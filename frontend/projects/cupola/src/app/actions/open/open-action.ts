import { Router } from '@angular/router';
import { Action, ActionContext } from '@cupola/core';

/** Navigates to (opens) the object. Applies to any object path. */
export class OpenAction implements Action {
  readonly key = 'open';
  readonly name = 'Open';
  readonly description = 'Open this object in the main view.';
  readonly glyph = 'i-external';
  readonly priority = 100;

  constructor(private readonly router: Router) {}

  appliesTo(context: ActionContext): boolean {
    return context.objectPath.length > 0;
  }

  invoke(context: ActionContext): void {
    void this.router.navigate([
      '/browse',
      ...context.objectPath.map((object) => object.keyString),
    ]);
  }
}
