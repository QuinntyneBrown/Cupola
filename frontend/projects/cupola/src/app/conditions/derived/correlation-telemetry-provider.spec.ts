import { TestBed } from '@angular/core/testing';
import {
  DomainObject,
  ObjectApi,
  TelemetryApiService,
  TelemetryDatum,
  TelemetryRequest,
  TelemetryValue,
} from '@cupola/core';

import { CorrelatedDatum, CorrelationTelemetryProvider } from './correlation-telemetry-provider';

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

function correlationObject(): DomainObject {
  return {
    identifier: { namespace: '', key: 'iv' },
    keyString: 'iv',
    name: 'Current vs voltage',
    type: 'derived-telemetry',
    location: null,
    composition: [],
    configuration: { derived: { kind: 'correlation', horizontalKeyString: 'pwr.i', verticalKeyString: 'pwr.v' } },
  };
}

class ObjectApiStub {
  get(keyString: string): Promise<DomainObject> {
    return Promise.resolve(source(keyString));
  }
}

class TelemetryStub {
  histories = new Map<string, TelemetryValue[]>();
  private callbacks = new Map<string, (datum: TelemetryDatum) => void>();
  request(object: DomainObject): Promise<TelemetryValue[]> {
    return Promise.resolve(this.histories.get(object.keyString) ?? []);
  }
  subscribe(object: DomainObject, callback: (datum: TelemetryDatum) => void): () => void {
    this.callbacks.set(object.keyString, callback);
    return () => this.callbacks.delete(object.keyString);
  }
  push(keyString: string, value: number, timestamp: string): void {
    this.callbacks.get(keyString)?.({ keyString, value, timestamp });
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
  return { provider: TestBed.inject(CorrelationTelemetryProvider), telemetry };
}

describe('OMCT-C10-L2-03.04 Timestamp correlation', () => {
  it('emits a paired datum only for timestamps present in both sources', async () => {
    const { provider, telemetry } = setup();
    telemetry.histories.set('pwr.i', [
      { keyString: 'pwr.i', timestamp: 't1', value: 2 },
      { keyString: 'pwr.i', timestamp: 't2', value: 4 },
    ]);
    telemetry.histories.set('pwr.v', [
      { keyString: 'pwr.v', timestamp: 't2', value: 28 },
      { keyString: 'pwr.v', timestamp: 't3', value: 29 },
    ]);

    const results = (await provider.request(correlationObject(), {} as TelemetryRequest)) as CorrelatedDatum[];

    expect(results).toEqual([{ keyString: 'iv', timestamp: 't2', value: 28, horizontal: 4, vertical: 28 }]);
  });

  it('correlates realtime values once both timestamps line up', async () => {
    const { provider, telemetry } = setup();
    const emitted: CorrelatedDatum[] = [];
    provider.subscribe(correlationObject(), (datum) => emitted.push(datum as CorrelatedDatum));
    await new Promise((resolve) => setTimeout(resolve, 0));

    telemetry.push('pwr.i', 5, 't1');
    expect(emitted).toHaveLength(0);

    telemetry.push('pwr.v', 30, 't1');
    expect(emitted).toEqual([{ keyString: 'iv', timestamp: 't1', value: 30, horizontal: 5, vertical: 30 }]);
  });
});
