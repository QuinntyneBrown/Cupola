import { DomainObject, MetadataRegistry, TelemetryValueMetadata } from '@cupola/core';

/** A range value whose format is not textual — i.e. a plottable numeric range. */
export function isNumericRange(range: TelemetryValueMetadata): boolean {
  return range.hint === 'range' && range.format !== 'string' && range.format !== 'enum';
}

/** The numeric ranges a metadata view exposes for an object. */
export function numericRanges(object: DomainObject, metadata: MetadataRegistry): TelemetryValueMetadata[] {
  const view = metadata.getMetadata(object);
  return view ? view.ranges().filter(isNumericRange) : [];
}

/**
 * A telemetry object that declares a `range` hint and exposes at least one numeric
 * range. The hint check is load-bearing: the default metadata provider reports a
 * numeric `value` range for every telemetry object (including imagery), so metadata
 * alone would make an image object plottable (OMCT-C07-L2-01.01, 01.02).
 */
export function isRangeTelemetry(object: DomainObject, metadata: MetadataRegistry): boolean {
  const hinted = object.telemetry?.hints?.includes('range') ?? false;
  return hinted && numericRanges(object, metadata).length >= 1;
}

/** Eligible for the single/overlay plot view: a plot object or range telemetry (01.01). */
export function isPlottable(object: DomainObject, metadata: MetadataRegistry): boolean {
  return object.type === 'overlay-plot' || isRangeTelemetry(object, metadata);
}
