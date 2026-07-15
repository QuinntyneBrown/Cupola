import { Action, ActionContext } from '@cupola/core';

import { isEditable, selectedObject } from '../hierarchy-policy';
import { JsonExportService } from './json-export.service';

/** Exports the selected object tree as JSON. Requirement: OMCT-C03-L2-03.01. */
export class ExportAsJsonAction implements Action {
  readonly key = 'export.json';
  readonly name = 'Export as JSON';
  readonly glyph = 'i-export';
  readonly priority = 30;

  constructor(private readonly exportService: JsonExportService) {}

  appliesTo(context: ActionContext): boolean {
    const object = selectedObject(context);
    return !!object && isEditable(object);
  }

  invoke(context: ActionContext): void {
    const object = selectedObject(context);
    if (object) {
      void this.exportService.exportTree(object);
    }
  }
}
