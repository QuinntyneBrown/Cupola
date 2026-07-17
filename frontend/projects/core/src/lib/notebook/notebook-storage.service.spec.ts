import { TestBed } from '@angular/core/testing';

import { DomainObject } from '../models/domain-object';
import { ObjectApi } from '../objects/object-api.service';
import { NotebookConfiguration } from './notebook-model';
import { NotebookStorageService } from './notebook-storage.service';

function notebook(configuration: NotebookConfiguration): DomainObject {
  return {
    identifier: { namespace: '', key: 'nb' },
    keyString: 'nb',
    name: 'Ops notebook',
    type: 'notebook',
    location: 'mine',
    composition: [],
    configuration: { ...configuration },
  };
}

const VALID: NotebookConfiguration = {
  sections: [{ id: 's1', name: 'EVA', pages: [{ id: 'p1', name: 'Page 1' }] }],
  entries: {},
};

class FakeObjectApi {
  object: DomainObject | null = notebook(VALID);
  get = jest.fn((keyString: string): Promise<DomainObject> => {
    if (!this.object || this.object.keyString !== keyString) {
      // Mirror the missing-object placeholder: no notebook structure.
      return Promise.resolve(notebook({ sections: [], entries: {} }));
    }
    return Promise.resolve(JSON.parse(JSON.stringify(this.object)) as DomainObject);
  });
}

function setup(): { service: NotebookStorageService; api: FakeObjectApi } {
  TestBed.resetTestingModule();
  const api = new FakeObjectApi();
  TestBed.configureTestingModule({
    providers: [NotebookStorageService, { provide: ObjectApi, useValue: api }],
  });
  return { service: TestBed.inject(NotebookStorageService), api };
}

describe('OMCT-C13-L2-01.05 — Default notebook location', () => {
  beforeEach(() => localStorage.clear());

  it('returns no default destination when none is stored', async () => {
    const { service } = setup();
    expect(service.getDefault()).toBeNull();
    expect(await service.resolve()).toBeNull();
  });

  it('returns the stored notebook, section, and page when they remain valid', async () => {
    const { service } = setup();
    service.storeDefault({ notebookKey: 'nb', sectionId: 's1', pageId: 'p1' });

    expect(service.getDefault()).toEqual({ notebookKey: 'nb', sectionId: 's1', pageId: 'p1' });
    const resolved = await service.resolve();
    expect(resolved).not.toBeNull();
    expect(resolved!.notebook.keyString).toBe('nb');
    expect(resolved!.destination).toEqual({ notebookKey: 'nb', sectionId: 's1', pageId: 'p1' });
  });

  it('persists the stored destination across a fresh service instance (browser storage)', async () => {
    const first = setup();
    first.service.storeDefault({ notebookKey: 'nb', sectionId: 's1', pageId: 'p1' });

    const second = setup();
    const resolved = await second.service.resolve();
    expect(resolved!.destination.pageId).toBe('p1');
  });

  it('returns no destination when the stored page no longer exists', async () => {
    const { service, api } = setup();
    service.storeDefault({ notebookKey: 'nb', sectionId: 's1', pageId: 'p1' });
    api.object = notebook({
      sections: [{ id: 's1', name: 'EVA', pages: [{ id: 'p9', name: 'Renamed page' }] }],
      entries: {},
    });
    expect(await service.resolve()).toBeNull();
  });

  it('returns no destination when the notebook is gone', async () => {
    const { service, api } = setup();
    service.storeDefault({ notebookKey: 'nb', sectionId: 's1', pageId: 'p1' });
    api.object = null;
    expect(await service.resolve()).toBeNull();
  });
});
