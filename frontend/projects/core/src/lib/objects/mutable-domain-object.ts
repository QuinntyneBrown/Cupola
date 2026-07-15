import { Injectable, inject } from '@angular/core';

import { DomainObject } from '../models/domain-object';
import { ObjectUpdatesService } from './object-updates.service';

type PropertyObserver = (value: unknown) => void;

function getByPath(source: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (value, key) =>
        value != null && typeof value === 'object'
          ? (value as Record<string, unknown>)[key]
          : undefined,
      source,
    );
}

function setByPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let cursor = target;
  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];
    if (cursor[key] == null || typeof cursor[key] !== 'object') {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[keys[keys.length - 1]] = value;
}

/**
 * A live domain object that notifies observers of property changes and stays
 * synchronized with provider-originated updates.
 *
 * Requirements: OMCT-C02-L2-02.05 (mutable observation), 02.06 (provider
 * synchronization).
 */
export class MutableDomainObject {
  private object: DomainObject;
  private readonly observers = new Map<string, Set<PropertyObserver>>();
  private readonly cleanups: (() => void)[] = [];

  constructor(object: DomainObject) {
    this.object = { ...object };
  }

  /** The current object state. */
  get(): DomainObject {
    return this.object;
  }

  /**
   * Observes a property path. The callback runs when that property, a matching
   * child property, or an ancestor changes (OMCT-C02-L2-02.05). A path of `*`
   * observes every change. Returns an unsubscribe function.
   */
  observe(path: string, callback: PropertyObserver): () => void {
    const callbacks = this.observers.get(path) ?? new Set<PropertyObserver>();
    callbacks.add(callback);
    this.observers.set(path, callbacks);
    return () => callbacks.delete(callback);
  }

  /** Sets a property at a dot path and notifies matching observers. */
  set(path: string, value: unknown): void {
    setByPath(this.object as unknown as Record<string, unknown>, path, value);
    this.notify(path);
  }

  /** Replaces the object with provider-originated state (OMCT-C02-L2-02.06). */
  applyProviderUpdate(object: DomainObject): void {
    this.object = { ...object };
    this.notify('*');
  }

  /** Registers a teardown callback run on {@link destroy}. */
  onDestroy(cleanup: () => void): void {
    this.cleanups.push(cleanup);
  }

  destroy(): void {
    this.cleanups.forEach((cleanup) => cleanup());
    this.cleanups.length = 0;
    this.observers.clear();
  }

  private notify(changedPath: string): void {
    for (const [observerPath, callbacks] of this.observers) {
      if (MutableDomainObject.matches(observerPath, changedPath)) {
        const value = observerPath === '*' ? this.object : getByPath(this.object, observerPath);
        callbacks.forEach((callback) => callback(value));
      }
    }
  }

  private static matches(observerPath: string, changedPath: string): boolean {
    if (observerPath === '*' || changedPath === '*') {
      return true;
    }
    return (
      observerPath === changedPath ||
      changedPath.startsWith(`${observerPath}.`) ||
      observerPath.startsWith(`${changedPath}.`)
    );
  }
}

/**
 * Creates {@link MutableDomainObject}s wired to the provider change stream so
 * they stay synchronized while alive (OMCT-C02-L2-02.06).
 */
@Injectable({ providedIn: 'root' })
export class MutableObjectService {
  private readonly updates = inject(ObjectUpdatesService);

  create(object: DomainObject): MutableDomainObject {
    const mutable = new MutableDomainObject(object);
    const subscription = this.updates
      .forKeyString(object.keyString)
      .subscribe((updated) => mutable.applyProviderUpdate(updated));
    mutable.onDestroy(() => subscription.unsubscribe());
    return mutable;
  }
}
