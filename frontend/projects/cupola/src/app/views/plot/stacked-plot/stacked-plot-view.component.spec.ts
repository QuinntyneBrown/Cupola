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

import { StackedPlotViewComponent } from './stacked-plot-view.component';
import { WideDatum } from '../../../telemetry-view/telemetry-stream';

const BOUNDS: TimeBounds = { start: 1_000, end: 10_000 };
const VIEW_W = 760;

function telemetry(keyString: string, unit = 'V'): DomainObject {
  return {
    identifier: { namespace: '', key: keyString },
    keyString,
    name: keyString,
    type: 'telemetry',
    location: null,
    composition: [],
    telemetry: { hints: ['range'], unit },
  };
}

function stacked(composition: string[]): DomainObject {
  return {
    identifier: { namespace: '', key: 'sp' },
    keyString: 'sp',
    name: 'Stack',
    type: 'stacked-plot',
    location: null,
    composition,
    telemetry: null,
  };
}

const datum = (timestamp: number, value: number): TelemetryValue => ({
  keyString: 'k',
  timestamp: new Date(timestamp).toISOString(),
  value,
});

class TelemetryApiStub {
  history: TelemetryValue[] = [datum(2_000, 5), datum(8_000, 7)];
  request(): Promise<TelemetryValue[]> {
    return Promise.resolve(this.history);
  }
  subscribe(_object: DomainObject, _cb: (datum: WideDatum) => void): () => void {
    return () => undefined;
  }
}

class ObjectApiStub {
  constructor(private readonly store: Record<string, DomainObject>) {}
  get(keyString: string): Promise<DomainObject> {
    const found = this.store[keyString];
    return found ? Promise.resolve(found) : Promise.reject(new Error('missing'));
  }
}

class ObjectUpdatesStub {
  readonly subjects = new Map<string, Subject<DomainObject>>();
  forKeyString(keyString: string): Subject<DomainObject> {
    const subject = this.subjects.get(keyString) ?? new Subject<DomainObject>();
    this.subjects.set(keyString, subject);
    return subject;
  }
}

class TimeContextStub extends TimeContext {
  private current: TimeBounds = { ...BOUNDS };
  private readonly bounds$ = new Subject<TimeBounds>();
  timeSystem() {
    return { key: 'utc', name: 'UTC', timeFormat: 'utc' };
  }
  bounds() {
    return this.current;
  }
  mode() {
    return 'fixed' as const;
  }
  clockOffsets() {
    return null;
  }
  setTimeSystem() {}
  setBounds(bounds: TimeBounds) {
    this.current = bounds;
    this.bounds$.next(bounds);
  }
  boundsChanged() {
    return this.bounds$.asObservable();
  }
  modeChanged() {
    return new Subject<'fixed' | 'realtime'>().asObservable();
  }
  tick() {
    return new Subject<number>().asObservable();
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function setup(store: Record<string, DomainObject>, object: DomainObject) {
  TestBed.resetTestingModule();
  const updates = new ObjectUpdatesStub();
  TestBed.configureTestingModule({
    providers: [
      { provide: TelemetryApiService, useClass: TelemetryApiStub },
      { provide: ObjectApi, useValue: new ObjectApiStub(store) },
      { provide: ObjectUpdatesService, useValue: updates },
      { provide: TimeContext, useClass: TimeContextStub },
    ],
  });
  const fixture = TestBed.createComponent(StackedPlotViewComponent);
  fixture.componentRef.setInput('object', object);
  fixture.detectChanges();
  await flush();
  await flush();
  fixture.detectChanges();
  return { fixture, updates };
}

function rows(fixture: ComponentFixture<StackedPlotViewComponent>): NodeListOf<Element> {
  return fixture.nativeElement.querySelectorAll('[data-testid="stacked-row"]');
}

describe('OMCT-C07-L2-03.02 Stacked series lifecycle', () => {
  const store = { a: telemetry('a', 'kW'), b: telemetry('b', 'V'), c: telemetry('c', '°C') };

  it('renders one row per composed child', async () => {
    const { fixture } = await setup(store, stacked(['a', 'b']));
    expect(rows(fixture)).toHaveLength(2);
  });

  it('adds a row when a child is added to composition', async () => {
    const { fixture, updates } = await setup(store, stacked(['a', 'b']));
    updates.forKeyString('sp').next(stacked(['a', 'b', 'c']));
    await flush();
    await flush();
    fixture.detectChanges();
    expect(rows(fixture)).toHaveLength(3);
  });

  it('removes a row when a child is removed from composition', async () => {
    const { fixture, updates } = await setup(store, stacked(['a', 'b', 'c']));
    updates.forKeyString('sp').next(stacked(['a']));
    await flush();
    await flush();
    fixture.detectChanges();
    expect(rows(fixture)).toHaveLength(1);
  });
});

describe('OMCT-C07-L2-03.03 Coordinated cursor guides', () => {
  it('draws one crosshair and an aligned point on every row', async () => {
    const { fixture } = await setup({ a: telemetry('a'), b: telemetry('b') }, stacked(['a', 'b']));
    const svg = fixture.nativeElement.querySelector('[data-testid="stacked-plot-svg"]') as SVGSVGElement;
    jest.spyOn(svg, 'getBoundingClientRect').mockReturnValue({ left: 0, width: VIEW_W, top: 0, height: 300 } as DOMRect);

    const move = new Event('pointermove');
    Object.defineProperty(move, 'clientX', { value: 400 });
    svg.dispatchEvent(move);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="stacked-cursor"]')).not.toBeNull();
    const points = fixture.nativeElement.querySelectorAll('[data-testid="stacked-cursor-point"]');
    expect(points).toHaveLength(2);
    const xs = Array.from(points).map((point) => (point as Element).getAttribute('cx'));
    expect(new Set(xs).size).toBe(1);
  });
});
