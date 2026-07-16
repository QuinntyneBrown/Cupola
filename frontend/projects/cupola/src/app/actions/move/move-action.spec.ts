import { CompositionApi, DomainObject, ObjectApi } from '@cupola/core';
import { FormsService } from '@cupola/components';

import { MoveAction } from './move-action';

function object(key: string): DomainObject {
  return { identifier: { namespace: '', key }, keyString: key, name: key, type: 'folder', location: 'mine', composition: [] };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('OMCT-C03-L2-02.04 Object move', () => {
  it('adds the child to the destination and removes it from the current parent', async () => {
    const forms = { showForm: jest.fn(async () => ({ location: 'dest' })) } as unknown as FormsService;
    const objects = { get: jest.fn(async (key: string) => object(key)) } as unknown as ObjectApi;
    const adds: string[] = [];
    const removes: string[] = [];
    const composition = {
      get: jest.fn((parent: DomainObject) => ({
        add: jest.fn(async () => void adds.push(parent.keyString)),
        remove: jest.fn(async () => void removes.push(parent.keyString)),
      })),
    } as unknown as CompositionApi;

    const action = new MoveAction(forms, objects, composition);
    action.invoke({ objectPath: [object('current'), object('src')] });
    await flush();

    expect(adds).toEqual(['dest']);
    expect(removes).toEqual(['current']);
  });
});
