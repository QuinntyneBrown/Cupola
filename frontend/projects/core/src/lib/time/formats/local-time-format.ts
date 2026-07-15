import { TimeFormat, padNumber } from '../time-format';

const LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

/**
 * Formats and parses timestamps in the host's local time zone as
 * `YYYY-MM-DD HH:mm:ss`. Requirement: OMCT-C05-L2-05.02.
 */
export class LocalTimeFormat implements TimeFormat {
  readonly key = 'local';

  format(value: number): string {
    const date = new Date(value);
    const y = date.getFullYear();
    const mo = padNumber(date.getMonth() + 1);
    const d = padNumber(date.getDate());
    const h = padNumber(date.getHours());
    const mi = padNumber(date.getMinutes());
    const s = padNumber(date.getSeconds());
    return `${y}-${mo}-${d} ${h}:${mi}:${s}`;
  }

  parse(text: string): number {
    const trimmed = text.trim();
    if (!LOCAL_PATTERN.test(trimmed)) {
      return Number.NaN;
    }
    const [datePart, timePart] = trimmed.split(' ');
    const [y, mo, d] = datePart.split('-').map(Number);
    const [h, mi, s] = timePart.split(':').map(Number);
    return new Date(y, mo - 1, d, h, mi, s).getTime();
  }

  validate(text: string): boolean {
    return LOCAL_PATTERN.test(text.trim());
  }
}
