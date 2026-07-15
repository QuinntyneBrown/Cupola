import { TimeSystem } from '../models/time';
import { TimeSystemRegistry } from './time-system-registry';

const UTC: TimeSystem = { key: 'utc', name: 'UTC', timeFormat: 'utc' };
const LOCAL: TimeSystem = { key: 'local', name: 'Local Time', timeFormat: 'local' };

describe('OMCT-C05-L2-01.01 TimeSystemRegistry', () => {
  let registry: TimeSystemRegistry;

  beforeEach(() => {
    registry = new TimeSystemRegistry();
  });

  it('makes a registered time system available for activation', () => {
    registry.register(UTC);
    registry.register(LOCAL);

    expect(registry.get('utc')).toEqual(UTC);
    expect(registry.has('utc')).toBe(true);
    expect(registry.list()).toEqual([UTC, LOCAL]);
  });

  it('reports an unregistered key as unavailable', () => {
    expect(registry.has('tai')).toBe(false);
    expect(registry.get('tai')).toBeUndefined();
  });
});
