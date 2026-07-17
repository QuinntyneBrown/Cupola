import { TelemetryFilter } from '../models/telemetry-filter';
import { TelemetryValue } from '../models/telemetry-value';
import { applyFilters, canonicalFilterKey, matchesFilters } from './telemetry-filtering';

const datum = (value: number, extra: Record<string, unknown> = {}): TelemetryValue =>
  ({ keyString: 'pwr.bus_v', timestamp: '2026-01-01T00:00:00.000Z', value, ...extra }) as TelemetryValue;

describe('OMCT-C10-L2-04.03 Filter application to telemetry data', () => {
  it('keeps only datums whose field equals one of the filter values', () => {
    const filters: TelemetryFilter[] = [{ key: 'value', comparator: 'equals', values: [3, 7] }];
    const kept = applyFilters([datum(3), datum(5), datum(7)], filters);
    expect(kept.map((entry) => entry.value)).toEqual([3, 7]);
  });

  it('excludes datums matching any value under notEquals', () => {
    const filters: TelemetryFilter[] = [{ key: 'value', comparator: 'notEquals', values: [5] }];
    const kept = applyFilters([datum(3), datum(5), datum(7)], filters);
    expect(kept.map((entry) => entry.value)).toEqual([3, 7]);
  });

  it('matches substrings case-insensitively under contains', () => {
    const filters: TelemetryFilter[] = [{ key: 'state', comparator: 'contains', values: ['ON'] }];
    expect(matchesFilters(datum(1, { state: 'Powered on' }), filters)).toBe(true);
    expect(matchesFilters(datum(1, { state: 'off' }), filters)).toBe(false);
  });

  it('requires every filter to match (AND semantics)', () => {
    const filters: TelemetryFilter[] = [
      { key: 'value', comparator: 'equals', values: [3] },
      { key: 'state', comparator: 'equals', values: ['on'] },
    ];
    expect(matchesFilters(datum(3, { state: 'on' }), filters)).toBe(true);
    expect(matchesFilters(datum(3, { state: 'off' }), filters)).toBe(false);
  });

  it('passes every datum when no filters are supplied', () => {
    expect(matchesFilters(datum(3), undefined)).toBe(true);
    expect(matchesFilters(datum(3), [])).toBe(true);
  });

  it('treats a missing datum field as a non-match for equals and contains', () => {
    expect(matchesFilters(datum(3), [{ key: 'state', comparator: 'equals', values: ['on'] }])).toBe(false);
    expect(matchesFilters(datum(3), [{ key: 'state', comparator: 'contains', values: ['on'] }])).toBe(false);
  });
});

describe('OMCT-C10-L2-04.03 Canonical filter cache key', () => {
  it('produces the same key for identical filters regardless of property order', () => {
    const a = canonicalFilterKey([{ key: 'value', comparator: 'equals', values: [1, 2] }]);
    const b = canonicalFilterKey([
      { values: [1, 2], comparator: 'equals', key: 'value' } as TelemetryFilter,
    ]);
    expect(a).toEqual(b);
  });

  it('produces distinct keys for distinct filter sets', () => {
    const a = canonicalFilterKey([{ key: 'value', comparator: 'equals', values: [1] }]);
    const b = canonicalFilterKey([{ key: 'value', comparator: 'equals', values: [2] }]);
    expect(a).not.toEqual(b);
  });

  it('is empty when no filters are active so unfiltered cache keys stay unchanged', () => {
    expect(canonicalFilterKey(undefined)).toBe('');
    expect(canonicalFilterKey([])).toBe('');
  });
});
