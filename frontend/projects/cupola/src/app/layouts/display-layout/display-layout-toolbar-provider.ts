import { SelectedItem, ToolbarControl, ToolbarProvider } from '@cupola/core';

import { LayoutClipboardService } from '../layout-clipboard.service';
import { LayoutEditService } from '../layout-edit.service';

/**
 * Edit toolbar for display layouts (OMCT-C09-L2-01.03, 01.05): an Edit toggle
 * in browse, and geometry/clipboard/commit controls while editing. Reads the
 * edit-service signals inside `toolbar()` so the shell toolbar re-renders on
 * edit-state changes.
 */
export class DisplayLayoutToolbarProvider implements ToolbarProvider {
  readonly key = 'display-layout';

  constructor(
    private readonly edits: LayoutEditService,
    private readonly clipboard: LayoutClipboardService,
  ) {}

  forSelection(selection: SelectedItem[]): boolean {
    const context = selection[0]?.context;
    return (
      context?.object?.type === 'layout' &&
      (context.type === 'object' || context.type === 'layout-item')
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
          key: 'layout.edit',
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
    const selectionSize = session.selectedItemIds().length;
    const controls: ToolbarControl[] = [];

    if (selectionSize >= 2) {
      controls.push(
        control('layout.align-left', 'i-arrow-up', 'Align left', () => session.align?.('left')),
        control('layout.align-right', 'i-arrow-down', 'Align right', () => session.align?.('right')),
        control('layout.align-top', 'i-arrow-up', 'Align top', () => session.align?.('top')),
        control('layout.align-bottom', 'i-arrow-down', 'Align bottom', () =>
          session.align?.('bottom'),
        ),
      );
    }
    if (selectionSize >= 3) {
      controls.push(
        control('layout.distribute-h', 'i-columns', 'Distribute horizontally', () =>
          session.distribute?.('horizontal'),
        ),
        control('layout.distribute-v', 'i-list', 'Distribute vertically', () =>
          session.distribute?.('vertical'),
        ),
      );
    }
    if (selectionSize >= 1) {
      controls.push(
        control('layout.forward', 'i-arrow-up', 'Bring forward', () =>
          session.reorderStack?.('forward'),
        ),
        control('layout.backward', 'i-arrow-down', 'Send backward', () =>
          session.reorderStack?.('backward'),
        ),
        control('layout.copy', 'i-copy', 'Copy items', () => session.copy?.()),
      );
    }
    if (this.clipboard.hasContent()) {
      controls.push(control('layout.paste', 'i-copy', 'Paste items', () => session.paste?.()));
    }
    controls.push(
      control('layout.save', 'i-check', 'Save layout', () => void session.save()),
      control('layout.cancel', 'i-close', 'Cancel edit', () => session.cancel()),
    );
    return controls;
  }
}

function control(key: string, glyph: string, label: string, onActivate: () => void): ToolbarControl {
  return { key, glyph, label, onActivate };
}
