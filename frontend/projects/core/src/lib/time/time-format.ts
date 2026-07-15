/**
 * A registered time format that converts between numeric time values (epoch
 * milliseconds, in the units of the owning time system) and their textual
 * representation. Requirements: OMCT-C05-L2-05.01, OMCT-C05-L2-05.02.
 */
export interface TimeFormat {
  /** Unique key referenced by a {@link TimeSystem.timeFormat}. */
  readonly key: string;
  /** Renders a numeric time value as text. */
  format(value: number): string;
  /** Parses text back into a numeric time value; returns NaN when unparseable. */
  parse(text: string): number;
  /** Reports whether the text is a valid representation for this format. */
  validate(text: string): boolean;
}

/** Left-pads a non-negative integer to the requested width with zeros. */
export function padNumber(value: number, width = 2): string {
  return String(value).padStart(width, '0');
}
