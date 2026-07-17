/** A linear mapping from a data domain to a pixel range. */
export interface LinearScale {
  readonly domainMin: number;
  readonly domainMax: number;
  readonly rangeMin: number;
  readonly rangeMax: number;
  scale(value: number): number;
}

/**
 * Builds a linear scale. A degenerate domain (min === max) is padded by one unit
 * so a single-valued series still renders on a centred axis.
 */
export function linearScale(
  domainMin: number,
  domainMax: number,
  rangeMin: number,
  rangeMax: number,
): LinearScale {
  let min = domainMin;
  let max = domainMax;
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const span = max - min;
  return {
    domainMin: min,
    domainMax: max,
    rangeMin,
    rangeMax,
    scale: (value: number) => rangeMin + ((value - min) / span) * (rangeMax - rangeMin),
  };
}

function niceNumber(range: number, round: boolean): number {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / 10 ** exponent;
  let niceFraction: number;
  if (round) {
    niceFraction = fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10;
  } else {
    niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  }
  return niceFraction * 10 ** exponent;
}

/**
 * Returns evenly spaced "nice" tick values spanning [min, max] (OMCT-C07-L2-02.03).
 * Rounds the interval and endpoints to human-readable multiples.
 */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
    const base = Number.isFinite(min) ? min : 0;
    return [base - 1, base, base + 1];
  }
  const range = niceNumber(max - min, false);
  const step = niceNumber(range / Math.max(count - 1, 1), true);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = niceMin; value <= niceMax + step * 0.5; value += step) {
    ticks.push(Number(value.toFixed(10)));
  }
  return ticks;
}

/** The data extent of a set of numeric values, or a unit range when empty. */
export function extent(values: number[]): { min: number; max: number } {
  if (values.length === 0) {
    return { min: 0, max: 1 };
  }
  return { min: Math.min(...values), max: Math.max(...values) };
}
