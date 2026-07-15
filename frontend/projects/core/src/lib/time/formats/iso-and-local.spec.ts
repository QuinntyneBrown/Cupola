import { ISOTimeFormat } from './iso-time-format';
import { LocalTimeFormat } from './local-time-format';

describe('OMCT-C05-L2-05.02 Local and ISO formats', () => {
  describe('ISOTimeFormat', () => {
    const format = new ISOTimeFormat();

    it('formats epoch milliseconds as an ISO 8601 string', () => {
      expect(format.format(0)).toBe('1970-01-01T00:00:00.000Z');
    });

    it('parses an ISO 8601 string back to epoch milliseconds (round trip)', () => {
      const value = Date.UTC(2026, 6, 14, 13, 30, 15, 250);
      expect(format.parse(format.format(value))).toBe(value);
    });

    it('reports validity of ISO strings', () => {
      expect(format.validate('2026-07-14T13:30:15.250Z')).toBe(true);
      expect(format.validate('2026-07-14 13:30:15')).toBe(false);
      expect(format.validate('nope')).toBe(false);
    });
  });

  describe('LocalTimeFormat', () => {
    const format = new LocalTimeFormat();

    it('round-trips a second-aligned local timestamp', () => {
      // Build the value from local components so the assertion is time-zone independent.
      const value = new Date(2026, 6, 14, 13, 30, 15).getTime();
      const text = format.format(value);
      expect(text).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      expect(format.parse(text)).toBe(value);
    });

    it('reports validity of local strings', () => {
      expect(format.validate('2026-07-14 13:30:15')).toBe(true);
      expect(format.validate('2026-07-14T13:30:15Z')).toBe(false);
    });
  });
});
