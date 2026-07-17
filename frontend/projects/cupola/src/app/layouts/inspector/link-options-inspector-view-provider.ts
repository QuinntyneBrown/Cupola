import { EnvironmentInjector } from '@angular/core';
import { CupolaView, InspectorViewProvider, SelectedItem } from '@cupola/core';
import { componentView } from '@cupola/components';

import { LinkOptionsInspectorViewComponent } from './link-options-inspector-view.component';

/** Link options inspector — hyperlink and web-page configuration authoring. */
export class LinkOptionsInspectorViewProvider implements InspectorViewProvider {
  readonly key = 'link-options';
  readonly name = 'Link';
  readonly glyph = 'i-link';
  readonly priority = 60;

  constructor(private readonly environmentInjector: EnvironmentInjector) {}

  canView(selection: SelectedItem[]): boolean {
    const type = selection[0]?.context.object?.type;
    return type === 'hyperlink' || type === 'web-page';
  }

  view(selection: SelectedItem[]): CupolaView {
    return componentView(this.environmentInjector, LinkOptionsInspectorViewComponent, {
      selection,
    });
  }
}
