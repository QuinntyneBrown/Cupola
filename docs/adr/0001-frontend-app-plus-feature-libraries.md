# ADR 0001 — Frontend organized as an application plus feature libraries

- Status: Accepted
- Date: 2026-07-14
- Capability: C15 — User-interface shell

## Context

The Angular 21 workspace at `frontend/` began with no projects. C15 is the
first of sixteen capability specs (C01–C16) that will be built into this
workspace over time, so the initial layout sets a precedent that later
capabilities inherit.

## Decision

Generate one application project (`cupola`) and three workspace libraries
under `frontend/projects/`:

- `@cupola/core` — framework-agnostic models, gateway abstractions, and
  registries/services with no DOM-mounting of components.
- `@cupola/components` — reusable `.cp-*` UI primitives and the services
  that mount them (menus, overlays, forms, tooltips, tree, splitter).
- `@cupola/api` — HTTP and SignalR gateway implementations plus the e2e
  fake realtime gateway.

Dependency direction is `api → core`, `components → core`, `cupola → all`.
TypeScript path mappings point at each library's `src/public-api.ts` source
so the app and Jest build against sources without a pre-build step.

## Consequences

- Boundaries are enforced by the dependency direction; core cannot depend on
  Angular components or the API layer.
- Later capabilities add feature folders to `cupola` and shared primitives to
  `components` without restructuring.
- Building against library sources keeps the edit/test loop fast at the cost
  of not exercising the packaged `ng-packagr` output during development.
