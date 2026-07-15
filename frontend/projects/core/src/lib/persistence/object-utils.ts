import { DomainObject } from '../models/domain-object';
import { Identifier } from '../models/identifier';
import { makeKeyString, parseKeyString } from '../models/key-string';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function toIdentifier(value: unknown, defaultNamespace = ''): Identifier {
  if (typeof value === 'string') {
    const parsed = parseKeyString(value);
    return parsed.namespace ? parsed : { namespace: defaultNamespace, key: parsed.key };
  }

  if (isRecord(value) && typeof value['key'] === 'string') {
    return {
      namespace: typeof value['namespace'] === 'string' ? value['namespace'] : defaultNamespace,
      key: value['key'],
    };
  }

  throw new Error('Persisted object has no valid identifier.');
}

/** Converts legacy string identities and composition entries to the current representation. */
export function convertLegacyDomainObject(
  value: unknown,
  fallbackKeyString?: string,
): DomainObject {
  if (!isRecord(value)) {
    throw new Error('Persisted object is not an object.');
  }

  const fallback = fallbackKeyString ? parseKeyString(fallbackKeyString) : undefined;
  const identifier = toIdentifier(
    value['identifier'] ?? value['id'] ?? fallbackKeyString,
    fallback?.namespace ?? '',
  );
  const keyString = makeKeyString(identifier);
  const composition = Array.isArray(value['composition'])
    ? value['composition'].map((entry) => makeKeyString(toIdentifier(entry, identifier.namespace)))
    : [];
  const locationValue = value['location'];
  const location =
    locationValue === null || locationValue === undefined
      ? null
      : locationValue === 'ROOT'
        ? 'ROOT'
        : makeKeyString(toIdentifier(locationValue, identifier.namespace));

  return {
    ...(value as unknown as DomainObject),
    identifier,
    keyString,
    name: typeof value['name'] === 'string' ? value['name'] : keyString,
    type: typeof value['type'] === 'string' ? value['type'] : 'unknown',
    location,
    composition,
  };
}
