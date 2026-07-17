import { DomainObject, MetadataRegistry } from '@cupola/core';

import { isRangeTelemetry } from '../../views/plot/plot-eligibility';

/** Plot object types eligible as a time-strip child. */
const PLOT_TYPES = new Set(['overlay-plot', 'stacked-plot', 'bar-graph', 'scatter-plot']);
/** Plan-family object types eligible as a time-strip child. */
const PLAN_TYPES = new Set(['plan', 'gantt-chart']);

/** Telemetry with an image hint renders as an imagery/thumbnail row. */
export function isImageTelemetry(object: DomainObject): boolean {
  return object.type === 'telemetry' && (object.telemetry?.hints?.includes('image') ?? false);
}

/**
 * Telemetry with a domain value and no range or image hint renders as an event
 * track (OMCT-C12-L2-02.04).
 */
export function isEventTelemetry(object: DomainObject): boolean {
  const hints = object.telemetry?.hints ?? [];
  return (
    object.type === 'telemetry' &&
    hints.includes('domain') &&
    !hints.includes('range') &&
    !hints.includes('image')
  );
}

/**
 * Whether an object is a compatible time-based time-strip child
 * (OMCT-C12-L2-02.01): a plan/gantt, a plot, range telemetry (plot row), image
 * telemetry (thumbnail row), or domain-only telemetry (event track).
 */
export function isTimeStripEligible(object: DomainObject, metadata: MetadataRegistry): boolean {
  if (PLAN_TYPES.has(object.type) || PLOT_TYPES.has(object.type)) {
    return true;
  }
  if (object.type !== 'telemetry') {
    return false;
  }
  return isRangeTelemetry(object, metadata) || isImageTelemetry(object) || isEventTelemetry(object);
}

/** The kind of row a strip child renders as. */
export type StripRowKind = 'plot' | 'plan' | 'gantt' | 'image' | 'event' | 'unknown';

/** Classifies a strip child into its row kind. */
export function stripRowKind(object: DomainObject, metadata: MetadataRegistry): StripRowKind {
  if (object.type === 'plan') {
    return 'plan';
  }
  if (object.type === 'gantt-chart') {
    return 'gantt';
  }
  if (PLOT_TYPES.has(object.type)) {
    return 'plot';
  }
  if (object.type === 'telemetry') {
    if (isImageTelemetry(object)) {
      return 'image';
    }
    if (isEventTelemetry(object)) {
      return 'event';
    }
    if (isRangeTelemetry(object, metadata)) {
      return 'plot';
    }
  }
  return 'unknown';
}
