import { TimeFormat, padNumber } from '../time-format';

const DURATION_PATTERN = /^-?\d+:[0-5]\d:[0-5]\d$/;

/**
 * Formats and parses durations as `HH:mm:ss` in milliseconds. Requirement:
 * OMCT-C05-L2-05.01.
 */
export class DurationFormat implements TimeFormat {
  readonly key = 'duration';

  format(value: number): string {
    const negative = value < 0;
    const totalSeconds = Math.floor(Math.abs(value) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${negative ? '-' : ''}${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}`;
  }

  parse(text: string): number {
    const trimmed = text.trim();
    if (!DURATION_PATTERN.test(trimmed)) {
      return Number.NaN;
    }
    const negative = trimmed.startsWith('-');
    const [hours, minutes, seconds] = trimmed.replace('-', '').split(':').map(Number);
    const magnitude = (hours * 3600 + minutes * 60 + seconds) * 1000;
    return negative ? -magnitude : magnitude;
  }

  validate(text: string): boolean {
    return DURATION_PATTERN.test(text.trim());
  }
}
