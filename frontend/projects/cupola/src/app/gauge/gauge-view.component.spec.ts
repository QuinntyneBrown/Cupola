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
import { GAUGE_FORMS, GaugeForm } from './gauge-config';
import { GaugeViewComponent } from './gauge-view.component';

const BOUNDS: TimeBounds = { start: 1_000, end: 10_000 };

function telemetry(keyString: string): DomainObject {
  return {
    identifier: { namespace: '', key: keyString },
    keyString,
    name: keyString,
    type: 'telemetry',
    location: null,
    composition: [],
    telemetry: { hints: ['range'], unit: 'kW' },
  };
}

function gauge(form: GaugeForm, composition: string[]): DomainObject {
  return {
    identifier: { namespace: '', key: 'g' },
    keyString: 'g',
    name: 'Array output',
    type: 'gauge',
    location: null,
    composition,
    telemetry: null,
    configuration: { gauge: { form, boundsMode: 'manual', min: 0, max: 100 } },
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

async function setup(object: DomainObject, history: TelemetryValue[]) {
  TestBed.resetTestingModule();
  const api = new TelemetryApiStub();
  api.history = history;
  TestBed.configureTestingModule({
    providers: [
      { provide: TelemetryApiService, useValue: api },
      { provide: ObjectApi, useValue: new ObjectApiStub({ a: telemetry('a') }) },
      { provide: ObjectUpdatesService, useClass: ObjectUpdatesStub },
      { provide: TimeContext, useClass: TimeContextStub },
    ],
  });
  TestBed.inject(MetadataRegistry).addProvider(new DefaultMetadataProvider());
  const formats = TestBed.inject(ValueFormatRegistry);
  formats.register(new NumberFormat());
  formats.register(new UtcFormat());
  const fixture = TestBed.createComponent(GaugeViewComponent);
  fixture.componentRef.setInput('object', object);
  fixture.detectChanges();
  await flush();
  fixture.detectChanges();
  await flush();
  fixture.detectChanges();
  return { fixture, api };
}

function gaugeValue(fixture: ComponentFixture<GaugeViewComponent>): string {
  return fixture.nativeElement.querySelector('[data-testid="gauge-value"]')?.textContent?.trim() ?? '';
}

describe('OMCT-C08-L2-03.01 Gauge forms', () => {
  it('renders each of the five gauge forms with its configured range', async () => {
    for (const form of GAUGE_FORMS) {
      const { fixture } = await setup(gauge(form, ['a']), [datum(2_000, 50)]);
      const formEl = fixture.nativeElement.querySelector('[data-testid="gauge-form"]');
      expect(formEl.getAttribute('data-form')).toBe(form);
      if (form === 'filled-dial' || form === 'needle-dial') {
        expect(formEl.querySelector('svg.dial')).not.toBeNull();
      } else {
        expect(formEl.querySelector('.cp-meter')).not.toBeNull();
      }
    }
  });
});

describe('OMCT-C08-L2-03.02 Latest gauge value', () => {
  it('displays the latest formatted range value and updates on a new datum', async () => {
    const { fixture, api } = await setup(gauge('horizontal-meter', ['a']), [datum(2_000, 42)]);
    expect(gaugeValue(fixture)).toContain('42');

    api.push('a', 63);
    fixture.detectChanges();
    expect(gaugeValue(fixture)).toContain('63');
  });
});
