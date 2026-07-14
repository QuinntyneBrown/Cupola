# Cupola design-system mocks

Static HTML mocks of the complete frontend design system for Cupola — the dark-theme
("Console") visual contract for the Angular implementation (Angular 17.2.2,
Angular Material 17, Angular CDK, chart.js, angular-gridster2).

Open [`index.html`](index.html) in a browser; no build step or server is required.
Pages work over `file://`; the IBM Plex webfonts load from Google Fonts when online
and fall back to system faces offline.

## Contents

| Area | Pages |
|---|---|
| Foundations | color, typography, spacing, elevation, iconography, motion |
| Components | buttons, form-controls, menus, toolbars-tabs, tree, tables, overlays, indicators, cards-panels |
| Patterns | shell, time-conductor, plots, dashboard, gauges, imagery, timeline, notebook |

## Shared assets

- `assets/tokens.css` — the authoritative design tokens (color, type, spacing,
  shape, elevation, motion, z-index). The Angular theme consumes these values.
- `assets/components.css` — reference implementation of every reusable element
  (`.cp-*` classes).
- `assets/docs.css` — documentation-site chrome only (`.ds-*` classes); not part
  of the product design system.
- `assets/docs.js` — injects the SVG icon sprite, renders the shared nav, and
  runs the masthead UTC clock. No external dependencies.

## Conventions

- Every component section lists the `OMCT-Cxx-L2-nn.nn` requirement identifiers
  it covers, tracing back to [`docs/specs`](../../specs/README.md).
- Status colors (ok / caution / critical) are reserved for limit and health
  semantics; edit mode is violet; selection and interaction are cyan.
- All telemetry values, timestamps, and identifiers render in IBM Plex Mono.
- The chart palette (`--cp-chart-1…8`) was validated for color-vision-deficiency
  separation and contrast against the dark surface; slots are assigned in fixed
  order and never cycled.
- Contrast: text tokens hold ≥ 4.5:1 on every surface they may occupy
  (disabled ink is intentionally exempt); status fills carry dark ink at ≥ 5.5:1.
