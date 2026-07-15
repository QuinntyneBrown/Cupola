import { Identifier } from './identifier';
import { TelemetryMetadata } from './telemetry-metadata';

export interface DomainObject {
  identifier: Identifier;
  keyString: string;
  name: string;
  type: string;
  location: string | null;
  composition: string[];
  telemetry?: TelemetryMetadata | null;
  created?: string;
  modified?: string;
  createdBy?: string;
  /** Optimistic-concurrency version; the store bumps it on every accepted save (B04). */
  version?: number;
  /** Save provenance (open contract item #1, resolved for B04). */
  modifiedBy?: string;
}
