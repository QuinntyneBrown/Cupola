import { WideDatum } from '../../telemetry-view/telemetry-stream';

/** A scatter sample positioned from two range values. */
export interface ScatterPoint {
  x: number;
  y: number;
}

/** The persisted scatter axis configuration under `configuration.scatter`. */
export interface ScatterConfig {
  xKey: string;
  yKey: string;
}

/** Resolves the axis range keys, defaulting to the first two ranges (04.04). */
export function readScatterConfig(
  configuration: Record<string, unknown> | undefined,
  rangeKeys: string[],
): ScatterConfig {
  const stored = (configuration?.['scatter'] ?? {}) as Partial<ScatterConfig>;
  return {
    xKey: stored.xKey ?? rangeKeys[0] ?? 'value',
    yKey: stored.yKey ?? rangeKeys[1] ?? rangeKeys[0] ?? 'value',
  };
}

/** Positions each datum from the configured horizontal and vertical range keys. */
export function scatterPoints(data: WideDatum[], config: ScatterConfig): ScatterPoint[] {
  const points: ScatterPoint[] = [];
  for (const datum of data) {
    const x = Number((datum as Record<string, unknown>)[config.xKey]);
    const y = Number((datum as Record<string, unknown>)[config.yKey]);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      points.push({ x, y });
    }
  }
  return points;
}
