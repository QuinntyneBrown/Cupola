import { DomainObject } from '@cupola/core';

/** The five mandated gauge forms (OMCT-C08-L2-03.01). */
export const GAUGE_FORMS = [
  'filled-dial',
  'needle-dial',
  'vertical-meter',
  'vertical-meter-inverted',
  'horizontal-meter',
] as const;

export type GaugeForm = (typeof GAUGE_FORMS)[number];

export type GaugeBoundsMode = 'manual' | 'limits';

/** The persisted gauge configuration under `configuration.gauge`. */
export interface GaugeConfiguration {
  form: GaugeForm;
  boundsMode: GaugeBoundsMode;
  min: number;
  max: number;
  limitLow?: number;
  limitHigh?: number;
}

export const GAUGE_CONFIG_FAMILY = 'gauge';

export const GAUGE_DEFAULTS: GaugeConfiguration = {
  form: 'filled-dial',
  boundsMode: 'manual',
  min: 0,
  max: 100,
};

/** True when the value names a dial (SVG) rather than a meter (DOM) form. */
export function isDial(form: GaugeForm): boolean {
  return form === 'filled-dial' || form === 'needle-dial';
}

/** Reads `configuration.gauge`, merged over the defaults. */
export function readGaugeConfig(object: DomainObject): GaugeConfiguration {
  const stored = (object.configuration?.[GAUGE_CONFIG_FAMILY] ?? {}) as Partial<GaugeConfiguration>;
  return {
    form: stored.form ?? GAUGE_DEFAULTS.form,
    boundsMode: stored.boundsMode ?? GAUGE_DEFAULTS.boundsMode,
    min: stored.min ?? GAUGE_DEFAULTS.min,
    max: stored.max ?? GAUGE_DEFAULTS.max,
    limitLow: stored.limitLow,
    limitHigh: stored.limitHigh,
  };
}
