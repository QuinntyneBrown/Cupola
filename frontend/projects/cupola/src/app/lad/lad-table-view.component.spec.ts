import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import {
  DefaultMetadataProvider,
  DomainObject,
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
import { LadTableViewComponent } from './lad-table-view.component';

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

function ladTable(composition: string[]): DomainObject {
  return {
    identifier: { namespace: '', key: 'lad' },
    keyString: 'lad',
    name: 'LAD',
    type: 'lad-table',
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
  private readonly subjects = new Map<string, Subject<DomainObject>>();
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

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function setup(object: DomainObject, store: Record<string, DomainObject>, history: TelemetryValue[]) {
  TestBed.resetTestingModule();
  const api = new TelemetryApiStub();
  api.history = history;
  TestBed.configureTestingModule({
    providers: [
      { provide: TelemetryApiService, useValue: api },
      { provide: ObjectApi, useValue: new ObjectApiStub(store) },
      { provide: ObjectUpdatesService, useClass: ObjectUpdatesStub },
      { provide: TimeContext, useClass: TimeContextStub },
    ],
  });
  TestBed.inject(MetadataRegistry).addProvider(new DefaultMetadataProvider());
  const formats = TestBed.inject(ValueFormatRegistry);
  formats.register(new NumberFormat());
  formats.register(new UtcFormat());
  const fixture = TestBed.createComponent(LadTableViewComponent);
  fixture.componentRef.setInput('object', object);
  fixture.detectChanges();
  await flush();
  fixture.detectChanges();
  await flush();
  fixture.detectChanges();
  return { fixture, api };
}

function value(fixture: ComponentFixture<LadTableViewComponent>, key: string): string {
  return (
    fixture.nativeElement
      .querySelector(`[data-testid="lad-row"][data-key="${key}"] [data-testid="lad-value"]`)
      ?.textContent?.trim() ?? ''
  );
}

describe('OMCT-C08-L2-02.02 Latest value per object', () => {
  it('renders one row per composed object showing its latest datum, updating in place', async () => {
    const store = { a: telemetry('a'), b: telemetry('b') };
    const { fixture, api } = await setup(ladTable(['a', 'b']), store, [datum(2_000, 10), datum(3_000, 20)]);

    const rows = fixture.nativeElement.querySelectorAll('[data-testid="lad-row"]');
    expect(rows).toHaveLength(2);
    // Latest historical value is shown for each object.
    expect(value(fixture, 'a')).toContain('20');
    expect(value(fixture, 'b')).toContain('20');

    // A realtime datum updates only that object's row, in place.
    api.push('a', 55);
    fixture.detectChanges();
    expect(value(fixture, 'a')).toContain('55');
    expect(value(fixture, 'b')).toContain('20');
    expect(fixture.nativeElement.querySelectorAll('[data-testid="lad-row"]')).toHaveLength(2);
  });
});
