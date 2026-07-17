/**
 * Greedy first-fit row allocation for plan activities (OMCT-C12-L2-01.03).
 * Activities whose rendered time-and-label extents overlap are pushed onto
 * separate rows within their group.
 */

/** One item to place, measured as percentages of the track width. */
export interface RowItem {
  /** Left edge (bar start) as a percentage of the track. */
  startPct: number;
  /** Right edge (bar end) as a percentage of the track. */
  endPct: number;
  /** Label length in characters, used to estimate the label's drawn extent. */
  labelLength: number;
}

/** Estimated percentage width of one label character (deterministic heuristic). */
const CHAR_PCT = 0.9;
/** Minimum gap between two bars on the same row before they are considered clear. */
const MIN_GAP_PCT = 0.5;

/** The percentage extent an item occupies, including its label drawn past the bar. */
function extentEnd(item: RowItem): number {
  const labelExtent = item.startPct + Math.max(0, item.labelLength) * CHAR_PCT;
  return Math.max(item.endPct, labelExtent);
}

/**
 * Assigns each item a zero-based row so that no two items on the same row
 * overlap in their time-plus-label extent. Returns an array parallel to the
 * input. Placement is deterministic: items are considered left-to-right by
 * start, ties broken by input order, and each takes the first free row.
 */
export function allocateRows(items: RowItem[]): number[] {
  const rowEnds: number[] = [];
  const assignments = new Array<number>(items.length).fill(0);

  const ordered = items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => a.item.startPct - b.item.startPct || a.index - b.index);

  for (const { item, index } of ordered) {
    const end = extentEnd(item);
    let placed = -1;
    for (let row = 0; row < rowEnds.length; row += 1) {
      if (item.startPct >= rowEnds[row] + MIN_GAP_PCT) {
        placed = row;
        break;
      }
    }
    if (placed === -1) {
      placed = rowEnds.length;
      rowEnds.push(end);
    } else {
      rowEnds[placed] = end;
    }
    assignments[index] = placed;
  }

  return assignments;
}

/** The number of rows a set of assignments spans. */
export function rowCount(assignments: number[]): number {
  return assignments.length === 0 ? 0 : Math.max(...assignments) + 1;
}
