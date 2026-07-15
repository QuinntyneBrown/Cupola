import { Injectable, inject } from '@angular/core';

import { DomainObject } from '../models/domain-object';
import { Identifier } from '../models/identifier';
import { parseKeyString } from '../models/key-string';
import { ObjectSaveResult } from '../models/object-save-result';
import { UserService } from '../user/user.service';
import { GatewayObjectProvider } from './gateway-object-provider';
import { InterceptorRegistry } from './interceptor-registry';
import { createMissingObject } from './missing-object-interceptor';
import { ObjectProvider } from './object-provider';

/** Fields excluded from the change comparison that drives unchanged-save suppression. */
type VolatileField = 'modified' | 'persisted' | 'version' | 'modifiedBy';
const VOLATILE_FIELDS: readonly VolatileField[] = ['modified', 'persisted', 'version', 'modifiedBy'];

/** Deterministic serialization independent of property insertion order. */
function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, nested) => {
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return Object.fromEntries(
        Object.entries(nested as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)),
      );
    }
    return nested;
  });
}

/**
 * Central object API: namespace-routed retrieval, save, and hierarchy
 * resolution over registered {@link ObjectProvider}s.
 *
 * Requirements: OMCT-C02-L2-01.03 (provider routing), 01.04 (concurrent-get
 * coalescing), 01.05 (retrieval interception), 01.06 (missing-object
 * representation), 02.01 (create/update selection), 02.02 (persistence
 * timestamps), 02.03 (user provenance), 02.04 (unchanged-object suppression),
 * 03.06 (original-path resolution).
 */
@Injectable({ providedIn: 'root' })
export class ObjectApi {
  private readonly defaultProvider = inject(GatewayObjectProvider);
  private readonly interceptors = inject(InterceptorRegistry);
  private readonly userService = inject(UserService, { optional: true });

  private readonly providers = new Map<string, ObjectProvider>();
  private readonly pending = new Map<string, Promise<DomainObject>>();
  private readonly lastPersistedState = new Map<string, string>();
  private currentUserId: string | undefined;

  constructor() {
    this.userService?.currentUser().subscribe((user) => {
      this.currentUserId = user?.id;
    });
  }

  /** Registers the provider that serves a namespace (OMCT-C02-L2-01.03). */
  registerProvider(namespace: string, provider: ObjectProvider): void {
    this.providers.set(namespace, provider);
  }

  /**
   * Resolves an object, routing to the namespace provider, sharing in-flight
   * requests for the same key (01.04), and applying interceptors (01.05).
   * Always resolves to a domain object; unavailable references become a
   * missing-object placeholder (01.06).
   */
  get(keyString: string): Promise<DomainObject> {
    const existing = this.pending.get(keyString);
    if (existing) {
      return existing;
    }

    const identifier = parseKeyString(keyString);
    const provider = this.providerFor(identifier.namespace);
    const request = Promise.resolve(provider.get(keyString))
      .then((object) => this.applyInterceptors(identifier, object))
      .finally(() => this.pending.delete(keyString));

    this.pending.set(keyString, request);
    return request;
  }

  /**
   * Persists an object, calling the provider `create` for a not-yet-persisted
   * object and `update` otherwise (02.01); stamps timestamps (02.02) and
   * provenance (02.03); suppresses provider updates when serializable state is
   * unchanged (02.04).
   */
  async save(object: DomainObject): Promise<ObjectSaveResult> {
    const provider = this.providerFor(object.identifier.namespace);
    const isNew = object.persisted === undefined;

    if (!isNew && this.lastPersistedState.get(object.keyString) === this.serializableState(object)) {
      return { keyString: object.keyString, outcome: 'updated', object };
    }

    const stamped = this.stamp(object, isNew);
    const operation = isNew ? provider.create : provider.update;
    if (!operation) {
      throw new Error(
        `Provider for namespace '${object.identifier.namespace}' cannot ${isNew ? 'create' : 'update'} objects.`,
      );
    }

    const result = await operation.call(provider, stamped);
    if (result.outcome !== 'conflict') {
      this.lastPersistedState.set(object.keyString, this.serializableState(stamped));
    }
    return result;
  }

  /**
   * Resolves the original hierarchy path for a key, object-first up to the
   * root, terminating on cyclic locations (OMCT-C02-L2-03.06).
   */
  async getOriginalPath(keyString: string): Promise<DomainObject[]> {
    const path: DomainObject[] = [];
    const visited = new Set<string>();
    let currentKey: string | null = keyString;

    while (currentKey && currentKey !== 'ROOT' && !visited.has(currentKey)) {
      visited.add(currentKey);
      const object = await this.get(currentKey);
      path.push(object);
      currentKey = object.location;
    }

    return path;
  }

  private providerFor(namespace: string): ObjectProvider {
    return this.providers.get(namespace) ?? this.defaultProvider;
  }

  private applyInterceptors(identifier: Identifier, object: DomainObject | undefined): DomainObject {
    let result = object;
    for (const interceptor of this.interceptors.all()) {
      if (interceptor.appliesTo(identifier, result)) {
        result = interceptor.invoke(identifier, result);
      }
    }
    return result ?? createMissingObject(identifier);
  }

  private stamp(object: DomainObject, isNew: boolean): DomainObject {
    const now = new Date().toISOString();
    const stamped: DomainObject = { ...object, modified: now, persisted: now };
    if (isNew) {
      stamped.created = object.created ?? now;
      if (this.currentUserId) {
        stamped.createdBy = this.currentUserId;
      }
    } else if (this.currentUserId) {
      stamped.modifiedBy = this.currentUserId;
    }
    return stamped;
  }

  private serializableState(object: DomainObject): string {
    const stable: Record<string, unknown> = { ...object };
    for (const field of VOLATILE_FIELDS) {
      delete stable[field];
    }
    return stableStringify(stable);
  }
}
