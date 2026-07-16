import { Injectable, inject } from '@angular/core';

import { DefaultUserService } from './default-user.service';

/**
 * Gets and sets the active role, forwarding changes to a role-capable user
 * provider and notifying active-role observers.
 * Requirement: OMCT-C14-L2-01.03.
 */
@Injectable({ providedIn: 'root' })
export class ActiveRoleSynchronizer {
  private readonly users = inject(DefaultUserService);

  setActiveRole(role: string): void {
    const provider = this.users.userProvider;
    if (provider?.supportsRoles()) {
      provider.setActiveRole?.(role);
    }
    this.users.notifyActiveRole(role);
  }

  getActiveRole(): string | null {
    return this.users.getActiveRole();
  }
}
