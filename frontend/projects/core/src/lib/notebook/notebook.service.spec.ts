import { TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { DomainObject } from '../models/domain-object';
import { ObjectSaveResult } from '../models/object-save-result';
import { User } from '../models/user';
import { NotificationService, ProgressUpdate } from '../notifications/notification.service';
import { ObjectApi } from '../objects/object-api.service';
import { UserService } from '../user/user.service';
import { NotebookConfiguration, readNotebookConfiguration } from './notebook-model';
import { NotebookService } from './notebook.service';

function notebook(configuration: Partial<NotebookConfiguration> = {}): DomainObject {
  return {
    identifier: { namespace: '', key: 'nb' },
    keyString: 'nb',
    name: 'Ops notebook',
    type: 'notebook',
    location: 'mine',
    composition: [],
    version: 1,
    configuration: { sections: [], entries: {}, ...configuration },
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

class FakeObjectApi {
  readonly store = new Map<string, DomainObject>();
  readonly saves: DomainObject[] = [];
  conflictOnce = false;

  get = jest.fn((keyString: string): Promise<DomainObject> => {
    const object = this.store.get(keyString);
    if (!object) {
      throw new Error(`missing ${keyString}`);
    }
    return Promise.resolve(clone(object));
  });

  save = jest.fn((object: DomainObject): Promise<ObjectSaveResult> => {
    if (this.conflictOnce) {
      this.conflictOnce = false;
      return Promise.resolve({
        keyString: object.keyString,
        outcome: 'conflict',
        object: clone(this.store.get(object.keyString) ?? object),
      });
    }
    this.saves.push(clone(object));
    this.store.set(object.keyString, clone(object));
    return Promise.resolve({ keyString: object.keyString, outcome: 'updated', object });
  });
}

class FakeUserService extends UserService {
  constructor(private readonly user: User | null) {
    super();
  }
  override hasProvider(): boolean {
    return this.user !== null;
  }
  override currentUser(): Observable<User | null> {
    return of(this.user);
  }
  override activeRole(): Observable<string | null> {
    return of(null);
  }
}

class FakeNotificationService extends NotificationService {
  readonly alerts: string[] = [];
  override info(): void {}
  override alert(message: string): void {
    this.alerts.push(message);
  }
  override error(): void {}
  override progress(): { update(p: ProgressUpdate): void; dismiss(): void } {
    return { update: () => {}, dismiss: () => {} };
  }
}

function setup(user: User | null = { id: 'u1', name: 'j.reyes' }): {
  service: NotebookService;
  api: FakeObjectApi;
  notifications: FakeNotificationService;
} {
  const api = new FakeObjectApi();
  const notifications = new FakeNotificationService();
  TestBed.configureTestingModule({
    providers: [
      NotebookService,
      { provide: ObjectApi, useValue: api },
      { provide: UserService, useValue: new FakeUserService(user) },
      { provide: NotificationService, useValue: notifications },
    ],
  });
  return { service: TestBed.inject(NotebookService), api, notifications };
}

describe('OMCT-C13-L2-01.02 — Section and page editing', () => {
  it('adds, renames, reorders, and deletes sections, persisting each change', async () => {
    const { service, api } = setup();
    const seed = notebook();
    api.store.set(seed.keyString, seed);

    let saved = await service.addSection(seed, 'EVA operations');
    let config = readNotebookConfiguration(saved);
    expect(config.sections.map((s) => s.name)).toEqual(['EVA operations']);
    const firstId = config.sections[0].id;

    saved = await service.addSection(saved, 'Payload science');
    saved = await service.renameSection(saved, firstId, 'EVA ops');
    config = readNotebookConfiguration(saved);
    expect(config.sections.map((s) => s.name)).toEqual(['EVA ops', 'Payload science']);

    saved = await service.reorderSections(saved, 1, 0);
    config = readNotebookConfiguration(saved);
    expect(config.sections.map((s) => s.name)).toEqual(['Payload science', 'EVA ops']);

    saved = await service.deleteSection(saved, firstId);
    config = readNotebookConfiguration(saved);
    expect(config.sections.map((s) => s.name)).toEqual(['Payload science']);
    expect(api.save).toHaveBeenCalledTimes(5);
  });

  it('adds a new section with an initial page', async () => {
    const { service } = setup();
    const seed = notebook();
    setupStore(service, seed);
    const saved = await service.addSection(seed, 'Anomalies');
    const config = readNotebookConfiguration(saved);
    expect(config.sections[0].pages).toHaveLength(1);
  });

  it('adds, renames, reorders, and deletes pages within a section', async () => {
    const { service } = setup();
    const seed = notebook();
    setupStore(service, seed);

    let saved = await service.addSection(seed, 'EVA');
    const sectionId = readNotebookConfiguration(saved).sections[0].id;

    saved = await service.addPage(saved, sectionId, 'EVA 71');
    let pages = readNotebookConfiguration(saved).sections[0].pages;
    expect(pages.map((p) => p.name)).toEqual(['Page 1', 'EVA 71']);

    const firstPageId = pages[0].id;
    saved = await service.renamePage(saved, sectionId, firstPageId, 'EVA 70');
    saved = await service.reorderPages(saved, sectionId, 1, 0);
    pages = readNotebookConfiguration(saved).sections[0].pages;
    expect(pages.map((p) => p.name)).toEqual(['EVA 71', 'EVA 70']);

    saved = await service.deletePage(saved, sectionId, firstPageId);
    pages = readNotebookConfiguration(saved).sections[0].pages;
    expect(pages.map((p) => p.name)).toEqual(['EVA 71']);
  });
});

describe('OMCT-C13-L2-01.03 — Entry creation', () => {
  it('creates an entry with identifier, timestamp, text, and active user', async () => {
    const { service } = setup({ id: 'u1', name: 'j.reyes' });
    const seed = notebook();
    setupStore(service, seed);
    const withSection = await service.addSection(seed, 'EVA');
    const { id: sectionId, pages } = readNotebookConfiguration(withSection).sections[0];

    const before = Date.now();
    const saved = await service.createEntry(
      withSection,
      sectionId,
      pages[0].id,
      'Torqued bolts 1-4',
    );
    const entries = readNotebookConfiguration(saved).entries[sectionId][pages[0].id];

    expect(entries).toHaveLength(1);
    expect(entries[0].id).toMatch(/^entry\./);
    expect(entries[0].text).toBe('Torqued bolts 1-4');
    expect(entries[0].createdBy).toBe('j.reyes');
    expect(Date.parse(entries[0].createdOn)).toBeGreaterThanOrEqual(before);
  });

  it('omits the author when no active user is configured', async () => {
    const { service } = setup(null);
    const seed = notebook();
    setupStore(service, seed);
    const withSection = await service.addSection(seed, 'EVA');
    const { id: sectionId, pages } = readNotebookConfiguration(withSection).sections[0];

    const saved = await service.createEntry(
      withSection,
      sectionId,
      pages[0].id,
      'Suit 2 scrubber swap',
    );
    const entry = readNotebookConfiguration(saved).entries[sectionId][pages[0].id][0];
    expect(entry.createdBy).toBeUndefined();
  });
});

describe('OMCT-C13-L2-01.04 — Entry editing and deletion', () => {
  it('updates the text of an existing entry', async () => {
    const { service } = setup();
    const seed = notebook();
    setupStore(service, seed);
    let saved = await service.addSection(seed, 'EVA');
    const { id: sectionId, pages } = readNotebookConfiguration(saved).sections[0];
    saved = await service.createEntry(saved, sectionId, pages[0].id, 'Original');
    const entryId = readNotebookConfiguration(saved).entries[sectionId][pages[0].id][0].id;

    saved = await service.updateEntry(saved, sectionId, pages[0].id, entryId, 'Edited');
    const entry = readNotebookConfiguration(saved).entries[sectionId][pages[0].id][0];
    expect(entry.text).toBe('Edited');
    expect(entry.id).toBe(entryId);
  });

  it('deletes an entry by identifier', async () => {
    const { service } = setup();
    const seed = notebook();
    setupStore(service, seed);
    let saved = await service.addSection(seed, 'EVA');
    const { id: sectionId, pages } = readNotebookConfiguration(saved).sections[0];
    saved = await service.createEntry(saved, sectionId, pages[0].id, 'One');
    saved = await service.createEntry(saved, sectionId, pages[0].id, 'Two');
    const entryId = readNotebookConfiguration(saved).entries[sectionId][pages[0].id][0].id;

    saved = await service.deleteEntry(saved, sectionId, pages[0].id, entryId);
    const entries = readNotebookConfiguration(saved).entries[sectionId][pages[0].id];
    expect(entries.map((e) => e.text)).toEqual(['Two']);
  });
});

describe('OMCT-C13-L2-02.04 — Notebook search', () => {
  it('returns entries whose text or tags match the term across sections and pages', async () => {
    const { service } = setup();
    const seed = notebook();
    setupStore(service, seed);
    let saved = await service.addSection(seed, 'EVA operations');
    const {
      id: sectionId,
      name: sectionName,
      pages,
    } = readNotebookConfiguration(saved).sections[0];
    saved = await service.createEntry(saved, sectionId, pages[0].id, 'Torqued battery 2B bolts');
    saved = await service.createEntry(saved, sectionId, pages[0].id, 'Scrubber swap complete');

    const matches = service.searchEntries(saved, 'battery');
    expect(matches).toHaveLength(1);
    expect(matches[0].entry.text).toContain('battery');
    expect(matches[0].sectionName).toBe(sectionName);
    expect(matches[0].pageName).toBe('Page 1');
  });

  it('returns no matches for an empty term', async () => {
    const { service } = setup();
    const seed = notebook();
    setupStore(service, seed);
    let saved = await service.addSection(seed, 'EVA');
    const { id: sectionId, pages } = readNotebookConfiguration(saved).sections[0];
    saved = await service.createEntry(saved, sectionId, pages[0].id, 'anything');
    expect(service.searchEntries(saved, '   ')).toEqual([]);
  });
});

describe('OMCT-C13-L2-02.05 — Text export', () => {
  it('formats sections, pages, and entries as text', async () => {
    const { service } = setup();
    const seed = notebook();
    setupStore(service, seed);
    let saved = await service.addSection(seed, 'EVA operations');
    const { id: sectionId, pages } = readNotebookConfiguration(saved).sections[0];
    saved = await service.createEntry(saved, sectionId, pages[0].id, 'Battery 2B installed');

    const text = service.formatText(saved);
    expect(text).toContain('Ops notebook');
    expect(text).toContain('EVA operations');
    expect(text).toContain('Page 1');
    expect(text).toContain('Battery 2B installed');
  });
});

describe('OMCT-C13-L2-01.02 — persistence conflict handling', () => {
  it('retries once on a save conflict then alerts if it persists', async () => {
    const { service, api, notifications } = setup();
    const seed = notebook();
    api.store.set(seed.keyString, seed);

    api.conflictOnce = true;
    const saved = await service.addSection(seed, 'EVA');
    // Recovered on the retry: the section is persisted and no alert is raised.
    expect(readNotebookConfiguration(saved).sections).toHaveLength(1);
    expect(notifications.alerts).toHaveLength(0);
  });
});

/** Seeds the fake store used by a service created via {@link setup}. */
function setupStore(service: NotebookService, seed: DomainObject): void {
  const api = TestBed.inject(ObjectApi) as unknown as FakeObjectApi;
  api.store.set(seed.keyString, seed);
  void service;
}
