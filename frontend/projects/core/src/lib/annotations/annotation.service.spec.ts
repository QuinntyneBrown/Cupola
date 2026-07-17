import { TestBed } from '@angular/core/testing';

import { Annotation } from '../models/annotation';
import { DomainObject } from '../models/domain-object';
import { ObjectSaveResult } from '../models/object-save-result';
import { ObjectApi } from '../objects/object-api.service';
import { AnnotationService } from './annotation.service';

class FakeObjectApi {
  readonly saved: DomainObject[] = [];
  save = jest.fn((object: DomainObject): Promise<ObjectSaveResult> => {
    this.saved.push(object);
    return Promise.resolve({ keyString: object.keyString, outcome: 'created', object });
  });
  get = jest.fn();
}

function setup(): { service: AnnotationService; api: FakeObjectApi } {
  const api = new FakeObjectApi();
  TestBed.configureTestingModule({
    providers: [AnnotationService, { provide: ObjectApi, useValue: api }],
  });
  const service = TestBed.inject(AnnotationService);
  service.registerType('tag');
  return { service, api };
}

function annotation(over: Partial<Annotation> = {}): Annotation {
  return {
    keyString: '',
    text: 'Observed pointing offset',
    targets: ['pwr.bus_v'],
    tags: ['power'],
    annotationType: 'tag',
    ...over,
  };
}

describe('OMCT-C13-L2-04.01 — Annotation creation', () => {
  it('persists a known-type annotation as an annotation-typed object and returns it', async () => {
    const { service, api } = setup();
    const created = await service.create(annotation());

    expect(created.keyString).toMatch(/^ann\./);
    expect(api.save).toHaveBeenCalledTimes(1);
    const object = api.saved[0];
    expect(object.type).toBe('annotation');
    expect(object.configuration?.['annotation']).toEqual({
      text: 'Observed pointing offset',
      targets: ['pwr.bus_v'],
      tags: ['power'],
    });
    expect(object.configuration?.['annotationType']).toBe('tag');
  });
});

describe('OMCT-C13-L2-04.02 — Immutable-target annotation', () => {
  it('stores the annotation in a writable namespace without mutating the immutable target', async () => {
    const { service, api } = setup();
    service.registerNamespace('readonly', { writable: false });

    // The target lives in the immutable "readonly" namespace; the annotation is
    // written to the default writable namespace and the target is never saved.
    const created = await service.create(annotation({ targets: ['readonly:sensor'] }));

    expect(created.keyString).toMatch(/^ann\./);
    expect(api.save).toHaveBeenCalledTimes(1);
    expect(api.saved[0].type).toBe('annotation');
    expect(api.saved.some((object) => object.keyString === 'readonly:sensor')).toBe(false);
  });
});

describe('OMCT-C13-L2-04.03 — Annotation validation', () => {
  it('rejects an unknown annotation type without creating an annotation', async () => {
    const { service, api } = setup();
    await expect(service.create(annotation({ annotationType: 'mystery' }))).rejects.toThrow(
      /unknown annotation type/i,
    );
    expect(api.save).not.toHaveBeenCalled();
  });

  it('rejects an unavailable annotation namespace', async () => {
    const { service, api } = setup();
    await expect(service.create(annotation(), { namespace: 'ghost' })).rejects.toThrow(
      /not available/i,
    );
    expect(api.save).not.toHaveBeenCalled();
  });

  it('rejects an immutable annotation namespace', async () => {
    const { service, api } = setup();
    service.registerNamespace('readonly', { writable: false });
    await expect(service.create(annotation(), { namespace: 'readonly' })).rejects.toThrow(
      /immutable|not writable/i,
    );
    expect(api.save).not.toHaveBeenCalled();
  });
});
