# C16 — Quality and delivery, via ATDD

## Problem

Implement capability C16 (`docs/specs/C16-quality-and-delivery.md`, 6 L1 / 30 L2) on branch
`capability/c16-quality-and-delivery`, following the nine detailed-design diagrams in
`docs/detailed-designs/C16-quality-and-delivery/` and using ATDD. C16 is a **Wave 1** capability:
it consumes only B18 and **provides B17** (sanitization/safe-navigation utilities for C09/C10/C11/C13),
and it owns the workspace, build, CI, and `frontend/e2e/**` infrastructure for the whole repo.

Two facts shaped the work: (1) the spec is reverse-engineered from upstream Open MCT
(Vue + webpack + Karma + `openmct.js` + `.github/workflows`), so every L2 is **translated** onto
Cupola's Angular 21 + Jest + Playwright + .NET stack, exactly as C01/C04/C05 translated theirs;
(2) ~13 L2s target consumer features that do not exist yet (notebooks/C13, tables/C08, imagery/C11,
plots/C07, tabs & layout/C09) — their utilities are delivered and unit-tested now, their view-level
scenarios are deferred as traced gaps.

## Current state (before this change)

- The B17 skeleton (`core/src/lib/security/sanitizers.ts` + spec) existed with conservative bodies,
  exported at `core/src/public-api.ts`, unconsumed. The image-URL allow list (04.06) and an
  import-side `__proto__` stripper (04.04) were missing.
- The About dialog (`app/shell/about-dialog/**`, C15) already rendered version/date/revision/branch
  (**06.01 satisfied**) and linked to `/licenses`, but no route served it and no license text showed.
- There was **no CI** (`.github/` absent), no `npm run lint`, no ESLint/cspell, no axe, and no
  visual-a11y / mobile / performance / memory Playwright configs.
- **Two latent breakages** (inherited, invisible because they masked each other): the app build failed
  on the stale C01 test-support stub `test-bootstrap-support.ts` (C04 extended `ObjectsGateway`), and
  the C16-owned `e2e/support/fake-backend.ts` did not serve the B04 batch endpoints the app now uses
  (C04 bound `CouchObjectsGateway`, which batches gets to `POST /api/objects/batch-get`). Because the
  e2e build could not compile, the whole functional e2e suite was un-runnable.

## Design

**Security — B17 (`core/src/lib/security/**`, C16-owned; unit-tested; consumer adoption deferred):**
- Hardened `sanitizeUrl` to strip control characters before scheme detection (closes the
  `java\tscript:` bypass) (04.01); broadened `sanitizeRichText` disallowed elements (+`svg`,`math`) and
  attributes (+`formaction`,`action`) (04.02); expanded `neutralizeCsvCell` coverage (04.03); trimmed
  trailing periods in `sanitizeFilename` (04.07).
- New `image-url.ts` — `isAllowedImageUrl`/`sanitizeImageUrl`/`openImageInNewTab`: allow safe
  absolute http(s), root-relative, non-SVG data-image, and same-origin blob URLs; block the rest
  (04.06 + opener isolation 04.05).
- New `safe-object.ts` — `dropUnsafeKeys`/`sanitizeImportedJson` strip `__proto__`/`constructor`/
  `prototype` at every depth for imported JSON (04.04; the local-storage path is C04's `safe-json.ts`).
- All new symbols barrel-exported from `core/src/public-api.ts` (flagged skeleton touch).

**Delivery/build config (C16-owned):** `.browserslistrc` (01.02), `package.json` `engines.node`
(01.01), `npm run lint` = ESLint (`angular-eslint` flat config) + `prettier --check` + `cspell`
(02.02), `.github/workflows/pr.yml` (build/lint/unit/sharded-e2e/visual-a11y/performance/memory jobs,
02.04) and `.github/workflows/codeql.yml` + `codeql/codeql-config.yml` (JS-TS **and** C#,
security-and-quality, push/PR/weekly, 02.05). `npm run build` (02.01) and `npm test`/`dotnet test`
(02.03) already existed; 01.03/01.04 are reinterpreted onto the Angular/ng-packagr build (documented).

**Accessibility / mobile / performance suites (`frontend/e2e/**`, C16-owned):**
- `e2e/support/axe.ts` scans for `wcag2aa` violations, asserts zero, and writes a JSON report +
  screenshot on failure (03.01, 03.03). `playwright-visual-a11y.config.ts` + `e2e/tests/visual-a11y/`
  cover browse shell, licenses overlay, and search (03.02).
- `playwright-mobile.config.ts` (iPad landscape + iPhone 14 Pro WebKit) + `e2e/tests/mobile/` verify
  tree visibility, search navigation, and the conductor (03.04).
- `playwright-performance-prod.config.ts` (perf + a `chromium-memory` project) and
  `playwright-performance-dev.config.ts` (contract) + `e2e/tests/performance/**` cover shell
  navigation/search timing (05.01), FCP contract budget (05.02), and a CDP forced-GC navigation
  memory-leak check over `e2e/test-data/memory-leak-detection.json` (05.03). New scripts:
  `lint`, `e2e:a11y`, `e2e:mobile`, `e2e:perf`, `e2e:perf:dev`. The default `playwright.config.ts`
  `testIgnore`s these dirs so `npm run e2e` stays functional-only.

**Disclosure (06.x):** new C16 feature `app/licenses/**` — a lazy-loaded `/licenses` route rendering
`LicensesComponent` as a full-screen nondismissible overlay with the project MIT license
(`mit-license.ts`) + a `third-party-licenses.ts` table (06.02, 06.03). A concise "Licensed under the
MIT License" line was added to the about dialog (flagged C15 touch). 06.01 was already satisfied by C15;
Playwright ATs in `e2e/tests/c16-06-disclosure.spec.ts` verify all three.

**Delivery-infrastructure repairs (C16-owned; these unblocked the entire e2e suite):**
- Excluded `src/**/testing/**` from `projects/cupola/tsconfig.app.json` so test-support files stay out
  of the production/e2e build (fixes the stale-stub build failure; test doubles must not ship).
- Added the B04 batch/save routes (`/api/objects/batch-get`, `/api/objects/batch`, `/api/objects`) to
  `e2e/support/fake-backend.ts` so `CouchObjectsGateway` resolves objects in e2e (fixes the browse
  tree/object-view not rendering — which had also read as a "WebKit-only" failure).

## Deliberate gaps (deferred, not stubbed — traced by a source comment + recorded here)

- **01.05** (script-relative `openmct.js` public path) — **N/A for an Angular SPA** (uses `<base href>`).
- **01.03 / 01.04** — no UMD `openmct.js` package, workers, or imagery-layer assets (imagery = C11
  unbuilt); reinterpreted onto `ng build` / ng-packagr, documented.
- **04.01–04.07 consumer adoption** — hyperlink/web-page/widget (C09/C10), notebook/annotation (C13),
  table CSV export (C08), import-from-JSON (C03), image new-tab/export (C11) are unbuilt; the B17
  utilities are delivered and unit-tested, adoption lands with those capabilities.
- **03.02 view scenarios** — notebooks/planning/telemetry/gauges/imagery a11y scenarios deferred;
  shell/licenses/search delivered.
- **05.02 (notebook/imagery contract), 05.04 (tab rendering), 05.05 (plot tagging)** — require
  C11/C13, C09, and C07 views; a shell representative is delivered for 05.02.
- **03.04 removal confirmation** — the destructive-action UI is C03 (unbuilt).

## ATDD flow

1. Acceptance/unit specs first: Jest `describe('OMCT-C16-L2-04.0X …')` for the security utilities and
   the licenses component; Playwright title-prefix + `requirement` annotation for disclosure,
   visual-a11y, mobile, and performance.
2. Implement to green.
3. Gates (all green): `npm run lint`; `npm test` (66 suites / 217 tests); `npm run build` (production);
   `npm run e2e` (28/28 functional, incl. C15 regression + c16 disclosure); `npm run e2e:a11y` (3),
   `e2e:mobile` (6), `e2e:perf` (3), `e2e:perf:dev` (1); `dotnet test backend/Cupola.sln` (42).

## Notes

- Branch protocol (§5b): C16 owns `core/src/lib/security/**`, all of `e2e/**`, and workspace/build/CI
  config. **Flagged cross-ownership touches** (called out in the commit, as C05 flagged `app.config.ts`):
  `core/src/public-api.ts` (barrel exports, skeleton); `app/app.routes.ts` (unassigned wiring, licenses
  route); `app/shell/about-dialog/about-dialog.component.html` (C15, one MIT line); and the trivial
  removal of an unused fixture param in `e2e/tests/c15-02-…` (C16-owned e2e path).
- **License** shows MIT (the repo's real `LICENSE`), not the spec's literal Apache-2.0, per the user
  decision.
- The `.browserslistrc` declares the Open-MCT-derived support matrix (Safari/iOS 16), which Angular 21
  reports as outside its default baseline — an **expected informational warning**, not a build failure.
- No backend **source** change (C16 owns only `Cupola.sln`/`global.json` there, unchanged).
