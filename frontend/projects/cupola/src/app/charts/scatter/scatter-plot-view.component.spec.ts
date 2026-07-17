import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import {
  DefaultMetadataProvider,
  DomainObject,
  MetadataRegistry,
  ObjectApi,
  ObjectUpdatesService,
  TelemetryApiService,
  TelemetryValue,
  TimeBounds,
  TimeContext,
} from '@cupola/core';

import { MultiRangeMetadataProvider } from '../../views/plot/multi-range-metadata-provider';
import { ScatterPlotViewComponent } from './scatter-plot-view.component';
import { WideDatum } from '../../telemetry-view/telemetry-stream';

const BOUNDS: TimeBounds = { start: 1_000, end: 10_000 };

function source(): DomainObject {
  return {
    identifier: { namespace: '', key: 'iv' },
    keyString: 'iv',
    name: 'IV sample',
    type: 'telemetry',
    location: null,
    composition: [],
    telemetry: { hints: ['range'] },
    configuration: { ranges: ['current', 'voltage'] },
  };
}

function scatter(): DomainObject {
  return {
    identifier: { namespace: '', key: 'sc' },
    keyString: 'sc',
    name: 'IV scatter',
    type: 'scatter-plot',
    location: null,
    composition: ['iv'],
    telemetry: null,
    configuration: { scatter: { xKey: 'current', yKey: 'voltage' } },
  };
}

class TelemetryApiStub {
  history: WideDatum[] = [];
  request(): Promise<TelemetryValue[]> {
    return Promise.resolve(this.history as unknown as TelemetryValue[]);
  }
  subscribe(): () => void {
    return () => undefined;
  }
}

class ObjectApiStub {
  get(): Promise<DomainObject> {
    return Promise.resolve(source());
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

const iv = (current: number, voltage: number): WideDatum =>
  ({ keyString: 'iv', timestamp: '2026-07-13T18:00:00Z', value: current, current, voltage }) as WideDatum;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function setup() {
  TestBed.resetTestingModule();
  const api = new TelemetryApiStub();
  api.history = [iv(3, 28), iv(4, 30), iv(5, 31)];
  TestBed.configureTestingModule({
    providers: [
      { provide: TelemetryApiService, useValue: api },
      { provide: ObjectApi, useClass: ObjectApiStub },
      { provide: ObjectUpdatesService, useClass: ObjectUpdatesStub },
      { provide: TimeContext, useClass: TimeContextStub },
    ],
  });
  const registry = TestBed.inject(MetadataRegistry);
  registry.addProvider(TestBed.inject(DefaultMetadataProvider));
  registry.addProvider(TestBed.inject(MultiRangeMetadataProvider));
  const fixture = TestBed.createComponent(ScatterPlotViewComponent);
  fixture.componentRef.setInput('object', scatter());
  fixture.detectChanges();
  await flush();
  await flush();
  fixture.detectChanges();
  return fixture;
}

function points(fixture: ComponentFixture<ScatterPlotViewComponent>): NodeListOf<Element> {
  return fixture.nativeElement.querySelectorAll('[data-testid="scatter-point"]');
}

describe('OMCT-C07-L2-04.04 Scatter axes', () => {
  it('renders a point per sample from the two configured ranges', async () => {
    const fixture = await setup();
    expect(points(fixture)).toHaveLength(3);
  });

  it('labels each axis from its range metadata', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('[data-testid="scatter-x-title"]').textContent).toContain('current');
    expect(fixture.nativeElement.querySelector('[data-testid="scatter-y-title"]').textContent).toContain('voltage');
  });
});
