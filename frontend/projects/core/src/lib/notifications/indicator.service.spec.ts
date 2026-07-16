import { IndicatorService } from './indicator.service';

describe('OMCT-C14-L2-05.01 Indicator registration and priority', () => {
  it('exposes registered indicators in descending priority order', () => {
    const service = new IndicatorService();

    service.register({ key: 'low', priority: 10 });
    service.register({ key: 'high', priority: 90 });
    service.register({ key: 'mid', priority: 50 });

    expect(service.indicators().map((indicator) => indicator.key)).toEqual([
      'high',
      'mid',
      'low',
    ]);
  });

  it('replaces a registration that reuses an existing key', () => {
    const service = new IndicatorService();

    service.register({ key: 'clock', priority: 10, text: 'old' });
    service.register({ key: 'clock', priority: 80, text: 'new' });

    expect(service.indicators()).toHaveLength(1);
    expect(service.indicators()[0]).toMatchObject({ priority: 80, text: 'new' });
  });
});
