import { DomainObject } from '@cupola/core';

import { TableColumn } from './table-columns';

/** Persisted per-column state: order comes from array position. */
export interface TableColumnConfig {
  key: string;
  visible?: boolean; // defaults to true when absent
  width?: number;
}

export type SortDirection = 'asc' | 'desc';

export interface TableSort {
  key: string;
  direction: SortDirection;
}

/** The persisted telemetry-table configuration under `configuration.table`. */
export interface TableConfiguration {
  columns: TableColumnConfig[];
  sort?: TableSort;
  /** Datum field whose value identifies a logical row for in-place replacement. */
  updateKey: string;
}

export const TABLE_CONFIG_FAMILY = 'table';

export const TABLE_DEFAULTS: TableConfiguration = {
  columns: [],
  updateKey: 'timestamp',
};

/** Reads `configuration.table`, merged over the defaults. */
export function readTableConfig(object: DomainObject): TableConfiguration {
  const stored = (object.configuration?.[TABLE_CONFIG_FAMILY] ?? {}) as Partial<TableConfiguration>;
  return {
    columns: stored.columns ?? [],
    sort: stored.sort,
    updateKey: stored.updateKey ?? TABLE_DEFAULTS.updateKey,
  };
}

/** Whether a column is visible under the configuration (visible unless disabled). */
export function isColumnVisible(config: TableConfiguration, key: string): boolean {
  const entry = config.columns.find((column) => column.key === key);
  return entry?.visible ?? true;
}

/**
 * Orders and filters the metadata-derived columns by the saved configuration:
 * configured columns keep their saved order and only the visible ones survive;
 * columns not yet in the configuration append in their derived order (01.04).
 */
export function orderedVisibleColumns(
  derived: TableColumn[],
  config: TableConfiguration,
): TableColumn[] {
  const byKey = new Map(derived.map((column) => [column.key, column]));
  const seen = new Set<string>();
  const ordered: TableColumn[] = [];
  for (const entry of config.columns) {
    const column = byKey.get(entry.key);
    if (column && (entry.visible ?? true)) {
      ordered.push(entry.width ? { ...column, width: entry.width } : column);
    }
    seen.add(entry.key);
  }
  for (const column of derived) {
    if (!seen.has(column.key)) {
      ordered.push(column);
    }
  }
  return ordered;
}

/**
 * Seeds a configuration column list from the derived columns, preserving any
 * saved order/visibility/width and appending newly discovered columns.
 */
export function reconcileColumns(
  derived: TableColumn[],
  config: TableConfiguration,
): TableColumnConfig[] {
  const configured = new Map(config.columns.map((column) => [column.key, column]));
  const merged: TableColumnConfig[] = [];
  const seen = new Set<string>();
  for (const entry of config.columns) {
    if (derived.some((column) => column.key === entry.key)) {
      merged.push(entry);
      seen.add(entry.key);
    }
  }
  for (const column of derived) {
    if (!seen.has(column.key)) {
      merged.push({ key: column.key, visible: true });
      configured.set(column.key, { key: column.key, visible: true });
    }
  }
  return merged;
}

/** Toggles a column's visibility, seeding it from `derived` if not yet tracked. */
export function toggleColumn(
  config: TableConfiguration,
  derived: TableColumn[],
  key: string,
): TableConfiguration {
  const columns = reconcileColumns(derived, config).map((column) =>
    column.key === key ? { ...column, visible: !(column.visible ?? true) } : column,
  );
  return { ...config, columns };
}

/** Moves a column one slot earlier or later in the configured order (01.04). */
export function moveColumn(
  config: TableConfiguration,
  derived: TableColumn[],
  key: string,
  direction: 'up' | 'down',
): TableConfiguration {
  const columns = reconcileColumns(derived, config);
  const index = columns.findIndex((column) => column.key === key);
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= columns.length) {
    return { ...config, columns };
  }
  const next = [...columns];
  [next[index], next[target]] = [next[target], next[index]];
  return { ...config, columns: next };
}

/** Sets a column width, seeding the column list if needed. */
export function setColumnWidth(
  config: TableConfiguration,
  derived: TableColumn[],
  key: string,
  width: number,
): TableConfiguration {
  const columns = reconcileColumns(derived, config).map((column) =>
    column.key === key ? { ...column, width } : column,
  );
  return { ...config, columns };
}

/** Cycles a column's sort: none → asc → desc → none for the same column. */
export function cycleSort(config: TableConfiguration, key: string): TableConfiguration {
  const current = config.sort;
  if (!current || current.key !== key) {
    return { ...config, sort: { key, direction: 'asc' } };
  }
  if (current.direction === 'asc') {
    return { ...config, sort: { key, direction: 'desc' } };
  }
  return { ...config, sort: undefined };
}
