import { TelemetryFilter } from '../models/telemetry-filter';
import { TelemetryValue } from '../models/telemetry-value';

/**
 * Transport for historical telemetry (B06). Production binds an HTTP implementation
 * against GET /api/telemetry/{keyString}?start=&end=. Active filters (B08) travel as
 * an optional URI-encoded JSON query parameter; a provider that cannot filter may
 * ignore them, and the caller applies them to the returned data.
 */
export abstract class TelemetryGateway {
  abstract requestHistory(
    keyString: string,
    start: number,
    end: number,
    filters?: TelemetryFilter[],
  ): Promise<TelemetryValue[]>;
}
