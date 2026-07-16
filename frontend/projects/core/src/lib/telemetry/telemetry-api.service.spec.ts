import { TestBed } from '@angular/core/testing';
import { EMPTY, Observable } from 'rxjs';

import { AbortRegistry } from '../routing/abort-registry';
import { DomainObject } from '../models/domain-object';
import { ClockOffsets, TimeBounds, TimeMode, TimeSystem } from '../models/time';
import { TelemetryValue } from '../models/telemetry-value';
import { TimeContext } from '../time/time-context';
import { TelemetryApiService } from './telemetry-api.service';
import { TelemetryDatum, TelemetryProvider } from './telemetry-provider';
import { TelemetryRequest } from './telemetry-request';

function telemetryObject(key = 'pt'): DomainObject {
  return {
    identifier: { namespace: '', key },
    keyString: key,
    name: key,
    type: 'telemetry',
    location: null,
    composition: [],
  };
}

function datum(value: number): TelemetryValue {
  return { keyString: 'pt', timestamp: new Date(value).toISOString(), value };
}

class TimeContextStub extends TimeContext {
  override timeSystem(): TimeSystem {
    return { key: 'utc', name: 'UTC', timeFormat: 'utc' };
  }
  override bounds(): TimeBounds {
    return { start: 100, end: 200 };
  }
  override mode(): TimeMode {
    return 'fixed';
  }
  override clockOffsets(): ClockOffsets | null {
    return null;
  }
  override setTimeSystem(): void {}
  override setBounds(): void {}
  override boundsChanged(): Observable<TimeBounds> {
    return EMPTY;
  }
  override modeChanged(): Observable<TimeMode> {
    return EMPTY;
  }
  override tick(): Observable<number> {
    return EMPTY;
  }
}

class FakeProvider implements TelemetryProvider {
  emit?: (datum: TelemetryDatum) => void;
  unsubscribed = false;
  request = jest.fn(async (_object: DomainObject, _request: TelemetryRequest): Promise<TelemetryValue[]> => []);
  subscribe = jest.fn((_object: DomainObject, emit: (datum: TelemetryDatum) => void) => {
    this.emit = emit;
    return () => {
      this.unsubscribed = true;
    };
  });
  constructor(private readonly supports: boolean) {}
  supportsRequest(): boolean {
    return this.supports;
  }
  supportsSubscribe(): boolean {
    return this.supports;
  }
}

function setup(): TelemetryApiService {
  TestBed.configureTestingModule({
    providers: [TelemetryApiService, { provide: TimeContext, useClass: TimeContextStub }],
  });
  return TestBed.inject(TelemetryApiService);
}

describe('OMCT-C06-L2-01.01 Provider selection', () => {
  it('skips nonmatching providers and uses the first matching one', async () => {
    const api = setup();
    const skipped = new FakeProvider(false);
    const matching = new FakeProvider(true);
    api.addProvider(skipped);
    api.addProvider(matching);

    await api.request(telemetryObject());

    expect(skipped.request).not.toHaveBeenCalled();
    expect(matching.request).toHaveBeenCalledTimes(1);
  });
});

describe('OMCT-C06-L2-01.02 Unsupported telemetry result', () => {
  it('resolves an empty collection when no provider supports the request', async () => {
    const api = setup();
    api.addProvider(new FakeProvider(false));

    expect(await api.request(telemetryObject())).toEqual([]);
  });
});

describe('OMCT-C06-L2-01.03 Request option defaults', () => {
  it('fills bounds and domain from the time context without overwriting explicit values', async () => {
    const api = setup();
    const provider = new FakeProvider(true);
    api.addProvider(provider);

    await api.request(telemetryObject());
    expect(provider.request.mock.calls[0][1]).toMatchObject({ bounds: { start: 100, end: 200 }, domain: 'utc' });

    await api.request(telemetryObject(), { bounds: { start: 5, end: 9 }, domain: 'tai' });
    expect(provider.request.mock.calls[1][1]).toMatchObject({ bounds: { start: 5, end: 9 }, domain: 'tai' });
  });
});

describe('OMCT-C06-L2-01.04 Navigation cancellation', () => {
  it('aborts an in-flight request when navigation aborts registered work', async () => {
    const api = setup();
    const provider = new FakeProvider(true);
    provider.request.mockImplementation(
      (_object, request) =>
        new Promise((_resolve, reject) => {
          request.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    api.addProvider(provider);

    const pending = api.request(telemetryObject());
    TestBed.inject(AbortRegistry).abortAll();

    await expect(pending).rejects.toThrow('aborted');
  });
});

describe('OMCT-C06-L2-02.03 Latest strategy shape', () => {
  it('delivers one latest datum from a provider batch', () => {
    const api = setup();
    const provider = new FakeProvider(true);
    api.addProvider(provider);
    const received: TelemetryDatum[] = [];

    api.subscribe(telemetryObject(), (d) => received.push(d));
    provider.emit!([datum(1), datum(2)]);

    expect(received).toEqual([datum(2)]);
  });
});

describe('OMCT-C06-L2-02.04 Batch strategy shape', () => {
  it('delivers an array to a batch subscription', () => {
    const api = setup();
    const provider = new FakeProvider(true);
    api.addProvider(provider);
    const received: TelemetryDatum[] = [];

    api.subscribe(telemetryObject(), (d) => received.push(d), { strategy: 'batch' });
    provider.emit!([datum(1), datum(2)]);

    expect(received).toEqual([[datum(1), datum(2)]]);
  });
});

describe('OMCT-C06-L2-02.05 Legacy subscription compatibility', () => {
  it('relays a legacy provider single datum unchanged', () => {
    const api = setup();
    const provider = new FakeProvider(true);
    api.addProvider(provider);
    const received: TelemetryDatum[] = [];

    api.subscribe(telemetryObject(), (d) => received.push(d));
    provider.emit!(datum(7));

    expect(received).toEqual([datum(7)]);
  });
});
