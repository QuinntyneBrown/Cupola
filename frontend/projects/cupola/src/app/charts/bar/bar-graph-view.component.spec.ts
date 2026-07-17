import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import {
  DomainObject,
  ObjectApi,
  ObjectUpdatesService,
  TelemetryApiService,
  TelemetryValue,
  TimeBounds,
  TimeContext,
} from '@cupola/core';

import { BarGraphViewComponent } from './bar-graph-view.component';
import { WideDatum } from '../../telemetry-view/telemetry-stream';

const BOUNDS: TimeBounds = { start: 1_000, end: 10_000 };

function telemetry(keyString: string): DomainObject {
  return {
    identifier: { namespace: '', key: keyString },
    keyString,
    name: keyString,
    type: 'telemetry',
    location: null,
    composition: [],
    telemetry: { hints: ['range'], unit: 'A' },
  };
}

function barGraph(composition: string[]): DomainObject {
  return {
    identifier: { namespace: '', key: 'bg' },
    keyString: 'bg',
    name: 'Loads',
    type: 'bar-graph',
    location: null,
    composition,
    telemetry: null,
  };
}

class TelemetryApiStub {
  histories: Record<string, TelemetryValue[]> = {};
  private emitters = new Map<string, (datum: WideDatum) => void>();
  request(object: DomainObject): Promise<TelemetryValue[]> {
    return Promise.resolve(this.histories[object.keyString] ?? []);
  }
  subscribe(object: DomainObject, callback: (datum: WideDatum) => void): () => void {
    this.emitters.set(object.keyString, callback);
    return () => this.emitters.delete(object.keyString);
  }
  push(keyString: string, datum: WideDatum): void {
    this.emitters.get(keyString)?.(datum);
  }
}

class ObjectApiStub {
  constructor(private readonly store: Record<string, DomainObject>) {}
  get(keyString: string): Promise<DomainObject> {
    return Promise.resolve(this.store[keyString]);
  }
}

class ObjectUpdatesStub {
  forKeyString(): Subject<DomainObject> {
    return new Subject<DomainObject>();
  }
}

class TimeContextStub extends TimeContext {
  timeSystem() {
    return { key: 'utc', name: 'UTC', timeFormat: 'utc' };
  }
  bounds() {
    return BOUNDS;
  }
  mode() {
    return 'fixed' as const;
  }
  clockOffsets() {
    return null;
  }
  setTimeSystem() {}
  setBounds() {}
  boundsChanged() {
    return new Subject<TimeBounds>().asObservable();
  }
  modeChanged() {
    return new Subject<'fixed' | 'realtime'>().asObservable();
  }
  tick() {
    return new Subject<number>().asObservable();
  }
}

const value = (keyString: string, v: number): TelemetryValue => ({ keyString, timestamp: '2026-07-13T18:00:00Z', value: v });
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function setup(object: DomainObject, store: Record<string, DomainObject>, histories: Record<string, TelemetryValue[]>) {
  TestBed.resetTestingModule();
  const api = new TelemetryApiStub();
  api.histories = histories;
  TestBed.configureTestingModule({
    providers: [
      { provide: TelemetryApiService, useValue: api },
      { provide: ObjectApi, useValue: new ObjectApiStub(store) },
      { provide: ObjectUpdatesService, useClass: ObjectUpdatesStub },
      { provide: TimeContext, useClass: TimeContextStub },
    ],
  });
  const fixture = TestBed.createComponent(BarGraphViewComponent);
  fixture.componentRef.setInput('object', object);
  fixture.detectChanges();
  await flush();
  await flush();
  fixture.detectChanges();
  return { fixture, api };
}

function bars(fixture: ComponentFixture<BarGraphViewComponent>): NodeListOf<Element> {
  return fixture.nativeElement.querySelectorAll('[data-testid="bar"]');
}

describe('OMCT-C07-L2-04.02 Scalar and spectral bars', () => {
  it('renders one bar per member at its latest value', async () => {
    const { fixture } = await setup(barGraph(['a', 'b']), { a: telemetry('a'), b: telemetry('b') }, {
      a: [value('a', 5.2)],
      b: [value('b', 4.6)],
    });
    expect(bars(fixture)).toHaveLength(2);
  });

  it('renders spectral bars from an array-valued datum', async () => {
    const { fixture, api } = await setup(barGraph(['a']), { a: telemetry('a') }, { a: [value('a', 1)] });
    expect(bars(fixture)).toHaveLength(1);

    api.push('a', { keyString: 'a', timestamp: '2026-07-13T18:00:05Z', value: 0, spectrum: [2, 4, 6, 8] } as WideDatum);
    fixture.detectChanges();
    expect(bars(fixture)).toHaveLength(4);
  });
});
