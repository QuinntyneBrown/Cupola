import { DomainObject } from '../models/domain-object';

/**
 * C13 — Notebook domain model (OMCT-C13-L1-01/02).
 *
 * A notebook is a domain object whose `configuration` carries a section/page
 * structure and the timestamped entries filed under each page. The shapes here
 * are the persisted contract: {@link NotebookConfiguration} is stored verbatim
 * at `object.configuration` and round-trips through the opaque store (B01).
 */

/** A page within a section: the leaf destination that holds entries. */
export interface NotebookPage {
  id: string;
  name: string;
}

/** A section groups pages; a notebook is an ordered list of sections. */
export interface NotebookSection {
  id: string;
  name: string;
  pages: NotebookPage[];
}

/**
 * A captured object-view reference embedded in an entry (OMCT-C13-L2-02.02).
 * A structured pointer to the source object and view — not a rasterized image —
 * so the embed can be expanded back to the live view (OMCT-C13-L2-02.03).
 */
export interface NotebookEmbed {
  objectKeyString: string;
  objectName: string;
  viewKey?: string;
  /** ISO timestamp of when the snapshot was captured. */
  capturedAt: string;
  /** Time bounds in effect at capture, when the source view was time-based. */
  bounds?: { start: number; end: number };
  /** Optional inline data-URI thumbnail; absent by default (no rasterization). */
  imageSrc?: string;
}

/** A single timestamped notebook entry (OMCT-C13-L2-01.03). */
export interface NotebookEntry {
  id: string;
  /** ISO creation timestamp. */
  createdOn: string;
  /** Active-user identity at creation time, when available (B12). */
  createdBy?: string;
  text: string;
  embeds: NotebookEmbed[];
  tags: string[];
}

/**
 * The persisted notebook configuration. `entries` is keyed section id → page id
 * → ordered entries so a page's entries survive section/page reordering.
 */
export interface NotebookConfiguration {
  sections: NotebookSection[];
  entries: Record<string, Record<string, NotebookEntry[]>>;
  /** Marks a restricted notebook: committed entries and a URL whitelist apply. */
  isRestricted?: boolean;
  /** Hostnames whose URLs may render as links in a restricted notebook. */
  urlWhitelist?: string[];
}

/** A search hit: the matched entry with the section/page path that locates it. */
export interface NotebookEntryLocation {
  sectionId: string;
  sectionName: string;
  pageId: string;
  pageName: string;
  entry: NotebookEntry;
}

/** A pinned copy destination: the notebook, section, and page a copy lands on. */
export interface NotebookDestination {
  notebookKey: string;
  sectionId: string;
  pageId: string;
}

/** Generates a locally-unique id, preferring a UUID when the platform offers one. */
export function newNotebookId(prefix: string): string {
  const unique =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  return `${prefix}.${unique}`;
}

/** A fresh section carrying one empty page, matching the seeded notebook shape. */
export function makeSection(name: string): NotebookSection {
  return { id: newNotebookId('section'), name, pages: [makePage('Page 1')] };
}

/** A fresh empty page. */
export function makePage(name: string): NotebookPage {
  return { id: newNotebookId('page'), name };
}

/**
 * Reads a deep copy of the notebook configuration from a domain object,
 * defaulting missing structure to empty so callers can mutate freely without
 * disturbing the source object.
 */
export function readNotebookConfiguration(object: DomainObject): NotebookConfiguration {
  const raw = (object.configuration ?? {}) as Partial<NotebookConfiguration>;
  return {
    sections: clone(raw.sections ?? []),
    entries: clone(raw.entries ?? {}),
    isRestricted: raw.isRestricted,
    urlWhitelist: raw.urlWhitelist ? [...raw.urlWhitelist] : undefined,
  };
}

/** Returns a copy of the object with its notebook configuration replaced. */
export function withNotebookConfiguration(
  object: DomainObject,
  configuration: NotebookConfiguration,
): DomainObject {
  return { ...object, configuration: { ...object.configuration, ...configuration } };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
