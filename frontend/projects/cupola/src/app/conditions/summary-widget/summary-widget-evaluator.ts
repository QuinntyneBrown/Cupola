import { CriterionOperation } from '../models/condition-models';
import { compareValue } from '../engine/condition-evaluator';

/** Object scope a summary-widget rule evaluates over (OMCT-C10-L2-02.04). */
export type SummaryRuleScope = 'single' | 'any' | 'all';

/** An ordered summary-widget rule with its presentation (OMCT-C10-L2-02.03). */
export interface SummaryRule {
  id: string;
  name: string;
  scope: SummaryRuleScope;
  /** Object tested under `single` scope. */
  telemetryKeyString?: string;
  metadataKey: string;
  operation: CriterionOperation;
  input: (string | number)[];
  /** Presentation applied when the rule matches. */
  label?: string;
  icon?: string;
  color?: string;
  border?: string;
  image?: string;
  /** Terminal fallback rule, always matching, always last. */
  isDefault?: boolean;
}

export interface SummaryWidgetConfiguration {
  rules: SummaryRule[];
}

/** Resolves the current value of a datum field for a composed object. */
export type ValueResolver = (keyString: string, metadataKey: string) => number | string | undefined;

function matchesRule(rule: SummaryRule, composedKeys: string[], resolve: ValueResolver): boolean {
  const test = (keyString: string): boolean =>
    compareValue(rule.operation, resolve(keyString, rule.metadataKey), rule.input);

  switch (rule.scope) {
    case 'single':
      return rule.telemetryKeyString !== undefined && test(rule.telemetryKeyString);
    case 'any':
      return composedKeys.some(test);
    case 'all':
      return composedKeys.length > 0 && composedKeys.every(test);
  }
}

/**
 * Selects the first matching summary-widget rule in order (OMCT-C10-L2-02.03),
 * applying single, any, or all object semantics (OMCT-C10-L2-02.04). A default
 * rule always matches, so it acts as the terminal fallback.
 */
export function evaluateSummaryRules(
  rules: SummaryRule[],
  composedKeys: string[],
  resolve: ValueResolver,
): SummaryRule | undefined {
  for (const rule of rules) {
    if (rule.isDefault || matchesRule(rule, composedKeys, resolve)) {
      return rule;
    }
  }
  return undefined;
}
