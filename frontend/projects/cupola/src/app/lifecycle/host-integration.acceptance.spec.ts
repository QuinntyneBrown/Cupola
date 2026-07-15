import { CupolaApplication } from './cupola-application';
import { buildTestAppConfig, TestRootComponent } from './testing/test-bootstrap-support';

describe('OMCT-C01-L2-03.01 Asset-path normalization', () => {
  it('returns the configured path unchanged when it already has a trailing slash', () => {
    const app = new CupolaApplication({ appConfig: buildTestAppConfig(), assetPath: '/dist/' });

    expect(app.getAssetPath()).toBe('/dist/');
  });

  it('appends exactly one trailing slash when the configured path has none', () => {
    const app = new CupolaApplication({ appConfig: buildTestAppConfig(), assetPath: '/dist' });

    expect(app.getAssetPath()).toBe('/dist/');
  });
});

describe('OMCT-C01-L2-03.02 Default asset path', () => {
  it('returns / when no asset path has been configured', () => {
    const app = new CupolaApplication({ appConfig: buildTestAppConfig() });

    expect(app.getAssetPath()).toBe('/');
  });
});

describe('OMCT-C01-L2-03.03 Teardown notification', () => {
  it('emits destroy and removes its unload listener when the host destroys the application', async () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const app = new CupolaApplication({ appConfig: buildTestAppConfig() });
    const destroyListener = jest.fn();
    app.on('destroy', destroyListener);

    await app.startHeadless();

    const [, unloadHandler] = addEventListenerSpy.mock.calls.find(([type]) => type === 'beforeunload')!;

    app.destroy();

    expect(destroyListener).toHaveBeenCalledTimes(1);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', unloadHandler);

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('emits destroy and removes its unload listener when the browser unloads the application', async () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const app = new CupolaApplication({
      appConfig: buildTestAppConfig(),
      rootComponent: TestRootComponent,
    });
    const destroyListener = jest.fn();
    app.on('destroy', destroyListener);

    await app.start();

    window.dispatchEvent(new Event('beforeunload'));

    expect(destroyListener).toHaveBeenCalledTimes(1);
    expect(removeEventListenerSpy).toHaveBeenCalled();

    removeEventListenerSpy.mockRestore();
    document.body.lastElementChild?.remove();
  });
});
