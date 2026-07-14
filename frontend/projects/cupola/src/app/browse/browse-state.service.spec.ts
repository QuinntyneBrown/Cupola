import { Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  ConnectionState,
  DomainObject,
  RealtimeGateway,
  TelemetryValue,
} from '@cupola/core';

import { BrowseStateService } from './browse-state.service';

class RealtimeGatewayStub extends RealtimeGateway {
  readonly objectUpdated$ = new Subject<DomainObject>();
  override readonly connectionState: Signal<ConnectionState> = signal('connected');
  override connect(): void {}
  override objectUpdates(keyString: string): Observable<DomainObject> {
    return this.objectUpdated$.pipe(filter((o) => o.keyString === keyString));
  }
  override telemetry(): Observable<TelemetryValue> {
    return new Subject<TelemetryValue>().asObservable();
  }
}

function object(keyString: string, name: string): DomainObject {
  return {
    identifier: { namespace: '', key: keyString },
    keyString,
    name,
    type: 'folder',
    location: null,
    composition: [],
  };
}

describe('OMCT-C15-L2-01.03 BrowseStateService', () => {
  let service: BrowseStateService;
  let realtime: RealtimeGatewayStub;

  beforeEach(() => {
    realtime = new RealtimeGatewayStub();
    TestBed.configureTestingModule({
      providers: [{ provide: RealtimeGateway, useValue: realtime }],
    });
    service = TestBed.inject(BrowseStateService);
  });

  it('stores the resolved path and sets the document title from the browsed object', () => {
    service.setPath([object('mine', 'My Items'), object('ops-notebook', 'Ops notebook')]);

    expect(service.pathKeyStrings()).toEqual(['mine', 'ops-notebook']);
    expect(service.navigatedObject()?.name).toBe('Ops notebook');
    expect(document.title).toBe('Ops notebook');
  });

  it('observes object updates for the navigated object and refreshes the title', () => {
    service.setPath([object('mine', 'My Items')]);

    realtime.objectUpdated$.next(object('mine', 'Renamed Items'));

    expect(service.navigatedObject()?.name).toBe('Renamed Items');
    expect(document.title).toBe('Renamed Items');
  });

  it('stops observing the previous object after the path changes', () => {
    service.setPath([object('mine', 'My Items')]);
    service.setPath([object('station', 'Station')]);

    realtime.objectUpdated$.next(object('mine', 'Renamed Items'));

    expect(service.navigatedObject()?.name).toBe('Station');
    expect(document.title).toBe('Station');
  });
});
