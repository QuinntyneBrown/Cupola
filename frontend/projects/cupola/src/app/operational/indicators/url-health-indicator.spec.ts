import { UrlHealthIndicator } from './url-health-indicator';

describe('OMCT-C14-L2-05.02 URL health indicator', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function setup(responses: Array<{ ok: boolean } | Error>) {
    const fetchFn = jest.fn(() => {
      const next = responses.shift() ?? new Error('exhausted');
      return next instanceof Error ? Promise.reject(next) : Promise.resolve(next);
    });
    const indicator = new UrlHealthIndicator(
      { url: '/api/branding', intervalMs: 1000, label: 'API' },
      fetchFn,
    );
    return { indicator, fetchFn };
  }

  it('indicates the nominal state when a poll succeeds', async () => {
    const { indicator, fetchFn } = setup([{ ok: true }]);

    indicator.start();
    await jest.advanceTimersByTimeAsync(0);

    expect(fetchFn).toHaveBeenCalledWith('/api/branding');
    expect(indicator.indicator.textSignal!()).toBe('API: Reachable');
    expect(indicator.indicator.cssClass!()).toBe('cp-dot--ok');
    indicator.stop();
  });

  it('indicates the error state when a poll fails or the response is not ok', async () => {
    const { indicator } = setup([{ ok: true }, new Error('offline'), { ok: false }]);

    indicator.start();
    await jest.advanceTimersByTimeAsync(0);
    expect(indicator.indicator.cssClass!()).toBe('cp-dot--ok');

    await jest.advanceTimersByTimeAsync(1000);
    expect(indicator.indicator.textSignal!()).toBe('API: Unreachable');
    expect(indicator.indicator.cssClass!()).toBe('cp-dot--critical');

    await jest.advanceTimersByTimeAsync(1000);
    expect(indicator.indicator.cssClass!()).toBe('cp-dot--critical');
    indicator.stop();
  });
});
