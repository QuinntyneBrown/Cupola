import { sanitizeImageUrl } from '@cupola/core';

import { WideDatum } from '../../telemetry-view/telemetry-stream';

/** One image sample in the history strip (OMCT-C11-L2-01.02). */
export interface ImageFrame {
  url: string;
  /** Epoch milliseconds of the capture instant. */
  time: number;
  timestampIso: string;
  heading?: number;
  cameraAngle?: number;
}

/**
 * Derives the ordered image history from a telemetry buffer: datums with an
 * allow-listed image URL (B17), ascending by time, deduplicated by capture
 * instant (latest datum wins).
 */
export function toImageFrames(points: WideDatum[]): ImageFrame[] {
  const byTime = new Map<number, ImageFrame>();
  for (const point of points) {
    const url = typeof point.url === 'string' ? sanitizeImageUrl(point.url) : null;
    const time = Date.parse(point.timestamp);
    if (!url || !Number.isFinite(time)) {
      continue;
    }
    byTime.set(time, {
      url,
      time,
      timestampIso: point.timestamp,
      heading: typeof point['heading'] === 'number' ? (point['heading'] as number) : undefined,
      cameraAngle:
        typeof point['cameraAngle'] === 'number' ? (point['cameraAngle'] as number) : undefined,
    });
  }
  return [...byTime.values()].sort((a, b) => a.time - b.time);
}
