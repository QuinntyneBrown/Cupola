import {
  ActionContext,
  DomainObject,
  NotebookEmbed,
  NotebookService,
  NotebookStorageService,
  NotificationService,
} from '@cupola/core';

import { SnapshotCaptureService } from '../snapshot/snapshot-capture.service';
import { CopyToNotebookAction } from './copy-to-notebook-action';

function object(keyString: string, name: string, type = 'telemetry'): DomainObject {
  return {
    identifier: { namespace: '', key: keyString },
    keyString,
    name,
    type,
    location: null,
    composition: [],
  };
}

describe('OMCT-C13-L2-02.01 — Copy to notebook', () => {
  const notebook = object('nb', 'Ops notebook', 'notebook');
  const embed: NotebookEmbed = {
    objectKeyString: 'pwr.bus_v',
    objectName: 'Bus voltage',
    capturedAt: '2026-07-13T00:00:00Z',
  };

  function setup(hasDefault: boolean): {
    action: CopyToNotebookAction;
    notebooks: { createEntry: jest.Mock };
    notifications: { alert: jest.Mock };
  } {
    const storage = {
      resolve: jest.fn(async () =>
        hasDefault
          ? { notebook, destination: { notebookKey: 'nb', sectionId: 's1', pageId: 'p1' } }
          : null,
      ),
    } as unknown as NotebookStorageService;
    const notebooks = { createEntry: jest.fn(async () => notebook) };
    const snapshots = { capture: jest.fn(() => embed) } as unknown as SnapshotCaptureService;
    const notifications = { alert: jest.fn() };
    const action = new CopyToNotebookAction(
      storage,
      notebooks as unknown as NotebookService,
      snapshots,
      notifications as unknown as NotificationService,
    );
    return { action, notebooks, notifications };
  }

  const context: ActionContext = {
    objectPath: [object('pwr.bus_v', 'Bus voltage')],
    viewKey: 'plot-view',
  };

  it('creates an entry containing the object name and snapshot in the default destination', async () => {
    const { action, notebooks } = setup(true);
    await action.copyToNotebook(context);
    expect(notebooks.createEntry).toHaveBeenCalledWith(notebook, 's1', 'p1', 'Bus voltage', [
      embed,
    ]);
  });

  it('does not apply to notebook objects themselves', () => {
    const { action } = setup(true);
    expect(action.appliesTo({ objectPath: [notebook] })).toBe(false);
    expect(action.appliesTo(context)).toBe(true);
  });

  it('notifies and creates nothing when no default destination is set', async () => {
    const { action, notebooks, notifications } = setup(false);
    await action.copyToNotebook(context);
    expect(notebooks.createEntry).not.toHaveBeenCalled();
    expect(notifications.alert).toHaveBeenCalled();
  });
});
