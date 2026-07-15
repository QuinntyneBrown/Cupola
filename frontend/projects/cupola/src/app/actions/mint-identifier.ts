import { Identifier, makeKeyString } from '@cupola/core';

/** A freshly generated identity for a new or imported object. */
export interface MintedIdentity {
  identifier: Identifier;
  keyString: string;
}

/** Mints a new namespace-less identifier with a unique key. */
export function mintIdentifier(): MintedIdentity {
  const key =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `obj-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const identifier: Identifier = { namespace: '', key };
  return { identifier, keyString: makeKeyString(identifier) };
}
