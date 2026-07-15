import { DurationFormat } from './duration-format';
import { UTCTimeFormat } from './utc-time-format';

describe('OMCT-C05-L2-05.01 UTC and duration formats', () => {
  describe('UTCTimeFormat', () => {
    const format = new UTCTimeFormat();

    it('formats epoch milliseconds as a UTC timestamp', () => {
      expect(format.format(0)).toBe('1970-01-01 00:00:00.000');
      expect(format.format(Date.UTC(2026, 6, 14, 13, 30, 15, 250))).toBe(
        '2026-07-14 13:30:15.250',
      );
    });

    it('parses a UTC timestamp back to epoch milliseconds (round trip)', () => {
      const value = Date.UTC(2026, 6, 14, 13, 30, 15, 250);
      expect(format.parse(format.format(value))).toBe(value);
    });

    it('reports validity of parsed values', () => {
      expect(format.validate('2026-07-14 13:30:15.250')).toBe(true);
      expect(format.validate('not-a-timestamp')).toBe(false);
    });
  });

  describe('DurationFormat', () => {
    const format = new DurationFormat();

    it('formats milliseconds as HH:mm:ss', () => {
      expect(format.format(0)).toBe('00:00:00');
      expect(format.format(3661000)).toBe('01:01:01');
      expect(format.format(-3661000)).toBe('-01:01:01');
    });

    it('parses HH:mm:ss back to milliseconds (round trip)', () => {
      expect(format.parse('01:01:01')).toBe(3661000);
      expect(format.parse(format.format(7200000))).toBe(7200000);
    });

    it('reports validity of duration strings', () => {
      expect(format.validate('01:01:01')).toBe(true);
      expect(format.validate('1:2:3')).toBe(false);
      expect(format.validate('bad')).toBe(false);
    });
  });
});
