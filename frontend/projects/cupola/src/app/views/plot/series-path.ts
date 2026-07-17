import { LinearScale } from './scale';
import { Interpolation } from './plot-config';
import { WideDatum } from '../../telemetry-view/telemetry-stream';

export interface PlotPoint {
  x: number;
  y: number;
  value: number;
  timestamp: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Projects telemetry data into pixel coordinates. The x position is clamped to the
 * plot area so a leading-edge realtime sample renders at the right margin rather
 * than off-canvas.
 */
export function projectSeries(
  points: WideDatum[],
  xScale: LinearScale,
  yScale: LinearScale,
  valueKey = 'value',
): PlotPoint[] {
  const xLo = Math.min(xScale.rangeMin, xScale.rangeMax);
  const xHi = Math.max(xScale.rangeMin, xScale.rangeMax);
  const projected: PlotPoint[] = [];
  for (const point of points) {
    const timestamp = Date.parse(point.timestamp);
    const value = Number((point as Record<string, unknown>)[valueKey]);
    if (!Number.isFinite(timestamp) || !Number.isFinite(value)) {
      continue;
    }
    projected.push({
      x: clamp(xScale.scale(timestamp), xLo, xHi),
      y: yScale.scale(value),
      value,
      timestamp,
    });
  }
  return projected;
}

/** Builds an SVG path for a series, honouring linear vs step interpolation (03.04). */
export function linePath(points: PlotPoint[], interpolation: Interpolation = 'linear'): string {
  if (points.length === 0) {
    return '';
  }
  let d = `M${round(points[0].x)},${round(points[0].y)}`;
  for (let i = 1; i < points.length; i += 1) {
    if (interpolation === 'step') {
      d += `L${round(points[i].x)},${round(points[i - 1].y)}`;
    }
    d += `L${round(points[i].x)},${round(points[i].y)}`;
  }
  return d;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
