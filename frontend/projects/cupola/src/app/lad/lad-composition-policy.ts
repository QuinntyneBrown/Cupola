import { CompositionPolicy, DomainObject, isTelemetryObject } from '@cupola/core';

/** An object that yields telemetry values (a telemetry point or a derived stream). */
export function producesTelemetry(object: DomainObject): boolean {
  return isTelemetryObject(object) || object.type === 'derived-telemetry';
}

/**
 * A latest-available-data table accepts only telemetry-producing children; a LAD
 * table set accepts only LAD tables (OMCT-C08-L2-02.01, 02.03).
 */
export class LadCompositionPolicy implements CompositionPolicy {
  allow(parent: DomainObject, child: DomainObject): boolean {
    if (parent.type === 'lad-table') {
      return producesTelemetry(child);
    }
    if (parent.type === 'lad-table-set') {
      return child.type === 'lad-table';
    }
    return true;
  }
}
