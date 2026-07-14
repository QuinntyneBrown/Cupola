import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ConnectionState, DomainObject, RealtimeGateway, TelemetryValue } from '@cupola/core';

import { CupolaE2eHook } from './cupola-e2e-hook';

/**
 * Realtime gateway used by the `e2e` build configuration. Instead of a
 * SignalR connection it exposes a `window.__cupolaE2E` hook through which
 * Playwright tests push simulated server events.
 */
@Injectable()
export class FakeRealtimeGateway extends RealtimeGateway {
  private readonly state = signal<ConnectionState>('connected');
  private readonly objectUpdated$ = new Subject<DomainObject>();
  private readonly telemetry$ = new Subject<TelemetryValue>();

  override readonly connectionState = this.state.asReadonly();

  constructor() {
    super();
    const hook: CupolaE2eHook = {
      pushObjectUpdate: (object) => this.objectUpdated$.next(object),
      pushTelemetry: (value) => this.telemetry$.next(value),
      setConnectionState: (state) => this.state.set(state),
    };
    window.__cupolaE2E = hook;
  }

  override connect(): void {
    this.state.set('connected');
  }

  override objectUpdates(keyString: string): Observable<DomainObject> {
    return this.objectUpdated$.pipe(filter((object) => object.keyString === keyString));
  }

  override telemetry(keyString: string): Observable<TelemetryValue> {
    return this.telemetry$.pipe(filter((value) => value.keyString === keyString));
  }
}
