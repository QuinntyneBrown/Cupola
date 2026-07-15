import { TimeBounds } from '../models/time';
import { TelemetryFilter } from '../models/telemetry-filter';

/**
 * B06 — Telemetry request and subscription (contract skeleton).
 * Owner: C06 · Consumers: C07, C08, C10, C11, C12 · Stability: high.
 * See docs/capability-contracts/cross-capability-contracts.md.
 */
export interface TelemetryRequestOptions {
  bounds?: TimeBounds; // defaults to the active time context (OMCT-C06-L2-01.03)
  strategy?: 'latest' | 'batch'; // OMCT-C06-L2-02.03–02.05
  filters?: TelemetryFilter[]; // B08, owned by C10
}
