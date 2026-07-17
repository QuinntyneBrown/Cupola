import { DomainObject } from '@cupola/core';

import { TableColumn } from './table-columns';
import {
  TABLE_DEFAULTS,
  TableConfiguration,
  cycleSort,
  moveColumn,
  orderedVisibleColumns,
  readTableConfig,
  setColumnWidth,
  toggleColumn,
} from './table-config';

const DERIVED: TableColumn[] = [
  { key: 'timestamp', name: 'Timestamp', hint: 'domain' },
  { key: 'value', name: 'Value', hint: 'range' },
  { key: 'unit', name: 'Unit', hint: 'range' },
];

function object(table?: unknown): DomainObject {
  return {
    identifier: { namespace: '', key: 't' },
    keyString: 't',
    name: 'Table',
    type: 'table',
    location: null,
    composition: [],
    configuration: table ? { table } : undefined,
  };
}

describe('OMCT-C08-L2-01.04 Column configuration', () => {
  it('reads defaults when no configuration is stored', () => {
    expect(readTableConfig(object())).toEqual(TABLE_DEFAULTS);
  });

  it('reads a stored configuration', () => {
    const config = readTableConfig(
      object({ columns: [{ key: 'value', visible: true }], sort: { key: 'value', direction: 'desc' }, updateKey: 'id' }),
    );
    expect(config.updateKey).toBe('id');
    expect(config.sort).toEqual({ key: 'value', direction: 'desc' });
  });

  it('orders and filters columns by the saved configuration', () => {
    const config: TableConfiguration = {
      columns: [{ key: 'value' }, { key: 'timestamp', visible: false }],
      updateKey: 'timestamp',
    };
    const ordered = orderedVisibleColumns(DERIVED, config);
    // 'value' first (saved order), 'timestamp' hidden, 'unit' appended (newly derived).
    expect(ordered.map((column) => column.key)).toEqual(['value', 'unit']);
  });

  it('toggles a column visibility, seeding the list from derived columns', () => {
    const next = toggleColumn(TABLE_DEFAULTS, DERIVED, 'unit');
    expect(next.columns.find((column) => column.key === 'unit')?.visible).toBe(false);
    expect(orderedVisibleColumns(DERIVED, next).map((column) => column.key)).toEqual([
      'timestamp',
      'value',
    ]);
  });

  it('moves a column earlier in the order', () => {
    const next = moveColumn(TABLE_DEFAULTS, DERIVED, 'value', 'up');
    expect(next.columns.map((column) => column.key)).toEqual(['value', 'timestamp', 'unit']);
  });

  it('does not move the first column further up', () => {
    const next = moveColumn(TABLE_DEFAULTS, DERIVED, 'timestamp', 'up');
    expect(next.columns.map((column) => column.key)).toEqual(['timestamp', 'value', 'unit']);
  });

  it('records a column width', () => {
    const next = setColumnWidth(TABLE_DEFAULTS, DERIVED, 'value', 120);
    expect(next.columns.find((column) => column.key === 'value')?.width).toBe(120);
  });

  it('cycles sort none → asc → desc → none for a column', () => {
    let config = cycleSort(TABLE_DEFAULTS, 'value');
    expect(config.sort).toEqual({ key: 'value', direction: 'asc' });
    config = cycleSort(config, 'value');
    expect(config.sort).toEqual({ key: 'value', direction: 'desc' });
    config = cycleSort(config, 'value');
    expect(config.sort).toBeUndefined();
  });

  it('starts a fresh ascending sort when switching columns', () => {
    const config = cycleSort({ ...TABLE_DEFAULTS, sort: { key: 'value', direction: 'desc' } }, 'timestamp');
    expect(config.sort).toEqual({ key: 'timestamp', direction: 'asc' });
  });
});
