import { Injectable, inject } from '@angular/core';

import { DomainObject } from '../models/domain-object';
import { ObjectApi } from '../objects/object-api.service';
import { NotebookDestination, readNotebookConfiguration } from './notebook-model';

const STORAGE_KEY = 'cupola.notebook.default';

/**
 * Retains the default notebook copy destination in browser storage and resolves
 * it back to a live notebook, section, and page, returning nothing when the
 * stored destination is no longer valid (OMCT-C13-L2-01.05).
 */
@Injectable({ providedIn: 'root' })
export class NotebookStorageService {
  private readonly objects = inject(ObjectApi);

  /** Persists the default copy destination. */
  storeDefault(destination: NotebookDestination): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(destination));
  }

  /** Forgets the default copy destination. */
  clearDefault(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /** The stored destination identifiers, or null when none is stored or parseable. */
  getDefault(): NotebookDestination | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<NotebookDestination>;
      if (
        typeof parsed.notebookKey === 'string' &&
        typeof parsed.sectionId === 'string' &&
        typeof parsed.pageId === 'string'
      ) {
        return {
          notebookKey: parsed.notebookKey,
          sectionId: parsed.sectionId,
          pageId: parsed.pageId,
        };
      }
    } catch {
      /* fall through to null */
    }
    return null;
  }

  /**
   * Re-fetches the stored notebook and confirms its section and page still
   * exist, returning the live notebook and destination or null when invalid.
   */
  async resolve(): Promise<{ notebook: DomainObject; destination: NotebookDestination } | null> {
    const destination = this.getDefault();
    if (!destination) {
      return null;
    }
    const notebook = await this.objects.get(destination.notebookKey);
    const config = readNotebookConfiguration(notebook);
    const section = config.sections.find((candidate) => candidate.id === destination.sectionId);
    const page = section?.pages.find((candidate) => candidate.id === destination.pageId);
    if (!section || !page) {
      return null;
    }
    return { notebook, destination };
  }
}
