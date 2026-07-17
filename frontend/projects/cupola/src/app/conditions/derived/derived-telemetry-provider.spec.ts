import { TestBed } from '@angular/core/testing';
import {
  DomainObject,
  ObjectApi,
  TelemetryApiService,
  TelemetryDatum,
  TelemetryRequest,
  TelemetryValue,
} from '@cupola/core';

import { DerivedTelemetryProvider } from './derived-telemetry-provider';

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

function expressionObject(sampleSize?: number): DomainObject {
  return {
    identifier: { namespace: '', key: 'derived-power' },
    keyString: 'derived-power',
    name: 'Derived power',
    type: 'derived-telemetry',
    location: null,
    composition: [],
    configuration: {
      derived: {
        kind: 'expression',
        expression: 'a * b',
        sampleSize,
        parameters: [
          { name: 'a', keyString: 'pwr.i' },
          { name: 'b', keyString: 'pwr.v' },
        ],
      },
    },
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
  return { provider: TestBed.inject(DerivedTelemetryProvider), telemetry };
}

describe('DerivedTelemetryProvider', () => {
  it('evaluates the expression over aligned historical sources', async () => {
    const { provider, telemetry } = setup();
    telemetry.histories.set('pwr.i', [
      { keyString: 'pwr.i', timestamp: 't1', value: 2 },
      { keyString: 'pwr.i', timestamp: 't2', value: 3 },
    ]);
    telemetry.histories.set('pwr.v', [
      { keyString: 'pwr.v', timestamp: 't1', value: 4 },
      { keyString: 'pwr.v', timestamp: 't2', value: 5 },
    ]);

    const results = await provider.request(expressionObject(), {} as TelemetryRequest);

    expect(results).toEqual([
      { keyString: 'derived-power', timestamp: 't1', value: 8 },
      { keyString: 'derived-power', timestamp: 't2', value: 15 },
    ]);
  });

  it('emits a streamed result once both realtime sources share a timestamp', async () => {
    const { provider, telemetry } = setup();
    const emitted: TelemetryValue[] = [];
    provider.subscribe(expressionObject(), (datum) => emitted.push(datum as TelemetryValue));
    await new Promise((resolve) => setTimeout(resolve, 0));

    telemetry.push('pwr.i', 3, 't1');
    expect(emitted).toHaveLength(0);

    telemetry.push('pwr.v', 4, 't1');
    expect(emitted).toEqual([{ keyString: 'derived-power', timestamp: 't1', value: 12 }]);
  });
});
