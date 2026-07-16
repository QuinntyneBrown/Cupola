import { OperatorStatus, PollQuestion, StatusProvider, User } from '@cupola/core';

const STATUSES: OperatorStatus[] = [
  { key: 'go', label: 'GO' },
  { key: 'caution', label: 'CAUTION' },
  { key: 'no-go', label: 'NO-GO' },
];

/**
 * Development status provider: GO/CAUTION/NO-GO statuses and an editable poll
 * question, authorized for every user.
 * Requirements: OMCT-C14-L2-02.02, OMCT-C14-L2-02.03.
 */
export class ExampleStatusProvider implements StatusProvider {
  private status: OperatorStatus = STATUSES[0];
  private pollQuestion: PollQuestion = {
    question: 'Ready for the next activity?',
    timestamp: '2026-07-16T00:00:00.000Z',
  };

  getAllowedStatuses(): OperatorStatus[] {
    return [...STATUSES];
  }

  getStatus(_user: User): OperatorStatus | null {
    return this.status;
  }

  submitStatus(_user: User, status: OperatorStatus): Promise<OperatorStatus> {
    this.status = status;
    return Promise.resolve(status);
  }

  canChangePollQuestion(_user: User): Promise<boolean> {
    return Promise.resolve(true);
  }

  getPollQuestion(): PollQuestion | null {
    return this.pollQuestion;
  }

  submitPollQuestion(question: string): Promise<PollQuestion> {
    this.pollQuestion = { question, timestamp: new Date().toISOString() };
    return Promise.resolve(this.pollQuestion);
  }
}
