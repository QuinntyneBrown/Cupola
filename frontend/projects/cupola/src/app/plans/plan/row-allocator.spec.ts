import { allocateRows, rowCount } from './row-allocator';

describe('OMCT-C12-L2-01.03 Overlap row allocation', () => {
  it('keeps non-overlapping activities on the same row', () => {
    const rows = allocateRows([
      { startPct: 0, endPct: 10, labelLength: 0 },
      { startPct: 20, endPct: 30, labelLength: 0 },
      { startPct: 40, endPct: 50, labelLength: 0 },
    ]);
    expect(rows).toEqual([0, 0, 0]);
    expect(rowCount(rows)).toBe(1);
  });

  it('assigns time-overlapping activities to separate rows', () => {
    const rows = allocateRows([
      { startPct: 0, endPct: 30, labelLength: 0 },
      { startPct: 10, endPct: 40, labelLength: 0 },
    ]);
    expect(rows[0]).not.toBe(rows[1]);
    expect(rowCount(rows)).toBe(2);
  });

  it('separates activities whose labels overlap even when the bars do not', () => {
    // Bars 0–5 and 8–12 do not overlap, but a long label on the first pushes
    // its extent past the second's start.
    const rows = allocateRows([
      { startPct: 0, endPct: 5, labelLength: 40 },
      { startPct: 8, endPct: 12, labelLength: 0 },
    ]);
    expect(rows[0]).not.toBe(rows[1]);
  });

  it('packs a third activity back onto the first free row', () => {
    const rows = allocateRows([
      { startPct: 0, endPct: 30, labelLength: 0 },
      { startPct: 10, endPct: 40, labelLength: 0 },
      { startPct: 50, endPct: 60, labelLength: 0 },
    ]);
    expect(rows).toEqual([0, 1, 0]);
    expect(rowCount(rows)).toBe(2);
  });

  it('returns assignments parallel to the input order', () => {
    const rows = allocateRows([
      { startPct: 50, endPct: 60, labelLength: 0 },
      { startPct: 0, endPct: 30, labelLength: 0 },
      { startPct: 10, endPct: 40, labelLength: 0 },
    ]);
    expect(rows).toHaveLength(3);
    // The two overlapping items (indices 1 and 2) land on different rows.
    expect(rows[1]).not.toBe(rows[2]);
  });
});
