import { Action, ActionContext, CompositionApi, DomainObject, ObjectApi } from '@cupola/core';
import { FormsService } from '@cupola/components';

import { isEditable, parentObject, selectedObject } from '../hierarchy-policy';

/**
 * Moves an object from its current parent to a destination parent.
 * Requirement: OMCT-C03-L2-02.04.
 */
export class MoveAction implements Action {
  readonly key = 'move';
  readonly name = 'Move';
  readonly glyph = 'i-move';
  readonly priority = 44;

  constructor(
    private readonly forms: FormsService,
    private readonly objects: ObjectApi,
    private readonly composition: CompositionApi,
  ) {}

  appliesTo(context: ActionContext): boolean {
    const object = selectedObject(context);
    return !!object && !!parentObject(context) && isEditable(object);
  }

  invoke(context: ActionContext): void {
    const source = selectedObject(context);
    const current = parentObject(context);
    if (!source || !current) {
      return;
    }
    this.forms
      .showForm({
        title: 'Move',
        rows: [{ key: 'location', name: 'Destination', control: 'locator', value: '', required: true }],
      })
      .then((values) => {
        const destination = values['location'];
        if (typeof destination === 'string' && destination) {
          void this.move(source, current, destination);
        }
      })
      .catch(() => {
        /* cancelled */
      });
  }

  private async move(source: DomainObject, current: DomainObject, destinationKey: string): Promise<void> {
    const destination = await this.objects.get(destinationKey);
    await this.composition.get(destination)?.add(source);
    await this.composition.get(current)?.remove(source);
  }
}
