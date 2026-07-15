import { DomainObject } from '@cupola/core';

/** A portable JSON object tree: keyed objects, the tree root, and external links. */
export interface ExportDocument {
  cupola: Record<string, DomainObject>;
  rootId: string;
  externalIdentifiers: string[];
}
