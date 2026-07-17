import { TestBed } from '@angular/core/testing';
import { DomainObject, ObjectApi, TelemetryApiService, TelemetryValue } from '@cupola/core';

import { RelatedTelemetryService } from './related-telemetry.service';

function related(key: string, unit?: string): DomainObject {
  return {
    identifier: { namespace: '', key },
    keyString: key,
    name: `Source ${key}`,
    type: 'telemetry',
    location: null,
    composition: [],
    telemetry: { hints: ['range'], unit },
  };
}

function value(keyString: string, time: number): TelemetryValue {
  return { keyString, timestamp: new Date(time).toISOString(), value: time / 1000 };
}

describe('OMCT-C11-L2-03.01 Related telemetry', () => {
  const IMAGE_TIME = 600_000;

  function setup(valuesByKey: Record<string, TelemetryValue[]>) {
    const requests: { keyString: string; bounds: { start: number; end: number } }[] = [];
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ObjectApi,
          useValue: {
            get: (keyString: string) =>
              valuesByKey[keyString]
                ? Promise.resolve(related(keyString, 'V'))
                : Promise.reject(new Error('missing')),
          },
        },
        {
          provide: TelemetryApiService,
          useValue: {
            request: (
              object: DomainObject,
              options: { bounds: { start: number; end: number } },
            ) => {
              requests.push({ keyString: object.keyString, bounds: options.bounds });
              return Promise.resolve(valuesByKey[object.keyString] ?? []);
            },
          },
        },
      ],
    });
    return { service: TestBed.inject(RelatedTelemetryService), requests };
  }

  it('requests a trailing window ending exactly at the image time', async () => {
    const { service, requests } = setup({ 'pwr.bus_v': [value('pwr.bus_v', 590_000)] });

    await service.sample(['pwr.bus_v'], IMAGE_TIME);

    expect(requests).toHaveLength(1);
    expect(requests[0].bounds.end).toBe(IMAGE_TIME);
    expect(requests[0].bounds.start).toBeLessThan(IMAGE_TIME);
  });

  it('exposes the last value at or before the image time, never later', async () => {
    const { service } = setup({
      'pwr.bus_v': [
        value('pwr.bus_v', 580_000),
        value('pwr.bus_v', 600_000),
        value('pwr.bus_v', 610_000),
      ],
    });

    const [sample] = await service.sample(['pwr.bus_v'], IMAGE_TIME);

    expect(sample.timestamp).toBe(new Date(600_000).toISOString());
    expect(sample.unit).toBe('V');
    expect(sample.name).toBe('Source pwr.bus_v');
  });

  it('yields a null sample for unresolvable sources without failing the rest', async () => {
    const { service } = setup({ 'pwr.bus_v': [value('pwr.bus_v', 590_000)] });

    const samples = await service.sample(['gone', 'pwr.bus_v'], IMAGE_TIME);

    expect(samples[0]).toMatchObject({ keyString: 'gone', value: null });
    expect(samples[1].value).not.toBeNull();
  });
});
