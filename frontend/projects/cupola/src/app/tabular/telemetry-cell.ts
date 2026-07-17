import { LimitEvaluation, TelemetryValueMetadata, ValueFormatRegistry } from '@cupola/core';

import { WideDatum } from '../telemetry-view/telemetry-stream';

/**
 * Formats a single datum field using the format named by its metadata, falling
 * back to a plain string when no format is registered (OMCT-C06-L2-03.04).
 */
export function formatField(
  datum: WideDatum,
  meta: TelemetryValueMetadata | undefined,
  formats: ValueFormatRegistry,
): string {
  const raw = (datum as Record<string, unknown>)[meta?.key ?? ''];
  if (meta?.format) {
    const format = formats.get(meta.format);
    if (format) {
      return format.format(raw);
    }
  }
  return raw == null ? '' : String(raw);
}

/**
 * Maps a limit evaluation to the table/gauge cell class the design system
 * defines: critical fills red, any lower level fills caution (OMCT-C08 states,
 * OMCT-C06-L2-04.03). Absent when the datum is within limits.
 */
export function limitCellClass(evaluation: LimitEvaluation | undefined): string {
  if (!evaluation) {
    return '';
  }
  return evaluation.level === 'critical' ? 'is-limit-critical' : 'is-limit-caution';
}

/** Maps a limit evaluation to the gauge meter state class (fill severity). */
export function limitStateClass(evaluation: LimitEvaluation | undefined): string {
  if (!evaluation) {
    return '';
  }
  return evaluation.level === 'critical'
    ? 'is-limit-critical-state'
    : 'is-limit-caution-state';
}
