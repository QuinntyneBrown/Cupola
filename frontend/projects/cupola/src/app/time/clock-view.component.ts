import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { ClockRegistry, DomainObject } from '@cupola/core';

import { ClockConfiguration, DEFAULT_CLOCK_CONFIGURATION, formatClock } from './clock-configuration';

/**
 * View for a clock domain object. Displays the current time according to the
 * object's clock configuration (time zone, 12/24-hour, seconds). Requirement:
 * OMCT-C05-L2-05.03.
 */
@Component({
  selector: 'cp-clock-view',
  templateUrl: './clock-view.component.html',
  styleUrl: './clock-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClockViewComponent {
  readonly object = input<DomainObject | null>(null);
  readonly config = input<ClockConfiguration>(DEFAULT_CLOCK_CONFIGURATION);

  private readonly now = signal(Date.now());
  protected readonly display = computed(() => formatClock(this.now(), this.config()));

  constructor() {
    const clock = inject(ClockRegistry).get('local');
    const unsubscribe = clock?.subscribe((tick) => this.now.set(tick));
    inject(DestroyRef).onDestroy(() => unsubscribe?.());
  }
}
