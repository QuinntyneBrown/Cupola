import {
  ApplicationConfig,
  ApplicationRef,
  EnvironmentInjector,
  Signal,
  Type,
  createComponent,
} from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { Router } from '@angular/router';
import {
  ActionRegistry,
  BrandingService,
  BuildInfo,
  CUPOLA_CONFIG,
  CupolaConfig,
  InspectorViewRegistry,
  NotificationService,
  ObjectsGateway,
  RealtimeGateway,
  RouteEventsService,
  SearchGateway,
  SelectionService,
  ThemeService,
  TimeContext,
  ToolbarRegistry,
  UrlParamsService,
  UserService,
  ViewRegistry,
} from '@cupola/core';

import { App } from '../app';
import { appConfig as defaultAppConfig } from '../app.config';
import { CupolaPlugin } from './cupola-plugin';
import { cupolaPlugins } from './plugin-catalog';

/** Lifecycle events emitted by {@link CupolaApplication}. */
export type CupolaLifecycleEvent = 'start' | 'destroy';

/** Constructor options for {@link CupolaApplication}. */
export interface CupolaApplicationOptions {
  /** Providers used to bootstrap the application. Defaults to the shipped `appConfig`. */
  appConfig?: ApplicationConfig;
  /** Root component mounted for rendered startup. Defaults to the shipped `App`. */
  rootComponent?: Type<unknown>;
  /** Configured asset path. Requirements: OMCT-C01-L2-03.01, OMCT-C01-L2-03.02. */
  assetPath?: string;
  /** Document used to resolve readiness and mount targets. Defaults to the global `document`. */
  document?: Document;
  /** Window used to register the unload listener. Defaults to the global `window`. */
  window?: Window;
}

/**
 * Cupola's configurable application shell. Requirement: OMCT-C01-L1-01 —
 * a configurable application instance whose capabilities can be extended
 * before startup — and OMCT-C01-L1-02/OMCT-C01-L1-03 — controlled
 * rendered/headless startup and a host integration lifecycle.
 *
 * The capability API accessors below (OMCT-C01-L2-01.02) and the baseline
 * plugin registration they expose (OMCT-C01-L2-01.03) are backed by an
 * Angular `EnvironmentInjector`. Unlike the ported OMCT design — where the
 * application constructor synchronously initializes every interface — this
 * injector comes into existence only once `start()`/`startHeadless()`
 * resolves, because Angular's dependency-injection container is built
 * asynchronously. "A newly constructed application instance" therefore
 * maps, in this architecture, onto an instance whose startup sequence has
 * completed.
 */
export class CupolaApplication {
  private readonly document: Document;
  private readonly window: Window;
  private readonly appConfig: ApplicationConfig;
  private readonly rootComponent: Type<unknown>;
  private readonly assetPathOption?: string;

  private appRef: ApplicationRef | null = null;
  private unloadListener: (() => void) | null = null;
  private readonly listeners: Record<CupolaLifecycleEvent, Set<() => void>> = {
    start: new Set(),
    destroy: new Set(),
  };

  /** Published catalog of shipped optional plugins. Requirement: OMCT-C01-L2-01.04. */
  readonly plugins = cupolaPlugins;

  constructor(options: CupolaApplicationOptions = {}) {
    this.document = options.document ?? document;
    this.window = options.window ?? window;
    this.appConfig = options.appConfig ?? defaultAppConfig;
    this.rootComponent = options.rootComponent ?? App;
    this.assetPathOption = options.assetPath;
  }

  /**
   * Installs a plugin, invoking it once with this application instance.
   * Requirement: OMCT-C01-L2-01.01.
   */
  install(plugin: CupolaPlugin): this {
    plugin(this);
    return this;
  }

  /**
   * Renders the application layout. Defers bootstrap until
   * `DOMContentLoaded` when the document is still loading
   * (OMCT-C01-L2-02.01), resolves the mount target (OMCT-C01-L2-02.02,
   * OMCT-C01-L2-02.03, OMCT-C01-L2-02.04), then emits `start`
   * (OMCT-C01-L2-02.06) once initialization completes.
   */
  async start(target?: HTMLElement | string): Promise<void> {
    await this.waitForDomReady();
    const hostElement = this.resolveMountTarget(target);
    this.appRef = await createApplication(this.appConfig);
    const componentRef = createComponent(this.rootComponent, {
      environmentInjector: this.appRef.injector,
      hostElement,
    });
    this.appRef.attachView(componentRef.hostView);
    await this.completeStartup();
  }

  /**
   * Initializes services and routing without mounting the visible
   * layout. Requirement: OMCT-C01-L2-02.05.
   */
  async startHeadless(): Promise<void> {
    this.appRef = await createApplication(this.appConfig);
    await this.completeStartup();
  }

  /** Registers a listener for `start` or `destroy`. */
  on(event: CupolaLifecycleEvent, handler: () => void): void {
    this.listeners[event].add(handler);
  }

  /** Removes a previously registered listener. */
  off(event: CupolaLifecycleEvent, handler: () => void): void {
    this.listeners[event].delete(handler);
  }

  /**
   * Destroys the application: emits `destroy`, removes the unload
   * listener, and tears down the underlying Angular application.
   * Requirement: OMCT-C01-L2-03.03.
   */
  destroy(): void {
    if (!this.appRef) {
      return;
    }
    this.emit('destroy');
    if (this.unloadListener) {
      this.window.removeEventListener('beforeunload', this.unloadListener);
      this.unloadListener = null;
    }
    this.appRef.destroy();
    this.appRef = null;
  }

  /**
   * Returns the configured asset path, normalized with exactly one
   * trailing slash, or `/` when no path has been configured.
   * Requirements: OMCT-C01-L2-03.01, OMCT-C01-L2-03.02.
   */
  getAssetPath(): string {
    const raw = this.assetPathOption;
    if (!raw) {
      return '/';
    }
    return raw.endsWith('/') ? raw : `${raw}/`;
  }

  // Capability API accessors — OMCT-C01-L2-01.02.

  get objects(): ObjectsGateway {
    return this.injector.get(ObjectsGateway);
  }

  get search(): SearchGateway {
    return this.injector.get(SearchGateway);
  }

  get realtime(): RealtimeGateway {
    return this.injector.get(RealtimeGateway);
  }

  get time(): TimeContext {
    return this.injector.get(TimeContext);
  }

  get user(): UserService {
    return this.injector.get(UserService);
  }

  get notifications(): NotificationService {
    return this.injector.get(NotificationService);
  }

  get actions(): ActionRegistry {
    return this.injector.get(ActionRegistry);
  }

  get views(): ViewRegistry {
    return this.injector.get(ViewRegistry);
  }

  get inspectorViews(): InspectorViewRegistry {
    return this.injector.get(InspectorViewRegistry);
  }

  get toolbars(): ToolbarRegistry {
    return this.injector.get(ToolbarRegistry);
  }

  get selection(): SelectionService {
    return this.injector.get(SelectionService);
  }

  get theme(): ThemeService {
    return this.injector.get(ThemeService);
  }

  get branding(): BrandingService {
    return this.injector.get(BrandingService);
  }

  get routeEvents(): RouteEventsService {
    return this.injector.get(RouteEventsService);
  }

  get urlParams(): UrlParamsService {
    return this.injector.get(UrlParamsService);
  }

  get config(): CupolaConfig {
    return this.injector.get(CUPOLA_CONFIG);
  }

  /** Build identification. Requirement: OMCT-C01-L2-01.05. */
  get buildInfo(): Signal<BuildInfo | null> {
    return this.branding.buildInfo;
  }

  private get injector(): EnvironmentInjector {
    if (!this.appRef) {
      throw new Error('Cupola: the application has not started.');
    }
    return this.appRef.injector;
  }

  private async completeStartup(): Promise<void> {
    await this.runInitialNavigation();
    this.registerUnloadListener();
    this.emit('start');
  }

  /**
   * Triggers the router's initial navigation and redirect to `/browse/`.
   * `createApplication`/`createComponent` do not bootstrap a root
   * component through `ApplicationRef.bootstrap()`, so the router's
   * usual auto-navigation on bootstrap never fires; the shell performs it
   * explicitly instead. Requirement: OMCT-C01-L2-02.07 (route half only —
   * see the acceptance spec for the deferred clock-activation half).
   */
  private async runInitialNavigation(): Promise<void> {
    const router = this.injector.get(Router, null);
    if (!router) {
      return;
    }
    // Warm up the routing capability accessors before navigating so their
    // subscriptions are live for the initial navigation event.
    this.injector.get(RouteEventsService, null);
    this.injector.get(UrlParamsService, null);
    router.initialNavigation();
    await this.appRef!.whenStable();
  }

  private registerUnloadListener(): void {
    this.unloadListener = () => this.destroy();
    this.window.addEventListener('beforeunload', this.unloadListener);
  }

  private emit(event: CupolaLifecycleEvent): void {
    for (const handler of this.listeners[event]) {
      handler();
    }
  }

  private async waitForDomReady(): Promise<void> {
    if (this.document.readyState !== 'loading') {
      return;
    }
    await new Promise<void>((resolve) => {
      this.document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
    });
  }

  private resolveMountTarget(target?: HTMLElement | string): HTMLElement {
    if (target === undefined) {
      const mount = this.document.createElement('div');
      this.document.body.appendChild(mount);
      return mount;
    }
    if (typeof target === 'string') {
      const found = this.document.querySelector(target);
      if (!found) {
        throw new Error(`Cupola: mount selector "${target}" did not resolve to an element.`);
      }
      return found as HTMLElement;
    }
    if (!(target instanceof HTMLElement)) {
      throw new Error('Cupola: the mount target must be an HTMLElement or a selector string.');
    }
    return target;
  }
}
