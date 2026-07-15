import { TimerConfiguration } from './timer-configuration';

/** The controllable states of a timer. Requirement: OMCT-C05-L2-05.04. */
export type TimerStatus = 'stopped' | 'started' | 'paused';

/** The actions that drive a timer's state machine. */
export type TimerAction = 'start' | 'pause' | 'stop' | 'restart';

export interface TimerState {
  status: TimerStatus;
  /** Epoch the running timer counts from; null when stopped. */
  referenceTime: number | null;
  /** Elapsed milliseconds captured at pause; null unless paused. */
  frozenElapsed: number | null;
}

export const STOPPED_TIMER: TimerState = {
  status: 'stopped',
  referenceTime: null,
  frozenElapsed: null,
};

/**
 * Applies a timer action, returning the next state. `now` is the current epoch
 * time. Requirement: OMCT-C05-L2-05.04.
 */
export function timerReduce(state: TimerState, action: TimerAction, now: number): TimerState {
  switch (action) {
    case 'start':
      if (state.status === 'paused') {
        // Resume: shift the reference so elapsed continues from where it froze.
        return { status: 'started', referenceTime: now - (state.frozenElapsed ?? 0), frozenElapsed: null };
      }
      if (state.status === 'started') {
        return state;
      }
      return { status: 'started', referenceTime: state.referenceTime ?? now, frozenElapsed: null };
    case 'pause':
      if (state.status !== 'started') {
        return state;
      }
      return {
        status: 'paused',
        referenceTime: state.referenceTime,
        frozenElapsed: state.referenceTime === null ? 0 : now - state.referenceTime,
      };
    case 'stop':
      return { ...STOPPED_TIMER };
    case 'restart':
      return { status: 'started', referenceTime: now, frozenElapsed: null };
  }
}

/** Count-up elapsed milliseconds for the current state. */
export function timerElapsed(state: TimerState, now: number): number {
  if (state.status === 'paused') {
    return state.frozenElapsed ?? 0;
  }
  if (state.status === 'started' && state.referenceTime !== null) {
    return now - state.referenceTime;
  }
  return 0;
}

/**
 * The signed duration a timer displays: elapsed for count-up, remaining for
 * count-down (negative once the target passes).
 */
export function timerValue(
  state: TimerState,
  config: TimerConfiguration,
  now: number,
): number {
  if (config.direction === 'countDown' && config.timestamp !== null) {
    return config.timestamp - now;
  }
  return timerElapsed(state, now);
}
