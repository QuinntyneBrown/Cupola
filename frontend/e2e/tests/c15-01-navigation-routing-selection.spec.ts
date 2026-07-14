import { expect, test } from '../support/cupola.fixture';

test.describe('C15 L1-01 — Navigation, routing, and selection', () => {
  test(
    'OMCT-C15-L2-01.01 — hash route dispatch updates the location and renders the matched object',
    { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-01.01' }] },
    async ({ shell, tree, objectView, page }) => {
      await shell.goto('browse/mine');
      await expect(objectView.title).toHaveText('My Items');

      await tree.expand('mine');
      await tree.activate('station-displays');

      await expect(page).toHaveURL(/#\/browse\/mine\/station-displays$/);
      await expect(objectView.title).toHaveText('Station displays');
    },
  );

  test(
    'OMCT-C15-L2-01.02 — search parameters are preserved across shell navigation',
    { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-01.02' }] },
    async ({ shell, tree, page }) => {
      await shell.goto('browse/mine?tc.mode=local');

      await tree.expand('mine');
      await tree.activate('station-displays');

      await expect(page).toHaveURL(/#\/browse\/mine\/station-displays\?tc\.mode=local$/);
    },
  );

  test(
    'OMCT-C15-L2-01.03 — browse path resolution sets title, tree selection, and observes object updates',
    { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-01.03' }] },
    async ({ shell, tree, objectView, realtime, fakeBackend, page }) => {
      await shell.goto('browse/mine/station-displays/solar-array-output');

      await expect(page).toHaveTitle('Solar array output');
      await expect(objectView.title).toHaveText('Solar array output');
      await expect(tree.selectedRow()).toHaveAttribute('data-key', 'solar-array-output');
      await expect(tree.row('solar-array-output')).toHaveAttribute('aria-current', 'true');

      const renamed = {
        ...fakeBackend.object('solar-array-output'),
        name: 'Array output (renamed)',
      };
      await realtime.pushObjectUpdate(renamed);

      await expect(page).toHaveTitle('Array output (renamed)');
      await expect(objectView.title).toHaveText('Array output (renamed)');
      await expect(tree.label('solar-array-output')).toHaveText('Array output (renamed)');
    },
  );

  test(
    'OMCT-C15-L2-01.04 — root browse redirects to the last child of root composition',
    { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-01.04' }] },
    async ({ shell, objectView, page }) => {
      await shell.goto('browse');

      await expect(page).toHaveURL(/#\/browse\/mine$/);
      await expect(objectView.title).toHaveText('My Items');
    },
  );

  test(
    'OMCT-C15-L2-01.05 — selection applies s-selected and s-selected-parent and supports multi-select',
    { annotation: [{ type: 'requirement', description: 'OMCT-C15-L2-01.05' }] },
    async ({ shell, objectView }) => {
      await shell.goto('browse/mine/station-displays');
      await expect(objectView.childCards).toHaveCount(2);

      await objectView.childCard('power-dashboard').click();
      await expect(objectView.childCard('power-dashboard')).toHaveAttribute('s-selected', '');
      await expect(objectView.viewHost).toHaveAttribute('s-selected-parent', '');

      await objectView.childCard('solar-array-output').click({ modifiers: ['Control'] });
      await expect(objectView.childCard('power-dashboard')).toHaveAttribute('s-selected', '');
      await expect(objectView.childCard('solar-array-output')).toHaveAttribute('s-selected', '');
    },
  );
});
