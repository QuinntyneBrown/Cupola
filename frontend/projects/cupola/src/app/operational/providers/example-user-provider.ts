import { Observable, of } from 'rxjs';
import { User, UserProvider } from '@cupola/core';

/**
 * Development user provider: a fixed operator identity with role support.
 * Requirements: OMCT-C14-L2-01.02, OMCT-C14-L2-01.03.
 */
export class ExampleUserProvider implements UserProvider {
  private activeRole: string | null = null;

  currentUser(): Observable<User | null> {
    return of({ id: 'operator', name: 'Operator' });
  }

  supportsRoles(): boolean {
    return true;
  }

  setActiveRole(role: string): void {
    this.activeRole = role;
  }

  getActiveRole(): string | null {
    return this.activeRole;
  }
}
