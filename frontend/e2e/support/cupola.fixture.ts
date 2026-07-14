import { test as base } from '@playwright/test';

import { AboutDialogPage } from '../pages/about-dialog.page';
import { AppShellPage } from '../pages/app-shell.page';
import { ContextMenuPage } from '../pages/context-menu.page';
import { FormDialogPage } from '../pages/form-dialog.page';
import { GrandSearchPage } from '../pages/grand-search.page';
import { InspectorPage } from '../pages/inspector.page';
import { ObjectViewPage } from '../pages/object-view.page';
import { OverlayPage } from '../pages/overlay.page';
import { TreePage } from '../pages/tree.page';
import { FakeBackend } from './fake-backend';
import { RealtimeDriver } from './realtime-driver';

interface CupolaFixtures {
  fakeBackend: FakeBackend;
  realtime: RealtimeDriver;
  shell: AppShellPage;
  tree: TreePage;
  objectView: ObjectViewPage;
  inspector: InspectorPage;
  overlay: OverlayPage;
  contextMenu: ContextMenuPage;
  formDialog: FormDialogPage;
  grandSearch: GrandSearchPage;
  aboutDialog: AboutDialogPage;
}

/**
 * Base test for all Cupola acceptance tests: the backend REST API is faked
 * via route interception before every test, and simulated realtime events
 * are available through the `realtime` driver.
 */
export const test = base.extend<CupolaFixtures>({
  fakeBackend: [
    async ({ page }, use) => {
      const backend = new FakeBackend();
      await backend.install(page);
      await use(backend);
    },
    { auto: true },
  ],
  realtime: async ({ page }, use) => {
    await use(new RealtimeDriver(page));
  },
  shell: async ({ page }, use) => {
    await use(new AppShellPage(page));
  },
  tree: async ({ page }, use) => {
    await use(new TreePage(page));
  },
  objectView: async ({ page }, use) => {
    await use(new ObjectViewPage(page));
  },
  inspector: async ({ page }, use) => {
    await use(new InspectorPage(page));
  },
  overlay: async ({ page }, use) => {
    await use(new OverlayPage(page));
  },
  contextMenu: async ({ page }, use) => {
    await use(new ContextMenuPage(page));
  },
  formDialog: async ({ page }, use) => {
    await use(new FormDialogPage(page));
  },
  grandSearch: async ({ page }, use) => {
    await use(new GrandSearchPage(page));
  },
  aboutDialog: async ({ page }, use) => {
    await use(new AboutDialogPage(page));
  },
});

export const expect = test.expect;
