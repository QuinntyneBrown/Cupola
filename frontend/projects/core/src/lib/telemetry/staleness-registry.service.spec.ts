import { Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { RealtimeGateway } from '../gateways/realtime-gateway';
import { ConnectionState } from '../models/connection-state';
import { DomainObject } from '../models/domain-object';
import { TelemetryValue } from '../models/telemetry-value';
import { StalenessEvent } from './limits';
import { ExampleStalenessProvider } from './providers/example-staleness-provider';
import { StalenessProvider, StalenessRegistry } from './staleness-registry.service';

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

describe('OMCT-C06-L2-04.04 Staleness evaluation', () => {
  it('relays provider staleness changes and releases the provider on unsubscribe', () => {
    let released = false;
    let emit!: (event: StalenessEvent) => void;
    const provider: StalenessProvider = {
      supportsStaleness: () => true,
      subscribe: (_object, callback) => {
        emit = callback;
        return () => {
          released = true;
        };
      },
    };
    const registry = new StalenessRegistry();
    registry.addProvider(provider);

    const events: StalenessEvent[] = [];
    const stop = registry.subscribe(telemetryObject(), (event) => events.push(event));
    emit({ keyString: 'pt', isStale: true, timestamp: 't' });

    expect(events).toEqual([{ keyString: 'pt', isStale: true, timestamp: 't' }]);

    stop();
    expect(released).toBe(true);
  });

  it('marks an object stale when no telemetry arrives within the window', () => {
    const realtime = new RealtimeStub();
    TestBed.configureTestingModule({
      providers: [ExampleStalenessProvider, { provide: RealtimeGateway, useValue: realtime }],
    });
    const provider = TestBed.inject(ExampleStalenessProvider);
    jest.useFakeTimers();
    const events: StalenessEvent[] = [];

    const stop = provider.subscribe(telemetryObject(), (event) => events.push(event));
    jest.advanceTimersByTime(provider.stalenessMs + 1);

    expect(events.some((event) => event.isStale)).toBe(true);

    stop();
    jest.useRealTimers();
  });
});
