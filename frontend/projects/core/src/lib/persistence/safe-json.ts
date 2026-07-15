const blockedProperties = new Set(['__proto__', 'prototype', 'constructor']);

/** Parses persisted JSON while discarding properties that can control prototypes. */
export function parsePersistedJson<T>(json: string): T {
  return JSON.parse(json, (key: string, value: unknown) =>
    blockedProperties.has(key) ? undefined : value,
  ) as T;
}
