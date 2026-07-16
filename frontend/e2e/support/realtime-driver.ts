import { Page } from '@playwright/test';

import { DomainObjectFixture } from './fake-backend';

interface E2eWindow {
  __cupolaE2E?: {
    pushObjectUpdate(object: unknown): void;
    pushTelemetry(value: unknown): void;
    setConnectionState(state: string): void;
  };
}

/**
 * Typed wrapper over the `window.__cupolaE2E` hook exposed by the
 * FakeRealtimeGateway in the e2e build configuration. Lets tests push
 * simulated SignalR server events.
 */
export class RealtimeDriver {
  constructor(private readonly page: Page) {}

  async pushObjectUpdate(object: DomainObjectFixture): Promise<void> {
    await this.page.evaluate((o) => {
      (window as E2eWindow).__cupolaE2E!.pushObjectUpdate(o);
    }, object);
  }

  async pushTelemetry(
    keyString: string,
    value: number,
    timestamp?: string,
    extra?: Record<string, unknown>,
  ): Promise<void> {
    await this.page.evaluate(
      (telemetry) => {
        (window as E2eWindow).__cupolaE2E!.pushTelemetry(telemetry);
      },
      { keyString, value, timestamp: timestamp ?? new Date().toISOString(), ...extra },
    );
  }

  async setConnectionState(state: 'connected' | 'connecting' | 'disconnected'): Promise<void> {
    await this.page.evaluate((s) => {
      (window as E2eWindow).__cupolaE2E!.setConnectionState(s);
    }, state);
  }
}
