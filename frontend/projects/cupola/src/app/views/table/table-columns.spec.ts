import { DefaultMetadataProvider, DomainObject, MetadataRegistry } from '@cupola/core';

import { deriveColumns } from './table-columns';

function telemetry(keyString: string, unit?: string): DomainObject {
  return {
    identifier: { namespace: '', key: keyString },
    keyString,
    name: keyString,
    type: 'telemetry',
    location: null,
    composition: [],
    telemetry: { hints: ['range'], unit },
  };
}

function registry(): MetadataRegistry {
  const metadata = new MetadataRegistry();
  metadata.addProvider(new DefaultMetadataProvider());
  return metadata;
}

describe('OMCT-C08-L2-01.01 Telemetry rows and metadata columns', () => {
  it('derives one column per metadata value, domains before ranges', () => {
    const columns = deriveColumns([telemetry('pwr.bus_v', 'V')], registry());
    expect(columns.map((column) => column.key)).toEqual(['timestamp', 'value']);
    expect(columns[0].hint).toBe('domain');
    expect(columns[1].hint).toBe('range');
    expect(columns[1].unit).toBe('V');
  });

  it('unions metadata values across members without duplicating shared keys', () => {
    const columns = deriveColumns([telemetry('a'), telemetry('b')], registry());
    // A synthetic Name column distinguishes the members, then the shared columns.
    expect(columns.map((column) => column.key)).toEqual(['name', 'timestamp', 'value']);
    expect(columns[0].hint).toBe('name');
  });

  it('omits the Name column for a single member', () => {
    const columns = deriveColumns([telemetry('solo')], registry());
    expect(columns.some((column) => column.key === 'name')).toBe(false);
  });
});
