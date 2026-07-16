import { Action, ActionContext } from '@cupola/core';

import { selectedObject } from '../hierarchy-policy';
import { JsonImportService } from './json-import.service';

/** Imports a JSON object tree into the selected folder. Requirement: OMCT-C03-L2-03.04. */
export class ImportFromJsonAction implements Action {
  readonly key = 'import.json';
  readonly name = 'Import from JSON';
  readonly glyph = 'i-import';
  readonly priority = 29;

  constructor(private readonly importService: JsonImportService) {}

  appliesTo(context: ActionContext): boolean {
    const object = selectedObject(context);
    return !!object && object.type === 'folder';
  }

  invoke(context: ActionContext): void {
    const parent = selectedObject(context);
    if (!parent) {
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        void file.text().then((text) => this.importService.import(text, parent));
      }
    };
    input.click();
  }
}
