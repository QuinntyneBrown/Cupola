import { TelemetryValue } from '../models/telemetry-value';
import { SubscriptionCache } from './subscription-cache';

function datum(value: number): TelemetryValue {
  return { keyString: 'k', timestamp: new Date(value).toISOString(), value };
}

describe('OMCT-C06-L2-02.01 Subscription sharing', () => {
  it('opens one provider subscription and fans emissions out to all consumers', () => {
    const cache = new SubscriptionCache();
    const start = jest.fn((emit: (d: TelemetryValue) => void) => {
      (start as unknown as { emit: typeof emit }).emit = emit;
      return () => {};
    });
    const a: TelemetryValue[] = [];
    const b: TelemetryValue[] = [];

    cache.subscribe('k', start as never, (d) => a.push(d as TelemetryValue));
    cache.subscribe('k', start as never, (d) => b.push(d as TelemetryValue));

    expect(start).toHaveBeenCalledTimes(1);
    (start as unknown as { emit: (d: TelemetryValue) => void }).emit(datum(1));
    expect(a).toEqual([datum(1)]);
    expect(b).toEqual([datum(1)]);
  });
});

describe('OMCT-C06-L2-02.02 Final unsubscribe', () => {
  it('releases the provider subscription after the last consumer leaves', () => {
    const cache = new SubscriptionCache();
    const unsubscribe = jest.fn();
    const start = jest.fn(() => unsubscribe);

    const stopA = cache.subscribe('k', start as never, () => {});
    const stopB = cache.subscribe('k', start as never, () => {});

    stopA();
    expect(unsubscribe).not.toHaveBeenCalled();
    expect(cache.activeKeys).toBe(1);

    stopB();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(cache.activeKeys).toBe(0);
  });
});
