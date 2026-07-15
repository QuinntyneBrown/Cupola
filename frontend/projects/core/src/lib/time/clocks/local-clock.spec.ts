import { LocalClock } from './local-clock';

describe('OMCT-C05-L2-03.04 LocalClock', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('emits the current epoch time once per configured interval', () => {
    const clock = new LocalClock(1000);
    const ticks: number[] = [];

    const unsubscribe = clock.subscribe((tick) => ticks.push(tick));
    jest.advanceTimersByTime(3000);

    expect(ticks).toHaveLength(3);
    expect(ticks.every((tick) => typeof tick === 'number')).toBe(true);
    expect(ticks[2]).toBeGreaterThanOrEqual(ticks[0]);

    unsubscribe();
  });

  it('stops emitting once the last subscriber unsubscribes', () => {
    const clock = new LocalClock(1000);
    const ticks: number[] = [];

    const unsubscribe = clock.subscribe((tick) => ticks.push(tick));
    jest.advanceTimersByTime(2000);
    unsubscribe();
    jest.advanceTimersByTime(5000);

    expect(ticks).toHaveLength(2);
  });
});
