import { DOCUMENT, Injectable, inject } from '@angular/core';
import { DomainObject, neutralizeCsvCell, sanitizeFilename } from '@cupola/core';

import { TableColumn } from './table-columns';
import { TableRow } from './table-rows';

/** Wraps a cell in quotes when it contains a delimiter, quote, or newline. */
function quote(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** A cell is neutralized against formula injection, then CSV-quoted (B17). */
function cell(value: string): string {
  return quote(neutralizeCsvCell(value));
}

/**
 * Exports telemetry-table rows as comma-separated values. Every cell — headers
 * included — is neutralized so a spreadsheet never interprets it as a formula,
 * and the download filename is sanitized (OMCT-C08-L2-01.08, OMCT-C16-L2-04.03).
 */
@Injectable({ providedIn: 'root' })
export class CsvExportService {
  private readonly document = inject(DOCUMENT);

  /** Serializes the given columns and rows to a CSV string. */
  toCsv(columns: TableColumn[], rows: TableRow[]): string {
    const header = columns.map((column) => cell(column.name)).join(',');
    const body = rows.map((row) =>
      columns.map((column) => cell(row.cells[column.key] ?? '')).join(','),
    );
    return [header, ...body].join('\r\n');
  }

  /** Triggers a browser download of the rows as `<sanitized name>.csv`. */
  download(object: DomainObject, columns: TableColumn[], rows: TableRow[]): void {
    const csv = this.toCsv(columns, rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = this.document.createElement('a');
    anchor.href = url;
    anchor.download = `${sanitizeFilename(object.name) || 'telemetry'}.csv`;
    anchor.setAttribute('data-testid', 'table-csv-download');
    this.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}
