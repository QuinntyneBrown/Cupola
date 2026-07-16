import { Observable } from 'rxjs';

import { User } from '../models/user';

/**
 * Supplies the active identity behind the B12 `UserService` contract.
 * Requirements: OMCT-C14-L2-01.02, OMCT-C14-L2-01.03.
 */
export interface UserProvider {
  currentUser(): Observable<User | null>;
  supportsRoles(): boolean;
  setActiveRole?(role: string): void;
}
