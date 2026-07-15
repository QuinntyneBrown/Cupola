import { Injectable, inject } from '@angular/core';
import { DomainObject, ObjectApi, TypeRegistry } from '@cupola/core';

/**
 * Reads a persistable object tree for export: recurses creatable descendants
 * (03.01), terminates on cycles (03.02), and records links to objects outside
 * the tree as external references (03.03).
 */
@Injectable({ providedIn: 'root' })
export class ObjectTreeReader {
  private readonly objects = inject(ObjectApi);
  private readonly types = inject(TypeRegistry);

  async read(root: DomainObject): Promise<{ objects: Record<string, DomainObject>; external: string[] }> {
    const collected: Record<string, DomainObject> = {};
    const external = new Set<string>();
    const visited = new Set<string>();

    const visit = async (object: DomainObject): Promise<void> => {
      if (visited.has(object.keyString)) {
        return; // OMCT-C03-L2-03.02 cycle guard
      }
      visited.add(object.keyString);
      collected[object.keyString] = object;

      for (const childKey of object.composition) {
        const child = await this.objects.get(childKey);
        if (!this.types.get(child.type)?.creatable) {
          continue; // OMCT-C03-L2-03.01 skip non-creatable descendants
        }
        if (child.location !== object.keyString) {
          external.add(child.keyString); // OMCT-C03-L2-03.03 alias to an external object
          continue;
        }
        await visit(child);
      }
    };

    await visit(root);
    return { objects: collected, external: [...external] };
  }
}
