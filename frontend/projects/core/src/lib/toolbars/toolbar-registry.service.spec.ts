import { ToolbarControl } from './toolbar-control';
import { ToolbarProvider } from './toolbar-provider';
import { ToolbarRegistry } from './toolbar-registry.service';
import { SelectedItem } from '../selection/selected-item';

function control(key: string): ToolbarControl {
  return { key, glyph: 'i-gear', label: key, onActivate: () => {} };
}

function provider(key: string, applies: boolean, controls: ToolbarControl[]): ToolbarProvider {
  return {
    key,
    forSelection: () => applies,
    toolbar: () => controls,
  };
}

describe('OMCT-C15-L2-03.05 ToolbarRegistry', () => {
  const selection: SelectedItem[] = [
    { element: document.createElement('div'), context: { key: 'k' } },
  ];

  it('concatenates controls from each provider whose selection predicate is true', () => {
    const registry = new ToolbarRegistry();
    registry.register(provider('a', true, [control('a1'), control('a2')]));
    registry.register(provider('b', false, [control('b1')]));
    registry.register(provider('c', true, [control('c1')]));

    const controls = registry.getStructure(selection);

    expect(controls.map((c) => c.key)).toEqual(['a1', 'a2', 'c1']);
  });
});
