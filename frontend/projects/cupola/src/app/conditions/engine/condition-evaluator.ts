import { ConditionConfiguration, ConditionCriterion, CriterionOperation } from '../models/condition-models';

/** Current sample presented to a criterion during evaluation. */
export interface CriterionInput {
  /** Latest value of the referenced datum field, or undefined when no datum has arrived. */
  value: number | string | undefined;
  /** True when the referenced source is older than the criterion interval (OMCT-C10-L2-01.05). */
  stale?: boolean;
}

/** Resolves the current boolean result of a single criterion. */
export type CriterionResolver = (criterion: ConditionCriterion) => boolean;

function looselyEquals(value: unknown, operand: string | number): boolean {
  return value === operand || String(value) === String(operand);
}

/**
 * Compares a telemetry value against an operation and its operands
 * (OMCT-C10-L2-01.02). Returns false for a value-based operation when no value
 * is available, so an absent datum never spuriously matches.
 */
export function compareValue(
  operation: CriterionOperation,
  value: number | string | undefined,
  input: (string | number)[],
): boolean {
  if (operation === 'isOlderThan') {
    return false; // resolved from the stale flag, not the value
  }
  if (value === undefined) {
    return false;
  }
  const numeric = Number(value);
  const first = Number(input[0]);
  const second = Number(input[1]);
  switch (operation) {
    case 'equalTo':
      return looselyEquals(value, input[0]);
    case 'notEqualTo':
      return !looselyEquals(value, input[0]);
    case 'greaterThan':
      return numeric > first;
    case 'lessThan':
      return numeric < first;
    case 'greaterThanOrEqualTo':
      return numeric >= first;
    case 'lessThanOrEqualTo':
      return numeric <= first;
    case 'between':
      return numeric >= first && numeric <= second;
    case 'outsideOf':
      return numeric < first || numeric > second;
    case 'contains':
      return String(value).includes(String(input[0]));
    case 'doesNotContain':
      return !String(value).includes(String(input[0]));
  }
}

/** Evaluates one criterion against its current sample (OMCT-C10-L2-01.02). */
export function evaluateCriterion(criterion: ConditionCriterion, input: CriterionInput): boolean {
  if (criterion.operation === 'isOlderThan') {
    return input.stale ?? false;
  }
  return compareValue(criterion.operation, input.value, criterion.input);
}

/**
 * Combines a condition's criteria with its trigger (OMCT-C10-L2-01.03): true for
 * any matching criterion under `any`, or every matching criterion under `all`. A
 * non-default condition with no criteria never matches.
 */
export function evaluateCondition(
  condition: ConditionConfiguration,
  resolve: CriterionResolver,
): boolean {
  if (condition.criteria.length === 0) {
    return false;
  }
  const results = condition.criteria.map(resolve);
  return condition.trigger === 'all' ? results.every(Boolean) : results.some(Boolean);
}

/**
 * Evaluates the ordered condition set, stopping at the first true condition
 * (OMCT-C10-L2-01.04) and falling back to the default condition (or the last
 * condition) when none match.
 */
export function evaluateConditionSet(
  conditions: ConditionConfiguration[],
  resolve: CriterionResolver,
): ConditionConfiguration | undefined {
  for (const condition of conditions) {
    if (condition.isDefault) {
      continue;
    }
    if (evaluateCondition(condition, resolve)) {
      return condition;
    }
  }
  return conditions.find((condition) => condition.isDefault) ?? conditions[conditions.length - 1];
}
