import { expect, test } from '../support/cupola.fixture';
import { DomainObjectFixture } from '../support/fake-backend';

const OPS_NOTEBOOK = 'browse/mine/ops-notebook';

interface NotebookEntryFixture {
  id: string;
  createdOn: string;
  createdBy?: string;
  text: string;
  embeds: unknown[];
  tags: string[];
}

interface NotebookConfigFixture {
  sections: unknown[];
  entries: Record<string, Record<string, NotebookEntryFixture[]>>;
}

/** A deep clone of the ops-notebook fixture with a bumped version for a remote push. */
function bumpedNotebook(current: DomainObjectFixture): DomainObjectFixture {
  const clone = JSON.parse(JSON.stringify(current)) as DomainObjectFixture;
  clone.version = (clone.version ?? 1) + 1;
  return clone;
}

/** The EVA 71 page entries of a notebook fixture. */
function pageEntries(notebook: DomainObjectFixture): NotebookEntryFixture[] {
  return (notebook.configuration as unknown as NotebookConfigFixture).entries['sec-eva'][
    'pg-eva71'
  ];
}

test.describe('C13 L1-03 — Collaborative notebook synchronization', () => {
  test(
    'OMCT-C13-L2-03.01 — a remotely modified entry updates in place',
    { annotation: [{ type: 'requirement', description: 'OMCT-C13-L2-03.01' }] },
    async ({ shell, notebook, realtime, fakeBackend }) => {
      await shell.goto(OPS_NOTEBOOK);
      await expect(notebook.entries).toHaveCount(2);

      const updated = bumpedNotebook(fakeBackend.object('ops-notebook'));
      pageEntries(updated)[0].text = 'Torqued battery 2B bolts — remote correction applied';
      await realtime.pushObjectUpdate(updated);

      await expect(notebook.entries.first().getByTestId('notebook-entry-body')).toContainText(
        'remote correction',
      );
      await expect(notebook.entries).toHaveCount(2);
    },
  );

  test(
    'OMCT-C13-L2-03.02 — a remotely added entry appears',
    { annotation: [{ type: 'requirement', description: 'OMCT-C13-L2-03.02' }] },
    async ({ shell, notebook, realtime, fakeBackend }) => {
      await shell.goto(OPS_NOTEBOOK);
      await expect(notebook.entries).toHaveCount(2);

      const updated = bumpedNotebook(fakeBackend.object('ops-notebook'));
      pageEntries(updated).push({
        id: 'ent-remote',
        createdOn: '2026-07-13T15:20:00Z',
        createdBy: 'e.thorne',
        text: 'Remote operator appended a go for egress',
        embeds: [],
        tags: [],
      });
      await realtime.pushObjectUpdate(updated);

      await expect(notebook.entries).toHaveCount(3);
      await expect(notebook.entries.last().getByTestId('notebook-entry-body')).toContainText(
        'go for egress',
      );
    },
  );

  test(
    'OMCT-C13-L2-03.03 — a remotely removed entry disappears',
    { annotation: [{ type: 'requirement', description: 'OMCT-C13-L2-03.03' }] },
    async ({ shell, notebook, realtime, fakeBackend }) => {
      await shell.goto(OPS_NOTEBOOK);
      await expect(notebook.entries).toHaveCount(2);

      const updated = bumpedNotebook(fakeBackend.object('ops-notebook'));
      const entries = pageEntries(updated);
      (updated.configuration as unknown as NotebookConfigFixture).entries['sec-eva']['pg-eva71'] = [
        entries[0],
      ];
      await realtime.pushObjectUpdate(updated);

      await expect(notebook.entries).toHaveCount(1);
    },
  );
});
