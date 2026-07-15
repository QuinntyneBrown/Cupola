import { firstValueFrom } from 'rxjs';

import { FakeUserService } from './fake-user.service';

describe('FakeUserService', () => {
  it('reports a provider and the default operator user', async () => {
    const service = new FakeUserService();

    expect(service.hasProvider()).toBe(true);
    await expect(firstValueFrom(service.currentUser())).resolves.toEqual({
      id: 'operator',
      name: 'Operator',
    });
    await expect(firstValueFrom(service.activeRole())).resolves.toBeNull();
  });

  it('reports no provider when constructed without a user', () => {
    const service = new FakeUserService(null);

    expect(service.hasProvider()).toBe(false);
  });
});
