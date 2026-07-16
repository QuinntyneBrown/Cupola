import { Observable, firstValueFrom, of } from 'rxjs';

import { User } from '../models/user';
import { DefaultUserService } from './default-user.service';
import { UserProvider } from './user-provider';

class FakeProvider implements UserProvider {
  constructor(private readonly user: User) {}
  currentUser(): Observable<User | null> {
    return of(this.user);
  }
  supportsRoles(): boolean {
    return false;
  }
}

describe('OMCT-C14-L2-01.01 Single user provider', () => {
  it('rejects a second provider and keeps the first active', async () => {
    const service = new DefaultUserService();
    service.setProvider(new FakeProvider({ id: 'alpha', name: 'Alpha' }));

    expect(() => service.setProvider(new FakeProvider({ id: 'beta', name: 'Beta' }))).toThrow(
      /already configured/,
    );
    expect(service.hasProvider()).toBe(true);
    await expect(firstValueFrom(service.currentUser())).resolves.toEqual({
      id: 'alpha',
      name: 'Alpha',
    });
  });

  it('rejects a second status provider', () => {
    const service = new DefaultUserService();
    const provider = {} as never;
    service.setStatusProvider(provider);

    expect(() => service.setStatusProvider(provider)).toThrow(/already configured/);
  });
});

describe('OMCT-C14-L2-01.02 Current identity', () => {
  it('returns the identifier and name supplied by the provider', async () => {
    const service = new DefaultUserService();
    service.setProvider(new FakeProvider({ id: 'cdr', name: 'Flight Commander' }));

    await expect(firstValueFrom(service.currentUser())).resolves.toEqual({
      id: 'cdr',
      name: 'Flight Commander',
    });
  });

  it('returns null without a configured provider', async () => {
    const service = new DefaultUserService();

    expect(service.hasProvider()).toBe(false);
    await expect(firstValueFrom(service.currentUser())).resolves.toBeNull();
  });
});
