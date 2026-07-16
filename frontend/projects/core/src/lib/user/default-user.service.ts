import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

import { User } from '../models/user';
import { UserService } from './user.service';
import { UserProvider } from './user-provider';
import { StatusProvider } from './status-provider';

/**
 * Default `UserService`: accepts at most one user provider (and one status
 * provider) per application instance and relays its identity.
 * Requirements: OMCT-C14-L2-01.01, OMCT-C14-L2-01.02.
 */
@Injectable({ providedIn: 'root' })
export class DefaultUserService extends UserService {
  private provider: UserProvider | null = null;
  private status: StatusProvider | null = null;
  private readonly role$ = new BehaviorSubject<string | null>(null);

  setProvider(provider: UserProvider): void {
    if (this.provider) {
      throw new Error('A user provider is already configured; only one is allowed.');
    }
    this.provider = provider;
  }

  get userProvider(): UserProvider | null {
    return this.provider;
  }

  override hasProvider(): boolean {
    return this.provider !== null;
  }

  override currentUser(): Observable<User | null> {
    return this.provider ? this.provider.currentUser() : of(null);
  }

  override activeRole(): Observable<string | null> {
    return this.role$.asObservable();
  }

  getActiveRole(): string | null {
    return this.role$.value;
  }

  /** Stores the role and notifies active-role listeners. */
  notifyActiveRole(role: string | null): void {
    this.role$.next(role);
  }

  setStatusProvider(provider: StatusProvider): void {
    if (this.status) {
      throw new Error('A status provider is already configured; only one is allowed.');
    }
    this.status = provider;
  }

  get statusProvider(): StatusProvider | null {
    return this.status;
  }
}
