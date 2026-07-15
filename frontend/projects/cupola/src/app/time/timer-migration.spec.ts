import { isLegacyTimer, migrateTimer } from './timer-migration';

describe('OMCT-C05-L2-05.05 Legacy timer migration', () => {
  it('maps the legacy format property to timerFormat and supplies direction', () => {
    expect(migrateTimer({ timestamp: 123, format: 'short' })).toEqual({
      timestamp: 123,
      timerFormat: 'short',
      direction: 'countUp',
    });
  });

  it('defaults missing legacy fields to the current structure', () => {
    expect(migrateTimer({})).toEqual({
      timestamp: null,
      timerFormat: 'long',
      direction: 'countUp',
    });
  });

  it('recognizes the legacy shape only when the legacy property is present', () => {
    expect(isLegacyTimer({ format: 'short' })).toBe(true);
    expect(isLegacyTimer({ timerFormat: 'short', timestamp: 1, direction: 'countUp' })).toBe(false);
  });
});
