import { Clock } from './clock';
import { ClockRegistry } from './clock-registry';

class StubClock implements Clock {
  constructor(
    readonly key: string,
    readonly name: string,
  ) {}
  subscribe(): () => void {
    return () => undefined;
  }
}

describe('OMCT-C05-L2-03.02 ClockRegistry', () => {
  let registry: ClockRegistry;

  beforeEach(() => {
    registry = new ClockRegistry();
  });

  it('resolves a registered clock by key', () => {
    const local = new StubClock('local', 'Local Clock');
    registry.register(local);

    expect(registry.get('local')).toBe(local);
    expect(registry.has('local')).toBe(true);
  });

  it('does not resolve an unregistered clock key', () => {
    expect(registry.get('remote')).toBeUndefined();
    expect(registry.has('remote')).toBe(false);
  });
});
