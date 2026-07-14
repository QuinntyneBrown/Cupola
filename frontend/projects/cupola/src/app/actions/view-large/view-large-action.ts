import { EnvironmentInjector } from '@angular/core';
import { Action, ActionContext } from '@cupola/core';
import { OverlayService, componentView } from '@cupola/components';

import { PreviewComponent } from './preview.component';
import { PreviewService } from './preview.service';

/**
 * Expands an embedded object view into a large overlay preview, restoring
 * preview state when the overlay is destroyed.
 * Requirement: OMCT-C15-L2-02.06.
 */
export class ViewLargeAction implements Action {
  readonly key = 'large.view';
  readonly name = 'Large view';
  readonly description = 'Expand this view into a large overlay.';
  readonly glyph = 'i-expand';
  readonly priority = 90;
  readonly showInStatusBar = false;

  constructor(
    private readonly overlays: OverlayService,
    private readonly preview: PreviewService,
    private readonly environmentInjector: EnvironmentInjector,
  ) {}

  appliesTo(context: ActionContext): boolean {
    return !!context.viewParentElement && context.objectPath.length > 0;
  }

  invoke(context: ActionContext): void {
    this.preview.open();
    const view = componentView(this.environmentInjector, PreviewComponent, {
      objectPath: context.objectPath,
    });
    this.overlays.show({
      view,
      size: 'large',
      dismissible: true,
      onDestroy: () => this.preview.close(),
    });
  }
}
