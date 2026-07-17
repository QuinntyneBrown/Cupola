import { TestBed } from '@angular/core/testing';
import {
  DomainObject,
  ObjectApi,
  ObjectSaveResult,
  TelemetryApiService,
  TelemetryDatum,
  TelemetryFilter,
  TelemetryValue,
} from '@cupola/core';

import { ConditionConfiguration } from '../models/condition-models';
import { FilterStore } from '../filters/filter-store.service';
import { ConditionSetEvaluationService } from './condition-set-evaluation.service';

function telemetryObject(keyString: string): DomainObject {
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

function conditionSet(conditions: ConditionConfiguration[]): DomainObject {
  return {
    identifier: { namespace: '', key: 'cs' },
    keyString: 'cs',
    name: 'Bus monitor',
    type: 'condition-set',
    location: null,
    composition: ['pwr.bus_v'],
    configuration: { conditions },
  };
}

class ObjectApiStub {
  get(keyString: string): Promise<DomainObject> {
    return Promise.resolve(telemetryObject(keyString));
  }
  save(object: DomainObject): Promise<ObjectSaveResult> {
    return Promise.resolve({ keyString: object.keyString, outcome: 'updated', object });
  }
}

class TelemetryStub {
  requestCalls: { key: string; filters?: TelemetryFilter[] }[] = [];
  subscribeCalls: { key: string; filters?: TelemetryFilter[] }[] = [];
  seed = new Map<string, TelemetryValue[]>();
  private callbacks = new Map<string, (datum: TelemetryDatum) => void>();

  request(object: DomainObject, options?: { filters?: TelemetryFilter[] }): Promise<TelemetryValue[]> {
    this.requestCalls.push({ key: object.keyString, filters: options?.filters });
    return Promise.resolve(this.seed.get(object.keyString) ?? []);
  }

  subscribe(
    object: DomainObject,
    callback: (datum: TelemetryDatum) => void,
    options?: { filters?: TelemetryFilter[] },
  ): () => void {
    this.subscribeCalls.push({ key: object.keyString, filters: options?.filters });
    this.callbacks.set(object.keyString, callback);
    return () => this.callbacks.delete(object.keyString);
  }

  push(keyString: string, value: number, timestamp = '2026-07-16T00:00:00.000Z'): void {
    this.callbacks.get(keyString)?.({ keyString, value, timestamp });
  }
}

const conditions: ConditionConfiguration[] = [
  {
    id: 'undervolt',
    name: 'Undervoltage',
    trigger: 'all',
    output: 'UNDERVOLTAGE',
    criteria: [{ id: 'u1', telemetryKeyString: 'pwr.bus_v', metadataKey: 'value', operation: 'lessThan', input: [28] }],
  },
  {
    id: 'nominal',
    name: 'Nominal',
    trigger: 'all',
    output: 'NOMINAL',
    criteria: [
      { id: 'n1', telemetryKeyString: 'pwr.bus_v', metadataKey: 'value', operation: 'greaterThanOrEqualTo', input: [28] },
    ],
  },
  { id: 'default', name: 'Default', trigger: 'all', output: 'DEFAULT', criteria: [], isDefault: true },
];

function setup() {
  const telemetry = new TelemetryStub();
  TestBed.configureTestingModule({
    providers: [
      { provide: ObjectApi, useClass: ObjectApiStub },
      { provide: TelemetryApiService, useValue: telemetry },
    ],
  });
  return { service: TestBed.inject(ConditionSetEvaluationService), telemetry, filterStore: TestBed.inject(FilterStore) };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('ConditionSetEvaluationService', () => {
  it('publishes the first matching condition output as telemetry drives it (01.02, 01.03, 01.04)', async () => {
    const { service, telemetry } = setup();
    const results: string[] = [];
    const sub = service.evaluate(conditionSet(conditions)).subscribe((result) => results.push(result.output));
    await flush();

    telemetry.push('pwr.bus_v', 20);
    telemetry.push('pwr.bus_v', 30);
    telemetry.push('pwr.bus_v', 24);

    expect(results).toEqual(['DEFAULT', 'UNDERVOLTAGE', 'NOMINAL', 'UNDERVOLTAGE']);
    sub.unsubscribe();
  });

  it('resolves composed children through the object and telemetry APIs', async () => {
    const { service, telemetry } = setup();
    const sub = service.evaluate(conditionSet(conditions)).subscribe();
    await flush();

    expect(telemetry.subscribeCalls.map((call) => call.key)).toContain('pwr.bus_v');
    sub.unsubscribe();
  });
});

describe('OMCT-C10-L2-04.03 Filter request propagation', () => {
  it('passes the view filters into both the historical request and the realtime subscription', async () => {
    const { service, telemetry, filterStore } = setup();
    const filter: TelemetryFilter = { key: 'value', comparator: 'equals', values: ['GOOD'] };

    const view = conditionSet(conditions);
    await filterStore.saveObjectFilter(view, 'pwr.bus_v', [filter]);

    const sub = service.evaluate(view).subscribe();
    await flush();

    expect(telemetry.requestCalls).toContainEqual({ key: 'pwr.bus_v', filters: [filter] });
    expect(telemetry.subscribeCalls).toContainEqual({ key: 'pwr.bus_v', filters: [filter] });
    sub.unsubscribe();
  });
});
