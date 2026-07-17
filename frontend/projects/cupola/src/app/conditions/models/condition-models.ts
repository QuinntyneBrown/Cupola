import { DomainObject } from '@cupola/core';

/** Combination rule for a condition's criteria (OMCT-C10-L2-01.03). */
export type ConditionTrigger = 'any' | 'all';

/** Comparison operation a criterion applies to a telemetry value (OMCT-C10-L2-01.02). */
export type CriterionOperation =
  | 'equalTo'
  | 'notEqualTo'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqualTo'
  | 'lessThanOrEqualTo'
  | 'between'
  | 'outsideOf'
  | 'contains'
  | 'doesNotContain'
  | 'isOlderThan';

/** Descriptor for a criterion operation, used to build the editor dropdown. */
export interface CriterionOperationDescriptor {
  operation: CriterionOperation;
  label: string;
  /** Number of operand inputs the operation consumes. */
  operandCount: number;
  /** True for the time-based old-data operation (OMCT-C10-L2-01.05). */
  timeBased?: boolean;
}

/** The operations offered by the criterion editor, in menu order. */
export const CRITERION_OPERATIONS: CriterionOperationDescriptor[] = [
  { operation: 'equalTo', label: 'is equal to', operandCount: 1 },
  { operation: 'notEqualTo', label: 'is not equal to', operandCount: 1 },
  { operation: 'greaterThan', label: 'is greater than', operandCount: 1 },
  { operation: 'lessThan', label: 'is less than', operandCount: 1 },
  { operation: 'greaterThanOrEqualTo', label: 'is greater than or equal to', operandCount: 1 },
  { operation: 'lessThanOrEqualTo', label: 'is less than or equal to', operandCount: 1 },
  { operation: 'between', label: 'is between', operandCount: 2 },
  { operation: 'outsideOf', label: 'is outside of', operandCount: 2 },
  { operation: 'contains', label: 'contains', operandCount: 1 },
  { operation: 'doesNotContain', label: 'does not contain', operandCount: 1 },
  { operation: 'isOlderThan', label: 'is older than', operandCount: 1, timeBased: true },
];

/** One comparison within a condition (OMCT-C10-L2-01.02). */
export interface ConditionCriterion {
  id: string;
  /** keyString of the composed telemetry source this criterion reads. */
  telemetryKeyString: string;
  /** Datum field key evaluated (e.g. 'value'). */
  metadataKey: string;
  operation: CriterionOperation;
  /** Operands: one value for most operations, two for between/outsideOf, an
   *  interval in milliseconds for isOlderThan. */
  input: (string | number)[];
}

/** An ordered condition producing an output when its criteria match (OMCT-C10-L2-01.03). */
export interface ConditionConfiguration {
  id: string;
  name: string;
  trigger: ConditionTrigger;
  criteria: ConditionCriterion[];
  /** Output published when this condition is the first match (OMCT-C10-L2-01.04). */
  output: string;
  /** The terminal fallback condition, always last and always matching. */
  isDefault?: boolean;
}

/** Persisted condition-set configuration (stored at `configuration.conditions`). */
export interface ConditionSetConfiguration {
  conditions: ConditionConfiguration[];
}

/** The selected output emitted by a condition set (OMCT-C10-L2-01.04). */
export interface ConditionResult {
  conditionId: string;
  output: string;
  timestamp: string;
}

/** Reads the condition-set configuration from a domain object. */
export function readConditionSet(object: DomainObject): ConditionSetConfiguration {
  const conditions = (object.configuration?.['conditions'] as ConditionConfiguration[] | undefined) ?? [];
  return { conditions };
}

/** Returns a copy of the object carrying the given condition-set configuration. */
export function writeConditionSet(
  object: DomainObject,
  config: ConditionSetConfiguration,
): DomainObject {
  return {
    ...object,
    configuration: { ...object.configuration, conditions: config.conditions },
  };
}

/** Builds the terminal default condition seeded into a new condition set. */
export function defaultCondition(): ConditionConfiguration {
  return { id: 'default', name: 'Default', trigger: 'all', criteria: [], output: 'DEFAULT', isDefault: true };
}
