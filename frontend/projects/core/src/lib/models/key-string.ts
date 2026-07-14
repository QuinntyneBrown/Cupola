import { Identifier } from './identifier';

export function makeKeyString(identifier: Identifier): string {
  return identifier.namespace ? `${identifier.namespace}:${identifier.key}` : identifier.key;
}

export function parseKeyString(keyString: string): Identifier {
  const separator = keyString.indexOf(':');
  if (separator === -1) {
    return { namespace: '', key: keyString };
  }
  return { namespace: keyString.slice(0, separator), key: keyString.slice(separator + 1) };
}
