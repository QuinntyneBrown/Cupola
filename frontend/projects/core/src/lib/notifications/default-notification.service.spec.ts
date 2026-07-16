import { TestBed } from '@angular/core/testing';

import {
  DefaultNotificationService,
  INFO_AUTO_DISMISS_MS,
} from './default-notification.service';

function setup(infoTimeoutMs = 100) {
  TestBed.configureTestingModule({
    providers: [{ provide: INFO_AUTO_DISMISS_MS, useValue: infoTimeoutMs }],
  });
  return TestBed.inject(DefaultNotificationService);
}

describe('OMCT-C14-L2-04.01 Information notification', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('displays with information severity and dismisses after the timeout', () => {
    const service = setup(100);

    service.info('Snapshot saved');
    expect(service.notifications()).toHaveLength(1);
    expect(service.notifications()[0]).toMatchObject({
      severity: 'info',
      message: 'Snapshot saved',
    });

    jest.advanceTimersByTime(100);
    expect(service.notifications()).toHaveLength(0);
  });
});

describe('OMCT-C14-L2-04.02 Alert and error persistence', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('retains alert and error notifications until explicitly dismissed', () => {
    const service = setup(100);

    service.alert('Link degraded');
    service.error('Persistence failed');
    jest.advanceTimersByTime(60_000);

    expect(service.notifications().map((notification) => notification.severity)).toEqual([
      'alert',
      'error',
    ]);

    service.dismiss(service.notifications()[0].id);
    expect(service.notifications().map((notification) => notification.severity)).toEqual([
      'error',
    ]);
  });
});

describe('OMCT-C14-L2-04.03 Progress notification', () => {
  it('updates and dismisses the notification through the returned control', () => {
    const service = setup();

    const control = service.progress('Importing objects');
    expect(service.notifications()[0]).toMatchObject({
      severity: 'progress',
      message: 'Importing objects',
      progress: { percent: null },
    });

    control.update({ percent: 40, text: '4 of 10' });
    expect(service.notifications()[0].progress).toEqual({ percent: 40, text: '4 of 10' });

    control.dismiss();
    expect(service.notifications()).toHaveLength(0);
  });
});

describe('DefaultNotificationService count', () => {
  it('tracks the active notification count', () => {
    const service = setup();

    service.alert('one');
    service.error('two');
    expect(service.count()).toBe(2);

    service.dismiss(service.notifications()[0].id);
    expect(service.count()).toBe(1);
  });
});
