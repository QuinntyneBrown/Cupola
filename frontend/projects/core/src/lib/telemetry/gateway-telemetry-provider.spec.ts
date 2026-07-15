import { Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { RealtimeGateway } from '../gateways/realtime-gateway';
import { ConnectionState } from '../models/connection-state';
import { DomainObject } from '../models/domain-object';
import { TelemetryValue } from '../models/telemetry-value';
import { GatewayTelemetryProvider } from './gateway-telemetry-provider';
import { TelemetryDatum } from './telemetry-provider';
import { TelemetryGateway } from './telemetry-gateway';

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

function datum(value: number): TelemetryValue {
  return { keyString: 'pt', timestamp: new Date(value).toISOString(), value };
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

describe('OMCT-C06-L2-02.05 Legacy subscription compatibility (gateway provider)', () => {
  it('relays realtime single datums unchanged and requests history via the gateway', async () => {
    const realtime = new RealtimeStub();
    const gateway = { requestHistory: jest.fn(async () => [datum(1)]) };
    TestBed.configureTestingModule({
      providers: [
        GatewayTelemetryProvider,
        { provide: RealtimeGateway, useValue: realtime },
        { provide: TelemetryGateway, useValue: gateway },
      ],
    });
    const provider = TestBed.inject(GatewayTelemetryProvider);
    const received: TelemetryDatum[] = [];

    provider.subscribe(telemetryObject(), (d) => received.push(d));
    realtime.telemetrySubject.next(datum(5));
    expect(received).toEqual([datum(5)]);

    await provider.request(telemetryObject(), {
      bounds: { start: 1, end: 2 },
      domain: 'utc',
    });
    expect(gateway.requestHistory).toHaveBeenCalledWith('pt', 1, 2);
  });
});
