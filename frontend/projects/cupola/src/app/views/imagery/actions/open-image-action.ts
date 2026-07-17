import { Action, ActionContext, isAllowedImageUrl, openImageInNewTab } from '@cupola/core';

import { ImageryFocusService } from '../imagery-focus.service';

/**
 * Opens the focused image in a new tab with opener isolation
 * (OMCT-C11-L2-04.01): delegates to the B17 image allow-list primitive, so a
 * blocked host never opens (OMCT-C16-L2-04.06).
 */
export class OpenImageAction implements Action {
  readonly key = 'imagery.open-image';
  readonly name = 'Open Image in New Tab';
  readonly glyph = 'i-external';
  readonly group = 'imagery';

  constructor(private readonly focus: ImageryFocusService) {}

  appliesTo(context: ActionContext): boolean {
    if (context.viewKey !== 'imagery') {
      return false;
    }
    const frame = this.focus.focusedFor(context.viewParentElement);
    return frame !== null && isAllowedImageUrl(frame.url);
  }

  invoke(context: ActionContext): void {
    const frame = this.focus.focusedFor(context.viewParentElement);
    if (frame) {
      openImageInNewTab(frame.url);
    }
  }
}
