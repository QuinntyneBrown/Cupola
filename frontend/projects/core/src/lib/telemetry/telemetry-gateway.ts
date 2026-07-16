import { TelemetryValue } from '../models/telemetry-value';

/**
 * Transport for historical telemetry (B06). Production binds an HTTP implementation
 * against GET /api/telemetry/{keyString}?start=&end=.
 */
export abstract class TelemetryGateway {
  abstract requestHistory(keyString: string, start: number, end: number): Promise<TelemetryValue[]>;
}
