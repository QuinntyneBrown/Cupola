import { CompositionApi, DomainObject, ObjectApi } from '@cupola/core';
import { FormsService } from '@cupola/components';

import { DuplicateAction } from './duplicate-action';

function object(key: string, over: Partial<DomainObject> = {}): DomainObject {
  return { identifier: { namespace: '', key }, keyString: key, name: 'Source', type: 'folder', location: 'mine', composition: [], ...over };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function harness(formValues: Record<string, unknown>) {
  const forms = { showForm: jest.fn(async () => formValues) } as unknown as FormsService;
  const saved: DomainObject[] = [];
  const objects = {
    save: jest.fn(async (o: DomainObject) => {
      saved.push(o);
      return { keyString: o.keyString, outcome: 'created', object: o };
    }),
  } as unknown as ObjectApi;
  const added: DomainObject[] = [];
  const composition = {
    get: jest.fn(() => ({ add: jest.fn(async (o: DomainObject) => void added.push(o)) })),
  } as unknown as CompositionApi;
  return { forms, objects, saved, composition, added };
}

describe('OMCT-C03-L2-02.02 Object duplication', () => {
  it('creates a distinct object preserving the source name and adds it to the parent', async () => {
    const { forms, objects, saved, composition, added } = harness({ name: '' });
    const action = new DuplicateAction(forms, objects, composition);

    action.invoke({ objectPath: [object('parent'), object('src')] });
    await flush();

    expect(saved).toHaveLength(1);
    expect(saved[0].keyString).not.toBe('src');
    expect(saved[0].name).toBe('Source');
    expect(added.map((o) => o.keyString)).toEqual([saved[0].keyString]);
  });

  it('uses a replacement name when supplied', async () => {
    const { forms, objects, saved, composition } = harness({ name: 'Copy of source' });
    const action = new DuplicateAction(forms, objects, composition);

    action.invoke({ objectPath: [object('parent'), object('src')] });
    await flush();

    expect(saved[0].name).toBe('Copy of source');
  });
});
