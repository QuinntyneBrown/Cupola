import { WideDatum } from '../../telemetry-view/telemetry-stream';
import { TableRow, TableRowCollection, filterRows, rowId, sortRows } from './table-rows';

function datum(timestamp: string, value: number): WideDatum {
  return { keyString: 'k', timestamp, value } as WideDatum;
}

function row(memberKey: string, timestamp: string, value: number): TableRow {
  const d = datum(timestamp, value);
  return {
    id: rowId(memberKey, 'timestamp', d),
    memberKey,
    memberName: memberKey,
    cells: { timestamp, value: String(value) },
    limitClass: '',
    datum: d,
  };
}

describe('OMCT-C08-L2-01.03 In-place realtime update', () => {
  it('replaces a logical row in place when a datum shares its update-key value', () => {
    const collection = new TableRowCollection('timestamp');
    collection.addOrReplace(row('k', '2026-07-13T18:22:00Z', 4.0));
    collection.addOrReplace(row('k', '2026-07-13T18:22:01Z', 4.1));
    expect(collection.size).toBe(2);

    // A corrected datum for an existing timestamp updates that row, not a new one.
    collection.addOrReplace(row('k', '2026-07-13T18:22:00Z', 4.5));
    expect(collection.size).toBe(2);
    const first = collection.all()[0];
    expect(first.cells['value']).toBe('4.5');
    // Order is preserved — the replaced row keeps its slot.
    expect(collection.all()[0].cells['timestamp']).toBe('2026-07-13T18:22:00Z');
  });

  it('keeps rows from different members distinct even at the same timestamp', () => {
    const collection = new TableRowCollection('timestamp');
    collection.addOrReplace(row('a', '2026-07-13T18:22:00Z', 1));
    collection.addOrReplace(row('b', '2026-07-13T18:22:00Z', 2));
    expect(collection.size).toBe(2);
  });
});

describe('OMCT-C08-L2-01.05 Column filtering and sorting', () => {
  const rows = [
    row('k', '2026-07-13T18:22:00Z', 4.0),
    row('k', '2026-07-13T18:22:01Z', 41.7),
    row('k', '2026-07-13T18:22:02Z', 22.4),
  ];

  it('filters rows by a case-insensitive column-value substring', () => {
    expect(filterRows(rows, { value: '41' })).toHaveLength(1);
    expect(filterRows(rows, { value: '4' }).map((r) => r.cells['value'])).toEqual(['4', '41.7', '22.4']);
    expect(filterRows(rows, {})).toHaveLength(3);
  });

  it('sorts numerically ascending and descending by a column', () => {
    expect(sortRows(rows, { key: 'value', direction: 'asc' }).map((r) => r.cells['value'])).toEqual([
      '4',
      '22.4',
      '41.7',
    ]);
    expect(sortRows(rows, { key: 'value', direction: 'desc' }).map((r) => r.cells['value'])).toEqual([
      '41.7',
      '22.4',
      '4',
    ]);
  });

  it('leaves order unchanged when no sort is active', () => {
    expect(sortRows(rows, undefined)).toBe(rows);
  });

  it('applies filter then sort through the collection view', () => {
    const collection = new TableRowCollection('timestamp');
    collection.reset(rows);
    const visible = collection.visible({ value: '4' }, { key: 'value', direction: 'desc' });
    expect(visible.map((r) => r.cells['value'])).toEqual(['41.7', '22.4', '4']);
  });
});
