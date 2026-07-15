import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormatRegistry, GlobalTimeContext } from '@cupola/core';
import { map } from 'rxjs';

/**
 * The time conductor. Reflects the global time context: fixed-mode bounds are
 * shown in fixed mode; the active clock and a live current-time display are
 * shown in real-time mode.
 *
 * Requirements: OMCT-C05-L2-04.01 (mode-specific controls),
 * OMCT-C05-L2-04.02 (current real-time display).
 */
@Component({
  selector: 'cp-conductor',
  templateUrl: './conductor.component.html',
  styleUrl: './conductor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConductorComponent {
  private readonly timeContext = inject(GlobalTimeContext);
  private readonly formats = inject(FormatRegistry);

  protected readonly mode = toSignal(this.timeContext.modeChanged(), {
    initialValue: this.timeContext.mode(),
  });
  protected readonly timeSystem = toSignal(this.timeContext.timeSystemChanged(), {
    initialValue: this.timeContext.timeSystem(),
  });
  protected readonly clockKey = toSignal(this.timeContext.clockChanged(), {
    initialValue: this.timeContext.activeClockKey(),
  });
  protected readonly bounds = toSignal(this.timeContext.boundsChanged(), {
    initialValue: this.timeContext.bounds(),
  });
  private readonly tickValue = toSignal(
    this.timeContext.tick().pipe(map((value): number | null => value)),
    { initialValue: null },
  );

  protected readonly isRealtime = computed(() => this.mode() === 'realtime');
  protected readonly startText = computed(() => this.formatValue(this.bounds().start));
  protected readonly endText = computed(() => this.formatValue(this.bounds().end));
  protected readonly currentTime = computed(() => {
    const value = this.tickValue();
    return value === null ? '' : this.formatValue(value);
  });

  private formatValue(value: number): string {
    const format = this.formats.get(this.timeSystem().timeFormat);
    return format ? format.format(value) : String(value);
  }
}
