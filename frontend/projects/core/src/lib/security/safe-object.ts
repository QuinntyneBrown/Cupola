/**
 * B17 — Prototype-pollution protection for imported and stored objects (owner C16).
 *
 * Imported JSON or manipulated local-storage payloads can carry `__proto__`,
 * `constructor`, or `prototype` keys that pollute the object prototype when the
 * value is later spread or deep-merged. The import action (C03) and any object
 * loader shall route untrusted payloads through these helpers. The local-storage
 * load path already strips these keys via C04's `parsePersistedJson`.
 * See docs/capability-contracts/cross-capability-contracts.md (B17).
 */

const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Returns a deep copy of a parsed value with every `__proto__`, `constructor`,
 * and `prototype` own property removed at every depth. Arrays and primitives are
 * preserved. OMCT-C16-L2-04.04
 */
export function dropUnsafeKeys<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => dropUnsafeKeys(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const clean: Record<string, unknown> = {};
    // getOwnPropertyNames surfaces the special `__proto__` data property that
    // JSON.parse creates; the key is skipped, so its value is never read back
    // through the prototype accessor.
    for (const key of Object.getOwnPropertyNames(value)) {
      if (UNSAFE_KEYS.has(key)) {
        continue;
      }
      clean[key] = dropUnsafeKeys((value as Record<string, unknown>)[key]);
    }
    return clean as T;
  }
  return value;
}

/**
 * Parses JSON and removes prototype-polluting keys, producing a domain object
 * without polluted prototype properties. OMCT-C16-L2-04.04
 */
export function sanitizeImportedJson<T>(json: string): T {
  return dropUnsafeKeys(JSON.parse(json) as T);
}
