import { Router } from '@angular/router';
import { Action, ActionContext, ObjectApi } from '@cupola/core';

import { isEditable, selectedObject } from '../hierarchy-policy';

/**
 * Navigates from an alias to the original object's hierarchy location.
 * Requirement: OMCT-C03-L2-04.01.
 */
export class GoToOriginalAction implements Action {
  readonly key = 'goToOriginal';
  readonly name = 'Go to original';
  readonly glyph = 'i-target';
  readonly priority = 40;

  constructor(
    private readonly objects: ObjectApi,
    private readonly router: Router,
  ) {}

  appliesTo(context: ActionContext): boolean {
    const object = selectedObject(context);
    return !!object && isEditable(object);
  }

  invoke(context: ActionContext): void {
    const object = selectedObject(context);
    if (object) {
      void this.navigate(object.keyString);
    }
  }

  private async navigate(keyString: string): Promise<void> {
    // getOriginalPath is object-first; the browse route is root-first.
    const path = await this.objects.getOriginalPath(keyString);
    const rootFirst = [...path].reverse().map((object) => object.keyString);
    void this.router.navigate(['/browse', ...rootFirst]);
  }
}
