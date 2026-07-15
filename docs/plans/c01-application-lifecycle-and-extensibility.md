# C01 — Application lifecycle and extensibility, via ATDD

## Problem

Implement capability C01 (`docs/specs/C01-application-lifecycle-and-extensibility.md`,
13 L2 requirements) on branch `capability/c01-application-lifecycle-and-extensibility`,
following the 8 detailed-design diagrams in
`docs/detailed-designs/C01-application-lifecycle-and-extensibility/` and using ATDD:
acceptance specs written first from the GIVEN/WHEN/THEN criteria, then implementation
until green.

## Current state

- `main.ts` calls `bootstrapApplication(App, appConfig)` directly — no lifecycle facade,
  no plugin installation, no start/destroy events, no headless mode, no asset path.
- `app.config.ts` wires providers + `provideAppInitializer` running the four baseline
  registration functions (views, inspector views, actions, toolbars).
- `app.routes.ts` already redirects `'' → browse` (half of 02.07).
- Wave 0 contracts give C01 the interfaces to expose: `TimeContext`, `UserService`,
  `NotificationService`, sanitizers, plus existing registries/gateways/services.
- C01-owned paths (ownership map): `core/src/lib/config/**`, `Cupola.Api/Program.cs`,
  and a new feature directory — `cupola/src/app/lifecycle/**`. (`main.ts` is unassigned;
  touching it is required to wire startup — noted as a gray area.)
- Backend `Program.cs` already provides BuildInfo/Branding — no backend change needed.

## Design (from the detailed-design diagrams)

New C01 feature directory `frontend/projects/cupola/src/app/lifecycle/`:

- **`cupola-plugin.ts`** — `type CupolaPlugin = (app: CupolaApplication) => void`
  (resolves the B18 plugin-function question for the frontend within C01-owned files).
- **`cupola-application.ts`** — the "cupola Shell" facade:
  - `constructor(options?: { appConfig?, rootComponent?, assetPath?, document? })` —
    defaults to the shipped `appConfig`/`App`.
  - `install(plugin)` — queues pre-start plugins; each invoked exactly once with the
    application instance during startup (diagram 01).
  - `start(target?: HTMLElement | string): Promise<void>` — defers until
    `DOMContentLoaded` when `readyState === 'loading'` (diagram 03); resolves mount
    target: element → use; selector → `querySelector`; none → create+append to body;
    invalid/unresolved → throw `Error` identifying the input (diagram 04). Uses
    `createApplication()` + `createComponent(..., { hostElement })` so the mount element
    is explicit. Emits `start` once after init completes.
  - `startHeadless(): Promise<void>` — `createApplication()` without component creation;
    starts router initial navigation; emits `start` (diagram 05).
  - `on/off('start' | 'destroy')` — minimal event emitter (02.06, 03.03).
  - `destroy()` — emits `destroy`, removes its window unload listener, destroys the
    `ApplicationRef`; also triggered by window unload (diagram 08).
  - `getAssetPath()` — normalizes one trailing slash; `/` when unconfigured (diagram 07).
  - Capability API accessors (01.02, diagram 02), injector-backed after startup: objects,
    composition (via ObjectsGateway), search, realtime/telemetry, time (`TimeContext`),
    user (`UserService`), notifications (`NotificationService`), actions, views,
    inspectorViews, toolbars, selection, theme, branding, routing (RouteEvents/UrlParams),
    config, `buildInfo` (01.05 via BrandingService), and `plugins` catalog (01.04).
  - Baseline plugins (01.03): the four existing registration functions run at startup —
    already in `appConfig`'s initializer; acceptance test asserts registries populated.
- **`plugin-catalog.ts`** — `cupolaPlugins` catalog object (01.04). Cupola ships no
  optional plugins yet, so the catalog exposes what exists (empty/minimal, documented);
  test asserts the catalog is exposed via `app.plugins`.
- **`cupola-config.ts`** (C01-owned core file) — add optional `assetPath?: string`.
- **`main.ts`** — rewire to `new CupolaApplication().start()`.

## Deliberate gaps (not invented, per user decisions / open contracts)

- 02.07 clock half deferred — blocked on open contract #5 (B05 clock surface). Acceptance
  test covers the route redirect only, with a comment tracing the deferral.
- 01.02: OMCT interfaces with no Cupola counterpart yet (status, fault, form*, overlay*,
  menu*, tooltip*, editor, indicator service, priority, type) are exposed only where a
  contract exists; the rest arrive with their owning capabilities. (*exist in
  @cupola/components; exposed via injector accessor.)
- 01.04: catalog exists but is sparsely populated until later waves ship optional plugins.

## ATDD flow

1. Author acceptance specs FIRST in `app/lifecycle/` — one file per L1 group:
   - `application-extensibility.acceptance.spec.ts` (L2-01.01…01.05)
   - `application-startup.acceptance.spec.ts` (L2-02.01…02.07, jsdom readyState/DOM
     manipulation; fake gateways + Wave 0 fakes as providers)
   - `host-integration.acceptance.spec.ts` (L2-03.01…03.03)
   Each `it` maps to one acceptance criterion, named with the requirement ID.
2. Run — all red (CupolaApplication absent).
3. Implement `cupola-plugin.ts`, `plugin-catalog.ts`, `cupola-application.ts`, config
   `assetPath`, `main.ts` wiring.
4. Iterate to green; then full gates: `npm test`, `ng build cupola` (and e2e if the
   environment has Playwright browsers — startup path changed).
5. Commit on the capability branch, push to origin.

## Todos

1. `c01-branch-checkout` — check out capability branch
2. `c01-acceptance-specs` — author failing acceptance specs from L2 criteria
3. `c01-implement-lifecycle` — plugin type, catalog, CupolaApplication, config assetPath
4. `c01-wire-main` — main.ts uses CupolaApplication
5. `c01-green-and-gates` — iterate to green; npm test + build (+ e2e if available)
6. `c01-commit-push` — commit on branch, push

## Notes

- Branch protocol (§5b): touch only C01 paths + the new lifecycle directory; `main.ts`
  is unassigned in the ownership map — minimal one-line wiring change, flagged in the
  commit message.
- No backend change; `Program.cs` already satisfies its C01 role.
- Do not modify skeleton-owned files other than C01-owned `config/**`.
