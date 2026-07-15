import { Injectable, inject } from '@angular/core';
import { CompositionApi, DomainObject, ObjectApi, parseKeyString, parsePersistedJson } from '@cupola/core';

import { ExportDocument } from '../export/export-document';
import { mintIdentifier } from '../mint-identifier';

/**
 * Imports a JSON object tree into a parent composition: parses safely (03.06),
 * remaps every object to a freshly generated identity that imported data cannot
 * override (03.05), and attaches the imported root to the parent (03.04).
 */
@Injectable({ providedIn: 'root' })
export class JsonImportService {
  private readonly objects = inject(ObjectApi);
  private readonly composition = inject(CompositionApi);

  async import(json: string, parent: DomainObject): Promise<void> {
    const document = parsePersistedJson<ExportDocument>(json); // OMCT-C03-L2-03.06
    const idMap = new Map<string, string>();
    for (const oldKey of Object.keys(document.cupola)) {
      idMap.set(oldKey, mintIdentifier().keyString);
    }

    const remapped: DomainObject[] = Object.entries(document.cupola).map(([oldKey, source]) => {
      const keyString = idMap.get(oldKey) as string;
      const composition = source.composition.map((child) => idMap.get(child) ?? child);
      const location =
        source.location && idMap.has(source.location) ? (idMap.get(source.location) as string) : parent.keyString;
      // Identity is set LAST so imported identifier/keyString cannot win (03.05).
      return { ...source, composition, location, identifier: parseKeyString(keyString), keyString };
    });

    for (const object of remapped) {
      await this.objects.save(object);
    }

    const rootKey = idMap.get(document.rootId);
    if (rootKey) {
      await this.composition.get(parent)?.add(await this.objects.get(rootKey)); // 03.04
    }
  }
}
