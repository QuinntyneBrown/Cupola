import { Action } from '@cupola/core';
import { FormsService } from '@cupola/components';

/**
 * Opens the create-folder form. The persistence of new objects is a
 * separate capability; here the form collects the name and location.
 */
export class CreateFolderAction implements Action {
  readonly key = 'create.folder';
  readonly name = 'Folder';
  readonly description = 'A container for organizing objects into a browsable hierarchy.';
  readonly glyph = 'i-folder';

  constructor(private readonly forms: FormsService) {}

  invoke(): void {
    this.forms
      .showForm({
        title: 'Create a Folder',
        rows: [
          { key: 'name', name: 'Title', control: 'textfield', value: 'Unnamed Folder', required: true },
          { key: 'location', name: 'Location', control: 'locator', value: '' },
        ],
      })
      .catch(() => {
        /* cancelled */
      });
  }
}
