import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { User } from '../models/user';
import { ActiveRoleSynchronizer } from './active-role-synchronizer';
import { DefaultUserService } from './default-user.service';
import { UserProvider } from './user-provider';

class RoleCapableProvider implements UserProvider {
  readonly rolesSet: string[] = [];
  currentUser(): Observable<User | null> {
    return of({ id: 'operator', name: 'Operator' });
  }
  supportsRoles(): boolean {
    return true;
  }
  setActiveRole(role: string): void {
    this.rolesSet.push(role);
  }
}

describe('OMCT-C14-L2-01.03 Active role', () => {
  function setup() {
    TestBed.configureTestingModule({});
    const users = TestBed.inject(DefaultUserService);
    const synchronizer = TestBed.inject(ActiveRoleSynchronizer);
    const provider = new RoleCapableProvider();
    users.setProvider(provider);
    return { users, synchronizer, provider };
  }

  it('stores the role, forwards it to the provider, and notifies listeners', () => {
    const { users, synchronizer, provider } = setup();
    const observed: Array<string | null> = [];
    users.activeRole().subscribe((role) => observed.push(role));

    synchronizer.setActiveRole('flight');

    expect(provider.rolesSet).toEqual(['flight']);
    expect(synchronizer.getActiveRole()).toBe('flight');
    expect(observed).toEqual([null, 'flight']);
  });
});
