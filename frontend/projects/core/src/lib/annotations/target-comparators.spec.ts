import { AnnotationTarget } from '../models/annotation';
import { TargetComparatorRegistry } from './target-comparators';

describe('OMCT-C13-L2-04.06 — Annotation target comparison', () => {
  const busPoints: AnnotationTarget = { keyString: 'pwr.bus_v', detail: { start: 100, end: 200 } };
  const samePoints: AnnotationTarget = { keyString: 'pwr.bus_v', detail: { end: 200, start: 100 } };
  const otherPoints: AnnotationTarget = {
    keyString: 'pwr.bus_v',
    detail: { start: 100, end: 999 },
  };

  it('falls back to deep equality when no comparator is registered', () => {
    const registry = new TargetComparatorRegistry();
    // Deep equality ignores key order but respects differing values.
    expect(registry.targetsMatch('temporal', busPoints, samePoints)).toBe(true);
    expect(registry.targetsMatch('temporal', busPoints, otherPoints)).toBe(false);
  });

  it('uses a registered comparator when one applies', () => {
    const registry = new TargetComparatorRegistry();
    // A key-only comparator treats the two targets as the same regardless of detail.
    registry.registerComparator('temporal', (a, b) => a.keyString === b.keyString);
    expect(registry.targetsMatch('temporal', busPoints, otherPoints)).toBe(true);
    expect(registry.targetsMatch('temporal', busPoints, { keyString: 'thm.rad_temp' })).toBe(false);
  });

  it('applies deep equality for a type without a registered comparator', () => {
    const registry = new TargetComparatorRegistry();
    registry.registerComparator('temporal', () => true);
    expect(registry.targetsMatch('plot-spatial', busPoints, otherPoints)).toBe(false);
  });
});
