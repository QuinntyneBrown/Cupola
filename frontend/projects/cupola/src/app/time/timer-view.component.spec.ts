import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Clock, ClockRegistry } from '@cupola/core';

import { TimerViewComponent } from './timer-view.component';

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

describe('OMCT-C05-L2-05.04 TimerViewComponent', () => {
  let fixture: ComponentFixture<TimerViewComponent>;
  let clock: ManualClock;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    clock = new ManualClock('local');
    TestBed.inject(ClockRegistry).register(clock);
    fixture = TestBed.createComponent(TimerViewComponent);
    fixture.detectChanges();
  });

  function click(testId: string): void {
    fixture.nativeElement.querySelector(`[data-testid="${testId}"]`).click();
    fixture.detectChanges();
  }

  function text(testId: string): string {
    return fixture.nativeElement.querySelector(`[data-testid="${testId}"]`).textContent.trim();
  }

  it('renders the duration for each state as timer actions change it', () => {
    clock.emit(1000);
    fixture.detectChanges();

    click('timer-start');
    expect(text('timer-status')).toBe('started');

    clock.emit(4000);
    fixture.detectChanges();
    expect(text('timer-duration')).toContain('00:00:03');

    click('timer-pause');
    clock.emit(9000);
    fixture.detectChanges();
    expect(text('timer-status')).toBe('paused');
    expect(text('timer-duration')).toContain('00:00:03');

    click('timer-restart');
    clock.emit(10_000);
    fixture.detectChanges();
    expect(text('timer-duration')).toContain('00:00:01');

    click('timer-stop');
    expect(text('timer-status')).toBe('stopped');
    expect(text('timer-duration')).toContain('00:00:00');
  });
});
