import { Action, ActionContext, CompositionApi, ObjectApi } from '@cupola/core';
import { FormsService } from '@cupola/components';

import { isEditable, selectedObject } from '../hierarchy-policy';

/**
 * Adds an alias of an object to a new parent, retaining the original membership.
 * Requirement: OMCT-C03-L2-02.03.
 */
export class LinkAction implements Action {
  readonly key = 'link';
  readonly name = 'Create link';
  readonly glyph = 'i-link';
  readonly priority = 45;

  constructor(
    private readonly forms: FormsService,
    private readonly objects: ObjectApi,
    private readonly composition: CompositionApi,
  ) {}

  appliesTo(context: ActionContext): boolean {
    const object = selectedObject(context);
    return !!object && isEditable(object);
  }

  invoke(context: ActionContext): void {
    const source = selectedObject(context);
    if (!source) {
      return;
    }
    this.forms
      .showForm({
        title: 'Create link',
        rows: [{ key: 'location', name: 'Destination', control: 'locator', value: '', required: true }],
      })
      .then((values) => {
        const destination = values['location'];
        if (typeof destination === 'string' && destination) {
          void this.link(source.keyString, destination);
        }
      })
      .catch(() => {
        /* cancelled */
      });
  }

  private async link(sourceKey: string, destinationKey: string): Promise<void> {
    const [source, destination] = await Promise.all([
      this.objects.get(sourceKey),
      this.objects.get(destinationKey),
    ]);
    // Adds the alias to the destination; the source's original parent is untouched.
    await this.composition.get(destination)?.add(source);
  }
}
