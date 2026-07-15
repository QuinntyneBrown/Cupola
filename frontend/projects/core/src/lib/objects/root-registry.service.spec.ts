import { TestBed } from '@angular/core/testing';

import { DomainObject } from '../models/domain-object';
import { RootObjectCompositionProvider, ROOT_KEY_STRING } from './root-composition-provider';
import { RootRegistry } from './root-registry.service';

function domainObject(key: string): DomainObject {
  return {
    identifier: { namespace: '', key },
    keyString: key,
    name: key,
    type: 'folder',
    location: null,
    composition: [],
  };
}

describe('OMCT-C02-L2-03.05 Root registry', () => {
  it('returns registered roots in descending priority order', () => {
    const registry = new RootRegistry();
    registry.addRoot('low', 10);
    registry.addRoot('high', 30);
    registry.addRoot('mid', 20);

    expect(registry.getRoots()).toEqual(['high', 'mid', 'low']);
  });

  it('exposes the roots as the composition of the synthetic root object', async () => {
    TestBed.configureTestingModule({ providers: [RootObjectCompositionProvider] });
    const registry = TestBed.inject(RootRegistry);
    registry.addRoot('a', 5);
    registry.addRoot('b', 15);
    const provider = TestBed.inject(RootObjectCompositionProvider);

    expect(provider.appliesTo(domainObject(ROOT_KEY_STRING))).toBe(true);
    expect(provider.appliesTo(domainObject('other'))).toBe(false);
    expect(await provider.load()).toEqual(['b', 'a']);
  });
});
