import { Injectable } from '@angular/core';
import { DomainObject, TelemetryMetadataProvider, TelemetryValueMetadata } from '@cupola/core';

/**
 * Emits a domain plus one numeric range per key listed in `configuration.ranges`,
 * letting a telemetry object advertise the two ranges a scatter plot needs
 * (OMCT-C07-L2-04.03/04.04) without a backend or core change. Registered above the
 * default provider so it wins for marked objects and is inert for every other.
 */
@Injectable({ providedIn: 'root' })
export class MultiRangeMetadataProvider implements TelemetryMetadataProvider {
  readonly priority = 100;

  supportsMetadata(object: DomainObject): boolean {
    return Array.isArray(object.configuration?.['ranges']);
  }

  getMetadata(object: DomainObject): TelemetryValueMetadata[] {
    const keys = (object.configuration?.['ranges'] as string[]) ?? [];
    const unit = object.telemetry?.unit;
    return [
      { key: 'timestamp', name: 'Timestamp', hint: 'domain', priority: 1, format: 'utc', timeSystem: 'utc' },
      ...keys.map((key, index) => ({
        key,
        name: key,
        hint: 'range' as const,
        priority: index + 1,
        unit,
        format: 'number',
      })),
    ];
  }
}
