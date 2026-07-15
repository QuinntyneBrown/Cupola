import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  Clock,
  ClockRegistry,
  FormatRegistry,
  GlobalTimeContext,
  TimeSystemRegistry,
  UTCTimeFormat,
} from '@cupola/core';

import { ConductorComponent } from './conductor.component';

class ManualClock implements Clock {
  readonly name = 'Local Clock';
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

describe('ConductorComponent', () => {
  let fixture: ComponentFixture<ConductorComponent>;
  let context: GlobalTimeContext;
  let clock: ManualClock;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    TestBed.inject(TimeSystemRegistry).register({ key: 'utc', name: 'UTC', timeFormat: 'utc' });
    TestBed.inject(FormatRegistry).register(new UTCTimeFormat());
    clock = new ManualClock('local');
    TestBed.inject(ClockRegistry).register(clock);
    context = TestBed.inject(GlobalTimeContext);

    fixture = TestBed.createComponent(ConductorComponent);
    fixture.detectChanges();
  });

  function query(testId: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);
  }

  describe('OMCT-C05-L2-04.01 Time conductor modes', () => {
    it('shows fixed-mode bounds controls when the context is in fixed mode', () => {
      expect(query('conductor-bounds')).toBeTruthy();
      expect(query('conductor-clock')).toBeFalsy();
      expect(query('conductor-mode')?.textContent).toContain('Fixed');
    });

    it('shows real-time clock controls when the active context switches to real-time', () => {
      context.setClock('local');
      fixture.detectChanges();

      expect(query('conductor-clock')).toBeTruthy();
      expect(query('conductor-bounds')).toBeFalsy();
      expect(query('conductor-mode')?.textContent).toContain('Real-time');
    });
  });

  describe('OMCT-C05-L2-04.02 Current real-time display', () => {
    it('updates the current-time display when the clock ticks in real-time mode', () => {
      context.setClock('local');
      fixture.detectChanges();

      const value = Date.UTC(2026, 6, 14, 13, 30, 15, 0);
      clock.emit(value);
      fixture.detectChanges();

      const expected = new UTCTimeFormat().format(value);
      expect(query('conductor-current-time')?.textContent).toContain(expected);
    });
  });
});
