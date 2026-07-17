import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  DomainObject,
  NotebookDestination,
  NotebookEntry,
  NotebookPage,
  NotebookSection,
  NotebookService,
  NotebookStorageService,
  ObjectUpdatesService,
  readNotebookConfiguration,
  sanitizeRichText,
} from '@cupola/core';

import { NotebookEmbedComponent } from './snapshot/notebook-embed.component';
import {
  RESTRICTED_NOTEBOOK_URL_WHITELIST,
  renderRestrictedEntryHtml,
} from './restricted-url-policy';
import { mergeRemoteNotebook } from './sync/notebook-sync';

/** One rendered entry with the section/page that locates it. */
interface EntryRow {
  sectionId: string;
  pageId: string;
  sectionName: string;
  pageName: string;
  entry: NotebookEntry;
}

/** Identifies the label currently being renamed inline. */
interface RenameTarget {
  kind: 'section' | 'page';
  sectionId: string;
  id: string;
}

const EMPTY_NOTEBOOK: DomainObject = {
  identifier: { namespace: '', key: '' },
  keyString: '',
  name: '',
  type: 'notebook',
  location: null,
  composition: [],
  configuration: { sections: [], entries: {} },
};

/**
 * The three-column notebook view: sections, pages, and timestamped entries. It
 * persists every structure and entry change through {@link NotebookService},
 * reflects remote changes in place (OMCT-C13-L2-03.*), searches entries
 * (OMCT-C13-L2-02.04), and renders restricted-notebook URLs against the
 * configured whitelist (OMCT-C13-L2-02.06).
 */
@Component({
  selector: 'cp-notebook-view',
  templateUrl: './notebook-view.component.html',
  styleUrl: './notebook-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NotebookEmbedComponent],
  host: { 'data-testid': 'notebook-view', class: 'notebook-host' },
})
export class NotebookViewComponent {
  private readonly notebooks = inject(NotebookService);
  private readonly storage = inject(NotebookStorageService);
  private readonly updates = inject(ObjectUpdatesService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly object = input.required<DomainObject>();
  readonly objectPath = input<DomainObject[]>([]);

  protected readonly notebook = signal<DomainObject>(EMPTY_NOTEBOOK);
  protected readonly selectedSectionId = signal<string | null>(null);
  protected readonly selectedPageId = signal<string | null>(null);
  protected readonly draftText = signal('');
  protected readonly editingEntryId = signal<string | null>(null);
  protected readonly searchTerm = signal('');
  protected readonly renameTarget = signal<RenameTarget | null>(null);
  protected readonly renameDraft = signal('');
  private readonly defaultDestination = signal<NotebookDestination | null>(null);

  protected readonly restricted = computed(() => this.object().type === 'restricted-notebook');
  protected readonly sections = computed(() => readNotebookConfiguration(this.notebook()).sections);
  protected readonly selectedSection = computed<NotebookSection | undefined>(() => {
    const sections = this.sections();
    return sections.find((section) => section.id === this.selectedSectionId()) ?? sections[0];
  });
  protected readonly pages = computed(() => this.selectedSection()?.pages ?? []);
  protected readonly selectedPage = computed<NotebookPage | undefined>(() => {
    const pages = this.pages();
    return pages.find((page) => page.id === this.selectedPageId()) ?? pages[0];
  });

  protected readonly entryRows = computed<EntryRow[]>(() => {
    const notebook = this.notebook();
    const term = this.searchTerm().trim();
    if (term.length > 0) {
      return this.notebooks.searchEntries(notebook, term).map((match) => ({
        sectionId: match.sectionId,
        pageId: match.pageId,
        sectionName: match.sectionName,
        pageName: match.pageName,
        entry: match.entry,
      }));
    }
    const section = this.selectedSection();
    const page = this.selectedPage();
    if (!section || !page) {
      return [];
    }
    const entries = readNotebookConfiguration(notebook).entries[section.id]?.[page.id] ?? [];
    return entries.map((entry) => ({
      sectionId: section.id,
      pageId: page.id,
      sectionName: section.name,
      pageName: page.name,
      entry,
    }));
  });

  constructor() {
    effect(() => {
      const object = this.object();
      untracked(() => {
        this.notebook.set(object);
        this.ensureSelection();
        this.defaultDestination.set(this.storage.getDefault());
      });
    });

    effect((onCleanup) => {
      const keyString = this.object().keyString;
      const subscription = this.updates.forKeyString(keyString).subscribe((incoming) => {
        this.notebook.set(mergeRemoteNotebook(this.notebook(), incoming));
        this.ensureSelection();
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  // --- Selection -----------------------------------------------------------

  protected selectSection(section: NotebookSection): void {
    this.selectedSectionId.set(section.id);
    this.selectedPageId.set(section.pages[0]?.id ?? null);
    this.searchTerm.set('');
  }

  protected selectPage(pageId: string): void {
    this.selectedPageId.set(pageId);
    this.searchTerm.set('');
  }

  private ensureSelection(): void {
    const sections = this.sections();
    if (!sections.some((section) => section.id === this.selectedSectionId())) {
      this.selectedSectionId.set(sections[0]?.id ?? null);
    }
    const pages = this.selectedSection()?.pages ?? [];
    if (!pages.some((page) => page.id === this.selectedPageId())) {
      this.selectedPageId.set(pages[0]?.id ?? null);
    }
  }

  // --- Entry editor --------------------------------------------------------

  protected async saveEntry(): Promise<void> {
    const text = this.draftText().trim();
    const section = this.selectedSection();
    const page = this.selectedPage();
    if (text.length === 0 || !section || !page) {
      return;
    }
    const editingId = this.editingEntryId();
    const saved = editingId
      ? await this.notebooks.updateEntry(this.notebook(), section.id, page.id, editingId, text)
      : await this.notebooks.createEntry(this.notebook(), section.id, page.id, text);
    this.notebook.set(saved);
    this.draftText.set('');
    this.editingEntryId.set(null);
  }

  protected editEntry(row: EntryRow): void {
    this.selectedSectionId.set(row.sectionId);
    this.selectedPageId.set(row.pageId);
    this.searchTerm.set('');
    this.editingEntryId.set(row.entry.id);
    this.draftText.set(row.entry.text);
  }

  protected cancelEdit(): void {
    this.editingEntryId.set(null);
    this.draftText.set('');
  }

  protected async deleteEntry(row: EntryRow): Promise<void> {
    const saved = await this.notebooks.deleteEntry(
      this.notebook(),
      row.sectionId,
      row.pageId,
      row.entry.id,
    );
    this.notebook.set(saved);
    if (this.editingEntryId() === row.entry.id) {
      this.cancelEdit();
    }
  }

  protected onEditorKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void this.saveEntry();
    }
  }

  // --- Section and page structure -----------------------------------------

  protected async addSection(): Promise<void> {
    const saved = await this.notebooks.addSection(this.notebook(), 'New section');
    this.notebook.set(saved);
    const sections = readNotebookConfiguration(saved).sections;
    const created = sections[sections.length - 1];
    if (created) {
      this.selectSection(created);
    }
  }

  protected async addPage(): Promise<void> {
    const section = this.selectedSection();
    if (!section) {
      return;
    }
    const saved = await this.notebooks.addPage(this.notebook(), section.id, 'New page');
    this.notebook.set(saved);
    const pages =
      readNotebookConfiguration(saved).sections.find((s) => s.id === section.id)?.pages ?? [];
    const created = pages[pages.length - 1];
    if (created) {
      this.selectPage(created.id);
    }
  }

  protected async deleteSection(section: NotebookSection): Promise<void> {
    const saved = await this.notebooks.deleteSection(this.notebook(), section.id);
    this.notebook.set(saved);
    this.ensureSelection();
  }

  protected async deletePage(pageId: string): Promise<void> {
    const section = this.selectedSection();
    if (!section) {
      return;
    }
    const saved = await this.notebooks.deletePage(this.notebook(), section.id, pageId);
    this.notebook.set(saved);
    this.ensureSelection();
  }

  protected async moveSection(index: number, delta: number): Promise<void> {
    const saved = await this.notebooks.reorderSections(this.notebook(), index, index + delta);
    this.notebook.set(saved);
  }

  protected async movePage(index: number, delta: number): Promise<void> {
    const section = this.selectedSection();
    if (!section) {
      return;
    }
    const saved = await this.notebooks.reorderPages(
      this.notebook(),
      section.id,
      index,
      index + delta,
    );
    this.notebook.set(saved);
  }

  // --- Inline rename -------------------------------------------------------

  protected startRename(
    kind: 'section' | 'page',
    sectionId: string,
    id: string,
    name: string,
  ): void {
    this.renameTarget.set({ kind, sectionId, id });
    this.renameDraft.set(name);
  }

  protected isRenaming(kind: 'section' | 'page', id: string): boolean {
    const target = this.renameTarget();
    return target?.kind === kind && target.id === id;
  }

  protected async commitRename(): Promise<void> {
    const target = this.renameTarget();
    const name = this.renameDraft().trim();
    if (!target || name.length === 0) {
      this.renameTarget.set(null);
      return;
    }
    const saved =
      target.kind === 'section'
        ? await this.notebooks.renameSection(this.notebook(), target.id, name)
        : await this.notebooks.renamePage(this.notebook(), target.sectionId, target.id, name);
    this.notebook.set(saved);
    this.renameTarget.set(null);
  }

  // --- Default destination -------------------------------------------------

  protected setDefaultDestination(): void {
    const section = this.selectedSection();
    const page = this.selectedPage();
    if (!section || !page) {
      return;
    }
    const destination: NotebookDestination = {
      notebookKey: this.object().keyString,
      sectionId: section.id,
      pageId: page.id,
    };
    this.storage.storeDefault(destination);
    this.defaultDestination.set(destination);
  }

  protected isDefaultPage(pageId: string): boolean {
    const destination = this.defaultDestination();
    const section = this.selectedSection();
    return (
      !!destination &&
      destination.notebookKey === this.object().keyString &&
      destination.sectionId === section?.id &&
      destination.pageId === pageId
    );
  }

  // --- Rendering helpers ---------------------------------------------------

  protected entryTimestamp(entry: NotebookEntry): string {
    return entry.createdOn.replace('T', ' ').slice(0, 19);
  }

  protected entryBodyHtml(entry: NotebookEntry): SafeHtml {
    const whitelist = readNotebookConfiguration(this.notebook()).urlWhitelist ?? [
      ...RESTRICTED_NOTEBOOK_URL_WHITELIST,
    ];
    // The text is already whitelist-sanitized here (B17); mark it trusted so the
    // inert blocked-URL markup and link classes survive Angular's binding.
    const html = this.restricted()
      ? renderRestrictedEntryHtml(entry.text, whitelist)
      : sanitizeRichText(entry.text);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  protected onSearch(value: string): void {
    this.searchTerm.set(value);
  }
}
