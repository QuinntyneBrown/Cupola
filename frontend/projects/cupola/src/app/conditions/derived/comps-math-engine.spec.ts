import { TelemetryValue } from '@cupola/core';

import { CompsMathEngine } from './comps-math-engine';

function datum(keyString: string, timestamp: string, value: number): TelemetryValue {
  return { keyString, timestamp, value };
}

const config = {
  parameters: [
    { name: 'a', keyString: 'src.a' },
    { name: 'b', keyString: 'src.b' },
  ],
  expression: 'a + b',
};

describe('OMCT-C10-L2-03.01 Mathematical derived telemetry', () => {
  it('emits the expression result at each shared reference timestamp', () => {
    const engine = new CompsMathEngine(config, 'derived');
    const sources = new Map<string, TelemetryValue[]>([
      ['src.a', [datum('src.a', 't1', 2), datum('src.a', 't2', 3)]],
      ['src.b', [datum('src.b', 't1', 10), datum('src.b', 't2', 20)]],
    ]);

    const results = engine.calculate(sources);

    expect(results).toEqual([
      { keyString: 'derived', timestamp: 't1', value: 12 },
      { keyString: 'derived', timestamp: 't2', value: 23 },
    ]);
  });

  it('omits timestamps a source does not share', () => {
    const engine = new CompsMathEngine(config, 'derived');
    const sources = new Map<string, TelemetryValue[]>([
      ['src.a', [datum('src.a', 't1', 2), datum('src.a', 't2', 3)]],
      ['src.b', [datum('src.b', 't2', 20)]],
    ]);

    expect(engine.calculate(sources).map((r) => r.timestamp)).toEqual(['t2']);
  });
});

describe('OMCT-C10-L2-03.02 Derived sample windows', () => {
  it('omits the derived result until the sample window is full', () => {
    const engine = new CompsMathEngine({ ...config, sampleSize: 3 }, 'derived');
    const sources = new Map<string, TelemetryValue[]>([
      ['src.a', [datum('src.a', 't1', 1), datum('src.a', 't2', 1), datum('src.a', 't3', 1), datum('src.a', 't4', 1)]],
      ['src.b', [datum('src.b', 't1', 1), datum('src.b', 't2', 1), datum('src.b', 't3', 1), datum('src.b', 't4', 1)]],
    ]);

    const results = engine.calculate(sources);

    expect(results.map((r) => r.timestamp)).toEqual(['t3', 't4']);
  });
});
