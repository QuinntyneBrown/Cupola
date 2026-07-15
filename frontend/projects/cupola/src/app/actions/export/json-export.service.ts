import { Injectable, inject } from '@angular/core';
import { DomainObject, sanitizeFilename } from '@cupola/core';

import { ExportDocument } from './export-document';
import { ObjectTreeReader } from './object-tree-reader.service';

/** Builds and downloads a JSON export of an object tree (OMCT-C03-L2-03.01–03.03). */
@Injectable({ providedIn: 'root' })
export class JsonExportService {
  private readonly reader = inject(ObjectTreeReader);

  async buildDocument(root: DomainObject): Promise<ExportDocument> {
    const { objects, external } = await this.reader.read(root);
    return { cupola: objects, rootId: root.keyString, externalIdentifiers: external };
  }

  async exportTree(root: DomainObject): Promise<void> {
    const document = await this.buildDocument(root);
    this.download(JSON.stringify(document, null, 2), `${sanitizeFilename(root.name)}.json`);
  }

  private download(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
