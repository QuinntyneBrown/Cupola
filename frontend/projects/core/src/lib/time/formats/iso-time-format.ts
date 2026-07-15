import { TimeFormat } from '../time-format';

const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;

/**
 * Formats and parses ISO 8601 timestamps in epoch milliseconds. Requirement:
 * OMCT-C05-L2-05.02.
 */
export class ISOTimeFormat implements TimeFormat {
  readonly key = 'iso';

  format(value: number): string {
    return new Date(value).toISOString();
  }

  parse(text: string): number {
    const trimmed = text.trim();
    if (!ISO_PATTERN.test(trimmed)) {
      return Number.NaN;
    }
    return Date.parse(trimmed);
  }

  validate(text: string): boolean {
    return !Number.isNaN(this.parse(text));
  }
}
