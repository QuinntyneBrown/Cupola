import { DomainObject, LimitRegistry, TelemetryValue } from '@cupola/core';

/** A horizontal limit line derived from telemetry limit thresholds (02.07). */
export interface LimitLine {
  level: string;
  cssClass?: string;
  edge: 'low' | 'high';
  value: number;
  label: string;
}

/** A telemetry point that violates a limit, styled by the alarm severity. */
export interface AlarmPoint {
  timestamp: number;
  value: number;
  level: string;
  cssClass?: string;
  edge: 'low' | 'high';
}

/**
 * Evaluates each point through the {@link LimitRegistry} to derive the limit lines
 * to draw and the violating (alarm-styled) points (OMCT-C07-L2-02.07). Thresholds
 * come from whichever evaluations report `low`/`high`, so lines appear only when
 * data actually reaches a limit.
 */
export function evaluateLimits(
  object: DomainObject,
  points: TelemetryValue[],
  registry: LimitRegistry,
): { lines: LimitLine[]; alarms: AlarmPoint[] } {
  const lines = new Map<string, LimitLine>();
  const alarms: AlarmPoint[] = [];

  for (const point of points) {
    const evaluation = registry.evaluate(point, object);
    if (!evaluation) {
      continue;
    }
    const label = (evaluation.name ?? evaluation.level).toUpperCase();
    const overHigh = evaluation.high !== undefined && point.value >= evaluation.high;
    const edge: 'low' | 'high' = overHigh ? 'high' : 'low';
    alarms.push({
      timestamp: Date.parse(point.timestamp),
      value: point.value,
      level: evaluation.level,
      cssClass: evaluation.cssClass,
      edge,
    });
    if (evaluation.high !== undefined) {
      lines.set(`${evaluation.level}-high`, {
        level: evaluation.level,
        cssClass: evaluation.cssClass,
        edge: 'high',
        value: evaluation.high,
        label: `${label} HIGH ${evaluation.high}`,
      });
    }
    if (evaluation.low !== undefined) {
      lines.set(`${evaluation.level}-low`, {
        level: evaluation.level,
        cssClass: evaluation.cssClass,
        edge: 'low',
        value: evaluation.low,
        label: `${label} LOW ${evaluation.low}`,
      });
    }
  }

  return { lines: [...lines.values()], alarms };
}
