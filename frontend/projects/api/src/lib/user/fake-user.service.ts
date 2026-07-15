import { Observable, of } from 'rxjs';
import { User, UserService } from '@cupola/core';

/**
 * Fake user service standing behind the B12 contract so consuming capabilities
 * build and test before C14 delivers the provider.
 * See docs/capability-contracts/cross-capability-contracts.md.
 */
export class FakeUserService extends UserService {
  constructor(private readonly user: User | null = { id: 'operator', name: 'Operator' }) {
    super();
  }
  override hasProvider(): boolean {
    return this.user !== null;
  }
  override currentUser(): Observable<User | null> {
    return of(this.user);
  }
  override activeRole(): Observable<string | null> {
    return of(null);
  }
}
