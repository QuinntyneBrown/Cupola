import { orientationFor } from './compass-orientation';

describe('OMCT-C11-L2-02.05 Compass overlays', () => {
  it('points the rose along heading plus camera angle, normalized', () => {
    expect(orientationFor(45, -5)?.rotation).toBe(40);
    expect(orientationFor(350, 20)?.rotation).toBe(10);
    expect(orientationFor(10, -30)?.rotation).toBe(340);
  });

  it('reads the platform heading in the heads-up display', () => {
    expect(orientationFor(45.25, 0)?.headingLabel).toBe('HDG 45.3°');
  });

  it('renders nothing without the required orientation metadata', () => {
    expect(orientationFor(undefined, 10)).toBeNull();
    expect(orientationFor(Number.NaN, 0)).toBeNull();
  });

  it('treats a missing camera angle as boresight', () => {
    expect(orientationFor(90, undefined)?.rotation).toBe(90);
  });
});
