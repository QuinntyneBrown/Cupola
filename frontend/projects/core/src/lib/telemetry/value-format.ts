/** A named value format that converts and validates telemetry field values. */
export interface Format {
  key: string;
  format(value: unknown): string;
  parse(text: string): number;
  validate(text: string): boolean;
}

/** Numeric format: string round-trip with numeric validation. */
export class NumberFormat implements Format {
  readonly key = 'number';

  format(value: unknown): string {
    return value == null ? '' : String(value);
  }

  parse(text: string): number {
    return Number(text);
  }

  validate(text: string): boolean {
    return text.trim() !== '' && !Number.isNaN(Number(text));
  }
}

/** UTC domain format: passes ISO timestamps through, parses to epoch milliseconds. */
export class UtcFormat implements Format {
  readonly key = 'utc';

  format(value: unknown): string {
    return value == null ? '' : String(value);
  }

  parse(text: string): number {
    return Date.parse(text);
  }

  validate(text: string): boolean {
    return !Number.isNaN(Date.parse(text));
  }
}
