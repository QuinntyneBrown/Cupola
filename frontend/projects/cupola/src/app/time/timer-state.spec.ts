import { TimerConfiguration } from './timer-configuration';
import { STOPPED_TIMER, timerElapsed, timerReduce, timerValue } from './timer-state';

describe('OMCT-C05-L2-05.04 Timer state machine', () => {
  it('starts and accrues count-up elapsed time', () => {
    const started = timerReduce(STOPPED_TIMER, 'start', 1000);
    expect(started.status).toBe('started');
    expect(timerElapsed(started, 4000)).toBe(3000);
  });

  it('pauses and freezes the elapsed duration', () => {
    let state = timerReduce(STOPPED_TIMER, 'start', 1000);
    state = timerReduce(state, 'pause', 4000);
    expect(state.status).toBe('paused');
    expect(timerElapsed(state, 99_999)).toBe(3000);
  });

  it('resumes from the frozen elapsed duration', () => {
    let state = timerReduce(STOPPED_TIMER, 'start', 1000);
    state = timerReduce(state, 'pause', 4000);
    state = timerReduce(state, 'start', 10_000);
    expect(timerElapsed(state, 12_000)).toBe(5000);
  });

  it('stops and resets to zero', () => {
    let state = timerReduce(STOPPED_TIMER, 'start', 1000);
    state = timerReduce(state, 'stop', 5000);
    expect(state.status).toBe('stopped');
    expect(timerElapsed(state, 99_999)).toBe(0);
  });

  it('restarts from the current time', () => {
    let state = timerReduce(STOPPED_TIMER, 'start', 1000);
    state = timerReduce(state, 'restart', 8000);
    expect(timerElapsed(state, 9000)).toBe(1000);
  });

  it('counts down the remaining time toward a target', () => {
    const config: TimerConfiguration = {
      timestamp: 10_000,
      timerFormat: 'long',
      direction: 'countDown',
    };
    const state = timerReduce(STOPPED_TIMER, 'start', 1000);
    expect(timerValue(state, config, 4000)).toBe(6000);
  });
});
