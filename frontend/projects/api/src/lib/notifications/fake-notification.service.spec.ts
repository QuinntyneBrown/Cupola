import { FakeNotificationService } from './fake-notification.service';

describe('FakeNotificationService', () => {
  it('logs each severity with its message', () => {
    const service = new FakeNotificationService();

    service.info('saved');
    service.alert('limit crossed');
    service.error('save failed');

    expect(service.log).toEqual([
      { severity: 'info', message: 'saved' },
      { severity: 'alert', message: 'limit crossed' },
      { severity: 'error', message: 'save failed' },
    ]);
  });

  it('logs progress and returns a controllable handle', () => {
    const service = new FakeNotificationService();

    const handle = service.progress('exporting');

    expect(service.log).toEqual([{ severity: 'progress', message: 'exporting' }]);
    expect(() => {
      handle.update({ percent: 50 });
      handle.dismiss();
    }).not.toThrow();
  });
});
