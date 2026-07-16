import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { IndicatorService, PersistenceStatusService } from '@cupola/core';

import { createConnectionIndicator } from '../../operational/indicators/connection-indicator';
import { StatusBarComponent } from './status-bar.component';

describe('OMCT-C14-L2-05.01 Indicator registration and priority', () => {
  it('renders registered indicators ordered by priority', () => {
    TestBed.configureTestingModule({});
    const indicators = TestBed.inject(IndicatorService);
    indicators.register({ key: 'low', priority: 10, text: 'low' });
    indicators.register({ key: 'high', priority: 90, text: 'high' });
    indicators.register({ key: 'mid', priority: 50, text: 'mid' });

    const fixture = TestBed.createComponent(StatusBarComponent);
    fixture.detectChanges();

    const rendered = fixture.nativeElement.querySelectorAll('.cp-indicator');
    expect(Array.from(rendered, (element: Element) => element.textContent!.trim())).toEqual([
      'high',
      'mid',
      'low',
    ]);
  });

  // Parity guard for frontend/e2e/tests/smoke.spec.ts: the connection
  // indicator must keep its testid and "Connected" label after the
  // registry-driven rewrite.
  it('renders the connection indicator with its e2e contract intact', () => {
    TestBed.configureTestingModule({});
    TestBed.inject(PersistenceStatusService).track(of('loaded')).subscribe();
    TestBed.runInInjectionContext(() => {
      TestBed.inject(IndicatorService).register(createConnectionIndicator());
    });

    const fixture = TestBed.createComponent(StatusBarComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="status-bar"]')).not.toBeNull();
    const connection = fixture.nativeElement.querySelector(
      '[data-testid="connection-indicator"]',
    );
    expect(connection.textContent).toContain('Connected');
    expect(connection.querySelector('.cp-dot--ok')).not.toBeNull();
  });
});
