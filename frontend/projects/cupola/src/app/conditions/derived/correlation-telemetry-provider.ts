import { Injectable, inject } from '@angular/core';
import {
  DomainObject,
  ObjectApi,
  TelemetryApiService,
  TelemetryDatum,
  TelemetryProvider,
  TelemetryRequest,
  TelemetryValue,
} from '@cupola/core';

import { DerivedCorrelationConfig, isDerivedKind, readDerivedConfig } from './derived-models';

/** A correlated datum: `value` carries the vertical source, with both raw values attached. */
export type CorrelatedDatum = TelemetryValue & { horizontal: number; vertical: number };

function correlate(
  outputKeyString: string,
  horizontal: TelemetryValue[],
  vertical: TelemetryValue[],
): CorrelatedDatum[] {
  const verticalByTimestamp = new Map(vertical.map((datum) => [datum.timestamp, datum.value]));
  const results: CorrelatedDatum[] = [];
  for (const horizontalDatum of horizontal) {
    if (verticalByTimestamp.has(horizontalDatum.timestamp)) {
      const verticalValue = verticalByTimestamp.get(horizontalDatum.timestamp) as number;
      results.push({
        keyString: outputKeyString,
        timestamp: horizontalDatum.timestamp,
        value: verticalValue,
        horizontal: horizontalDatum.value,
        vertical: verticalValue,
      });
    }
  }
  return results;
}

/**
 * Correlates two telemetry sources, emitting a paired datum only when both
 * provide a value at the same timestamp (OMCT-C10-L2-03.04). The emitted
 * `value` is the vertical source; horizontal and vertical ride as extra fields.
 */
@Injectable({ providedIn: 'root' })
export class CorrelationTelemetryProvider implements TelemetryProvider {
  private readonly objects = inject(ObjectApi);
  private readonly telemetry = inject(TelemetryApiService);

  supportsRequest(object: DomainObject): boolean {
    return isDerivedKind(object, 'correlation');
  }

  supportsSubscribe(object: DomainObject): boolean {
    return isDerivedKind(object, 'correlation');
  }

  async request(object: DomainObject, request: TelemetryRequest): Promise<TelemetryValue[]> {
    const config = readDerivedConfig(object) as DerivedCorrelationConfig;
    const [horizontal, vertical] = await Promise.all([
      this.requestSource(config.horizontalKeyString, request),
      this.requestSource(config.verticalKeyString, request),
    ]);
    return correlate(object.keyString, horizontal, vertical);
  }

  subscribe(object: DomainObject, emit: (datum: TelemetryDatum) => void): () => void {
    const config = readDerivedConfig(object) as DerivedCorrelationConfig;
    const horizontal: TelemetryValue[] = [];
    const vertical: TelemetryValue[] = [];
    const emitted = new Set<string>();
    let active = true;
    let teardown = () => {};

    const buffer = (target: TelemetryValue[], datum: TelemetryDatum): void => {
      const value = Array.isArray(datum) ? datum[datum.length - 1] : datum;
      if (!value) {
        return;
      }
      target.push(value);
      for (const result of correlate(object.keyString, horizontal, vertical)) {
        if (!emitted.has(result.timestamp)) {
          emitted.add(result.timestamp);
          emit(result);
        }
      }
    };

    void Promise.all([this.objects.get(config.horizontalKeyString), this.objects.get(config.verticalKeyString)]).then(
      ([horizontalSource, verticalSource]) => {
        if (!active) {
          return;
        }
        const unsubscribes = [
          this.telemetry.subscribe(horizontalSource, (datum) => buffer(horizontal, datum)),
          this.telemetry.subscribe(verticalSource, (datum) => buffer(vertical, datum)),
        ];
        teardown = () => unsubscribes.forEach((unsubscribe) => unsubscribe());
      },
    );

    return () => {
      active = false;
      teardown();
    };
  }

  private async requestSource(keyString: string, request: TelemetryRequest): Promise<TelemetryValue[]> {
    const source = await this.objects.get(keyString);
    return this.telemetry.request(source, request);
  }
}
