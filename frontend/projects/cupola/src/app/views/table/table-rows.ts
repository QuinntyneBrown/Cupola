import { WideDatum } from '../../telemetry-view/telemetry-stream';
import { TableColumn } from './table-columns';
import { TableSort } from './table-config';

/** One rendered datum row: formatted cells keyed by column, plus row state. */
export interface TableRow {
  id: string; // memberKey + '::' + update-key value — the logical row identity
  memberKey: string;
  memberName: string;
  cells: Record<string, string>;
  limitClass: string; // '' | 'is-limit-caution' | 'is-limit-critical'
  datum: WideDatum;
}

/** Builds a stable logical-row id from the member and its in-place update value. */
export function rowId(memberKey: string, updateKey: string, datum: WideDatum): string {
  return `${memberKey}::${String((datum as Record<string, unknown>)[updateKey] ?? '')}`;
}

/**
 * A telemetry-table row set that replaces an existing logical row in place when a
 * datum shares its update-key value, rather than appending a duplicate
 * (OMCT-C08-L2-01.03), and exposes filtered/sorted views (OMCT-C08-L2-01.05).
 */
export class TableRowCollection {
  private order: string[] = [];
  private readonly byId = new Map<string, TableRow>();

  constructor(private readonly updateKey: string = 'timestamp') {}

  /** Replaces all rows (e.g. after a historical reload). */
  reset(rows: TableRow[]): void {
    this.order = [];
    this.byId.clear();
    for (const row of rows) {
      this.addOrReplace(row);
    }
  }

  /** Adds a row, or replaces the existing row with the same id in place (01.03). */
  addOrReplace(row: TableRow): void {
    if (!this.byId.has(row.id)) {
      this.order.push(row.id);
    }
    this.byId.set(row.id, row);
  }

  all(): TableRow[] {
    return this.order.map((id) => this.byId.get(id)!).filter(Boolean);
  }

  /** Rows after applying per-column text filters and the active sort (01.05). */
  visible(filters: Record<string, string>, sort?: TableSort): TableRow[] {
    return sortRows(filterRows(this.all(), filters), sort);
  }

  get size(): number {
    return this.byId.size;
  }
}

/** Keeps rows whose cell text contains each active filter term (case-insensitive). */
export function filterRows(rows: TableRow[], filters: Record<string, string>): TableRow[] {
  const active = Object.entries(filters).filter(([, term]) => term.trim() !== '');
  if (active.length === 0) {
    return rows;
  }
  return rows.filter((row) =>
    active.every(([key, term]) => (row.cells[key] ?? '').toLowerCase().includes(term.trim().toLowerCase())),
  );
}

function compare(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb) && a.trim() !== '' && b.trim() !== '') {
    return na - nb;
  }
  return a.localeCompare(b);
}

/** Returns a new array sorted by the given column and direction (01.05). */
export function sortRows(rows: TableRow[], sort?: TableSort): TableRow[] {
  if (!sort) {
    return rows;
  }
  const factor = sort.direction === 'desc' ? -1 : 1;
  return [...rows].sort(
    (a, b) => factor * compare(a.cells[sort.key] ?? '', b.cells[sort.key] ?? ''),
  );
}
