import { DomainObject, LimitEvaluation, LimitRegistry, TelemetryValue } from '@cupola/core';

import { GaugeConfiguration } from './gauge-config';
import { resolveScale, valueFraction } from './gauge-scale';

function object(): DomainObject {
  return {
    identifier: { namespace: '', key: 'g' },
    keyString: 'g',
    name: 'g',
    type: 'telemetry',
    location: null,
    composition: [],
    telemetry: { hints: ['range'] },
  };
}

function config(overrides: Partial<GaugeConfiguration>): GaugeConfiguration {
  return { form: 'horizontal-meter', boundsMode: 'manual', min: 0, max: 100, ...overrides };
}

/** A registry whose provider reports a critical band for large magnitudes. */
function limitRegistry(): LimitRegistry {
  const registry = new LimitRegistry();
  registry.addProvider({
    supportsLimits: () => true,
    evaluate: (datum: TelemetryValue): LimitEvaluation | undefined =>
      Math.abs(datum.value) >= 0.9
        ? { level: 'critical', cssClass: 'is-limit--critical', low: -0.9, high: 0.9 }
        : undefined,
  });
  return registry;
}

describe('OMCT-C08-L2-03.03 Gauge limits', () => {
  it('uses configured minimum, maximum, and limit markers for manual bounds', () => {
    const scale = resolveScale(
      config({ boundsMode: 'manual', min: 0, max: 4, limitLow: 1, limitHigh: 3.2 }),
      object(),
      new LimitRegistry(),
    );
    expect(scale).toEqual({ min: 0, max: 4, low: 1, high: 3.2 });
  });

  it('derives the range and markers from telemetry limits when configured', () => {
    const scale = resolveScale(config({ boundsMode: 'limits' }), object(), limitRegistry());
    // Framed around the critical band [-0.9, 0.9] with a quarter-span pad.
    expect(scale.low).toBe(-0.9);
    expect(scale.high).toBe(0.9);
    expect(scale.min).toBeLessThan(-0.9);
    expect(scale.max).toBeGreaterThan(0.9);
  });

  it('falls back to configured bounds when no limits apply', () => {
    const scale = resolveScale(config({ boundsMode: 'limits', min: 5, max: 25 }), object(), new LimitRegistry());
    expect(scale).toEqual({ min: 5, max: 25, low: undefined, high: undefined });
  });

  it('clamps a value to a 0–1 fraction of the scale span', () => {
    const scale = { min: 0, max: 4 };
    expect(valueFraction(2, scale)).toBe(0.5);
    expect(valueFraction(-1, scale)).toBe(0);
    expect(valueFraction(9, scale)).toBe(1);
  });
});
