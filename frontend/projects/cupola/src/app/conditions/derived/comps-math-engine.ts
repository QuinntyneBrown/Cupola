import { TelemetryValue } from '@cupola/core';

import { CompiledExpression, compileExpression } from './expression';

/** One named source feeding a derived expression. */
export interface CompsParameter {
  /** Identifier used in the expression. */
  name: string;
  /** keyString of the source telemetry object. */
  keyString: string;
}

/** Configuration for a mathematical derived-telemetry object. */
export interface CompsConfiguration {
  parameters: CompsParameter[];
  expression: string;
  /** Aligned samples required before output begins (OMCT-C10-L2-03.02); defaults to 1. */
  sampleSize?: number;
  /** Source providing the reference timestamps; defaults to the first parameter. */
  referenceKeyString?: string;
}

/** One reference timestamp with each parameter's aligned value. */
export interface AlignedSample {
  timestamp: string;
  values: Record<string, number>;
}

/**
 * Synchronous in-process comps engine. It aligns source telemetry by reference
 * timestamp, omits results until the configured sample window is full
 * (OMCT-C10-L2-03.02), and evaluates the compiled expression at each aligned
 * timestamp (OMCT-C10-L2-03.01). Kept as a class mirroring the worker-shaped
 * upstream API.
 */
export class CompsMathEngine {
  private readonly compiled: CompiledExpression;
  private readonly sampleSize: number;

  constructor(
    private readonly config: CompsConfiguration,
    private readonly outputKeyString: string,
  ) {
    this.compiled = compileExpression(config.expression);
    this.sampleSize = Math.max(1, config.sampleSize ?? 1);
  }

  /** Reference source key (explicit, else the first parameter's source). */
  referenceKey(): string {
    return this.config.referenceKeyString ?? this.config.parameters[0]?.keyString ?? '';
  }

  /** Builds the aligned samples where every parameter has a value at the reference timestamp. */
  alignByReferenceTimestamp(sourcesByKey: Map<string, TelemetryValue[]>): AlignedSample[] {
    const reference = sourcesByKey.get(this.referenceKey()) ?? [];
    const aligned: AlignedSample[] = [];
    for (const referenceDatum of reference) {
      const values: Record<string, number> = {};
      let complete = true;
      for (const parameter of this.config.parameters) {
        const match = (sourcesByKey.get(parameter.keyString) ?? []).find(
          (datum) => datum.timestamp === referenceDatum.timestamp,
        );
        if (!match) {
          complete = false;
          break;
        }
        values[parameter.name] = match.value;
      }
      if (complete) {
        aligned.push({ timestamp: referenceDatum.timestamp, values });
      }
    }
    return aligned;
  }

  /** Evaluates the expression at each aligned timestamp once the window is full. */
  calculate(sourcesByKey: Map<string, TelemetryValue[]>): TelemetryValue[] {
    const aligned = this.alignByReferenceTimestamp(sourcesByKey);
    const results: TelemetryValue[] = [];
    aligned.forEach((sample, index) => {
      if (index + 1 < this.sampleSize) {
        return; // OMCT-C10-L2-03.02 — omit until the sample window is full
      }
      results.push({
        keyString: this.outputKeyString,
        timestamp: sample.timestamp,
        value: this.compiled.evaluate(sample.values),
      });
    });
    return results;
  }
}
