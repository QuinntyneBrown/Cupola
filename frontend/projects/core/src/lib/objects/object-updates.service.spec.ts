import { Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { RealtimeGateway } from '../gateways/realtime-gateway';
import { ConnectionState } from '../models/connection-state';
import { DomainObject } from '../models/domain-object';
import { TelemetryValue } from '../models/telemetry-value';
import { ObjectUpdatesService } from './object-updates.service';

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

describe('ObjectUpdatesService', () => {
  it('relays remote changes to observers of the affected object (OMCT-C04-L2-02.05)', () => {
    const realtime = new RealtimeStub();
    TestBed.configureTestingModule({
      providers: [ObjectUpdatesService, { provide: RealtimeGateway, useValue: realtime }],
    });
    const received: DomainObject[] = [];
    TestBed.inject(ObjectUpdatesService)
      .forKeyString('observed')
      .subscribe((object) => received.push(object));
    const update: DomainObject = {
      identifier: { namespace: '', key: 'observed' },
      keyString: 'observed',
      name: 'Remote state',
      type: 'folder',
      location: null,
      composition: [],
    };

    realtime.updates.next(update);

    expect(received).toEqual([update]);
  });
});
