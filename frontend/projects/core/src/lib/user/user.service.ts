import { Observable } from 'rxjs';
import { User } from '../models/user';

/**
 * B12 — User identity (contract skeleton).
 * Owner: C14 · Consumers: C13 (entry author), C15 (user indicator) · Stability: medium.
 * See docs/capability-contracts/cross-capability-contracts.md.
 */
export abstract class UserService {
  abstract hasProvider(): boolean; // OMCT-C14-L2-01.01
  abstract currentUser(): Observable<User | null>;
  abstract activeRole(): Observable<string | null>; // OMCT-C14-L2-01.03
}
