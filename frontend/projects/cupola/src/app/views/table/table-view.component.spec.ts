import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import {
  DefaultMetadataProvider,
  DomainObject,
  MetadataRegistry,
  NumberFormat,
  ObjectApi,
  ObjectSaveResult,
  ObjectUpdatesService,
  TelemetryApiService,
  TelemetryValue,
  TimeBounds,
  TimeContext,
  UtcFormat,
  ValueFormatRegistry,
} from '@cupola/core';

import { WideDatum } from '../../telemetry-view/telemetry-stream';
import { TableViewComponent } from './table-view.component';

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

const datum = (timestamp: number, value: number): TelemetryValue => ({
  keyString: 'k',
  timestamp: new Date(timestamp).toISOString(),
  value,
});

class TelemetryApiStub {
  history: TelemetryValue[] = [];
  requestCount = 0;
  deferred = false;
  private pending: (() => void)[] = [];
  private emitters = new Map<string, (datum: WideDatum) => void>();

  request(): Promise<TelemetryValue[]> {
    this.requestCount += 1;
    if (this.deferred) {
      return new Promise((resolve) => this.pending.push(() => resolve(this.history)));
    }
    return Promise.resolve(this.history);
  }
  resolveAll(): void {
    this.pending.forEach((resolve) => resolve());
    this.pending = [];
  }
  subscribe(object: DomainObject, callback: (datum: WideDatum) => void): () => void {
    this.emitters.set(object.keyString, callback);
    return () => this.emitters.delete(object.keyString);
  }
  push(keyString: string, value: number, timestamp = 5_000): void {
    this.emitters
      .get(keyString)
      ?.({ keyString, timestamp: new Date(timestamp).toISOString(), value } as WideDatum);
  }
}

class ObjectApiStub {
  saved: DomainObject[] = [];
  get(keyString: string): Promise<DomainObject> {
    return Promise.reject(new Error(`no ${keyString}`));
  }
  save(object: DomainObject): Promise<ObjectSaveResult> {
    this.saved.push(object);
    return Promise.resolve({ keyString: object.keyString, outcome: 'updated', object });
  }
}

class ObjectUpdatesStub {
  private readonly subjects = new Map<string, Subject<DomainObject>>();
  forKeyString(keyString: string): Subject<DomainObject> {
    const subject = this.subjects.get(keyString) ?? new Subject<DomainObject>();
    this.subjects.set(keyString, subject);
    return subject;
  }
  emitLocal(): void {}
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

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function setup(
  object: DomainObject,
  options: { history?: TelemetryValue[]; deferred?: boolean } = {},
) {
  TestBed.resetTestingModule();
  const api = new TelemetryApiStub();
  api.history = options.history ?? [];
  api.deferred = options.deferred ?? false;
  const time = new TimeContextStub();
  TestBed.configureTestingModule({
    providers: [
      { provide: TelemetryApiService, useValue: api },
      { provide: ObjectApi, useClass: ObjectApiStub },
      { provide: ObjectUpdatesService, useClass: ObjectUpdatesStub },
      { provide: TimeContext, useValue: time },
    ],
  });
  TestBed.inject(MetadataRegistry).addProvider(new DefaultMetadataProvider());
  const formats = TestBed.inject(ValueFormatRegistry);
  formats.register(new NumberFormat());
  formats.register(new UtcFormat());
  const fixture = TestBed.createComponent(TableViewComponent);
  fixture.componentRef.setInput('object', object);
  fixture.detectChanges();
  await flush();
  fixture.detectChanges();
  await flush();
  fixture.detectChanges();
  return { fixture, api, time };
}

function rows(fixture: ComponentFixture<TableViewComponent>): HTMLElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('[data-testid="table-row"]'));
}
function query(fixture: ComponentFixture<TableViewComponent>, testId: string): HTMLElement | null {
  return fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);
}

describe('OMCT-C08-L2-01.02 Loading indication', () => {
  it('shows the progress indicator only while the historical request is active', async () => {
    const { fixture, api } = await setup(telemetry('pwr.bus_v'), {
      history: [datum(2_000, 4), datum(3_000, 5)],
      deferred: true,
    });
    // Request in flight — the indeterminate progress bar is shown.
    expect(query(fixture, 'table-progress')).not.toBeNull();

    api.resolveAll();
    await flush();
    fixture.detectChanges();
    // Request resolved — progress gone, rows rendered.
    expect(query(fixture, 'table-progress')).toBeNull();
    expect(rows(fixture)).toHaveLength(2);
  });
});

describe('OMCT-C08-L2-01.06 Row marking and pause', () => {
  it('marking a row retains it and pauses visible realtime updates', async () => {
    const { fixture, api } = await setup(telemetry('pwr.bus_v'), {
      history: [datum(2_000, 4), datum(3_000, 5)],
    });
    expect(rows(fixture)).toHaveLength(2);

    // Mark the first row.
    rows(fixture)[0].click();
    fixture.detectChanges();
    expect(query(fixture, 'table-paused')).not.toBeNull();
    expect(rows(fixture)[0].classList.contains('is-marked')).toBe(true);

    // Realtime datum arrives — the frozen row set does not grow.
    api.push('pwr.bus_v', 6, 6_000);
    fixture.detectChanges();
    expect(rows(fixture)).toHaveLength(2);
  });
});

describe('OMCT-C08-L2-01.07 Bounds-change resume', () => {
  it('clears the paused state and refreshes for the new bounds', async () => {
    const { fixture, api, time } = await setup(telemetry('pwr.bus_v'), {
      history: [datum(2_000, 4), datum(3_000, 5)],
    });
    rows(fixture)[0].click();
    fixture.detectChanges();
    expect(query(fixture, 'table-paused')).not.toBeNull();
    const before = api.requestCount;

    time.setBounds({ start: 3_000, end: 4_000 });
    await flush();
    fixture.detectChanges();

    // Pause cleared, marks cleared, and a fresh request issued for the new bounds.
    expect(query(fixture, 'table-paused')).toBeNull();
    expect(rows(fixture).some((row) => row.classList.contains('is-marked'))).toBe(false);
    expect(api.requestCount).toBeGreaterThan(before);
  });
});
