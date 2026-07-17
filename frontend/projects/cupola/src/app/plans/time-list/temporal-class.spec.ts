import {
  classifyTemporal,
  formatDuration,
  isInProgress,
  progressPercent,
} from './temporal-class';

describe('OMCT-C12-L2-03.04 Activity progress', () => {
  it('classifies past, current, and future activities relative to now', () => {
    expect(classifyTemporal(0, 100, 200)).toBe('past');
    expect(classifyTemporal(100, 300, 200)).toBe('current');
    expect(classifyTemporal(300, 400, 200)).toBe('future');
  });

  it('treats the end instant as past and the start instant as current', () => {
    expect(classifyTemporal(0, 100, 100)).toBe('past');
    expect(classifyTemporal(100, 200, 100)).toBe('current');
    expect(isInProgress(100, 200, 100)).toBe(true);
    expect(isInProgress(100, 200, 200)).toBe(false);
  });

  it('formats duration as HH:mm:ss', () => {
    expect(formatDuration(0, 3_600_000)).toBe('01:00:00');
    expect(formatDuration(0, 90 * 60_000)).toBe('01:30:00');
    expect(formatDuration(500, 100)).toBe('00:00:00');
  });

  it('reports elapsed progress percent for an in-progress activity', () => {
    expect(progressPercent(0, 100, -10)).toBe(0);
    expect(progressPercent(0, 100, 22)).toBe(22);
    expect(progressPercent(0, 100, 50)).toBe(50);
    expect(progressPercent(0, 100, 150)).toBe(100);
  });
});
