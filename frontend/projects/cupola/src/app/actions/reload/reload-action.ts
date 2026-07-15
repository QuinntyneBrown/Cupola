import { Action, ActionContext, ObjectApi, ObjectUpdatesService } from '@cupola/core';

import { isEditable, selectedObject } from '../hierarchy-policy';

/**
 * Refreshes an object from its provider and publishes the fresh state.
 * Requirement: OMCT-C03-L2-04.03.
 */
export class ReloadAction implements Action {
  readonly key = 'reload';
  readonly name = 'Reload';
  readonly glyph = 'i-refresh';
  readonly priority = 20;

  constructor(
    private readonly objects: ObjectApi,
    private readonly updates: ObjectUpdatesService,
  ) {}

  appliesTo(context: ActionContext): boolean {
    const object = selectedObject(context);
    return !!object && isEditable(object);
  }

  invoke(context: ActionContext): void {
    const object = selectedObject(context);
    if (object) {
      void this.reload(object.keyString);
    }
  }

  private async reload(keyString: string): Promise<void> {
    const fresh = await this.objects.get(keyString);
    this.updates.emitLocal(fresh);
  }
}
