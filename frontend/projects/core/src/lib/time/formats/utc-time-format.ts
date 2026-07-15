import { TimeFormat, padNumber } from '../time-format';

/**
 * Formats and parses UTC timestamps as `YYYY-MM-DD HH:mm:ss.SSS` in epoch
 * milliseconds. Requirement: OMCT-C05-L2-05.01.
 */
export class UTCTimeFormat implements TimeFormat {
  readonly key = 'utc';

  format(value: number): string {
    const date = new Date(value);
    const y = date.getUTCFullYear();
    const mo = padNumber(date.getUTCMonth() + 1);
    const d = padNumber(date.getUTCDate());
    const h = padNumber(date.getUTCHours());
    const mi = padNumber(date.getUTCMinutes());
    const s = padNumber(date.getUTCSeconds());
    const ms = padNumber(date.getUTCMilliseconds(), 3);
    return `${y}-${mo}-${d} ${h}:${mi}:${s}.${ms}`;
  }

  parse(text: string): number {
    const trimmed = text.trim();
    const isoish = trimmed.includes('T') ? trimmed : trimmed.replace(' ', 'T');
    const zoned = /[zZ]|[+-]\d{2}:?\d{2}$/.test(isoish) ? isoish : `${isoish}Z`;
    return Date.parse(zoned);
  }

  validate(text: string): boolean {
    return !Number.isNaN(this.parse(text));
  }
}
