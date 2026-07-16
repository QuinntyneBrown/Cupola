import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { User } from '../models/user';
import { DefaultUserService } from './default-user.service';
import { OperatorStatus, PollQuestion, StatusProvider } from './status-provider';
import { UserProvider } from './user-provider';
import { UserStatusService } from './user-status.service';

class FakeUserProvider implements UserProvider {
  currentUser(): Observable<User | null> {
    return of({ id: 'operator', name: 'Operator' });
  }
  supportsRoles(): boolean {
    return false;
  }
}

class FakeStatusProvider implements StatusProvider {
  pollQuestionAllowed = true;
  readonly submittedStatuses: Array<{ user: User; status: OperatorStatus }> = [];
  readonly submittedQuestions: string[] = [];

  getAllowedStatuses(): OperatorStatus[] {
    return [
      { key: 'go', label: 'GO' },
      { key: 'no-go', label: 'NO-GO' },
    ];
  }
  getStatus(): OperatorStatus | null {
    return { key: 'go', label: 'GO' };
  }
  submitStatus(user: User, status: OperatorStatus): Promise<OperatorStatus> {
    this.submittedStatuses.push({ user, status });
    return Promise.resolve(status);
  }
  canChangePollQuestion(): Promise<boolean> {
    return Promise.resolve(this.pollQuestionAllowed);
  }
  getPollQuestion(): PollQuestion | null {
    return { question: 'Ready for launch?', timestamp: '2026-07-15T12:00:00.000Z' };
  }
  submitPollQuestion(question: string): Promise<PollQuestion> {
    this.submittedQuestions.push(question);
    return Promise.resolve({ question, timestamp: '2026-07-15T12:01:00.000Z' });
  }
}

function setup() {
  TestBed.configureTestingModule({});
  const users = TestBed.inject(DefaultUserService);
  const service = TestBed.inject(UserStatusService);
  const provider = new FakeStatusProvider();
  users.setProvider(new FakeUserProvider());
  users.setStatusProvider(provider);
  return { service, provider };
}

describe('OMCT-C14-L2-02.03 Poll-question authorization', () => {
  it('submits the question when the provider authorizes the current user', async () => {
    const { service, provider } = setup();
    provider.pollQuestionAllowed = true;

    await expect(service.changePollQuestion('Confidence check?')).resolves.toBe(true);
    expect(provider.submittedQuestions).toEqual(['Confidence check?']);
  });

  it('does not submit when provider permission is false', async () => {
    const { service, provider } = setup();
    provider.pollQuestionAllowed = false;

    await expect(service.changePollQuestion('Confidence check?')).resolves.toBe(false);
    expect(provider.submittedQuestions).toEqual([]);
  });
});

describe('UserStatusService status changes', () => {
  it('submits the status for the current user and returns the provider result', async () => {
    const { service, provider } = setup();

    const result = await service.changeStatus({ key: 'no-go', label: 'NO-GO' });

    expect(result).toEqual({ key: 'no-go', label: 'NO-GO' });
    expect(provider.submittedStatuses).toEqual([
      { user: { id: 'operator', name: 'Operator' }, status: { key: 'no-go', label: 'NO-GO' } },
    ]);
  });
});
