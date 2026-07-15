import { Action, ActionContext, ObjectUpdatesService, TransactionManager } from '@cupola/core';
import { FormsService } from '@cupola/components';

import { isEditable, selectedObject } from '../hierarchy-policy';

/**
 * Edits an object's properties through a transactional form: commit on save,
 * discard on cancel, retain the transaction on failed save.
 * Requirements: OMCT-C03-L2-01.02, 01.03, 01.04, 01.05.
 */
export class EditPropertiesAction implements Action {
  readonly key = 'edit.properties';
  readonly name = 'Edit properties';
  readonly description = 'Edit this object’s title and properties.';
  readonly glyph = 'i-pencil';
  readonly priority = 60;

  constructor(
    private readonly forms: FormsService,
    private readonly transactions: TransactionManager,
    private readonly updates: ObjectUpdatesService,
  ) {}

  appliesTo(context: ActionContext): boolean {
    const object = selectedObject(context);
    return !!object && isEditable(object);
  }

  invoke(context: ActionContext): void {
    const object = selectedObject(context);
    if (!object) {
      return;
    }
    const transaction = this.transactions.start();
    this.forms
      .showForm({
        title: 'Edit properties',
        rows: [
          { key: 'name', name: 'Title', control: 'textfield', value: object.name, required: true },
        ],
      })
      .then((values) => {
        const name = values['name'];
        if (typeof name === 'string' && name.trim()) {
          transaction.add({ ...object, name: name.trim() });
          this.transactions
            .commit()
            .then((results) => {
              const saved = results[0]?.object;
              if (saved) {
                this.updates.emitLocal(saved);
              }
            })
            .catch(() => {
              /* OMCT-C03-L2-01.05: the transaction stays open for retry. */
            });
        } else {
          this.transactions.cancel();
        }
      })
      .catch(() => this.transactions.cancel());
  }
}
