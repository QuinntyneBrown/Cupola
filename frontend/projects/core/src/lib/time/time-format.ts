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

const DATED_LABEL = /^(\d{4}-\d{2}-\d{2})[T ]/;

/**
 * Condenses a run of timestamp labels for horizontal axes, where full
 * `YYYY-MM-DD HH:mm:ss.SSS` renderings overlap at typical tick densities:
 * when every label carries the same date the axis goes time-only (the dated
 * bounds remain visible in the conductor and independent-time badges), and
 * uniform `.000` millisecond tails are dropped. Labels that are not
 * shared-date timestamps pass through unchanged, so non-time formatters are
 * unaffected.
 */
export function condenseTimeLabels(labels: string[]): string[] {
  if (labels.length < 2) {
    return stripUniformZeroMillis(labels);
  }
  const dates = labels.map((label) => DATED_LABEL.exec(label)?.[1]);
  const shared = dates[0];
  if (!shared || dates.some((date) => date !== shared)) {
    return stripUniformZeroMillis(labels);
  }
  return stripUniformZeroMillis(labels.map((label) => label.slice(shared.length + 1)));
}

function stripUniformZeroMillis(labels: string[]): string[] {
  return labels.length > 0 && labels.every((label) => label.endsWith('.000'))
    ? labels.map((label) => label.slice(0, -'.000'.length))
    : labels;
}
