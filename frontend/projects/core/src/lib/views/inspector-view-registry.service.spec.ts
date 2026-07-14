import { InspectorViewProvider } from './inspector-view-provider';
import { InspectorViewRegistry } from './inspector-view-registry.service';
import { SelectedItem } from '../selection/selected-item';

function inspectorProvider(
  key: string,
  glyph: string,
  priority: number,
  canView: boolean,
): InspectorViewProvider {
  return {
    key,
    name: key,
    glyph,
    priority,
    canView: () => canView,
    view: () => ({ show: () => {}, destroy: () => {} }),
  };
}

describe('OMCT-C15-L2-02.03 InspectorViewRegistry', () => {
  const selection: SelectedItem[] = [
    { element: document.createElement('div'), context: { key: 'k' } },
  ];

  it('returns applicable inspector views in descending priority with key, name, and glyph', () => {
    const registry = new InspectorViewRegistry();
    registry.register(inspectorProvider('properties', 'i-info', 100, true));
    registry.register(inspectorProvider('annotations', 'i-flag', 40, true));
    registry.register(inspectorProvider('elements', 'i-layers', 80, false));

    const views = registry.applicableViews(selection);

    expect(views.map((v) => v.key)).toEqual(['properties', 'annotations']);
    expect(views[0]).toMatchObject({ key: 'properties', name: 'properties', glyph: 'i-info' });
  });
});
