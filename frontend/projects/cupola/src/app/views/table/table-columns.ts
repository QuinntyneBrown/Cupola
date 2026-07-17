import { DomainObject, MetadataRegistry, TelemetryValueMetadata } from '@cupola/core';

/** A rendered table column derived from a telemetry metadata value. */
export interface TableColumn {
  key: string; // datum field key, or 'name' for the synthetic member column
  name: string;
  hint: 'domain' | 'range' | 'name';
  unit?: string;
  format?: string;
  width?: number;
}

/** The synthetic column identifying which composed member a datum came from. */
export const NAME_COLUMN: TableColumn = { key: 'name', name: 'Name', hint: 'name' };

function toColumn(value: TelemetryValueMetadata): TableColumn {
  return {
    key: value.key,
    name: value.name ?? value.key,
    hint: value.hint,
    unit: value.unit,
    format: value.format,
  };
}

/**
 * Derives one column per metadata value across the composed members — domains
 * first, then ranges, deduplicated by key — prepending a synthetic Name column
 * when more than one member contributes rows (OMCT-C08-L2-01.01).
 */
export function deriveColumns(members: DomainObject[], metadata: MetadataRegistry): TableColumn[] {
  const byKey = new Map<string, TableColumn>();
  for (const member of members) {
    const view = metadata.getMetadata(member);
    if (!view) {
      continue;
    }
    for (const value of [...view.domains(), ...view.ranges()]) {
      if (!byKey.has(value.key)) {
        byKey.set(value.key, toColumn(value));
      }
    }
  }
  const columns = [...byKey.values()];
  return members.length > 1 ? [NAME_COLUMN, ...columns] : columns;
}
