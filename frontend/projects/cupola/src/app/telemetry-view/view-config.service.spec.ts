import { TestBed } from '@angular/core/testing';
import { DomainObject, ObjectApi, ObjectSaveResult } from '@cupola/core';

import { ViewConfigService } from './view-config.service';

class ObjectApiStub {
  readonly saved: DomainObject[] = [];
  save(object: DomainObject): Promise<ObjectSaveResult> {
    this.saved.push(object);
    return Promise.resolve({ keyString: object.keyString, outcome: 'updated', object });
  }
}

function object(configuration?: Record<string, unknown>): DomainObject {
  return {
    identifier: { namespace: '', key: 'p' },
    keyString: 'p',
    name: 'Plot',
    type: 'overlay-plot',
    location: null,
    composition: [],
    configuration,
  };
}

function setup() {
  const api = new ObjectApiStub();
  TestBed.configureTestingModule({ providers: [{ provide: ObjectApi, useValue: api }] });
  return { api, service: TestBed.inject(ViewConfigService) };
}

describe('ViewConfigService', () => {
  it('reads a configuration family', () => {
    const { service } = setup();
    expect(service.read(object({ plot: { grid: true } }), 'plot')).toEqual({ grid: true });
    expect(service.read(object(), 'plot')).toBeUndefined();
  });

  it('writes a family without disturbing sibling families', async () => {
    const { api, service } = setup();
    const saved = await service.write(object({ other: { a: 1 } }), 'plot', { grid: false });
    expect(saved.configuration).toEqual({ other: { a: 1 }, plot: { grid: false } });
    expect(api.saved).toHaveLength(1);
  });

  it('updates the current family value through a mutator (04.05)', async () => {
    const { service } = setup();
    const saved = await service.update<{ grid?: boolean }>(object({ plot: { grid: true } }), 'plot', (current) => ({
      ...current,
      grid: false,
    }));
    expect(saved.configuration?.['plot']).toEqual({ grid: false });
  });
});
