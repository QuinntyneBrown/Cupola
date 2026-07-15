import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, Subject, throwError } from 'rxjs';

import { PersistenceStatusService } from './persistence-status.service';

describe('PersistenceStatusService', () => {
  it('moves requests through pending and connected (OMCT-C04-L2-02.06)', async () => {
    const status = new PersistenceStatusService();
    const response = new Subject<string>();

    expect(status.connectionState()).toBe('unknown');
    const pending = firstValueFrom(status.track(response));

    expect(status.connectionState()).toBe('pending');
    response.next('ok');
    await pending;
    expect(status.connectionState()).toBe('connected');
  });

  it('reports disconnected for an unreachable provider (OMCT-C04-L2-02.06)', async () => {
    const status = new PersistenceStatusService();
    await expect(
      firstValueFrom(status.track(throwError(() => new HttpErrorResponse({ status: 0 })))),
    ).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(status.connectionState()).toBe('disconnected');
  });
});
