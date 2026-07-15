import { Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { RealtimeGateway } from '../gateways/realtime-gateway';
import { ConnectionState } from '../models/connection-state';
import { DomainObject } from '../models/domain-object';
import { TelemetryValue } from '../models/telemetry-value';
import { MutableDomainObject, MutableObjectService } from './mutable-domain-object';
import { ObjectUpdatesService } from './object-updates.service';

function domainObject(over: Partial<DomainObject> = {}): DomainObject {
  return {
    identifier: { namespace: '', key: 'k' },
    keyString: 'k',
    name: 'K',
    type: 'folder',
    location: null,
    composition: [],
    ...over,
  };
}

class RealtimeStub extends RealtimeGateway {
  override readonly connectionState: Signal<ConnectionState> = signal('connected');
  readonly updates = new Subject<DomainObject>();
  override connect(): void {}
  override objectUpdates() {
    return this.updates.asObservable();
  }
  override telemetry() {
    return new Subject<TelemetryValue>();
  }
}

describe('OMCT-C02-L2-02.05 Mutable observation', () => {
  it('invokes an observer with the changed value when its property changes', () => {
    const mutable = new MutableDomainObject(domainObject());
    const seen: unknown[] = [];
    mutable.observe('name', (value) => seen.push(value));

    mutable.set('name', 'Renamed');

    expect(seen).toEqual(['Renamed']);
    expect(mutable.get().name).toBe('Renamed');
  });

  it('invokes an observer when a matching child property changes', () => {
    const mutable = new MutableDomainObject(domainObject());
    const seen: unknown[] = [];
    mutable.observe('configuration', (value) => seen.push(value));

    mutable.set('configuration.color', 'red');

    expect(seen).toEqual([{ color: 'red' }]);
  });

  it('stops notifying after the observer unsubscribes', () => {
    const mutable = new MutableDomainObject(domainObject());
    const seen: unknown[] = [];
    const stop = mutable.observe('name', (value) => seen.push(value));

    stop();
    mutable.set('name', 'Renamed');

    expect(seen).toEqual([]);
  });
});

describe('OMCT-C02-L2-02.06 Provider synchronization', () => {
  it('updates the live mutable object from a provider change event', () => {
    const realtime = new RealtimeStub();
    TestBed.configureTestingModule({
      providers: [
        MutableObjectService,
        ObjectUpdatesService,
        { provide: RealtimeGateway, useValue: realtime },
      ],
    });
    const mutable = TestBed.inject(MutableObjectService).create(domainObject({ name: 'Original' }));
    const seen: unknown[] = [];
    mutable.observe('*', () => seen.push(mutable.get().name));

    realtime.updates.next(domainObject({ name: 'From provider' }));

    expect(mutable.get().name).toBe('From provider');
    expect(seen).toEqual(['From provider']);
  });
});
