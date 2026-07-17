import { Injectable, inject } from '@angular/core';

import { DomainObject } from '../models/domain-object';
import { User } from '../models/user';
import { NotificationService } from '../notifications/notification.service';
import { ObjectApi } from '../objects/object-api.service';
import { UserService } from '../user/user.service';
import {
  NotebookConfiguration,
  NotebookEmbed,
  NotebookEntry,
  NotebookEntryLocation,
  makePage,
  makeSection,
  newNotebookId,
  readNotebookConfiguration,
  withNotebookConfiguration,
} from './notebook-model';

/**
 * Structure and entry lifecycle for notebooks, persisting every change through
 * the shared object store. Each write is get → merge the change → save, with a
 * single re-get-and-reapply retry on an optimistic-concurrency conflict and a
 * notification when the conflict persists (OMCT-C13-L2-01.02–01.04).
 *
 * Search (OMCT-C13-L2-02.04) and text formatting (OMCT-C13-L2-02.05) are pure
 * reads over a notebook's persisted configuration.
 */
@Injectable({ providedIn: 'root' })
export class NotebookService {
  private readonly objects = inject(ObjectApi);
  private readonly notifications = inject(NotificationService);
  private readonly users = inject(UserService, { optional: true });

  /** Appends a new section (carrying one page) to the notebook. */
  addSection(notebook: DomainObject, name: string): Promise<DomainObject> {
    return this.mutate(notebook, (config) => {
      config.sections.push(makeSection(name));
    });
  }

  /** Renames a section by identifier. */
  renameSection(notebook: DomainObject, sectionId: string, name: string): Promise<DomainObject> {
    return this.mutate(notebook, (config) => {
      const section = config.sections.find((candidate) => candidate.id === sectionId);
      if (section) {
        section.name = name;
      }
    });
  }

  /** Moves a section from one index to another. */
  reorderSections(
    notebook: DomainObject,
    fromIndex: number,
    toIndex: number,
  ): Promise<DomainObject> {
    return this.mutate(notebook, (config) => {
      moveWithin(config.sections, fromIndex, toIndex);
    });
  }

  /** Removes a section and every entry filed under its pages. */
  deleteSection(notebook: DomainObject, sectionId: string): Promise<DomainObject> {
    return this.mutate(notebook, (config) => {
      config.sections = config.sections.filter((section) => section.id !== sectionId);
      delete config.entries[sectionId];
    });
  }

  /** Appends a new page to a section. */
  addPage(notebook: DomainObject, sectionId: string, name: string): Promise<DomainObject> {
    return this.mutate(notebook, (config) => {
      const section = config.sections.find((candidate) => candidate.id === sectionId);
      section?.pages.push(makePage(name));
    });
  }

  /** Renames a page by identifier. */
  renamePage(
    notebook: DomainObject,
    sectionId: string,
    pageId: string,
    name: string,
  ): Promise<DomainObject> {
    return this.mutate(notebook, (config) => {
      const page = config.sections
        .find((section) => section.id === sectionId)
        ?.pages.find((candidate) => candidate.id === pageId);
      if (page) {
        page.name = name;
      }
    });
  }

  /** Moves a page within its section from one index to another. */
  reorderPages(
    notebook: DomainObject,
    sectionId: string,
    fromIndex: number,
    toIndex: number,
  ): Promise<DomainObject> {
    return this.mutate(notebook, (config) => {
      const section = config.sections.find((candidate) => candidate.id === sectionId);
      if (section) {
        moveWithin(section.pages, fromIndex, toIndex);
      }
    });
  }

  /** Removes a page and its entries from a section. */
  deletePage(notebook: DomainObject, sectionId: string, pageId: string): Promise<DomainObject> {
    return this.mutate(notebook, (config) => {
      const section = config.sections.find((candidate) => candidate.id === sectionId);
      if (section) {
        section.pages = section.pages.filter((page) => page.id !== pageId);
      }
      delete config.entries[sectionId]?.[pageId];
    });
  }

  /**
   * Files a new entry on a section/page with a generated identifier, an ISO
   * creation timestamp, and the active-user identity when available (B12).
   */
  createEntry(
    notebook: DomainObject,
    sectionId: string,
    pageId: string,
    text: string,
    embeds: NotebookEmbed[] = [],
  ): Promise<DomainObject> {
    const entry: NotebookEntry = {
      id: newNotebookId('entry'),
      createdOn: new Date().toISOString(),
      text,
      embeds,
      tags: [],
    };
    const user = this.snapshotUser();
    if (user) {
      entry.createdBy = user.name;
    }
    return this.mutate(notebook, (config) => {
      entriesFor(config, sectionId, pageId).push(entry);
    });
  }

  /**
   * The active user at call time. Read on demand (not cached at construction)
   * because the user provider may be installed after this service is created.
   */
  private snapshotUser(): User | null {
    let user: User | null = null;
    this.users
      ?.currentUser()
      .subscribe((value) => {
        user = value;
      })
      .unsubscribe();
    return user;
  }

  /** Replaces the text of an identified entry. */
  updateEntry(
    notebook: DomainObject,
    sectionId: string,
    pageId: string,
    entryId: string,
    text: string,
  ): Promise<DomainObject> {
    return this.mutate(notebook, (config) => {
      const entry = entriesFor(config, sectionId, pageId).find(
        (candidate) => candidate.id === entryId,
      );
      if (entry) {
        entry.text = text;
      }
    });
  }

  /** Removes an identified entry from a page. */
  deleteEntry(
    notebook: DomainObject,
    sectionId: string,
    pageId: string,
    entryId: string,
  ): Promise<DomainObject> {
    return this.mutate(notebook, (config) => {
      const page = config.entries[sectionId]?.[pageId];
      if (page) {
        config.entries[sectionId][pageId] = page.filter((entry) => entry.id !== entryId);
      }
    });
  }

  /**
   * Finds entries whose text or tags contain the term (case-insensitive) across
   * every section and page; an empty term matches nothing (OMCT-C13-L2-02.04).
   */
  searchEntries(notebook: DomainObject, term: string): NotebookEntryLocation[] {
    const needle = term.trim().toLowerCase();
    if (needle.length === 0) {
      return [];
    }
    const config = readNotebookConfiguration(notebook);
    const matches: NotebookEntryLocation[] = [];
    for (const section of config.sections) {
      for (const page of section.pages) {
        for (const entry of config.entries[section.id]?.[page.id] ?? []) {
          const haystack = `${entry.text} ${entry.tags.join(' ')}`.toLowerCase();
          if (haystack.includes(needle)) {
            matches.push({
              sectionId: section.id,
              sectionName: section.name,
              pageId: page.id,
              pageName: page.name,
              entry,
            });
          }
        }
      }
    }
    return matches;
  }

  /** Renders the notebook's sections, pages, and entries as plain text. */
  formatText(notebook: DomainObject): string {
    const config = readNotebookConfiguration(notebook);
    const lines: string[] = [notebook.name, ''];
    for (const section of config.sections) {
      lines.push(`== ${section.name} ==`);
      for (const page of section.pages) {
        lines.push(`--- ${page.name} ---`);
        for (const entry of config.entries[section.id]?.[page.id] ?? []) {
          const author = entry.createdBy ? ` ${entry.createdBy}` : '';
          lines.push(`[${entry.createdOn}]${author}: ${entry.text}`);
        }
        lines.push('');
      }
    }
    return lines.join('\n');
  }

  private async mutate(
    notebook: DomainObject,
    apply: (config: NotebookConfiguration) => void,
  ): Promise<DomainObject> {
    const keyString = notebook.keyString;
    const object = await this.objects.get(keyString);
    const first = applied(object, apply);
    const result = await this.objects.save(first);
    if (result.outcome !== 'conflict') {
      return result.object ?? first;
    }
    // One retry: re-read the current server state and re-apply the change.
    const current = result.object ?? (await this.objects.get(keyString));
    const retried = applied(current, apply);
    const retry = await this.objects.save(retried);
    if (retry.outcome === 'conflict') {
      this.notifications.alert(
        `Could not save notebook “${object.name}” — it was changed elsewhere.`,
      );
    }
    return retry.object ?? retried;
  }
}

/** Applies a mutation to a fresh copy of the object's configuration. */
function applied(
  object: DomainObject,
  apply: (config: NotebookConfiguration) => void,
): DomainObject {
  const config = readNotebookConfiguration(object);
  apply(config);
  return withNotebookConfiguration(object, config);
}

/** Returns the (created-on-demand) entries array for a section/page. */
function entriesFor(
  config: NotebookConfiguration,
  sectionId: string,
  pageId: string,
): NotebookEntry[] {
  const section = (config.entries[sectionId] ??= {});
  return (section[pageId] ??= []);
}

/** Moves an array element from one index to another in place. */
function moveWithin<T>(items: T[], fromIndex: number, toIndex: number): void {
  if (
    fromIndex < 0 ||
    fromIndex >= items.length ||
    toIndex < 0 ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return;
  }
  const [moved] = items.splice(fromIndex, 1);
  items.splice(toIndex, 0, moved);
}
