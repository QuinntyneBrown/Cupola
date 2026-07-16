import { User } from '../models/user';

/** An operator status a provider allows (e.g. GO, NO-GO). */
export interface OperatorStatus {
  key: string;
  label: string;
}

/** The poll question operator statuses answer. */
export interface PollQuestion {
  question: string;
  timestamp: string; // ISO 8601
}

/**
 * Provider-authorized operator state behind the user API.
 * Requirements: OMCT-C14-L2-02.02, OMCT-C14-L2-02.03.
 */
export interface StatusProvider {
  getAllowedStatuses(): OperatorStatus[];
  getStatus(user: User): OperatorStatus | null;
  submitStatus(user: User, status: OperatorStatus): Promise<OperatorStatus>;
  canChangePollQuestion(user: User): Promise<boolean>;
  getPollQuestion(): PollQuestion | null;
  submitPollQuestion(question: string): Promise<PollQuestion>;
}
