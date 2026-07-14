import { Router } from '@angular/router';
import { Action, ActionContext } from '@cupola/core';

/** Opens telemetry or plot objects with the table view selected. */
export class ViewAsTableAction implements Action {
  readonly key = 'view.table';
  readonly name = 'View as table';
  readonly description = 'Open this object with the tabular view.';
  readonly glyph = 'i-table';
  readonly priority = 80;

  constructor(private readonly router: Router) {}

  appliesTo(context: ActionContext): boolean {
    const object = context.objectPath.at(-1);
    if (!object) {
      return false;
    }
    return (
      object.type === 'overlay-plot' ||
      (object.type === 'telemetry' && (object.telemetry?.hints.includes('range') ?? false))
    );
  }

  invoke(context: ActionContext): void {
    void this.router.navigate(
      ['/browse', ...context.objectPath.map((object) => object.keyString)],
      { queryParams: { view: 'table' } },
    );
  }
}
