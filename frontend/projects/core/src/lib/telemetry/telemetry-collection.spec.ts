import { DomainObject } from '../models/domain-object';
import { TelemetryValue } from '../models/telemetry-value';
import { TimeContext } from '../time/time-context';
import { TelemetryApiService } from './telemetry-api.service';
import { TelemetryCollection } from './telemetry-collection';
import { TelemetryMetadataView } from './telemetry-metadata-view';

function telemetryObject(): DomainObject {
  return {
    identifier: { namespace: '', key: 'pt' },
    keyString: 'pt',
    name: 'pt',
    type: 'telemetry',
    location: null,
    composition: [],
  };
}

function datum(value: number): TelemetryValue {
  return { keyString: 'pt', timestamp: new Date(value).toISOString(), value };
}

const timeContext = {
  timeSystem: () => ({ key: 'utc', name: 'UTC', timeFormat: 'utc' }),
  bounds: () => ({ start: 100, end: 200 }),
} as unknown as TimeContext;

function fakeApi(onSubscribe: (cb: (d: TelemetryValue) => void) => void): TelemetryApiService {
  return {
    request: jest.fn(async () => [datum(150)]),
    subscribe: jest.fn((_object: DomainObject, cb: (d: TelemetryValue) => void) => {
      onSubscribe(cb);
      return () => {};
    }),
  } as unknown as TelemetryApiService;
}

describe('OMCT-C06-L2-04.01 Collection acquisition', () => {
  it('loads historical data and appends realtime updates within bounds', async () => {
    let emit!: (d: TelemetryValue) => void;
    const collection = new TelemetryCollection(
      telemetryObject(),
      fakeApi((cb) => (emit = cb)),
      timeContext,
      undefined,
    );

    await collection.load();
    expect(collection.getAll()).toEqual([datum(150)]);

    emit(datum(160));
    expect(collection.getAll().map((d) => d.value)).toEqual([150, 160]);

    emit(datum(999)); // outside [100,200]
    expect(collection.getAll().map((d) => d.value)).toEqual([150, 160]);
  });
});

describe('OMCT-C06-L2-04.02 Time-metadata mismatch warning', () => {
  it('warns when metadata lacks a domain for the active time system', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    new TelemetryCollection(
      telemetryObject(),
      fakeApi(() => {}),
      timeContext,
      new TelemetryMetadataView([{ key: 't', hint: 'domain', timeSystem: 'tai' }]),
    );
    expect(warn).toHaveBeenCalled();

    warn.mockClear();
    new TelemetryCollection(
      telemetryObject(),
      fakeApi(() => {}),
      timeContext,
      new TelemetryMetadataView([{ key: 't', hint: 'domain', timeSystem: 'utc' }]),
    );
    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });
});
