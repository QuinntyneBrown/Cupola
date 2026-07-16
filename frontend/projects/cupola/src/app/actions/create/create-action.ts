import { Action, ActionContext, CompositionApi, DomainObject, ObjectApi, ObjectType } from '@cupola/core';
import { FormsService } from '@cupola/components';

import { mintIdentifier } from '../mint-identifier';
import { selectedObject } from '../hierarchy-policy';

/**
 * Creates a new object of a registered creatable type in a selected parent, then
 * adds it to the parent composition. Requirements: OMCT-C03-L2-01.01 (type-based
 * creation), 02.01 (folder creation, when the type is `folder`).
 */
export class CreateAction implements Action {
  readonly key: string;
  readonly name: string;
  readonly glyph?: string;
  readonly description?: string;
  readonly group = 'create';

  constructor(
    private readonly type: ObjectType,
    private readonly forms: FormsService,
    private readonly objects: ObjectApi,
    private readonly composition: CompositionApi,
  ) {
    this.key = `create.${type.key}`;
    this.name = type.name;
    this.glyph = type.glyph;
    this.description = type.description;
  }

  appliesTo(context: ActionContext): boolean {
    const parent = selectedObject(context);
    return !!parent && Array.isArray(parent.composition) && parent.type === 'folder';
  }

  invoke(context: ActionContext): void {
    const parent = selectedObject(context);
    if (!parent) {
      return;
    }
    this.forms
      .showForm({
        title: `Create ${this.type.name}`,
        rows: [
          {
            key: 'name',
            name: 'Title',
            control: 'textfield',
            value: `Unnamed ${this.type.name}`,
            required: true,
          },
        ],
      })
      .then((values) => {
        const name = values['name'];
        if (typeof name === 'string' && name.trim()) {
          void this.create(parent, name.trim());
        }
      })
      .catch(() => {
        /* cancelled */
      });
  }

  private async create(parent: DomainObject, name: string): Promise<void> {
    const identity = mintIdentifier();
    const object: DomainObject = {
      identifier: identity.identifier,
      keyString: identity.keyString,
      name,
      type: this.type.key,
      location: parent.keyString,
      composition: [],
    };
    this.type.initialize?.(object);
    await this.objects.save(object);
    await this.composition.get(parent)?.add(object);
  }
}
