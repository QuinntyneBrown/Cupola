import { Identifier } from './identifier';
import { TelemetryMetadata } from './telemetry-metadata';

export interface DomainObject {
  identifier: Identifier;
  keyString: string;
  name: string;
  type: string;
  location: string | null;
  composition: string[];
  /** Configured database query when this object is a CouchDB search folder. */
  query?: string;
  telemetry?: TelemetryMetadata | null;
  created?: string;
  modified?: string;
  /** Timestamp of the last successful persistence; never earlier than `modified` (OMCT-C02-L2-02.02). */
  persisted?: string;
  createdBy?: string;
  /** Optimistic-concurrency version; the store bumps it on every accepted save (B04). */
  version?: number;
  /** Save provenance (open contract item #1, resolved for B04). */
  modifiedBy?: string;
}
