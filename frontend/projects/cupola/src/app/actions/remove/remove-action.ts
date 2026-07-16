import { Action, ActionContext, ObjectUpdatesService, TransactionManager } from '@cupola/core';

import { isEditable, isLocked, parentObject, selectedObject } from '../hierarchy-policy';

/**
 * Removes an object from its parent composition within an editing transaction,
 * closing the transaction on success. Locked originals are not removable.
 * Requirements: OMCT-C03-L2-02.05, 02.06 (locked-object policy).
 */
export class RemoveAction implements Action {
  readonly key = 'remove';
  readonly name = 'Remove';
  readonly glyph = 'i-trash';
  readonly priority = 10;

  constructor(
    private readonly transactions: TransactionManager,
    private readonly updates: ObjectUpdatesService,
  ) {}

  appliesTo(context: ActionContext): boolean {
    const object = selectedObject(context);
    return !!object && !!parentObject(context) && isEditable(object) && !isLocked(object);
  }

  invoke(context: ActionContext): void {
    const child = selectedObject(context);
    const parent = parentObject(context);
    if (!child || !parent) {
      return;
    }
    const transaction = this.transactions.start();
    transaction.add({
      ...parent,
      composition: parent.composition.filter((keyString) => keyString !== child.keyString),
    });
    this.transactions
      .commit()
      .then((results) => {
        const saved = results[0]?.object;
        if (saved) {
          this.updates.emitLocal(saved);
        }
      })
      .catch(() => {
        /* transaction retained for retry */
      });
  }
}
