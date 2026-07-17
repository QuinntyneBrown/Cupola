import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import {
  DefaultMetadataProvider,
  DomainObject,
  MetadataRegistry,
  NumberFormat,
  ObjectApi,
  ObjectUpdatesService,
  TelemetryApiService,
  TimeBounds,
  TimeContext,
  UtcFormat,
  ValueFormatRegistry,
} from '@cupola/core';

import { LadTableSetViewComponent } from './lad-table-set-view.component';

function object(keyString: string, type: string, composition: string[] = []): DomainObject {
  return {
    identifier: { namespace: '', key: keyString },
    keyString,
    name: keyString,
    type,
    location: null,
    composition,
    telemetry: type === 'telemetry' ? { hints: ['range'], unit: 'V' } : null,
  };
}

class TelemetryApiStub {
  request() {
    return Promise.resolve([]);
  }
  subscribe() {
    return () => {};
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
    return { start: 0, end: 1 };
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

async function setup(setComposition: string[], store: Record<string, DomainObject>) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: TelemetryApiService, useClass: TelemetryApiStub },
      { provide: ObjectApi, useValue: new ObjectApiStub(store) },
      { provide: ObjectUpdatesService, useClass: ObjectUpdatesStub },
      { provide: TimeContext, useClass: TimeContextStub },
    ],
  });
  TestBed.inject(MetadataRegistry).addProvider(new DefaultMetadataProvider());
  const formats = TestBed.inject(ValueFormatRegistry);
  formats.register(new NumberFormat());
  formats.register(new UtcFormat());
  const set = object('set', 'lad-table-set', setComposition);
  const fixture = TestBed.createComponent(LadTableSetViewComponent);
  fixture.componentRef.setInput('object', set);
  fixture.detectChanges();
  await flush();
  fixture.detectChanges();
  await flush();
  fixture.detectChanges();
  return fixture;
}

describe('OMCT-C08-L2-02.03 LAD table sets', () => {
  it('renders one section per composed LAD table', async () => {
    const store = {
      'lad-1': object('lad-1', 'lad-table', ['a']),
      'lad-2': object('lad-2', 'lad-table', ['a']),
      a: object('a', 'telemetry'),
    };
    const fixture = await setup(['lad-1', 'lad-2'], store);
    expect(fixture.nativeElement.querySelectorAll('[data-testid="lad-group"]')).toHaveLength(2);
    // Each section embeds a LAD table.
    expect(fixture.nativeElement.querySelectorAll('[data-testid="lad-table"]')).toHaveLength(2);
  });
});
