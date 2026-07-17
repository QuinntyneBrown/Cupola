import { EnvironmentInjector, inject } from '@angular/core';
import {
  ActionRegistry,
  DomainObject,
  InspectorViewRegistry,
  ToolbarRegistry,
  TypeRegistry,
  ViewRegistry,
} from '@cupola/core';

import { FolderListViewProvider } from '../views/folder/folder-list-view-provider';
import { CopyToClipboardAction } from './actions/copy-to-clipboard-action';
import { DisplayLayoutToolbarProvider } from './display-layout/display-layout-toolbar-provider';
import { DisplayLayoutViewProvider } from './display-layout/display-layout-view-provider';
import { emptyLayoutConfiguration } from './display-layout/layout-model';
import { FlexibleLayoutToolbarProvider } from './flexible-layout/flexible-layout-toolbar-provider';
import { FlexibleLayoutViewProvider } from './flexible-layout/flexible-layout-view-provider';
import { emptyFlexibleConfiguration } from './flexible-layout/flexible-model';
import { HyperlinkViewProvider } from './hyperlink/hyperlink-view-provider';
import { LinkOptionsInspectorViewProvider } from './inspector/link-options-inspector-view-provider';
import { LayoutClipboardService } from './layout-clipboard.service';
import { LayoutEditService } from './layout-edit.service';
import { TabsViewProvider } from './tabs/tabs-view-provider';
import { WebPageViewProvider } from './web-page/web-page-view-provider';

function setConfiguration(object: DomainObject, configuration: Record<string, unknown>): void {
  object.configuration = { ...object.configuration, ...configuration };
}

/**
 * Registers C09 layout and embedded-content contributions: the display-layout,
 * flexible-layout, tabs, hyperlink, and web-page types with default
 * configuration; their object views; the layout edit toolbars; the folder list
 * view beside the existing grid; the link-options inspector; and the layout
 * clipboard action. Must run inside an injection context (the app initializer).
 *
 * Requirements: OMCT-C09-L2-01.01–01.05, 02.01–02.03, 03.01–03.04, 04.01–04.03.
 */
export function registerLayouts(): void {
  const types = inject(TypeRegistry);
  types.register({
    key: 'layout',
    name: 'Display Layout',
    glyph: 'i-layout',
    description: 'An editable canvas that positions and styles composed object views.',
    creatable: true,
    initialize: (object) => setConfiguration(object, { layout: emptyLayoutConfiguration() }),
  });
  types.register({
    key: 'flexible-layout',
    name: 'Flexible Layout',
    glyph: 'i-columns',
    description: 'Resizable pane containers hosting composed object views.',
    creatable: true,
    initialize: (object) => setConfiguration(object, { flexible: emptyFlexibleConfiguration() }),
  });
  types.register({
    key: 'tabs',
    name: 'Tabs View',
    glyph: 'i-tabs',
    description: 'Presents each composed object behind its own selectable tab.',
    creatable: true,
    initialize: (object) => setConfiguration(object, { tabs: {} }),
  });
  types.register({
    key: 'hyperlink',
    name: 'Hyperlink',
    glyph: 'i-link',
    description: 'A configured web destination presented as a text link or button.',
    creatable: true,
    initialize: (object) => setConfiguration(object, { hyperlink: { displayFormat: 'link', target: 'current' } }),
  });
  types.register({
    key: 'web-page',
    name: 'Web Page',
    glyph: 'i-link',
    description: 'Embeds a configured web page in a dedicated object view.',
    creatable: true,
    initialize: (object) => setConfiguration(object, { webPage: {} }),
  });

  const injector = inject(EnvironmentInjector);
  const views = inject(ViewRegistry);
  views.register(new DisplayLayoutViewProvider(injector));
  views.register(new FlexibleLayoutViewProvider(injector));
  views.register(new TabsViewProvider(injector));
  views.register(new HyperlinkViewProvider(injector));
  views.register(new WebPageViewProvider(injector));
  views.register(new FolderListViewProvider(injector));

  const edits = inject(LayoutEditService);
  const clipboard = inject(LayoutClipboardService);
  const toolbars = inject(ToolbarRegistry);
  toolbars.register(new DisplayLayoutToolbarProvider(edits, clipboard));
  toolbars.register(new FlexibleLayoutToolbarProvider(edits));

  inject(InspectorViewRegistry).register(new LinkOptionsInspectorViewProvider(injector));
  inject(ActionRegistry).register(new CopyToClipboardAction(edits, clipboard));
}
