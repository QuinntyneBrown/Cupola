import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import {
  DefaultMetadataProvider,
  DomainObject,
  LimitEvaluation,
  LimitRegistry,
  MetadataRegistry,
  NumberFormat,
  ObjectApi,
  ObjectUpdatesService,
  TelemetryApiService,
  TelemetryValue,
  TimeBounds,
  TimeContext,
  UtcFormat,
  ValueFormatRegistry,
} from '@cupola/core';

import { WideDatum } from '../telemetry-view/telemetry-stream';
import { AutoflowViewComponent } from './autoflow-view.component';

const BOUNDS: TimeBounds = { start: 1_000, end: 10_000 };

let resizeCallbacks: ((entries: { contentRect: { width: number } }[]) => void)[] = [];
class FakeResizeObserver {
  constructor(private readonly cb: (entries: { contentRect: { width: number } }[]) => void) {
    resizeCallbacks.push(cb);
  }
  observe(): void {}
  disconnect(): void {}
}

function telemetry(keyString: string): DomainObject {
  return {
    identifier: { namespace: '', key: keyString },
    keyString,
    name: keyString,
    type: 'telemetry',
    location: null,
    composition: [],
    telemetry: { hints: ['range'], unit: 'V' },
  };
}

function autoflow(composition: string[]): DomainObject {
  return {
    identifier: { namespace: '', key: 'auto' },
    keyString: 'auto',
    name: 'Autoflow',
    type: 'autoflow',
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
  history: TelemetryValue[] = [];
  private emitters = new Map<string, (datum: WideDatum) => void>();
  request(): Promise<TelemetryValue[]> {
    return Promise.resolve(this.history);
  }
  subscribe(object: DomainObject, callback: (datum: WideDatum) => void): () => void {
    this.emitters.set(object.keyString, callback);
    return () => this.emitters.delete(object.keyString);
  }
  push(keyString: string, value: number, timestamp = 6_000): void {
    this.emitters
      .get(keyString)
      ?.({ keyString, timestamp: new Date(timestamp).toISOString(), value } as WideDatum);
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
  timeSystem() {
    return { key: 'utc', name: 'UTC', timeFormat: 'utc' };
  }
  bounds(): TimeBounds {
    return { ...BOUNDS };
  }
  mode() {
    return 'fixed' as const;
  }
  clockOffsets() {
    return null;
  }
  setTimeSystem(): void {}
  setBounds(): void {}
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
class LimitRegistryStub {
  evaluate(datum: TelemetryValue): LimitEvaluation | undefined {
    return Math.abs(datum.value) >= 0.9
      ? { level: 'critical', cssClass: 'is-limit--critical', low: -0.9, high: 0.9 }
      : undefined;
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function setup(
  object: DomainObject,
  store: Record<string, DomainObject>,
  options: { history?: TelemetryValue[]; limits?: boolean } = {},
) {
  TestBed.resetTestingModule();
  const api = new TelemetryApiStub();
  api.history = options.history ?? [];
  const updates = new ObjectUpdatesStub();
  TestBed.configureTestingModule({
    providers: [
      { provide: TelemetryApiService, useValue: api },
      { provide: ObjectApi, useValue: new ObjectApiStub(store) },
      { provide: ObjectUpdatesService, useValue: updates },
      { provide: TimeContext, useClass: TimeContextStub },
      { provide: LimitRegistry, useClass: options.limits ? LimitRegistryStub : LimitRegistry },
    ],
  });
  TestBed.inject(MetadataRegistry).addProvider(new DefaultMetadataProvider());
  const formats = TestBed.inject(ValueFormatRegistry);
  formats.register(new NumberFormat());
  formats.register(new UtcFormat());
  const fixture = TestBed.createComponent(AutoflowViewComponent);
  fixture.componentRef.setInput('object', object);
  fixture.detectChanges();
  await flush();
  fixture.detectChanges();
  await flush();
  fixture.detectChanges();
  return { fixture, api, updates };
}

function rows(fixture: ComponentFixture<AutoflowViewComponent>): HTMLElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('[data-testid="autoflow-row"]'));
}

beforeEach(() => {
  resizeCallbacks = [];
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = FakeResizeObserver;
});
afterAll(() => {
  delete (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver;
});

describe('OMCT-C08-L2-04.01 Autoflow rows', () => {
  it('renders one row per composed child and reflows across the available columns', async () => {
    const store = { a: telemetry('a'), b: telemetry('b'), c: telemetry('c') };
    const { fixture } = await setup(autoflow(['a', 'b', 'c']), store, { history: [datum(2_000, 1)] });
    expect(rows(fixture)).toHaveLength(3);

    const container = fixture.nativeElement.querySelector('[data-testid="autoflow-view"]');
    expect(container.getAttribute('data-columns')).toBe('1');

    // A wider container flows the rows into more columns.
    resizeCallbacks.forEach((cb) => cb([{ contentRect: { width: 900 } }]));
    fixture.detectChanges();
    expect(container.getAttribute('data-columns')).toBe('4');
  });
});

describe('OMCT-C08-L2-04.02 Autoflow telemetry and limits', () => {
  it('updates each row value and applies its limit class', async () => {
    const store = { a: telemetry('a') };
    const { fixture, api } = await setup(autoflow(['a']), store, { history: [datum(2_000, 0.1)], limits: true });
    const value = () => fixture.nativeElement.querySelector('[data-testid="autoflow-value"]');
    expect(value().textContent).toContain('0.1');
    expect(value().classList.contains('is-limit-critical')).toBe(false);

    api.push('a', 0.95);
    fixture.detectChanges();
    expect(value().textContent).toContain('0.95');
    expect(value().classList.contains('is-limit-critical')).toBe(true);
  });
});

describe('OMCT-C08-L2-04.03 Autoflow composition changes', () => {
  it('adds and removes rows as composition changes', async () => {
    const store = { a: telemetry('a'), b: telemetry('b') };
    const { fixture, updates } = await setup(autoflow(['a']), store, { history: [datum(2_000, 1)] });
    expect(rows(fixture)).toHaveLength(1);

    updates.forKeyString('auto').next(autoflow(['a', 'b']));
    await flush();
    fixture.detectChanges();
    expect(rows(fixture)).toHaveLength(2);

    updates.forKeyString('auto').next(autoflow(['b']));
    await flush();
    fixture.detectChanges();
    expect(rows(fixture).map((row) => row.getAttribute('data-key'))).toEqual(['b']);
  });
});
