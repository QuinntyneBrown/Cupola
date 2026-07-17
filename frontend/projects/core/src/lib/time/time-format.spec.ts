import { condenseTimeLabels, padNumber } from './time-format';

describe('padNumber', () => {
  it('pads to the requested width', () => {
    expect(padNumber(7)).toBe('07');
    expect(padNumber(123, 2)).toBe('123');
  });
});

describe('condenseTimeLabels', () => {
  it('drops the shared date from every label', () => {
    expect(
      condenseTimeLabels([
        '2026-07-13 09:30:00.000',
        '2026-07-13 10:30:00.000',
        '2026-07-13 11:30:00.000',
      ]),
    ).toEqual(['09:30:00', '10:30:00', '11:30:00']);
  });

  it('preserves dates when labels cross midnight', () => {
    expect(condenseTimeLabels(['2026-07-13 23:30:00.500', '2026-07-14 00:30:00.500'])).toEqual([
      '2026-07-13 23:30:00.500',
      '2026-07-14 00:30:00.500',
    ]);
  });

  it('drops millisecond tails only when uniformly zero', () => {
    expect(condenseTimeLabels(['2026-07-13 09:30:00.250', '2026-07-13 09:30:00.500'])).toEqual([
      '09:30:00.250',
      '09:30:00.500',
    ]);
  });

  it('passes non-timestamp labels through unchanged', () => {
    expect(condenseTimeLabels(['1000', '2000', '3000'])).toEqual(['1000', '2000', '3000']);
  });

  it('handles empty and single-label input', () => {
    expect(condenseTimeLabels([])).toEqual([]);
    expect(condenseTimeLabels(['2026-07-13 09:30:00.000'])).toEqual(['2026-07-13 09:30:00']);
  });
});
