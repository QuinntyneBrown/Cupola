import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { AxisTick } from '../plan/axis';

/**
 * The shared, visible time axis of a time strip (OMCT-C12-L2-02.02). Renders the
 * tick labels its parent computes from the strip's time bounds; every composed
 * row aligns to these ticks.
 */
@Component({
  selector: 'cp-time-axis',
  standalone: true,
  template: `
    <div class="tl-row tl-axis" data-testid="time-axis">
      <div class="tl-gutter">{{ gutterLabel() }}</div>
      <div class="tl-track tl-track--axis">
        @for (tick of ticks(); track $index) {
          <span
            class="tl-tick"
            data-testid="time-axis-tick"
            [class.tl-tick--first]="$first"
            [class.tl-tick--last]="$last"
            [style.left.%]="tick.leftPct"
            >{{ tick.label }}</span
          >
        }
      </div>
    </div>
  `,
  styleUrl: './time-axis.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeAxisComponent {
  readonly ticks = input<AxisTick[]>([]);
  readonly gutterLabel = input<string>('UTC');
}
