import { Injectable, inject } from '@angular/core';
import { DomainObject, ObjectApi } from '@cupola/core';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Reads and writes a namespaced slice of a domain object's configuration bag
 * (`configuration.<family>`), persisting through the object save path so plot,
 * chart, and table options round-trip and survive reload (OMCT-C07-L2-04.05, B01).
 * Created by C07; reused by C08 tables and gauges.
 */
@Injectable({ providedIn: 'root' })
export class ViewConfigService {
  private readonly objects = inject(ObjectApi);

  read<T = Record<string, unknown>>(object: DomainObject, family: string): T | undefined {
    return object.configuration?.[family] as T | undefined;
  }

  /** Persists `value` at `configuration.<family>`, returning the saved object. */
  async write<T>(object: DomainObject, family: string, value: T): Promise<DomainObject> {
    const configuration = { ...(object.configuration ?? {}), [family]: clone(value) };
    const updated: DomainObject = { ...object, configuration };
    const result = await this.objects.save(updated);
    return result.object ?? updated;
  }

  /** Reads the current family value, applies `mutate`, and persists the result. */
  update<T extends Record<string, unknown>>(
    object: DomainObject,
    family: string,
    mutate: (current: T) => T,
  ): Promise<DomainObject> {
    const current = clone((this.read<T>(object, family) ?? {}) as T);
    return this.write(object, family, mutate(current));
  }
}
