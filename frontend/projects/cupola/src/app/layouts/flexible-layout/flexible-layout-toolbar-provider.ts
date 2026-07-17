import { SelectedItem, ToolbarControl, ToolbarProvider } from '@cupola/core';

import { LayoutEditService } from '../layout-edit.service';

/**
 * Edit toolbar for flexible layouts (OMCT-C09-L2-02.02): an Edit toggle in
 * browse; add-container / remove-frame / remove-container / orientation
 * controls while editing, each persisting immediately through the view.
 */
export class FlexibleLayoutToolbarProvider implements ToolbarProvider {
  readonly key = 'flexible-layout';

  constructor(private readonly edits: LayoutEditService) {}

  forSelection(selection: SelectedItem[]): boolean {
    const context = selection[0]?.context;
    return (
      context?.object?.type === 'flexible-layout' &&
      (context.type === 'object' || context.type === 'flexible-frame')
    );
  }

  toolbar(selection: SelectedItem[]): ToolbarControl[] {
    const object = selection[0]?.context.object;
    if (!object) {
      return [];
    }
    const keyString = object.keyString;
    if (!this.edits.isEditing(keyString)) {
      return [
        {
          key: 'flexible.edit',
          glyph: 'i-pencil',
          label: 'Edit layout',
          onActivate: () => this.edits.beginEdit(keyString),
        },
      ];
    }
    const session = this.edits.session(keyString);
    if (!session) {
      return [];
    }
    const controls: ToolbarControl[] = [
      {
        key: 'flexible.add-container',
        glyph: 'i-plus',
        label: 'Add container',
        onActivate: () => session.addContainer?.(),
      },
      {
        key: 'flexible.remove-container',
        glyph: 'i-minus',
        label: 'Remove container',
        onActivate: () => session.removeContainer?.(),
      },
      {
        key: 'flexible.orientation',
        glyph: 'i-columns',
        label: 'Toggle orientation',
        onActivate: () => session.toggleOrientation?.(),
      },
    ];
    if (session.selectedItemIds().length > 0) {
      controls.push({
        key: 'flexible.remove-frame',
        glyph: 'i-trash',
        label: 'Remove frame',
        onActivate: () => session.removeFrame?.(),
      });
    }
    controls.push({
      key: 'flexible.done',
      glyph: 'i-check',
      label: 'Done editing',
      onActivate: () => void session.save(),
    });
    return controls;
  }
}
