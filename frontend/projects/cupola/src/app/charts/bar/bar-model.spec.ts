import { barsFromMembers, spectralBins } from './bar-model';
import { WideDatum } from '../../telemetry-view/telemetry-stream';

const datum = (value: number, extra: Record<string, unknown> = {}): WideDatum =>
  ({ keyString: 'k', timestamp: '2026-07-13T18:00:00Z', value, ...extra }) as WideDatum;

describe('spectralBins', () => {
  it('extracts the first array field as bins', () => {
    expect(spectralBins(datum(0, { spectrum: [1, 2, 3] }))).toEqual([1, 2, 3]);
  });

  it('returns null for a scalar datum', () => {
    expect(spectralBins(datum(5))).toBeNull();
  });
});

describe('OMCT-C07-L2-04.02 Scalar and spectral bars', () => {
  it('renders one scalar bar per member', () => {
    const bars = barsFromMembers([
      { name: 'PDU-A', latest: datum(5.2) },
      { name: 'PDU-B', latest: datum(4.6) },
    ]);
    expect(bars).toEqual([
      { label: 'PDU-A', value: 5.2 },
      { label: 'PDU-B', value: 4.6 },
    ]);
  });

  it('renders spectral bins for an array-valued datum', () => {
    const bars = barsFromMembers([{ name: 'Spectrum', latest: datum(0, { amplitudes: [3, 6, 9] }) }]);
    expect(bars.map((bar) => bar.value)).toEqual([3, 6, 9]);
    expect(bars).toHaveLength(3);
  });

  it('skips members without data', () => {
    expect(barsFromMembers([{ name: 'PDU-A', latest: null }])).toHaveLength(0);
  });
});
