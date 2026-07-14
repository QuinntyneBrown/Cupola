import { Action } from './action';
import { ActionCollection } from './action-collection';

function action(key: string, showInStatusBar = false): Action {
  return { key, name: key, showInStatusBar, invoke: () => {} };
}

describe('OMCT-C15-L2-03.02 ActionCollection', () => {
  let collection: ActionCollection;

  beforeEach(() => {
    collection = new ActionCollection([
      action('open'),
      action('remove'),
      action('info', true),
    ]);
  });

  it('lists all actions as visible by default', () => {
    expect(collection.getVisibleActions().map((a) => a.key)).toEqual(['open', 'remove', 'info']);
  });

  it('hides and shows actions', () => {
    collection.hide('remove');
    expect(collection.getVisibleActions().map((a) => a.key)).toEqual(['open', 'info']);

    collection.show('remove');
    expect(collection.getVisibleActions().map((a) => a.key)).toEqual(['open', 'remove', 'info']);
  });

  it('filters status-bar actions to visible actions flagged for the status bar', () => {
    expect(collection.getStatusBarActions().map((a) => a.key)).toEqual(['info']);

    collection.hide('info');
    expect(collection.getStatusBarActions()).toEqual([]);
  });

  it('disables and enables actions', () => {
    collection.disable('open');
    expect(collection.isDisabled('open')).toBe(true);

    collection.enable('open');
    expect(collection.isDisabled('open')).toBe(false);
  });

  it('notifies subscribers of state changes', () => {
    let changes = 0;
    collection.changes.subscribe(() => (changes += 1));

    collection.hide('open');
    collection.disable('remove');

    expect(changes).toBe(2);
  });
});
