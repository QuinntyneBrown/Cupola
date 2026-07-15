import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Clock, ClockRegistry } from '@cupola/core';

import { formatClock } from './clock-configuration';
import { ClockViewComponent } from './clock-view.component';

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

describe('OMCT-C05-L2-05.03 Clock object', () => {
  const sample = Date.UTC(2026, 6, 14, 21, 30, 15);

  describe('formatClock', () => {
    it('renders a 24-hour UTC time with seconds', () => {
      expect(formatClock(sample, { timezone: 'UTC', hourFormat: 24, showSeconds: true })).toBe(
        '21:30:15 UTC',
      );
    });

    it('renders a 12-hour UTC time without seconds', () => {
      expect(formatClock(sample, { timezone: 'UTC', hourFormat: 12, showSeconds: false })).toBe(
        '09:30 PM UTC',
      );
    });
  });

  describe('ClockViewComponent', () => {
    let fixture: ComponentFixture<ClockViewComponent>;
    let clock: ManualClock;

    beforeEach(() => {
      TestBed.configureTestingModule({});
      clock = new ManualClock('local');
      TestBed.inject(ClockRegistry).register(clock);
      fixture = TestBed.createComponent(ClockViewComponent);
      fixture.componentRef.setInput('config', { timezone: 'UTC', hourFormat: 24, showSeconds: true });
      fixture.detectChanges();
    });

    it('displays the current time per configuration when the clock ticks', () => {
      clock.emit(sample);
      fixture.detectChanges();

      const time = fixture.nativeElement.querySelector('[data-testid="clock-time"]');
      expect(time?.textContent).toContain('21:30:15 UTC');
    });
  });
});
