import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { DomainObject } from '@cupola/core';

import {
  CRITERION_OPERATIONS,
  ConditionConfiguration,
  ConditionTrigger,
  CriterionOperation,
  readConditionSet,
} from '../models/condition-models';
import { ConditionManager } from './condition-manager.service';
import { ConditionSetEvaluationService } from '../engine/condition-set-evaluation.service';
import { FilterStore } from '../filters/filter-store.service';

/**
 * Editor and live view for a condition set (OMCT-C10-L2-01.06). Renders each
 * condition with its trigger, output, and criteria, badges the active condition
 * from the running evaluation, and persists edits through the condition manager.
 */
@Component({
  selector: 'cp-condition-set-view',
  templateUrl: './condition-set-view.component.html',
  styleUrl: './condition-set-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionSetViewComponent implements OnInit {
  private readonly manager = inject(ConditionManager);
  private readonly evaluation = inject(ConditionSetEvaluationService);
  private readonly filterStore = inject(FilterStore);

  readonly object = input.required<DomainObject>();

  protected readonly operations = CRITERION_OPERATIONS;

  protected readonly working = signal<DomainObject | null>(null);
  protected readonly activeConditionId = signal<string | undefined>(undefined);
  private readonly filterVersion = signal(0);

  protected readonly conditions = computed<ConditionConfiguration[]>(() => {
    const object = this.working();
    return object ? readConditionSet(object).conditions : [];
  });
  protected readonly editableConditions = computed(() => this.conditions().filter((c) => !c.isDefault));
  protected readonly defaultCondition = computed(() => this.conditions().find((c) => c.isDefault));
  protected readonly sources = computed<string[]>(() => this.working()?.composition ?? []);
  protected readonly activeOutput = computed(() => {
    const id = this.activeConditionId();
    return this.conditions().find((condition) => condition.id === id)?.output ?? '';
  });

  constructor() {
    effect((onCleanup) => {
      const object = this.working();
      this.filterVersion();
      if (!object) {
        return;
      }
      const subscription = this.evaluation
        .evaluate(object)
        .subscribe((result) => this.activeConditionId.set(result.conditionId));
      onCleanup(() => subscription.unsubscribe());
    });
  }

  ngOnInit(): void {
    this.working.set(this.object());
    this.filterStore
      .changes(this.object().keyString)
      .subscribe(() => this.filterVersion.update((version) => version + 1));
  }

  protected isActive(condition: ConditionConfiguration): boolean {
    return condition.id === this.activeConditionId();
  }

  protected async addCondition(): Promise<void> {
    await this.apply((object) => this.manager.addCondition(object));
  }

  protected async removeCondition(conditionId: string): Promise<void> {
    await this.apply((object) => this.manager.removeCondition(object, conditionId));
  }

  protected async setTrigger(conditionId: string, trigger: string): Promise<void> {
    await this.apply((object) =>
      this.manager.updateCondition(object, conditionId, { trigger: trigger as ConditionTrigger }),
    );
  }

  protected async setOutput(conditionId: string, output: string): Promise<void> {
    await this.apply((object) => this.manager.updateCondition(object, conditionId, { output }));
  }

  protected async addCriterion(conditionId: string): Promise<void> {
    const source = this.sources()[0] ?? '';
    await this.apply((object) => this.manager.addCriterion(object, conditionId, source));
  }

  protected async removeCriterion(conditionId: string, criterionId: string): Promise<void> {
    await this.apply((object) => this.manager.removeCriterion(object, conditionId, criterionId));
  }

  protected async setCriterionSource(conditionId: string, criterionId: string, telemetryKeyString: string): Promise<void> {
    await this.apply((object) =>
      this.manager.updateCriterion(object, conditionId, criterionId, { telemetryKeyString }),
    );
  }

  protected async setCriterionOperation(conditionId: string, criterionId: string, operation: string): Promise<void> {
    await this.apply((object) =>
      this.manager.updateCriterion(object, conditionId, criterionId, { operation: operation as CriterionOperation }),
    );
  }

  protected async setCriterionInput(
    conditionId: string,
    criterionId: string,
    index: number,
    raw: string,
  ): Promise<void> {
    const condition = this.conditions().find((c) => c.id === conditionId);
    const criterion = condition?.criteria.find((c) => c.id === criterionId);
    if (!criterion) {
      return;
    }
    const input = [...criterion.input];
    const numeric = Number(raw);
    input[index] = raw !== '' && !Number.isNaN(numeric) ? numeric : raw;
    await this.apply((object) => this.manager.updateCriterion(object, conditionId, criterionId, { input }));
  }

  private async apply(mutate: (object: DomainObject) => Promise<DomainObject>): Promise<void> {
    const object = this.working();
    if (!object) {
      return;
    }
    this.working.set(await mutate(object));
  }
}
