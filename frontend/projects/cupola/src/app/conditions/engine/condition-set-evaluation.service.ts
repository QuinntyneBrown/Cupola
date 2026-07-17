import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { DomainObject, ObjectApi, TelemetryApiService, TelemetryValue } from '@cupola/core';

import {
  ConditionCriterion,
  ConditionResult,
  ConditionSetConfiguration,
  readConditionSet,
} from '../models/condition-models';
import { FilterStore } from '../filters/filter-store.service';
import { CriterionInput, evaluateConditionSet, evaluateCriterion } from './condition-evaluator';
import { OldDataMonitor } from './old-data-monitor';

function fieldValue(datum: TelemetryValue | undefined, key: string): number | string | undefined {
  if (!datum) {
    return undefined;
  }
  return (datum as unknown as Record<string, number | string>)[key];
}

/**
 * Evaluates one condition set while subscribed: resolves the composed telemetry
 * children, seeds and subscribes each through the telemetry API using the view's
 * persisted filters, maintains the latest-value map, and emits the selected
 * output distinct-until-changed (OMCT-C10-L2-01.02–01.05, 04.03).
 */
@Injectable({ providedIn: 'root' })
export class ConditionSetEvaluationService {
  private readonly objects = inject(ObjectApi);
  private readonly telemetry = inject(TelemetryApiService);
  private readonly filterStore = inject(FilterStore);

  /** A cold observable that runs the condition set only while subscribed. */
  evaluate(conditionSet: DomainObject): Observable<ConditionResult> {
    return new Observable<ConditionResult>((subscriber) => {
      const config = readConditionSet(conditionSet);
      const latest = new Map<string, TelemetryValue>();
      const oldDataCriteria = oldDataCriteriaOf(config);
      let active = true;
      let lastConditionId: string | undefined;
      const subs: (() => void)[] = [];

      const monitor = new OldDataMonitor(() => recompute(new Date().toISOString()));

      const recompute = (timestamp: string): void => {
        const matched = evaluateConditionSet(config.conditions, (criterion) =>
          resolveCriterion(criterion, latest, monitor),
        );
        if (matched && matched.id !== lastConditionId) {
          lastConditionId = matched.id;
          subscriber.next({ conditionId: matched.id, output: matched.output, timestamp });
        }
      };

      void this.start(conditionSet, config, latest, monitor, oldDataCriteria, subs, recompute, () => active);

      return () => {
        active = false;
        subs.forEach((unsubscribe) => unsubscribe());
        monitor.destroy();
      };
    });
  }

  private async start(
    conditionSet: DomainObject,
    config: ConditionSetConfiguration,
    latest: Map<string, TelemetryValue>,
    monitor: OldDataMonitor,
    oldDataCriteria: ConditionCriterion[],
    subs: (() => void)[],
    recompute: (timestamp: string) => void,
    isActive: () => boolean,
  ): Promise<void> {
    const sourceKeys = new Set<string>([
      ...conditionSet.composition,
      ...config.conditions.flatMap((condition) => condition.criteria.map((c) => c.telemetryKeyString)),
    ]);

    for (const key of sourceKeys) {
      if (!isActive()) {
        return;
      }
      let child: DomainObject;
      try {
        child = await this.objects.get(key);
      } catch {
        continue;
      }
      if (!isActive()) {
        return;
      }
      const filters = this.filterStore.applicableFilters(conditionSet, key);
      const options = filters.length ? { filters } : undefined;
      try {
        const seed = await this.telemetry.request(child, options);
        if (seed.length) {
          latest.set(key, seed[seed.length - 1]);
        }
      } catch {
        // seeding is best-effort; realtime data still drives evaluation
      }
      if (!isActive()) {
        return;
      }
      const unsubscribe = this.telemetry.subscribe(
        child,
        (datum) => {
          const value = Array.isArray(datum) ? datum[datum.length - 1] : datum;
          if (!value) {
            return;
          }
          latest.set(key, value);
          for (const criterion of oldDataCriteria) {
            if (criterion.telemetryKeyString === key) {
              monitor.reset(criterion.id);
            }
          }
          recompute(value.timestamp);
        },
        options,
      );
      subs.push(unsubscribe);
    }

    for (const criterion of oldDataCriteria) {
      const interval = Number(criterion.input[0]);
      if (interval > 0) {
        monitor.track(criterion.id, interval);
      }
    }
    recompute(new Date().toISOString());
  }
}

function oldDataCriteriaOf(config: ConditionSetConfiguration): ConditionCriterion[] {
  return config.conditions.flatMap((condition) =>
    condition.criteria.filter((criterion) => criterion.operation === 'isOlderThan'),
  );
}

function resolveCriterion(
  criterion: ConditionCriterion,
  latest: Map<string, TelemetryValue>,
  monitor: OldDataMonitor,
): boolean {
  const input: CriterionInput = {
    value: fieldValue(latest.get(criterion.telemetryKeyString), criterion.metadataKey),
    stale: monitor.isStale(criterion.id),
  };
  return evaluateCriterion(criterion, input);
}
