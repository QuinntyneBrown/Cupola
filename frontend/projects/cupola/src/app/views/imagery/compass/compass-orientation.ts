/**
 * Compass orientation math (OMCT-C11-L2-02.05): the rose wedge points along
 * the camera line of sight — platform heading plus the camera angle relative
 * to it — and the heads-up display reads the platform heading.
 */
export interface CompassOrientation {
  /** Camera pointing, degrees clockwise from north, normalized to [0, 360). */
  rotation: number;
  /** Heads-up display text for the platform heading. */
  headingLabel: string;
}

export function orientationFor(
  heading: number | undefined,
  cameraAngle: number | undefined,
): CompassOrientation | null {
  if (heading === undefined || !Number.isFinite(heading)) {
    return null;
  }
  const rotation = (((heading + (cameraAngle ?? 0)) % 360) + 360) % 360;
  return { rotation, headingLabel: `HDG ${heading.toFixed(1)}°` };
}
