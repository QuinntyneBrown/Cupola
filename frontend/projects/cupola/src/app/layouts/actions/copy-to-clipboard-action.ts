import { Action, ActionContext } from '@cupola/core';

import { LayoutClipboardService } from '../layout-clipboard.service';
import { LayoutEditService } from '../layout-edit.service';

/**
 * Copies the selected display-layout items to the layout clipboard
 * (OMCT-C09-L2-01.05). Applies while a display layout is being edited with a
 * non-empty item selection; delegates to the layout's edit session.
 */
export class CopyToClipboardAction implements Action {
  readonly key = 'layout.copy-to-clipboard';
  readonly name = 'Copy to Layout Clipboard';
  readonly glyph = 'i-copy';
  readonly group = 'edit';

  constructor(
    private readonly edits: LayoutEditService,
    private readonly clipboard: LayoutClipboardService,
  ) {}

  appliesTo(context: ActionContext): boolean {
    const object = context.objectPath[context.objectPath.length - 1];
    if (object?.type !== 'layout' || !this.edits.isEditing(object.keyString)) {
      return false;
    }
    return (this.edits.session(object.keyString)?.selectedItemIds().length ?? 0) > 0;
  }

  invoke(context: ActionContext): void {
    const object = context.objectPath[context.objectPath.length - 1];
    if (object) {
      this.edits.session(object.keyString)?.copy?.();
    }
  }
}
