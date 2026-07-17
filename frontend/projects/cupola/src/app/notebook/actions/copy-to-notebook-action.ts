import {
  Action,
  ActionContext,
  NotebookService,
  NotebookStorageService,
  NotificationService,
} from '@cupola/core';

import { SnapshotCaptureService } from '../snapshot/snapshot-capture.service';

/**
 * Copies the selected object into the default notebook destination as a new
 * entry capturing the object name and a snapshot embed (OMCT-C13-L2-02.01,
 * 02.02). When no default destination is set, the operator is notified rather
 * than guessed at.
 */
export class CopyToNotebookAction implements Action {
  readonly key = 'notebook.copy';
  readonly name = 'Copy to notebook';
  readonly description = 'Capture this object into the default notebook page.';
  readonly glyph = 'i-copy';
  readonly priority = 35;

  constructor(
    private readonly storage: NotebookStorageService,
    private readonly notebooks: NotebookService,
    private readonly snapshots: SnapshotCaptureService,
    private readonly notifications: NotificationService,
  ) {}

  appliesTo(context: ActionContext): boolean {
    const object = context.objectPath.at(-1);
    return !!object && object.type !== 'notebook' && object.type !== 'restricted-notebook';
  }

  invoke(context: ActionContext): void {
    void this.copyToNotebook(context);
  }

  /** Resolves the default destination and files a snapshot entry there. */
  async copyToNotebook(context: ActionContext): Promise<void> {
    const object = context.objectPath.at(-1);
    if (!object) {
      return;
    }
    const resolved = await this.storage.resolve();
    if (!resolved) {
      this.notifications.alert('No default notebook is set. Pin a notebook page first.');
      return;
    }
    const embed = this.snapshots.capture(context.objectPath, context.viewKey);
    await this.notebooks.createEntry(
      resolved.notebook,
      resolved.destination.sectionId,
      resolved.destination.pageId,
      object.name,
      [embed],
    );
  }
}
