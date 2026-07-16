import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { DefaultUserService } from './default-user.service';
import { OperatorStatus, PollQuestion } from './status-provider';

/**
 * Operator status and poll question for the current user, authorized by the
 * configured status provider.
 * Requirements: OMCT-C14-L2-02.02, OMCT-C14-L2-02.03.
 */
@Injectable({ providedIn: 'root' })
export class UserStatusService {
  private readonly users = inject(DefaultUserService);

  canProvideStatus(): boolean {
    return this.users.statusProvider !== null;
  }

  allowedStatuses(): OperatorStatus[] {
    return this.users.statusProvider?.getAllowedStatuses() ?? [];
  }

  async currentStatus(): Promise<OperatorStatus | null> {
    const provider = this.users.statusProvider;
    if (!provider) {
      return null;
    }
    const user = await firstValueFrom(this.users.currentUser());
    return user ? provider.getStatus(user) : null;
  }

  /** Submits the status for the current user and returns the provider result. */
  async changeStatus(status: OperatorStatus): Promise<OperatorStatus | null> {
    const provider = this.users.statusProvider;
    if (!provider) {
      return null;
    }
    const user = await firstValueFrom(this.users.currentUser());
    if (!user) {
      return null;
    }
    return provider.submitStatus(user, status);
  }

  getPollQuestion(): PollQuestion | null {
    return this.users.statusProvider?.getPollQuestion() ?? null;
  }

  /** Submits the change only when the provider authorizes the current user. */
  async changePollQuestion(question: string): Promise<boolean> {
    const provider = this.users.statusProvider;
    if (!provider) {
      return false;
    }
    const user = await firstValueFrom(this.users.currentUser());
    if (!user) {
      return false;
    }
    const allowed = await provider.canChangePollQuestion(user);
    if (!allowed) {
      return false;
    }
    await provider.submitPollQuestion(question);
    return true;
  }
}
