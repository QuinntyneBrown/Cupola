import { DomainObject } from '../models/domain-object';
import { TelemetryValue } from '../models/telemetry-value';
import { LimitEvaluation } from './limits';
import { LimitProvider, LimitRegistry } from './limit-registry.service';
import { SineLimitProvider } from './providers/sine-limit-provider';

function telemetryObject(): DomainObject {
  return {
    identifier: { namespace: '', key: 'pt' },
    keyString: 'pt',
    name: 'pt',
    type: 'telemetry',
    location: null,
    composition: [],
  };
}

function datum(value: number): TelemetryValue {
  return { keyString: 'pt', timestamp: '2026-01-01T00:00:00.000Z', value };
}

describe('OMCT-C06-L2-04.03 Limit evaluation', () => {
  it('maps sine values to warning and critical levels', () => {
    const registry = new LimitRegistry();
    registry.addProvider(new SineLimitProvider());
    const object = telemetryObject();

    expect(registry.evaluate(datum(0.95), object)?.level).toBe('critical');
    expect(registry.evaluate(datum(-0.6), object)?.level).toBe('warning');
    expect(registry.evaluate(datum(0.1), object)).toBeUndefined();
  });

  it('returns the first applicable provider evaluation', () => {
    const registry = new LimitRegistry();
    const first: LimitProvider = {
      supportsLimits: () => true,
      evaluate: (): LimitEvaluation => ({ level: 'first' }),
    };
    const second: LimitProvider = {
      supportsLimits: () => true,
      evaluate: (): LimitEvaluation => ({ level: 'second' }),
    };
    registry.addProvider(first);
    registry.addProvider(second);

    expect(registry.evaluate(datum(0.95), telemetryObject())?.level).toBe('first');
  });
});
