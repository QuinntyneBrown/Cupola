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
  /**
   * Type-specific view and behavior configuration persisted with the object
   * (B01, wave-4 extension; e.g. plot/table options, condition sets, plan data,
   * notebook structure). Opaque to the store; round-trips unchanged.
   */
  configuration?: Record<string, unknown>;
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
