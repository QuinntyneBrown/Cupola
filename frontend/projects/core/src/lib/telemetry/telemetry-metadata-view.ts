import { DomainObject } from '../models/domain-object';

/** A datum field descriptor: a domain (e.g. time) or range (e.g. value) column. */
export interface TelemetryValueMetadata {
  key: string; // datum field key, e.g. 'timestamp' | 'value'
  name?: string;
  hint: 'domain' | 'range';
  priority?: number; // lower sorts first (OMCT-C06-L2-03.02)
  unit?: string;
  format?: string; // named format for the value formatter (OMCT-C06-L2-03.04)
  timeSystem?: string; // for domain values: the time-system key they express (OMCT-C06-L2-04.02)
}

/** A telemetry metadata provider selected by the {@link MetadataRegistry}. */
export interface TelemetryMetadataProvider {
  priority?: number; // higher wins (OMCT-C06-L2-03.01)
  supportsMetadata(object: DomainObject): boolean;
  getMetadata(object: DomainObject): TelemetryValueMetadata[];
}

/**
 * Normalized metadata exposing domain and range values in priority order.
 * Requirement: OMCT-C06-L2-03.02.
 */
export class TelemetryMetadataView {
  constructor(readonly values: TelemetryValueMetadata[]) {}

  valuesForHints(hints: ('domain' | 'range')[]): TelemetryValueMetadata[] {
    return this.values
      .filter((value) => hints.includes(value.hint))
      .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
  }

  domains(): TelemetryValueMetadata[] {
    return this.valuesForHints(['domain']);
  }

  ranges(): TelemetryValueMetadata[] {
    return this.valuesForHints(['range']);
  }

  value(key: string): TelemetryValueMetadata | undefined {
    return this.values.find((value) => value.key === key);
  }
}
