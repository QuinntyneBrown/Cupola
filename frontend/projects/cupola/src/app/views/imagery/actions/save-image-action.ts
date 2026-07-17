import { Action, ActionContext } from '@cupola/core';

import { ImageryFocusService } from '../imagery-focus.service';
import { ImageExporter } from './image-exporter';

/**
 * Saves the focused image through the browser download workflow with a derived
 * filename (OMCT-C11-L2-04.02).
 */
export class SaveImageAction implements Action {
  readonly key = 'imagery.save-image';
  readonly name = 'Save Image As';
  readonly glyph = 'i-download';
  readonly group = 'imagery';

  constructor(
    private readonly focus: ImageryFocusService,
    private readonly exporter: ImageExporter,
  ) {}

  appliesTo(context: ActionContext): boolean {
    return (
      context.viewKey === 'imagery' && this.focus.focusedFor(context.viewParentElement) !== null
    );
  }

  invoke(context: ActionContext): void {
    const frame = this.focus.focusedFor(context.viewParentElement);
    const object = context.objectPath[context.objectPath.length - 1];
    if (frame && object) {
      void this.exporter.exportImage(object.name, frame);
    }
  }
}
