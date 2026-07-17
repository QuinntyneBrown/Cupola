import { IDENTITY, panBy, visibleRegion, zoomAround } from './pan-zoom';

const STAGE = { width: 400, height: 300 };

describe('OMCT-C11-L2-02.01 Zoom and pan', () => {
  it('zooms around the interaction point, keeping it fixed', () => {
    const point = { x: 100, y: 150 };

    const zoomed = zoomAround(IDENTITY, 2, point, STAGE);

    // The stage point maps to the same image pixel before and after:
    // (point - t) / s is invariant.
    expect((point.x - zoomed.tx) / zoomed.scale).toBeCloseTo(point.x - IDENTITY.tx);
    expect((point.y - zoomed.ty) / zoomed.scale).toBeCloseTo(point.y - IDENTITY.ty);
    expect(zoomed.scale).toBe(2);
  });

  it('clamps the scale into [1, 8] and resets translation at scale 1', () => {
    const zoomedOut = zoomAround(IDENTITY, 0.5, { x: 200, y: 150 }, STAGE);
    expect(zoomedOut).toEqual(IDENTITY);

    let state = IDENTITY;
    for (let i = 0; i < 10; i += 1) {
      state = zoomAround(state, 2, { x: 0, y: 0 }, STAGE);
    }
    expect(state.scale).toBe(8);
  });

  it('pans within bounds only while zoomed', () => {
    expect(panBy(IDENTITY, -50, -50, STAGE)).toBe(IDENTITY);

    const zoomed = zoomAround(IDENTITY, 2, { x: 0, y: 0 }, STAGE);
    const panned = panBy(zoomed, -100, -50, STAGE);
    expect(panned.tx).toBe(-100);
    expect(panned.ty).toBe(-50);

    const overPanned = panBy(zoomed, -10_000, 10_000, STAGE);
    expect(overPanned.tx).toBe(STAGE.width * (1 - 2));
    expect(overPanned.ty).toBe(0);
  });
});

describe('OMCT-C11-L2-02.02 Viewable-area indicator', () => {
  it('reports the visible region for the current pan position', () => {
    const zoomed = panBy(zoomAround(IDENTITY, 2, { x: 0, y: 0 }, STAGE), -200, -150, STAGE);

    const region = visibleRegion(zoomed, STAGE);

    expect(region).toEqual({ x: 0.25, y: 0.25, w: 0.5, h: 0.5 });
  });

  it('covers the full image at scale one', () => {
    expect(visibleRegion(IDENTITY, STAGE)).toEqual({ x: -0, y: -0, w: 1, h: 1 });
  });
});
