import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { OperatorStatus, UserStatusService } from '@cupola/core';

import { PollQuestionComponent } from './poll-question.component';

/**
 * Operator-status indicator: shows the provider-supplied status for the
 * current user, lets the user pick an allowed status, and displays the
 * provider result.
 * Requirement: OMCT-C14-L2-02.02.
 */
@Component({
  selector: 'cp-operator-status-indicator',
  templateUrl: './operator-status-indicator.component.html',
  styleUrl: './operator-status-indicator.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PollQuestionComponent],
})
export class OperatorStatusIndicatorComponent {
  private readonly userStatus = inject(UserStatusService);

  protected readonly statuses = this.userStatus.allowedStatuses();
  protected readonly current = signal<OperatorStatus | null>(null);

  constructor() {
    void this.userStatus.currentStatus().then((status) => this.current.set(status));
  }

  protected async onStatusChange(key: string): Promise<void> {
    const status = this.statuses.find((candidate) => candidate.key === key);
    if (!status) {
      return;
    }
    const result = await this.userStatus.changeStatus(status);
    if (result) {
      this.current.set(result);
    }
  }
}
