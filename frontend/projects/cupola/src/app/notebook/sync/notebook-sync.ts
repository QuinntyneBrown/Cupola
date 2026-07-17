import { DomainObject, NotebookEntry, readNotebookConfiguration } from '@cupola/core';

/**
 * Reconciles the entries rendered on a page with entries arriving from a remote
 * update, keyed by entry id: an entry present in both is replaced in place
 * (OMCT-C13-L2-03.01), an entry present only remotely is appended
 * (OMCT-C13-L2-03.02), and an entry absent remotely is dropped
 * (OMCT-C13-L2-03.03). Current ordering is preserved; new entries follow in
 * their incoming order.
 */
export function reconcileEntries(
  current: NotebookEntry[],
  incoming: NotebookEntry[],
): NotebookEntry[] {
  const incomingById = new Map(incoming.map((entry) => [entry.id, entry]));
  const reconciled: NotebookEntry[] = [];
  for (const entry of current) {
    const updated = incomingById.get(entry.id);
    if (updated) {
      reconciled.push(updated);
    }
  }
  const currentIds = new Set(current.map((entry) => entry.id));
  for (const entry of incoming) {
    if (!currentIds.has(entry.id)) {
      reconciled.push(entry);
    }
  }
  return reconciled;
}

/**
 * Merges a remote notebook update into the currently rendered notebook: adopts
 * the remote structure but reconciles each page's entries so remote edits,
 * additions, and removals apply in place without reopening the notebook.
 */
export function mergeRemoteNotebook(current: DomainObject, incoming: DomainObject): DomainObject {
  const currentConfig = readNotebookConfiguration(current);
  const incomingConfig = readNotebookConfiguration(incoming);
  const entries: Record<string, Record<string, NotebookEntry[]>> = {};
  for (const [sectionId, pages] of Object.entries(incomingConfig.entries)) {
    entries[sectionId] = {};
    for (const [pageId, incomingEntries] of Object.entries(pages)) {
      entries[sectionId][pageId] = reconcileEntries(
        currentConfig.entries[sectionId]?.[pageId] ?? [],
        incomingEntries,
      );
    }
  }
  return {
    ...incoming,
    configuration: { ...incoming.configuration, sections: incomingConfig.sections, entries },
  };
}
