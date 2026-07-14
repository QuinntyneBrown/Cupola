import { AbortRegistry } from './abort-registry';

describe('OMCT-C15-L2-01.01 AbortRegistry', () => {
  let registry: AbortRegistry;

  beforeEach(() => {
    registry = new AbortRegistry();
  });

  it('aborts every registered callback once and clears the registry', () => {
    const first = jest.fn();
    const second = jest.fn();
    registry.register(first);
    registry.register(second);

    registry.abortAll();
    registry.abortAll();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(registry.size).toBe(0);
  });

  it('does not abort unregistered callbacks', () => {
    const abort = jest.fn();
    const unregister = registry.register(abort);
    unregister();

    registry.abortAll();

    expect(abort).not.toHaveBeenCalled();
  });
});
