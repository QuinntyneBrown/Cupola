import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { LegendMode } from './plot-config';

/** One row of legend data for a rendered series. */
export interface LegendSeries {
  keyString: string;
  name: string;
  color: string;
  unit: string;
  latest: string;
  min: string;
  max: string;
  timestamp: string;
}

/**
 * Renders a plot legend in collapsed or expanded mode (OMCT-C07-L2-02.04):
 * collapsed shows a swatch, name, and latest value inline; expanded is a table
 * adding timestamp, min, and max per series.
 */
@Component({
  selector: 'cp-plot-legend',
  templateUrl: './plot-legend.component.html',
  styleUrl: './plot-legend.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlotLegendComponent {
  readonly series = input.required<LegendSeries[]>();
  readonly mode = input<LegendMode>('collapsed');
}
