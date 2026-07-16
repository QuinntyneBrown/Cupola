import { Action, ActionContext, CompositionApi, DomainObject, ObjectApi } from '@cupola/core';
import { FormsService } from '@cupola/components';

import { isEditable, parentObject, selectedObject } from '../hierarchy-policy';
import { mintIdentifier } from '../mint-identifier';

/**
 * Duplicates an object with a new identifier, preserving the source name unless a
 * replacement is supplied. Requirement: OMCT-C03-L2-02.02.
 */
export class DuplicateAction implements Action {
  readonly key = 'duplicate';
  readonly name = 'Duplicate';
  readonly glyph = 'i-duplicate';
  readonly priority = 50;

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
    const parent = parentObject(context);
    this.forms
      .showForm({
        title: 'Duplicate',
        rows: [{ key: 'name', name: 'Title', control: 'textfield', value: source.name, required: true }],
      })
      .then((values) => {
        const replacement = values['name'];
        const name = typeof replacement === 'string' && replacement.trim() ? replacement.trim() : source.name;
        void this.duplicate(source, parent, name);
      })
      .catch(() => {
        /* cancelled */
      });
  }

  private async duplicate(source: DomainObject, parent: DomainObject | undefined, name: string): Promise<void> {
    const identity = mintIdentifier();
    const copy: DomainObject = {
      ...source,
      identifier: identity.identifier,
      keyString: identity.keyString,
      name,
      composition: [...source.composition],
    };
    await this.objects.save(copy);
    if (parent) {
      await this.composition.get(parent)?.add(copy);
    }
  }
}
