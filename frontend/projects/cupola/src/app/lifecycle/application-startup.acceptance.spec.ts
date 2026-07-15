import { routes } from '../app.routes';
import { CupolaApplication } from './cupola-application';
import { buildTestAppConfig, TestRootComponent } from './testing/test-bootstrap-support';

/** Overrides `document.readyState` for the duration of one test. */
function setReadyState(state: DocumentReadyState): () => void {
  Object.defineProperty(document, 'readyState', { value: state, configurable: true });
  return () => {
    delete (document as { readyState?: DocumentReadyState }).readyState;
  };
}

describe('OMCT-C01-L2-02.01 Deferred browser startup', () => {
  it('bootstraps once, after DOMContentLoaded, when the document is still loading', async () => {
    const restoreReadyState = setReadyState('loading');
    const app = new CupolaApplication({
      appConfig: buildTestAppConfig(),
      rootComponent: TestRootComponent,
    });

    let started = false;
    app.on('start', () => {
      started = true;
    });

    const startPromise = app.start();

    // Startup is deferred: it has not resolved before DOMContentLoaded fires.
    expect(started).toBe(false);

    document.dispatchEvent(new Event('DOMContentLoaded'));
    restoreReadyState();

    await startPromise;

    expect(started).toBe(true);

    app.destroy();
    document.body.lastElementChild?.remove();
  });
});

describe('OMCT-C01-L2-02.02 Explicit mount target', () => {
  it('mounts the application layout in a supplied HTMLElement', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const app = new CupolaApplication({
      appConfig: buildTestAppConfig(),
      rootComponent: TestRootComponent,
    });

    await app.start(host);

    expect(host.textContent).toContain('cupola test shell');

    app.destroy();
    host.remove();
  });

  it('mounts the application layout in the element resolved by a selector', async () => {
    const host = document.createElement('div');
    host.id = 'cupola-mount-target';
    document.body.appendChild(host);
    const app = new CupolaApplication({
      appConfig: buildTestAppConfig(),
      rootComponent: TestRootComponent,
    });

    await app.start('#cupola-mount-target');

    expect(host.textContent).toContain('cupola test shell');

    app.destroy();
    host.remove();
  });
});

describe('OMCT-C01-L2-02.03 Implicit mount target', () => {
  it('appends a mount element to the document body and uses it when no target is supplied', async () => {
    const bodyChildCountBefore = document.body.childElementCount;
    const app = new CupolaApplication({
      appConfig: buildTestAppConfig(),
      rootComponent: TestRootComponent,
    });

    await app.start();

    expect(document.body.childElementCount).toBe(bodyChildCountBefore + 1);
    expect(document.body.textContent).toContain('cupola test shell');

    app.destroy();
    document.body.lastElementChild?.remove();
  });
});

describe('OMCT-C01-L2-02.04 Invalid mount target rejection', () => {
  it('throws an error identifying the input when a selector has no matching element', async () => {
    const app = new CupolaApplication({
      appConfig: buildTestAppConfig(),
      rootComponent: TestRootComponent,
    });

    await expect(app.start('#does-not-exist')).rejects.toThrow(/does-not-exist/);
  });

  it('throws an error identifying the input when the target value is unsupported', async () => {
    const app = new CupolaApplication({
      appConfig: buildTestAppConfig(),
      rootComponent: TestRootComponent,
    });

    await expect(app.start(42 as unknown as HTMLElement)).rejects.toThrow(Error);
  });
});

describe('OMCT-C01-L2-02.05 Headless startup', () => {
  it('starts routing and emits start without mounting the visible layout', async () => {
    const bodyChildCountBefore = document.body.childElementCount;
    const app = new CupolaApplication({ appConfig: buildTestAppConfig() });

    let started = false;
    app.on('start', () => {
      started = true;
    });

    await app.startHeadless();

    expect(started).toBe(true);
    expect(document.body.childElementCount).toBe(bodyChildCountBefore);
    expect(app.routeEvents).toBeDefined();

    app.destroy();
  });
});

describe('OMCT-C01-L2-02.06 Startup event', () => {
  it('emits exactly one start event after rendered startup completes', async () => {
    const app = new CupolaApplication({
      appConfig: buildTestAppConfig(),
      rootComponent: TestRootComponent,
    });
    const listener = jest.fn();
    app.on('start', listener);

    await app.start();

    expect(listener).toHaveBeenCalledTimes(1);

    app.destroy();
    document.body.lastElementChild?.remove();
  });

  it('emits exactly one start event after headless startup completes', async () => {
    const app = new CupolaApplication({ appConfig: buildTestAppConfig() });
    const listener = jest.fn();
    app.on('start', listener);

    await app.startHeadless();

    expect(listener).toHaveBeenCalledTimes(1);

    app.destroy();
  });
});

// OMCT-C01-L2-02.07 requires both an active default clock and a redirect to
// `/browse/`. The clock half is deferred: the B05 TimeContext contract
// (docs/capability-contracts/cross-capability-contracts.md, open contract
// #5) has no clock-activation surface yet, so there is no default clock to
// activate. Only the route-redirect half is implemented and tested here,
// per the decision recorded in docs/plans/c01-application-lifecycle-and-extensibility.md.
describe('OMCT-C01-L2-02.07 Initial route (clock activation deferred)', () => {
  it('redirects the root route to browse', () => {
    const rootRedirect = routes.find((route) => route.path === '');

    expect(rootRedirect?.redirectTo).toBe('browse');
    expect(rootRedirect?.pathMatch).toBe('full');
  });

  it('activates the browse route after headless startup navigates the initial route', async () => {
    const app = new CupolaApplication({ appConfig: buildTestAppConfig() });

    await app.startHeadless();

    expect(app.routeEvents.path()).toBe('/browse');

    app.destroy();
  });
});
