import { CompositionApi, DomainObject, ObjectApi, ObjectType } from '@cupola/core';
import { FormsService } from '@cupola/components';

import { CreateAction } from './create-action';

function folder(key: string): DomainObject {
  return { identifier: { namespace: '', key }, keyString: key, name: key, type: 'folder', location: 'ROOT', composition: [] };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const folderType: ObjectType = { key: 'folder', name: 'Folder', glyph: 'i-folder', creatable: true };

function harness(formValues: Record<string, unknown>) {
  const forms = { showForm: jest.fn(async () => formValues) } as unknown as FormsService;
  const saved: DomainObject[] = [];
  const objects = {
    save: jest.fn(async (object: DomainObject) => {
      saved.push(object);
      return { keyString: object.keyString, outcome: 'created', object };
    }),
  } as unknown as ObjectApi;
  const added: DomainObject[] = [];
  const composition = {
    get: jest.fn(() => ({ add: jest.fn(async (object: DomainObject) => void added.push(object)) })),
  } as unknown as CompositionApi;
  return { forms, objects, saved, composition, added };
}

describe('OMCT-C03-L2-01.01 Type-based creation', () => {
  it('persists a new object of the type and adds it to the parent composition', async () => {
    const { forms, objects, saved, composition, added } = harness({ name: 'New folder' });
    const action = new CreateAction(folderType, forms, objects, composition);

    action.invoke({ objectPath: [folder('parent')] });
    await flush();

    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ type: 'folder', name: 'New folder', location: 'parent' });
    expect(added.map((object) => object.keyString)).toEqual([saved[0].keyString]);
  });

  it('applies only to a folder parent', () => {
    const { forms, objects, composition } = harness({});
    const action = new CreateAction(folderType, forms, objects, composition);

    expect(action.appliesTo({ objectPath: [folder('p')] })).toBe(true);
    expect(action.appliesTo({ objectPath: [{ ...folder('t'), type: 'telemetry' }] })).toBe(false);
  });
});

describe('OMCT-C03-L2-02.01 Folder creation', () => {
  it('adds the created folder identifier to the parent composition', async () => {
    const { forms, objects, saved, composition, added } = harness({ name: 'Logs' });
    const action = new CreateAction(folderType, forms, objects, composition);

    action.invoke({ objectPath: [folder('mine')] });
    await flush();

    expect(saved[0].type).toBe('folder');
    expect(added).toEqual([saved[0]]);
  });
});
