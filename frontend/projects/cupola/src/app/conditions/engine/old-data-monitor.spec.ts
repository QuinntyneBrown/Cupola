import { OldDataMonitor } from './old-data-monitor';

describe('OMCT-C10-L2-01.05 Old-data criterion', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('evaluates the criterion as old once the no-data interval elapses', () => {
    const onStale = jest.fn();
    const monitor = new OldDataMonitor(onStale);
    monitor.track('c1', 30_000);

    expect(monitor.isStale('c1')).toBe(false);
    jest.advanceTimersByTime(30_000);

    expect(monitor.isStale('c1')).toBe(true);
    expect(onStale).toHaveBeenCalledWith('c1');
    monitor.destroy();
  });

  it('keeps the criterion current when a datum arrives before the interval', () => {
    const monitor = new OldDataMonitor(jest.fn());
    monitor.track('c1', 30_000);

    jest.advanceTimersByTime(20_000);
    monitor.reset('c1');
    jest.advanceTimersByTime(20_000);

    expect(monitor.isStale('c1')).toBe(false);
    monitor.destroy();
  });

  it('stops firing after destroy', () => {
    const onStale = jest.fn();
    const monitor = new OldDataMonitor(onStale);
    monitor.track('c1', 10_000);

    monitor.destroy();
    jest.advanceTimersByTime(10_000);

    expect(onStale).not.toHaveBeenCalled();
    expect(monitor.isEmpty).toBe(true);
  });
});
