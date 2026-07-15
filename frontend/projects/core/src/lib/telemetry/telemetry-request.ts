import { TimeBounds } from '../models/time';
import { TelemetryFilter } from '../models/telemetry-filter';

/**
 * B06 — Telemetry request and subscription (contract).
 * Owner: C06 · Consumers: C07, C08, C10, C11, C12 · Stability: high.
 * See docs/capability-contracts/cross-capability-contracts.md.
 *
 * Historical transport (resolves open contract item #6):
 *   GET /api/telemetry/{keyString}?start={ms}&end={ms} -> 200 TelemetryValue[] | 404
 * Realtime transport is the existing hub event "TelemetryReceived" carried by
 * RealtimeGateway.telemetry(); the datum stays the scalar TelemetryValue (no envelope).
 */
export interface TelemetryRequestOptions {
  bounds?: TimeBounds; // defaults to the active time context (OMCT-C06-L2-01.03)
  domain?: string; // active time-system key; defaults from the time context (OMCT-C06-L2-01.03)
  strategy?: 'latest' | 'batch'; // OMCT-C06-L2-02.03–02.05
  filters?: TelemetryFilter[]; // B08, owned by C10
  signal?: AbortSignal; // request cancellation on navigation (OMCT-C06-L2-01.04)
}

/** A telemetry request after the API has applied time-context defaults. */
export interface TelemetryRequest extends TelemetryRequestOptions {
  bounds: TimeBounds;
  domain: string;
}
