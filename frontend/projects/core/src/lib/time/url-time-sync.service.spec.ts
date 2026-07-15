import { TestBed } from '@angular/core/testing';

import { UrlParamsService } from '../routing/url-params.service';
import { Clock } from './clock';
import { ClockRegistry } from './clock-registry';
import { GlobalTimeContext } from './global-time-context';
import { TimeSystemRegistry } from './time-system-registry';
import { UrlTimeSyncService } from './url-time-sync.service';

class ManualClock implements Clock {
  readonly name = 'Manual Clock';
  private readonly listeners = new Set<(tick: number) => void>();
  constructor(readonly key = 'local') {}
  subscribe(callback: (tick: number) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  emit(value: number): void {
    for (const listener of [...this.listeners]) {
      listener(value);
    }
  }
}

describe('OMCT-C05-L2-04.03 UrlTimeSyncService', () => {
  let context: GlobalTimeContext;
  let clock: ManualClock;
  let setParams: jest.Mock;

  beforeEach(() => {
    setParams = jest.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [{ provide: UrlParamsService, useValue: { setParams } }],
    });
    const systems = TestBed.inject(TimeSystemRegistry);
    systems.register({ key: 'utc', name: 'UTC', timeFormat: 'utc' });
    systems.register({ key: 'tai', name: 'TAI', timeFormat: 'utc' });
    clock = new ManualClock('local');
    TestBed.inject(ClockRegistry).register(clock);
    context = TestBed.inject(GlobalTimeContext);
    TestBed.inject(UrlTimeSyncService).start();
  });

  it('writes tc.timeSystem when the active time system changes', () => {
    context.setTimeSystem('tai');
    expect(setParams).toHaveBeenCalledWith({ 'tc.timeSystem': 'tai' });
  });

  it('writes tc.mode as the clock key when set and fixed when cleared', () => {
    context.setClock('local');
    expect(setParams).toHaveBeenCalledWith({ 'tc.mode': 'local' });

    context.setClock(null);
    expect(setParams).toHaveBeenCalledWith({ 'tc.mode': 'fixed' });
  });

  it('writes fixed-mode bounds when bounds change', () => {
    context.setBounds({ start: 100, end: 200 });
    expect(setParams).toHaveBeenCalledWith({ 'tc.startBound': '100', 'tc.endBound': '200' });
  });

  it('writes offsets when they change', () => {
    context.setClockOffsets({ start: -1000, end: 0 });
    expect(setParams).toHaveBeenCalledWith({ 'tc.startDelta': '-1000', 'tc.endDelta': '0' });
  });

  it('does not write moving bounds while in real-time mode', () => {
    context.setClock('local');
    setParams.mockClear();

    clock.emit(5000);

    expect(setParams).not.toHaveBeenCalledWith(
      expect.objectContaining({ 'tc.startBound': expect.anything() }),
    );
  });
});
