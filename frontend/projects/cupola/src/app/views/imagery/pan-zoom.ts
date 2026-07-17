/**
 * Pure zoom/pan math for the imagery stage (OMCT-C11-L2-02.01, 02.02). The
 * transform applies as `translate(tx, ty) scale(scale)` with origin 0 0;
 * translation is clamped so the image never leaves the stage.
 */
export interface PanZoom {
  scale: number;
  tx: number;
  ty: number;
}

export interface StageSize {
  width: number;
  height: number;
}

export const IDENTITY: PanZoom = { scale: 1, tx: 0, ty: 0 };

export const MIN_SCALE = 1;
export const MAX_SCALE = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Clamps translation to keep the scaled image covering the stage. */
export function clampTranslation(state: PanZoom, stage: StageSize): PanZoom {
  return {
    scale: state.scale,
    tx: clamp(state.tx, stage.width * (1 - state.scale), 0),
    ty: clamp(state.ty, stage.height * (1 - state.scale), 0),
  };
}

/**
 * Scales by `factor` around the stage-space interaction point, so the pixel
 * under the cursor stays put (02.01).
 */
export function zoomAround(
  state: PanZoom,
  factor: number,
  point: { x: number; y: number },
  stage: StageSize,
): PanZoom {
  const scale = clamp(state.scale * factor, MIN_SCALE, MAX_SCALE);
  const ratio = scale / state.scale;
  return clampTranslation(
    {
      scale,
      tx: point.x - (point.x - state.tx) * ratio,
      ty: point.y - (point.y - state.ty) * ratio,
    },
    stage,
  );
}

/** Pans by a pixel delta; only meaningful while zoomed in. */
export function panBy(state: PanZoom, dx: number, dy: number, stage: StageSize): PanZoom {
  if (state.scale <= 1) {
    return state;
  }
  return clampTranslation({ scale: state.scale, tx: state.tx + dx, ty: state.ty + dy }, stage);
}

/**
 * The viewable image area in normalized [0,1] coordinates, for the overview
 * indicator shown while zoom exceeds one (02.02).
 */
export function visibleRegion(state: PanZoom, stage: StageSize): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  return {
    x: -state.tx / (stage.width * state.scale),
    y: -state.ty / (stage.height * state.scale),
    w: 1 / state.scale,
    h: 1 / state.scale,
  };
}

export function transformCss(state: PanZoom): string {
  return `translate(${state.tx}px, ${state.ty}px) scale(${state.scale})`;
}
