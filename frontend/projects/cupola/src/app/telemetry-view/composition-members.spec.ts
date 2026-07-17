import { Subject } from 'rxjs';
import { DomainObject } from '@cupola/core';

import { CompositionMembers } from './composition-members';

function object(overrides: Partial<DomainObject>): DomainObject {
  return {
    identifier: { namespace: '', key: overrides.keyString ?? 'k' },
    keyString: 'k',
    name: 'k',
    type: 'telemetry',
    location: null,
    composition: [],
    ...overrides,
  };
}

class ObjectApiStub {
  constructor(private readonly store: Record<string, DomainObject>) {}
  get(keyString: string): Promise<DomainObject> {
    const found = this.store[keyString];
    return found ? Promise.resolve(found) : Promise.reject(new Error('missing'));
  }
}

class ObjectUpdatesStub {
  readonly subjects = new Map<string, Subject<DomainObject>>();
  forKeyString(keyString: string): Subject<DomainObject> {
    const subject = this.subjects.get(keyString) ?? new Subject<DomainObject>();
    this.subjects.set(keyString, subject);
    return subject;
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('CompositionMembers', () => {
  it('resolves the object itself when it is telemetry with no composition', async () => {
    const self = object({ keyString: 't', type: 'telemetry', telemetry: { hints: ['range'] } });
    const members = new CompositionMembers(self, new ObjectApiStub({}) as never, new ObjectUpdatesStub() as never);
    members.start();
    await flush();
    expect(members.members().map((member) => member.keyString)).toEqual(['t']);
  });

  it('resolves composed children', async () => {
    const child = object({ keyString: 'c', name: 'child', telemetry: { hints: ['range'] } });
    const parent = object({ keyString: 'p', type: 'overlay-plot', telemetry: null, composition: ['c'] });
    const members = new CompositionMembers(
      parent,
      new ObjectApiStub({ c: child }) as never,
      new ObjectUpdatesStub() as never,
    );
    members.start();
    await flush();
    expect(members.members().map((member) => member.keyString)).toEqual(['c']);
  });

  it('adds a rendered member when composition grows (03.02)', async () => {
    const a = object({ keyString: 'a', telemetry: { hints: ['range'] } });
    const b = object({ keyString: 'b', telemetry: { hints: ['range'] } });
    const parent = object({ keyString: 'p', type: 'overlay-plot', telemetry: null, composition: ['a'] });
    const updates = new ObjectUpdatesStub();
    const members = new CompositionMembers(parent, new ObjectApiStub({ a, b }) as never, updates as never);
    members.start();
    await flush();
    expect(members.members()).toHaveLength(1);

    updates.forKeyString('p').next({ ...parent, composition: ['a', 'b'] });
    await flush();
    expect(members.members().map((member) => member.keyString)).toEqual(['a', 'b']);
  });

  it('removes a rendered member when composition shrinks (03.02)', async () => {
    const a = object({ keyString: 'a', telemetry: { hints: ['range'] } });
    const b = object({ keyString: 'b', telemetry: { hints: ['range'] } });
    const parent = object({ keyString: 'p', type: 'overlay-plot', telemetry: null, composition: ['a', 'b'] });
    const updates = new ObjectUpdatesStub();
    const members = new CompositionMembers(parent, new ObjectApiStub({ a, b }) as never, updates as never);
    members.start();
    await flush();
    expect(members.members()).toHaveLength(2);

    updates.forKeyString('p').next({ ...parent, composition: ['a'] });
    await flush();
    expect(members.members().map((member) => member.keyString)).toEqual(['a']);
  });
});
