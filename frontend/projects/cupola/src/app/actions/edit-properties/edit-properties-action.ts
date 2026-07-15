import { Action, ActionContext, ObjectPersistenceService } from '@cupola/core';
import { FormsService } from '@cupola/components';

/**
 * Edits an object's properties in an overlay form, applying the change on
 * save. Requirement: OMCT-C15-L2-04.03.
 */
export class EditPropertiesAction implements Action {
  readonly key = 'edit.properties';
  readonly name = 'Edit properties';
  readonly description = 'Edit this object’s title and properties.';
  readonly glyph = 'i-pencil';
  readonly priority = 60;

  constructor(
    private readonly forms: FormsService,
    private readonly persistence: ObjectPersistenceService,
  ) {}

  appliesTo(context: ActionContext): boolean {
    return context.objectPath.length > 0;
  }

  invoke(context: ActionContext): void {
    const object = context.objectPath.at(-1);
    if (!object) {
      return;
    }
    this.forms
      .showForm({
        title: 'Edit properties',
        rows: [
          {
            key: 'name',
            name: 'Title',
            control: 'textfield',
            value: object.name,
            required: true,
          },
        ],
      })
      .then((values) => {
        const name = values['name'];
        if (typeof name === 'string' && name.trim()) {
          this.persistence.save({ ...object, name: name.trim() }).subscribe();
        }
      })
      .catch(() => {
        /* cancelled */
      });
  }
}
