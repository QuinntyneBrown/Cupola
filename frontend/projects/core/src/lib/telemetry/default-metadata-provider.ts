import { Injectable } from '@angular/core';

import { DomainObject } from '../models/domain-object';
import { TelemetryMetadataProvider, TelemetryValueMetadata } from './telemetry-metadata-view';

/** True when the object carries a telemetry definition. */
export function isTelemetryObject(object: DomainObject): boolean {
  return object.type === 'telemetry' || object.telemetry != null;
}

/**
 * Derives normalized metadata from a domain object's telemetry definition when no
 * higher-priority provider supersedes it. Requirement: OMCT-C06-L2-03.03.
 */
@Injectable({ providedIn: 'root' })
export class DefaultMetadataProvider implements TelemetryMetadataProvider {
  readonly priority = -1000; // lowest, so custom providers win

  supportsMetadata(object: DomainObject): boolean {
    return isTelemetryObject(object);
  }

  getMetadata(object: DomainObject): TelemetryValueMetadata[] {
    return [
      {
        key: 'timestamp',
        name: 'Timestamp',
        hint: 'domain',
        priority: 1,
        format: 'utc',
        timeSystem: 'utc',
      },
      {
        key: 'value',
        name: 'Value',
        hint: 'range',
        priority: 1,
        unit: object.telemetry?.unit,
        format: 'number',
        filters: object.telemetry?.filters,
      },
    ];
  }
}
