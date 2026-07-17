import { TestBed } from '@angular/core/testing';
import { DomainObject } from '@cupola/core';

import { CsvExportService } from './csv-export.service';
import { TableColumn } from './table-columns';
import { TableRow } from './table-rows';

const COLUMNS: TableColumn[] = [
  { key: 'timestamp', name: 'Timestamp', hint: 'domain' },
  { key: 'value', name: 'Value', hint: 'range' },
];

function row(id: string, timestamp: string, value: string): TableRow {
  return {
    id,
    memberKey: 'k',
    memberName: 'k',
    cells: { timestamp, value },
    limitClass: '',
    datum: { keyString: 'k', timestamp, value: Number(value) } as never,
  };
}

function object(name: string): DomainObject {
  return {
    identifier: { namespace: '', key: 't' },
    keyString: 't',
    name,
    type: 'table',
    location: null,
    composition: [],
  };
}

function service(): CsvExportService {
  return TestBed.inject(CsvExportService);
}

describe('OMCT-C08-L2-01.08 CSV export', () => {
  it('serializes headers and rows to CSV', () => {
    const csv = service().toCsv(COLUMNS, [row('1', '2026-07-13T18:22:00Z', '4.06')]);
    expect(csv).toBe('Timestamp,Value\r\n2026-07-13T18:22:00Z,4.06');
  });

  it('neutralizes formula-leading cells so a spreadsheet treats them as text', () => {
    const csv = service().toCsv(COLUMNS, [row('1', '2026-07-13T18:22:00Z', '=1+2')]);
    // The value cell is prefixed with a single quote (B17) before serialization.
    expect(csv.split('\r\n')[1]).toBe("2026-07-13T18:22:00Z,'=1+2");
  });

  it('quotes cells that contain a delimiter', () => {
    const csv = service().toCsv(
      [{ key: 'value', name: 'Value', hint: 'range' }],
      [row('1', '', 'a,b')],
    );
    expect(csv).toBe('Value\r\n"a,b"');
  });

  it('exports only the rows it is given (all rows or the marked subset)', () => {
    const all = [row('1', 't1', '1'), row('2', 't2', '2'), row('3', 't3', '3')];
    const marked = [all[1]];
    expect(service().toCsv(COLUMNS, all).split('\r\n')).toHaveLength(4);
    expect(service().toCsv(COLUMNS, marked).split('\r\n')).toHaveLength(2);
  });

  it('downloads through a sanitized .csv filename', () => {
    const url = URL as unknown as { createObjectURL?: unknown; revokeObjectURL?: unknown };
    const priorCreate = url.createObjectURL;
    const priorRevoke = url.revokeObjectURL;
    url.createObjectURL = () => 'blob:x';
    url.revokeObjectURL = () => {};
    const clicks: string[] = [];
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      clicks.push(this.getAttribute('download') ?? '');
    };
    try {
      service().download(object('PDU-2/Current'), COLUMNS, [row('1', 't', '4')]);
      expect(clicks).toEqual(['PDU-2_Current.csv']);
    } finally {
      HTMLAnchorElement.prototype.click = originalClick;
      url.createObjectURL = priorCreate;
      url.revokeObjectURL = priorRevoke;
    }
  });
});
