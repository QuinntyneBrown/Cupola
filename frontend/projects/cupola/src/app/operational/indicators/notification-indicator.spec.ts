import { TestBed } from '@angular/core/testing';
import { DefaultNotificationService, IndicatorService } from '@cupola/core';

import { registerNotificationIndicator } from './notification-indicator';

describe('OMCT-C14-L2-04.04 Notification count', () => {
  it('updates the displayed count as the notification collection changes', () => {
    TestBed.configureTestingModule({});
    TestBed.runInInjectionContext(() => registerNotificationIndicator());
    const notifications = TestBed.inject(DefaultNotificationService);
    const indicator = TestBed.inject(IndicatorService)
      .indicators()
      .find((candidate) => candidate.key === 'notifications')!;

    expect(indicator.textSignal!()).toBe('0');

    notifications.alert('one');
    notifications.error('two');
    expect(indicator.textSignal!()).toBe('2');

    notifications.dismiss(notifications.notifications()[0].id);
    expect(indicator.textSignal!()).toBe('1');
  });
});
