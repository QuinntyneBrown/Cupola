import { TestBed } from '@angular/core/testing';
import {
  DomainObject,
  ObjectApi,
  TelemetryApiService,
  TelemetryDatum,
  TelemetryRequest,
  TelemetryValue,
} from '@cupola/core';

import { MeanTelemetryProvider } from './mean-telemetry-provider';

function source(keyString: string): DomainObject {
  return {
    identifier: { namespace: '', key: keyString },
    keyString,
    name: keyString,
    type: 'telemetry',
    location: null,
    composition: [],
    telemetry: { hints: ['range'] },
  };
}

function meanObject(): DomainObject {
  return {
    identifier: { namespace: '', key: 'bus-mean' },
    keyString: 'bus-mean',
    name: 'Bus mean',
    type: 'derived-telemetry',
    location: null,
    composition: [],
    configuration: { derived: { kind: 'mean', sourceKeyString: 'pwr.bus_v', sampleCount: 3 } },
  };
}

class ObjectApiStub {
  get(keyString: string): Promise<DomainObject> {
    return Promise.resolve(source(keyString));
  }
}

class TelemetryStub {
  history: TelemetryValue[] = [];
  private callback?: (datum: TelemetryDatum) => void;
  request(): Promise<TelemetryValue[]> {
    return Promise.resolve(this.history);
  }
  subscribe(_object: DomainObject, callback: (datum: TelemetryDatum) => void): () => void {
    this.callback = callback;
    return () => (this.callback = undefined);
  }
  push(value: number, timestamp: string): void {
    this.callback?.({ keyString: 'pwr.bus_v', value, timestamp });
  }
}

function setup() {
  const telemetry = new TelemetryStub();
  TestBed.configureTestingModule({
    providers: [
      { provide: ObjectApi, useClass: ObjectApiStub },
      { provide: TelemetryApiService, useValue: telemetry },
    ],
  });
  return { provider: TestBed.inject(MeanTelemetryProvider), telemetry };
}

describe('OMCT-C10-L2-03.03 Mean telemetry', () => {
  it('emits the arithmetic mean of the latest sample window from history', async () => {
    const { provider, telemetry } = setup();
    telemetry.history = [
      { keyString: 'pwr.bus_v', timestamp: 't1', value: 3 },
      { keyString: 'pwr.bus_v', timestamp: 't2', value: 6 },
      { keyString: 'pwr.bus_v', timestamp: 't3', value: 9 },
      { keyString: 'pwr.bus_v', timestamp: 't4', value: 12 },
    ];

    const results = await provider.request(meanObject(), {} as TelemetryRequest);

    expect(results).toEqual([
      { keyString: 'bus-mean', timestamp: 't3', value: 6 },
      { keyString: 'bus-mean', timestamp: 't4', value: 9 },
    ]);
  });

  it('emits a mean over realtime data only once the window is full', async () => {
    const { provider, telemetry } = setup();
    const emitted: TelemetryValue[] = [];
    provider.subscribe(meanObject(), (datum) => emitted.push(datum as TelemetryValue));
    await new Promise((resolve) => setTimeout(resolve, 0));

    telemetry.push(3, 't1');
    telemetry.push(6, 't2');
    expect(emitted).toHaveLength(0);

    telemetry.push(9, 't3');
    expect(emitted).toEqual([{ keyString: 'bus-mean', timestamp: 't3', value: 6 }]);
  });
});
