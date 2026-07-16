import { DomainObject } from '@cupola/core';

import { CompsConfiguration } from './comps-math-engine';

/** Mathematical expression over timestamp-aligned sources (OMCT-C10-L2-03.01/03.02). */
export interface DerivedExpressionConfig extends CompsConfiguration {
  kind: 'expression';
}

/** Arithmetic mean over a recent sample window (OMCT-C10-L2-03.03). */
export interface DerivedMeanConfig {
  kind: 'mean';
  sourceKeyString: string;
  sampleCount: number;
}

/** Two sources paired on equal timestamps (OMCT-C10-L2-03.04). */
export interface DerivedCorrelationConfig {
  kind: 'correlation';
  horizontalKeyString: string;
  verticalKeyString: string;
}

export type DerivedConfig = DerivedExpressionConfig | DerivedMeanConfig | DerivedCorrelationConfig;

/** Reads the derived configuration from a domain object, or undefined when absent. */
export function readDerivedConfig(object: DomainObject): DerivedConfig | undefined {
  return object.configuration?.['derived'] as DerivedConfig | undefined;
}

/** True when the object is a derived-telemetry object of the given kind. */
export function isDerivedKind(object: DomainObject, kind: DerivedConfig['kind']): boolean {
  return object.type === 'derived-telemetry' && readDerivedConfig(object)?.kind === kind;
}
