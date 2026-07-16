import { Signal, signal } from '@angular/core';
import { Subject } from 'rxjs';

import { RealtimeGateway } from '../gateways/realtime-gateway';
import { ConnectionState } from '../models/connection-state';
import { DomainObject } from '../models/domain-object';
import { TelemetryValue } from '../models/telemetry-value';
import { LatestTelemetryClock } from './latest-telemetry-clock';

function telemetryObject(): DomainObject {
  return {
    identifier: { namespace: '', key: 'pt' },
    keyString: 'pt',
    name: 'pt',
    type: 'telemetry',
    location: null,
    composition: [],
  };
}

class RealtimeStub extends RealtimeGateway {
  override readonly connectionState: Signal<ConnectionState> = signal('connected');
  readonly telemetrySubject = new Subject<TelemetryValue>();
  override connect(): void {}
  override objectUpdates() {
    return new Subject<DomainObject>();
  }
  override telemetry() {
    return this.telemetrySubject.asObservable();
  }
}

describe('LatestTelemetryClock (enables OMCT-C05-L2-03.06)', () => {
  it('ticks from the timestamp of the latest telemetry datum', () => {
    const realtime = new RealtimeStub();
    const clock = new LatestTelemetryClock(realtime, telemetryObject());
    const ticks: number[] = [];

    clock.subscribe((tick) => ticks.push(tick));
    realtime.telemetrySubject.next({ keyString: 'pt', timestamp: new Date(1234).toISOString(), value: 1 });

    expect(ticks).toEqual([1234]);
  });
});
