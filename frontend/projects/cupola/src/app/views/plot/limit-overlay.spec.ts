import { DomainObject, LimitEvaluation, TelemetryValue } from '@cupola/core';

import { evaluateLimits } from './limit-overlay';

function object(): DomainObject {
  return {
    identifier: { namespace: '', key: 't' },
    keyString: 't',
    name: 'Battery temp',
    type: 'telemetry',
    location: null,
    composition: [],
    telemetry: { hints: ['range'], unit: '°C' },
  };
}

const point = (value: number): TelemetryValue => ({ keyString: 't', timestamp: '2026-07-13T18:00:00Z', value });

class LimitRegistryStub {
  evaluate(datum: TelemetryValue): LimitEvaluation | undefined {
    if (datum.value >= 42) {
      return { level: 'critical', name: 'Critical', cssClass: 'is-limit--critical', low: -42, high: 42 };
    }
    if (datum.value >= 38) {
      return { level: 'warning', name: 'Caution', cssClass: 'is-limit--caution', low: -38, high: 38 };
    }
    return undefined;
  }
}

describe('evaluateLimits', () => {
  it('derives limit lines from violating evaluations (02.07)', () => {
    const { lines } = evaluateLimits(object(), [point(20), point(39), point(43)], new LimitRegistryStub() as never);
    const highs = lines.filter((line) => line.edge === 'high').map((line) => line.value);
    expect(highs).toEqual(expect.arrayContaining([38, 42]));
    expect(lines.find((line) => line.value === 42)?.cssClass).toBe('is-limit--critical');
    expect(lines.find((line) => line.value === 42)?.label).toContain('CRITICAL HIGH 42');
  });

  it('marks violating points with the alarm severity', () => {
    const { alarms } = evaluateLimits(object(), [point(20), point(43)], new LimitRegistryStub() as never);
    expect(alarms).toHaveLength(1);
    expect(alarms[0]).toMatchObject({ value: 43, level: 'critical', edge: 'high', cssClass: 'is-limit--critical' });
  });

  it('returns nothing when no point reaches a limit', () => {
    const { lines, alarms } = evaluateLimits(object(), [point(10), point(20)], new LimitRegistryStub() as never);
    expect(lines).toHaveLength(0);
    expect(alarms).toHaveLength(0);
  });
});
