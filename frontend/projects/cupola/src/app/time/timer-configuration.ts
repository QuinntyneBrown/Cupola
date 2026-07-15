/**
 * Configuration of a timer domain object in the current property structure.
 * Requirements: OMCT-C05-L2-05.04, OMCT-C05-L2-05.05.
 */
export interface TimerConfiguration {
  /** Reference epoch the timer counts from (count-up) or toward (count-down). */
  timestamp: number | null;
  /** Long (`HH:mm:ss`) or short display. */
  timerFormat: 'long' | 'short';
  /** Count elapsed time upward or remaining time downward. */
  direction: 'countUp' | 'countDown';
}

export const DEFAULT_TIMER_CONFIGURATION: TimerConfiguration = {
  timestamp: null,
  timerFormat: 'long',
  direction: 'countUp',
};
