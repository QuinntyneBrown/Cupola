import { CompositionApi, DomainObject, ObjectApi } from '@cupola/core';
import { FormsService } from '@cupola/components';

import { LinkAction } from './link-action';

function object(key: string): DomainObject {
  return { identifier: { namespace: '', key }, keyString: key, name: key, type: 'folder', location: 'mine', composition: [] };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('OMCT-C03-L2-02.03 Object linking', () => {
  it('adds an alias to the destination without removing the original membership', async () => {
    const forms = { showForm: jest.fn(async () => ({ location: 'dest' })) } as unknown as FormsService;
    const objects = { get: jest.fn(async (key: string) => object(key)) } as unknown as ObjectApi;
    const adds: { parent: string; child: string }[] = [];
    const removes: string[] = [];
    const composition = {
      get: jest.fn((parent: DomainObject) => ({
        add: jest.fn(async (child: DomainObject) => void adds.push({ parent: parent.keyString, child: child.keyString })),
        remove: jest.fn(async (child: DomainObject) => void removes.push(child.keyString)),
      })),
    } as unknown as CompositionApi;

    const action = new LinkAction(forms, objects, composition);
    action.invoke({ objectPath: [object('origParent'), object('src')] });
    await flush();

    expect(adds).toEqual([{ parent: 'dest', child: 'src' }]);
    expect(removes).toEqual([]);
  });
});
