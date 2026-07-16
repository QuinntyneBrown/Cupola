import { Action, ActionContext } from '@cupola/core';

/** Opens an object's browse route in a new browser tab. Requirement: OMCT-C03-L2-04.02. */
export class OpenInNewTabAction implements Action {
  readonly key = 'newTab';
  readonly name = 'Open in a new tab';
  readonly glyph = 'i-new-tab';
  readonly priority = 90;

  appliesTo(context: ActionContext): boolean {
    return context.objectPath.length > 0;
  }

  invoke(context: ActionContext): void {
    const path = context.objectPath.map((object) => object.keyString).join('/');
    window.open(`#/browse/${path}`, '_blank', 'noopener');
  }
}
