import { Injectable, inject } from '@angular/core';
import { DomainObject, ObjectApi } from '@cupola/core';

import {
  ConditionConfiguration,
  ConditionCriterion,
  ConditionTrigger,
  CriterionOperation,
  readConditionSet,
  writeConditionSet,
} from '../models/condition-models';

let sequence = 0;
function newId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${sequence}`;
}

/** A blank condition inserted by the editor. */
function blankCondition(): ConditionConfiguration {
  return { id: newId('cond'), name: 'New condition', trigger: 'all', criteria: [], output: 'OUTPUT' };
}

/** A blank criterion inserted by the editor. */
function blankCriterion(telemetryKeyString: string): ConditionCriterion {
  return { id: newId('crit'), telemetryKeyString, metadataKey: 'value', operation: 'greaterThan', input: [0] };
}

/**
 * Applies and persists condition-set edits — adding, removing, reordering
 * conditions and editing their criteria, trigger, and output — through the
 * object save path (OMCT-C10-L2-01.06).
 */
@Injectable({ providedIn: 'root' })
export class ConditionManager {
  private readonly objects = inject(ObjectApi);

  addCondition(object: DomainObject): Promise<DomainObject> {
    return this.mutate(object, (conditions) => {
      const defaultIndex = conditions.findIndex((condition) => condition.isDefault);
      const insertAt = defaultIndex >= 0 ? defaultIndex : conditions.length;
      conditions.splice(insertAt, 0, blankCondition());
    });
  }

  removeCondition(object: DomainObject, conditionId: string): Promise<DomainObject> {
    return this.mutate(object, (conditions) => {
      const index = conditions.findIndex((condition) => condition.id === conditionId && !condition.isDefault);
      if (index >= 0) {
        conditions.splice(index, 1);
      }
    });
  }

  /** Reorders the non-default conditions; the default condition stays last. */
  reorderConditions(object: DomainObject, fromIndex: number, toIndex: number): Promise<DomainObject> {
    return this.mutate(object, (conditions) => {
      const movable = conditions.filter((condition) => !condition.isDefault);
      if (fromIndex < 0 || fromIndex >= movable.length || toIndex < 0 || toIndex >= movable.length) {
        return;
      }
      const [moved] = movable.splice(fromIndex, 1);
      movable.splice(toIndex, 0, moved);
      const fallback = conditions.filter((condition) => condition.isDefault);
      conditions.splice(0, conditions.length, ...movable, ...fallback);
    });
  }

  updateCondition(
    object: DomainObject,
    conditionId: string,
    changes: Partial<Pick<ConditionConfiguration, 'name' | 'trigger' | 'output'>> & { trigger?: ConditionTrigger },
  ): Promise<DomainObject> {
    return this.mutate(object, (conditions) => {
      const condition = conditions.find((c) => c.id === conditionId);
      if (condition) {
        Object.assign(condition, changes);
      }
    });
  }

  addCriterion(object: DomainObject, conditionId: string, telemetryKeyString: string): Promise<DomainObject> {
    return this.mutate(object, (conditions) => {
      conditions.find((c) => c.id === conditionId)?.criteria.push(blankCriterion(telemetryKeyString));
    });
  }

  removeCriterion(object: DomainObject, conditionId: string, criterionId: string): Promise<DomainObject> {
    return this.mutate(object, (conditions) => {
      const condition = conditions.find((c) => c.id === conditionId);
      if (condition) {
        condition.criteria = condition.criteria.filter((criterion) => criterion.id !== criterionId);
      }
    });
  }

  updateCriterion(
    object: DomainObject,
    conditionId: string,
    criterionId: string,
    changes: Partial<Pick<ConditionCriterion, 'telemetryKeyString' | 'metadataKey' | 'operation' | 'input'>> & {
      operation?: CriterionOperation;
    },
  ): Promise<DomainObject> {
    return this.mutate(object, (conditions) => {
      const criterion = conditions.find((c) => c.id === conditionId)?.criteria.find((c) => c.id === criterionId);
      if (criterion) {
        Object.assign(criterion, changes);
      }
    });
  }

  private async mutate(
    object: DomainObject,
    apply: (conditions: ConditionConfiguration[]) => void,
  ): Promise<DomainObject> {
    const conditions = JSON.parse(JSON.stringify(readConditionSet(object).conditions)) as ConditionConfiguration[];
    apply(conditions);
    const updated = writeConditionSet(object, { conditions });
    const result = await this.objects.save(updated);
    return result.object ?? updated;
  }
}
