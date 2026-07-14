import { SelectionService } from './selection.service';
import { SelectedItem } from './selected-item';

describe('OMCT-C15-L2-01.05 SelectionService', () => {
  let service: SelectionService;
  let container: HTMLElement;
  let first: HTMLElement;
  let second: HTMLElement;

  function item(element: HTMLElement, key: string): SelectedItem {
    return { element, context: { key } };
  }

  beforeEach(() => {
    service = new SelectionService();
    container = document.createElement('div');
    container.setAttribute('data-selection-parent', '');
    first = document.createElement('div');
    second = document.createElement('div');
    container.append(first, second);
    document.body.appendChild(container);
  });

  afterEach(() => container.remove());

  it('updates the selected collection and applies selected and selected-parent attributes', () => {
    service.select(item(first, 'a'));

    expect(service.selected()).toHaveLength(1);
    expect(first.hasAttribute('s-selected')).toBe(true);
    expect(container.hasAttribute('s-selected-parent')).toBe(true);
  });

  it('replaces the selection on single select', () => {
    service.select(item(first, 'a'));
    service.select(item(second, 'b'));

    expect(first.hasAttribute('s-selected')).toBe(false);
    expect(second.hasAttribute('s-selected')).toBe(true);
    expect(service.selected().map((s) => s.context.key)).toEqual(['b']);
  });

  it('appends on multi-select and toggles already-selected items', () => {
    service.select(item(first, 'a'));
    service.select(item(second, 'b'), true);

    expect(first.hasAttribute('s-selected')).toBe(true);
    expect(second.hasAttribute('s-selected')).toBe(true);
    expect(service.selected()).toHaveLength(2);

    service.select(item(second, 'b'), true);
    expect(second.hasAttribute('s-selected')).toBe(false);
    expect(service.selected().map((s) => s.context.key)).toEqual(['a']);
  });

  it('emits the selection-change event', () => {
    const emitted: string[][] = [];
    service.changes.subscribe((selection) => emitted.push(selection.map((s) => s.context.key)));

    service.select(item(first, 'a'));
    service.select(item(second, 'b'), true);
    service.clear();

    expect(emitted).toEqual([['a'], ['a', 'b'], []]);
  });
});
