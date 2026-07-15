import { TestBed } from '@angular/core/testing';

import { DomainObject } from '../models/domain-object';
import { GlobalTimeContext } from './global-time-context';
import { TimeApiService } from './time-api.service';
import { TimeSystemRegistry } from './time-system-registry';

function object(keyString: string): DomainObject {
  return {
    identifier: { namespace: '', key: keyString },
    keyString,
    name: keyString,
    type: 'folder',
    location: null,
    composition: [],
  };
}

describe('TimeApiService', () => {
  let api: TimeApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    api = TestBed.inject(TimeApiService);
  });

  describe('OMCT-C05-L2-01.01 Time-system registration', () => {
    it('makes a registered time system available for activation', () => {
      api.registerTimeSystem({ key: 'tai', name: 'TAI', timeFormat: 'utc' });
      expect(TestBed.inject(TimeSystemRegistry).has('tai')).toBe(true);
    });
  });

  describe('OMCT-C05-L2-02.01 Global context default', () => {
    it('returns the global context when no object declares independent time', () => {
      const context = api.getContext([object('root'), object('leaf')]);
      expect(context).toBe(TestBed.inject(GlobalTimeContext));
    });
  });

  describe('OMCT-C05-L2-02.02 Independent context creation', () => {
    it("returns an object's own independent context", () => {
      const own = api.addIndependentContext('leaf');
      expect(api.getContext([object('root'), object('leaf')])).toBe(own);
    });
  });

  describe('OMCT-C05-L2-02.03 Ancestor context inheritance', () => {
    it('returns the nearest ancestor independent context for a descendant that owns none', () => {
      const ancestor = api.addIndependentContext('mid');
      const path = [object('root'), object('mid'), object('leaf')];
      expect(api.getContext(path)).toBe(ancestor);
    });
  });
});
