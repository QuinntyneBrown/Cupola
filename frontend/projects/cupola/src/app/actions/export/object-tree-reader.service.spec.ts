import { TestBed } from '@angular/core/testing';
import { DomainObject, ObjectApi, TypeRegistry } from '@cupola/core';

import { ObjectTreeReader } from './object-tree-reader.service';

function object(key: string, over: Partial<DomainObject> = {}): DomainObject {
  return { identifier: { namespace: '', key }, keyString: key, name: key, type: 'folder', location: null, composition: [], ...over };
}

function reader(objects: Record<string, DomainObject>, creatable: (type: string) => boolean): ObjectTreeReader {
  const api = { get: jest.fn(async (key: string) => objects[key]) };
  const types = { get: jest.fn((type: string) => ({ key: type, name: type, creatable: creatable(type) })) };
  TestBed.configureTestingModule({
    providers: [ObjectTreeReader, { provide: ObjectApi, useValue: api }, { provide: TypeRegistry, useValue: types }],
  });
  return TestBed.inject(ObjectTreeReader);
}

describe('OMCT-C03-L2-03.01 Recursive export', () => {
  it('serializes the object and creatable descendants, skipping non-creatable ones', async () => {
    const root = object('root', { location: 'ROOT', composition: ['a', 'b'] });
    const tree = reader(
      { root, a: object('a', { location: 'root' }), b: object('b', { location: 'root', type: 'telemetry' }) },
      (type) => type === 'folder',
    );

    const { objects } = await tree.read(root);

    expect(Object.keys(objects).sort()).toEqual(['a', 'root']);
  });
});

describe('OMCT-C03-L2-03.02 Cyclic export', () => {
  it('terminates on a cyclic location chain', async () => {
    const root = object('root', { location: 'a', composition: ['a'] });
    const tree = reader({ root, a: object('a', { location: 'root', composition: ['root'] }) }, () => true);

    const { objects } = await tree.read(root);

    expect(Object.keys(objects).sort()).toEqual(['a', 'root']);
  });
});

describe('OMCT-C03-L2-03.03 External-reference export', () => {
  it('records a link to an out-of-tree object as an external reference', async () => {
    const root = object('root', { location: 'ROOT', composition: ['ext'] });
    const tree = reader({ root, ext: object('ext', { location: 'elsewhere' }) }, () => true);

    const { objects, external } = await tree.read(root);

    expect(external).toEqual(['ext']);
    expect(Object.keys(objects)).toEqual(['root']);
  });
});
