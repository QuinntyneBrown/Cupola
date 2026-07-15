# C15 — User-interface shell, ATDD conformance audit

## Problem

Capability C15 (`docs/specs/C15-user-interface-shell.md`, **26 L2 requirements** across five L1s)
was implemented and merged to `main` in an earlier wave. This document is a **verification pass**,
not a re-implementation: it maps every `OMCT-C15-L2-*` requirement to its covering test(s),
confirms the suite is green, and records that no gaps were found. It rides on the combined
`capability/c02-domain-objects-composition-and-discovery` branch per the one-branch decision for
this effort. `frontend/e2e/**` is C16-owned, so this audit verifies the existing Playwright suites
rather than adding new ones.

## Method

Every L2 identifier was traced across the three test tiers: Playwright ATs
(`e2e/tests/c15-0N-*.spec.ts`, title + `requirement` annotation), Jest specs (describe titles), and
NUnit backend tests (`[Requirement]`). Requirements with a purely programmatic contract (registry
ordering, collection state, control registration) are Jest-only by the house traceability
convention; all others carry a Playwright AT.

## Conformance

| L2 | Requirement | Playwright AT | Programmatic / backend coverage | Status |
| --- | --- | --- | --- | --- |
| 01.01 | Hash route dispatch | c15-01 | `routing/route-events.service`, `routing/abort-registry` | ✅ |
| 01.02 | Search-parameter synchronization | c15-01 | `routing/url-params.service` | ✅ |
| 01.03 | Browse path resolution | c15-01 | `browse.resolver`, `view-host`, `browse-state`; be `ObjectsEndpoint`, `ObjectUpdateHub`, `Identifier` | ✅ |
| 01.04 | Root browse redirect | c15-01 | `browse.resolver`; be `CompositionEndpoint`, `ObjectStoreComposition`, `SeedData` | ✅ |
| 01.05 | Selection state | c15-01 | `selection.service`, `selectable.directive` | ✅ |
| 02.01 | Object-view applicability | c15-02 | `views/view-registry.service`, `view-host` | ✅ |
| 02.02 | View lifecycle wrapping | — (Jest-only) | `views/view-registry.service` | ✅ |
| 02.03 | Inspector-view applicability | c15-02 | `views/inspector-view-registry.service` | ✅ |
| 02.04 | Standard inspector views | c15-02 | `inspector/register-standard-inspector-views` | ✅ |
| 02.05 | Inspector data visualization | c15-02 | `inspector/data-visualization-…-provider`; be `TelemetryHub` | ✅ |
| 02.06 | View large overlay | c15-02 | `actions/view-large-action`, `preview.service` | ✅ |
| 03.01 | Action registration and lookup | c15-03 | `actions/action-registry.service` | ✅ |
| 03.02 | Action collection state | — (Jest-only) | `actions/action-collection` | ✅ |
| 03.03 | Context menu execution | c15-03 | `menus/menu.service` | ✅ |
| 03.04 | Super menu descriptions and placement | c15-03 | `menus/menu-position`, `menus/super-menu.component` | ✅ |
| 03.05 | Toolbar aggregation | c15-03 | `toolbars/toolbar-registry.service`, `telemetry-toolbar-provider` | ✅ |
| 04.01 | Default form controls | — (Jest-only) | `forms/forms.service` | ✅ |
| 04.02 | Custom form controls | — (Jest-only) | `forms/forms.service` | ✅ |
| 04.03 | Form presentation | c15-04 | `forms/form.component`, `forms/forms.service` | ✅ |
| 04.04 | Overlay stack | c15-04 | `overlays/overlay.service` | ✅ |
| 04.05 | Tooltip lifecycle | c15-04 | `tooltips/tooltip.service`, `tooltip.directive` | ✅ |
| 05.01 | Device classification classes | c15-05 | `adaptive/device-classifier.service`, `device-matchers` | ✅ |
| 05.02 | Theme installation | c15-05 | `theme/theme.service` | ✅ |
| 05.03 | Branding configuration | c15-05 | `branding/branding.service`; be `BrandingEndpoint` | ✅ |
| 05.04 | About dialog launch | c15-05 | `about-dialog.component`, `app-logo`; be `BuildInfoEndpoint` | ✅ |
| 05.05 | Shell search | c15-05 | `grand-search.component`, `highlight`, `http-search-gateway`; be `SearchEndpoint`, `ObjectStoreSearch` | ✅ |

(`be` = backend NUnit test.)

## Result

**26 of 26 L2s conformant; no gaps found; no fixes required.** Every requirement is covered by at
least one automated test, and most by both a Playwright AT and a unit test. Gates re-run on this
branch stayed green: `npm run e2e` 28/28 (all `c15-01…05` plus smoke), `npm test` 76 suites / 257
tests, `dotnet test` 44 tests. The additive C02 work on this branch introduced no C15 regression —
the shell continues to render, navigate, select, inspect, act, form, theme, and search as specified.

## Notes

- No C15-owned source was changed by this audit; it is a verification record only.
- The earlier exploration summarized C15 as 23 L2s; the spec defines 26 (01.01–01.05, 02.01–02.06,
  03.01–03.05, 04.01–04.05, 05.01–05.05), all conformant.
- Open contract item 12 (route schema for non-browse views, B16) remains unresolved upstream but is
  not required by any C15 L2 in the current spec; it is deferred to the C09 wave as recorded in
  `cross-capability-contracts.md` §6.
