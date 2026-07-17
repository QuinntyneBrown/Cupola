import { TestBed } from '@angular/core/testing';
import { DomainObject, ObjectApi, ObjectSaveResult, TelemetryFilter } from '@cupola/core';

import { FilterStore } from './filter-store.service';

function view(overrides: Partial<DomainObject> = {}): DomainObject {
  return {
    identifier: { namespace: '', key: 'cs' },
    keyString: 'cs',
    name: 'Condition set',
    type: 'condition-set',
    location: null,
    composition: ['pwr.bus_v', 'pwr.mode'],
    ...overrides,
  };
}

class ObjectApiStub {
  saved: DomainObject[] = [];
  save(object: DomainObject): Promise<ObjectSaveResult> {
    this.saved.push(object);
    return Promise.resolve({ keyString: object.keyString, outcome: 'updated', object });
  }
}

function setup() {
  const objects = new ObjectApiStub();
  TestBed.configureTestingModule({ providers: [{ provide: ObjectApi, useValue: objects }] });
  return { store: TestBed.inject(FilterStore), objects };
}

const busEquals: TelemetryFilter = { key: 'value', comparator: 'equals', values: ['GOOD'] };
const globalMode: TelemetryFilter = { key: 'value', comparator: 'notEquals', values: ['SAFE'] };

describe('OMCT-C10-L2-04.02 Object and global filter scope', () => {
  it('stores an object-specific filter under the child scope and persists the view', async () => {
    const { store, objects } = setup();

    const updated = await store.saveObjectFilter(view(), 'pwr.bus_v', [busEquals]);

    expect((updated.configuration?.['filters'] as Record<string, unknown>)['byObject']).toEqual({
      'pwr.bus_v': [busEquals],
    });
    expect(objects.saved).toHaveLength(1);
    expect(store.applicableFilters(view(), 'pwr.bus_v')).toEqual([busEquals]);
  });

  it('stores a global filter and applies it to every compatible child', async () => {
    const { store } = setup();

    await store.saveGlobalFilter(view(), [globalMode]);

    expect(store.applicableFilters(view(), 'pwr.bus_v')).toEqual([globalMode]);
    expect(store.applicableFilters(view(), 'pwr.mode')).toEqual([globalMode]);
  });

  it('lets an object-specific filter override a global filter with the same key', async () => {
    const { store } = setup();

    await store.saveGlobalFilter(view(), [globalMode]);
    await store.saveObjectFilter(view(), 'pwr.bus_v', [busEquals]);

    expect(store.applicableFilters(view(), 'pwr.bus_v')).toEqual([busEquals]);
    expect(store.applicableFilters(view(), 'pwr.mode')).toEqual([globalMode]);
  });

  it('emits a change event for the view on save', async () => {
    const { store } = setup();
    const events: unknown[] = [];
    store.changes('cs').subscribe((config) => events.push(config));

    await store.saveObjectFilter(view(), 'pwr.bus_v', [busEquals]);

    expect(events).toHaveLength(1);
  });
});
