import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UserStatusService } from '@cupola/core';

/**
 * Poll-question display and edit control; submission is delegated to
 * `UserStatusService`, which enforces provider authorization.
 * Requirement: OMCT-C14-L2-02.03.
 */
@Component({
  selector: 'cp-poll-question',
  templateUrl: './poll-question.component.html',
  styleUrl: './poll-question.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PollQuestionComponent {
  private readonly userStatus = inject(UserStatusService);

  protected readonly question = signal(this.userStatus.getPollQuestion()?.question ?? '');
  protected readonly draft = signal('');

  protected onDraftInput(value: string): void {
    this.draft.set(value);
  }

  protected async submit(): Promise<void> {
    const draft = this.draft().trim();
    if (!draft) {
      return;
    }
    const accepted = await this.userStatus.changePollQuestion(draft);
    if (accepted) {
      this.question.set(draft);
      this.draft.set('');
    }
  }
}
