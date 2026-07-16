import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DefaultUserService, OperatorStatus, PollQuestion, StatusProvider, User } from '@cupola/core';

import { ExampleUserProvider } from '../providers/example-user-provider';
import { OperatorStatusIndicatorComponent } from './operator-status-indicator.component';

class FakeStatusProvider implements StatusProvider {
  status: OperatorStatus = { key: 'go', label: 'GO' };
  readonly submitted: Array<{ user: User; status: OperatorStatus }> = [];

  getAllowedStatuses(): OperatorStatus[] {
    return [
      { key: 'go', label: 'GO' },
      { key: 'no-go', label: 'NO-GO' },
    ];
  }
  getStatus(): OperatorStatus | null {
    return this.status;
  }
  submitStatus(user: User, status: OperatorStatus): Promise<OperatorStatus> {
    this.submitted.push({ user, status });
    this.status = status;
    return Promise.resolve(status);
  }
  canChangePollQuestion(): Promise<boolean> {
    return Promise.resolve(false);
  }
  getPollQuestion(): PollQuestion | null {
    return { question: 'Ready?', timestamp: '2026-07-16T00:00:00.000Z' };
  }
  submitPollQuestion(question: string): Promise<PollQuestion> {
    return Promise.resolve({ question, timestamp: '2026-07-16T00:00:00.000Z' });
  }
}

async function settle(fixture: ComponentFixture<OperatorStatusIndicatorComponent>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

function setup() {
  TestBed.configureTestingModule({});
  const users = TestBed.inject(DefaultUserService);
  const provider = new FakeStatusProvider();
  users.setProvider(new ExampleUserProvider());
  users.setStatusProvider(provider);
  const fixture = TestBed.createComponent(OperatorStatusIndicatorComponent);
  fixture.detectChanges();
  return { fixture, provider };
}

describe('OMCT-C14-L2-02.02 Operator status', () => {
  it('displays the provider-supplied status for the current user', async () => {
    const { fixture } = setup();
    await settle(fixture);

    const current = fixture.nativeElement.querySelector(
      '[data-testid="operator-status-current"]',
    );
    expect(current.textContent).toContain('GO');
  });

  it('submits an allowed status change and displays the provider result', async () => {
    const { fixture, provider } = setup();
    await settle(fixture);

    const select: HTMLSelectElement = fixture.nativeElement.querySelector(
      '[data-testid="operator-status-select"]',
    );
    select.value = 'no-go';
    select.dispatchEvent(new Event('change'));
    await settle(fixture);

    expect(provider.submitted).toEqual([
      {
        user: { id: 'operator', name: 'Operator' },
        status: { key: 'no-go', label: 'NO-GO' },
      },
    ]);
    const current = fixture.nativeElement.querySelector(
      '[data-testid="operator-status-current"]',
    );
    expect(current.textContent).toContain('NO-GO');
  });
});
