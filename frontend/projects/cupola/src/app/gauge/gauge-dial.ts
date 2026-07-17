/** Dial geometry for the filled/needle gauge forms (240° sweep per the mock). */
export const DIAL = { cx: 80, cy: 84, r: 58, start: 150, sweep: 240 };

interface Point {
  x: number;
  y: number;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** A point on the dial at the given angle (degrees, SVG y-down). */
export function polar(deg: number, r: number = DIAL.r): Point {
  const rad = (Math.PI / 180) * deg;
  return { x: round(DIAL.cx + r * Math.cos(rad)), y: round(DIAL.cy + r * Math.sin(rad)) };
}

/** An SVG arc path from one dial angle to another. */
export function arc(startDeg: number, endDeg: number, r: number = DIAL.r): string {
  const s = polar(startDeg, r);
  const e = polar(endDeg, r);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M${s.x},${s.y} A${r} ${r} 0 ${large} 1 ${e.x},${e.y}`;
}

/** The full-sweep background track path. */
export function trackPath(): string {
  return arc(DIAL.start, DIAL.start + DIAL.sweep);
}

/** The value-fill arc from the start of the sweep to `fraction` (0–1). */
export function fillPath(fraction: number): string {
  const clamped = Math.min(1, Math.max(0, fraction));
  if (clamped <= 0) {
    return '';
  }
  return arc(DIAL.start, DIAL.start + clamped * DIAL.sweep);
}

/** The needle line from the hub to `fraction` along the sweep. */
export function needle(fraction: number): { x1: number; y1: number; x2: number; y2: number } {
  const clamped = Math.min(1, Math.max(0, fraction));
  const tip = polar(DIAL.start + clamped * DIAL.sweep, DIAL.r * 0.72);
  return { x1: DIAL.cx, y1: DIAL.cy, x2: tip.x, y2: tip.y };
}
