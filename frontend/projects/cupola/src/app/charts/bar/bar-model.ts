import { WideDatum } from '../../telemetry-view/telemetry-stream';

/** One rendered bar: a category label and a scalar magnitude. */
export interface BarDatum {
  label: string;
  value: number;
}

const RESERVED = new Set(['keyString', 'timestamp', 'id']);

/** The first array-valued field of a datum, treated as spectral bins (04.02). */
export function spectralBins(datum: WideDatum): number[] | null {
  for (const [key, value] of Object.entries(datum)) {
    if (!RESERVED.has(key) && Array.isArray(value)) {
      return value.map((entry) => Number(entry)).filter((entry) => Number.isFinite(entry));
    }
  }
  return null;
}

/**
 * Builds the bars for a bar graph: one scalar bar per member at its latest value,
 * or a spectral series of bins when a member's datum carries an array field
 * (OMCT-C07-L2-04.02).
 */
export function barsFromMembers(members: { name: string; latest: WideDatum | null }[]): BarDatum[] {
  const bars: BarDatum[] = [];
  for (const member of members) {
    if (!member.latest) {
      continue;
    }
    const bins = spectralBins(member.latest);
    if (bins) {
      bins.forEach((value, index) => bars.push({ label: String(index + 1), value }));
    } else {
      bars.push({ label: member.name, value: member.latest.value });
    }
  }
  return bars;
}
