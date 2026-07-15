import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { ClockRegistry, DomainObject, DurationFormat } from '@cupola/core';

import { DEFAULT_TIMER_CONFIGURATION, TimerConfiguration } from './timer-configuration';
import { STOPPED_TIMER, TimerAction, timerReduce, timerValue } from './timer-state';

/**
 * View for a timer domain object. Controls the timer through its state machine
 * (start, pause, stop, restart) and renders the elapsed or remaining duration
 * for the current state. Requirement: OMCT-C05-L2-05.04.
 */
@Component({
  selector: 'cp-timer-view',
  templateUrl: './timer-view.component.html',
  styleUrl: './timer-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimerViewComponent {
  readonly object = input<DomainObject | null>(null);
  readonly config = input<TimerConfiguration>(DEFAULT_TIMER_CONFIGURATION);

  private readonly duration = new DurationFormat();
  private readonly now = signal(Date.now());
  private readonly timerState = signal(STOPPED_TIMER);

  protected readonly status = computed(() => this.timerState().status);
  protected readonly durationText = computed(() =>
    this.duration.format(timerValue(this.timerState(), this.config(), this.now())),
  );

  constructor() {
    const clock = inject(ClockRegistry).get('local');
    const unsubscribe = clock?.subscribe((tick) => this.now.set(tick));
    inject(DestroyRef).onDestroy(() => unsubscribe?.());
  }

  protected act(action: TimerAction): void {
    this.timerState.set(timerReduce(this.timerState(), action, this.now()));
  }
}
