import { ConnectionState, DomainObject, TelemetryValue } from '@cupola/core';

/**
 * Test hook published on `window.__cupolaE2E` by the FakeRealtimeGateway so
 * Playwright acceptance tests can push simulated server events.
 */
export interface CupolaE2eHook {
  pushObjectUpdate(object: DomainObject): void;
  pushTelemetry(value: TelemetryValue): void;
  setConnectionState(state: ConnectionState): void;
}

declare global {
  interface Window {
    __cupolaE2E?: CupolaE2eHook;
  }
}
