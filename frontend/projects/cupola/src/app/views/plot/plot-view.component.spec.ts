import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import {
  DefaultMetadataProvider,
  DomainObject,
  LimitEvaluation,
  LimitRegistry,
  MetadataRegistry,
  ObjectApi,
  ObjectUpdatesService,
  TelemetryApiService,
  TelemetryValue,
  TimeBounds,
  TimeContext,
} from '@cupola/core';

import { PlotViewComponent } from './plot-view.component';
import { WideDatum } from '../../telemetry-view/telemetry-stream';

const BOUNDS: TimeBounds = { start: 1_000, end: 10_000 };

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

function overlay(keyString: string, composition: string[], configuration?: Record<string, unknown>): DomainObject {
  return {
    identifier: { namespace: '', key: keyString },
    keyString,
    name: keyString,
    type: 'overlay-plot',
    location: null,
    composition,
    telemetry: null,
    configuration,
  };
}

const datum = (timestamp: number, value: number): TelemetryValue => ({
  keyString: 'k',
  timestamp: new Date(timestamp).toISOString(),
  value,
});

class TelemetryApiStub {
  history: TelemetryValue[] = [];
  requestCount = 0;
  requestedBounds: TimeBounds[] = [];
  private emitters = new Map<string, (datum: WideDatum) => void>();
  request(_object: DomainObject, options: { bounds: TimeBounds }): Promise<TelemetryValue[]> {
    this.requestCount += 1;
    this.requestedBounds.push(options.bounds);
    return Promise.resolve(this.history);
  }
  subscribe(object: DomainObject, callback: (datum: WideDatum) => void): () => void {
    this.emitters.set(object.keyString, callback);
    return () => this.emitters.delete(object.keyString);
  }
  push(keyString: string, value: number, timestamp = 5_000): void {
    this.emitters.get(keyString)?.({ keyString, timestamp: new Date(timestamp).toISOString(), value } as WideDatum);
  }
}

class ObjectApiStub {
  constructor(private readonly store: Record<string, DomainObject> = {}) {}
  get(keyString: string): Promise<DomainObject> {
    const found = this.store[keyString];
    return found ? Promise.resolve(found) : Promise.reject(new Error('missing'));
  }
}

class ObjectUpdatesStub {
  private readonly subjects = new Map<string, Subject<DomainObject>>();
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
  bounds(): TimeBounds {
    return this.current;
  }
  mode() {
    return 'fixed' as const;
  }
  clockOffsets() {
    return null;
  }
  setTimeSystem(): void {}
  setBounds(bounds: TimeBounds): void {
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

class LimitRegistryStub {
  evaluate(datum: TelemetryValue): LimitEvaluation | undefined {
    return datum.value >= 42
      ? { level: 'critical', name: 'Critical', cssClass: 'is-limit--critical', low: -42, high: 42 }
      : undefined;
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function setup(object: DomainObject, options: { history?: TelemetryValue[]; store?: Record<string, DomainObject>; limits?: boolean } = {}) {
  TestBed.resetTestingModule();
  const api = new TelemetryApiStub();
  api.history = options.history ?? [];
  TestBed.configureTestingModule({
    providers: [
      { provide: TelemetryApiService, useValue: api },
      { provide: ObjectApi, useValue: new ObjectApiStub(options.store) },
      { provide: ObjectUpdatesService, useClass: ObjectUpdatesStub },
      { provide: TimeContext, useClass: TimeContextStub },
      { provide: LimitRegistry, useClass: options.limits ? LimitRegistryStub : LimitRegistry },
    ],
  });
  TestBed.inject(MetadataRegistry).addProvider(TestBed.inject(DefaultMetadataProvider));
  const fixture = TestBed.createComponent(PlotViewComponent);
  fixture.componentRef.setInput('object', object);
  fixture.detectChanges();
  await flush();
  fixture.detectChanges();
  await flush();
  fixture.detectChanges();
  return { fixture, api };
}

function seriesLines(fixture: ComponentFixture<PlotViewComponent>): HTMLElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('[data-testid="plot-series-line"]'));
}

describe('OMCT-C07-L2-02.01 Initial historical request', () => {
  it('issues one request for the active bounds on mount', async () => {
    const { api } = await setup(telemetry('pwr.bus_v'), { history: [datum(2_000, 29)] });
    expect(api.requestCount).toBe(1);
    expect(api.requestedBounds[0]).toEqual(BOUNDS);
  });
});

describe('OMCT-C07-L2-02.02 Realtime point rendering', () => {
  it('renders a newly emitted datum', async () => {
    const { fixture, api } = await setup(telemetry('pwr.bus_v'), { history: [datum(2_000, 29), datum(3_000, 30)] });
    expect(seriesLines(fixture)[0].getAttribute('data-count')).toBe('2');

    api.push('pwr.bus_v', 31, 6_000);
    fixture.detectChanges();
    expect(seriesLines(fixture)[0].getAttribute('data-count')).toBe('3');
  });
});

describe('OMCT-C07-L2-02.03 Axis ticks and labels', () => {
  it('renders formatted domain and range ticks', async () => {
    const { fixture } = await setup(telemetry('pwr.bus_v'), { history: [datum(2_000, 29), datum(9_000, 33)] });
    expect(fixture.nativeElement.querySelectorAll('[data-testid="plot-x-tick"]').length).toBeGreaterThan(1);
    expect(fixture.nativeElement.querySelectorAll('[data-testid="plot-y-tick"]').length).toBeGreaterThan(1);
  });
});

describe('OMCT-C07-L2-02.05 Pan and zoom', () => {
  it('updates the bounds and re-requests on zoom', async () => {
    const { fixture, api } = await setup(telemetry('pwr.bus_v'), { history: [datum(2_000, 29)] });
    const before = api.requestCount;
    fixture.nativeElement.querySelector('[data-testid="plot-zoom-in"]').click();
    await flush();
    expect(api.requestCount).toBeGreaterThan(before);
    expect(api.requestedBounds[api.requestedBounds.length - 1]).not.toEqual(BOUNDS);
  });

  it('ignores gestures in a restricted time-strip context', async () => {
    const api = new TelemetryApiStub();
    api.history = [datum(2_000, 29)];
    TestBed.configureTestingModule({
      providers: [
        { provide: TelemetryApiService, useValue: api },
        { provide: ObjectApi, useValue: new ObjectApiStub() },
        { provide: ObjectUpdatesService, useClass: ObjectUpdatesStub },
        { provide: TimeContext, useClass: TimeContextStub },
      ],
    });
    TestBed.inject(MetadataRegistry).addProvider(TestBed.inject(DefaultMetadataProvider));
    const fixture = TestBed.createComponent(PlotViewComponent);
    fixture.componentRef.setInput('object', telemetry('pwr.bus_v'));
    fixture.componentRef.setInput('restricted', true);
    fixture.detectChanges();
    await flush();
    fixture.detectChanges();
    // No toolbar is rendered when restricted, so there are no gesture controls.
    expect(fixture.nativeElement.querySelector('[data-testid="plot-toolbar"]')).toBeNull();
  });
});

describe('OMCT-C07-L2-02.06 Pause and resume', () => {
  it('freezes the rendered snapshot while telemetry keeps buffering', async () => {
    const { fixture, api } = await setup(telemetry('pwr.bus_v'), { history: [datum(2_000, 29), datum(3_000, 30)] });
    fixture.nativeElement.querySelector('[data-testid="plot-pause"]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="plot-paused"]')).not.toBeNull();

    api.push('pwr.bus_v', 31, 6_000);
    fixture.detectChanges();
    expect(seriesLines(fixture)[0].getAttribute('data-count')).toBe('2');

    fixture.nativeElement.querySelector('[data-testid="plot-pause"]').click();
    await flush();
    fixture.detectChanges();
    expect(seriesLines(fixture)[0].getAttribute('data-count')).toBe('3');
  });
});

describe('OMCT-C07-L2-02.07 Telemetry limit display', () => {
  it('renders limit lines and alarm-styled points when configured', async () => {
    const { fixture } = await setup(telemetry('tcs.batt_t', '°C'), {
      history: [datum(2_000, 20), datum(3_000, 43)],
      limits: true,
    });
    // limitLines default off — enable via configuration on the object.
    const withLimits = { ...telemetry('tcs.batt_t', '°C'), configuration: { plot: { limitLines: true } } };
    fixture.componentRef.setInput('object', withLimits);
    fixture.detectChanges();
    await flush();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="plot-limit-line"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="plot-alarm-point"]')).not.toBeNull();
  });
});

describe('OMCT-C07-L2-03.01 Overlay axes', () => {
  it('renders per-series axes in multiple-axis mode and none in single-axis mode', async () => {
    const store = { a: telemetry('a', 'kW'), b: telemetry('b', '°C') };
    const single = await setup(overlay('op', ['a', 'b'], { plot: { yAxisMode: 'single' } }), {
      history: [datum(2_000, 3)],
      store,
    });
    expect(single.fixture.nativeElement.querySelectorAll('[data-testid="plot-series-axis"]')).toHaveLength(0);

    const multi = await setup(overlay('op', ['a', 'b'], { plot: { yAxisMode: 'per-series' } }), {
      history: [datum(2_000, 3)],
      store,
    });
    expect(multi.fixture.nativeElement.querySelectorAll('[data-testid="plot-series-axis"]')).toHaveLength(2);
  });
});

describe('OMCT-C07-L2-03.04 Grid and series styles', () => {
  it('applies configured line style to a series', async () => {
    const { fixture } = await setup(
      overlay('op', ['a'], { plot: { series: { a: { lineStyle: 'dashed', colorSlot: 3 } } } }),
      { history: [datum(2_000, 3), datum(3_000, 4)], store: { a: telemetry('a') } },
    );
    const line = seriesLines(fixture)[0];
    expect(line.getAttribute('stroke-dasharray')).toBe('6 4');
    expect(line.getAttribute('stroke')).toBe('var(--cp-chart-3)');
  });

  it('hides gridlines when grid is disabled', async () => {
    const { fixture } = await setup(telemetry('pwr.bus_v'), {
      history: [datum(2_000, 29)],
    });
    const withoutGrid = { ...telemetry('pwr.bus_v'), configuration: { plot: { grid: false } } };
    fixture.componentRef.setInput('object', withoutGrid);
    fixture.detectChanges();
    await flush();
    fixture.detectChanges();
    const gridLines = fixture.nativeElement.querySelectorAll('.plot-svg g[stroke="var(--cp-chart-grid)"] line');
    expect(gridLines).toHaveLength(0);
  });
});
