# C05 — Time coordination, via ATDD

## Problem

Implement capability C05 (`docs/specs/C05-time-coordination.md`, 22 L2 requirements) on branch
`capability/c05-time-coordination`, following the 10 detailed-design diagrams in
`docs/detailed-designs/C05-time-coordination/` and using ATDD: acceptance specs written first
from the GIVEN/WHEN/THEN criteria, then implementation until green. C05 is frontend-only (the B05
contract and ownership map assign it no backend code).

## Current state (before this change)

- The B05 contract skeleton was committed and consumed by C06/C07/C08/C11/C12: the models
  `core/src/lib/models/time.ts`, the abstract `core/src/lib/time/time-context.ts` (9 methods), and
  the fake `api/src/lib/time/fake-time-context.ts`.
- Production `app.config.ts` did **not** bind a real `TimeContext` (a latent gap — `app.time` in
  C01's `cupola-application.ts` would throw against the real config), and
  `app/shell/conductor/**` was a static placeholder.

## Design

C05-owned engine under `core/src/lib/time/**` (the skeleton-owned `time-context.ts` is left
untouched; the extra surface area lives on C05 concrete classes):

- **Formats** (`time-format.ts`, `format-registry.ts`, `formats/*`): `UTCTimeFormat`,
  `DurationFormat`, `ISOTimeFormat`, `LocalTimeFormat` and a `FormatRegistry` (05.01, 05.02).
- **Clocks** (`clock.ts`, `clock-registry.ts`, `clocks/local-clock.ts`): a `Clock` interface, a
  `LocalClock` emitting wall-clock time on an interval (03.04), and a `ClockRegistry` (03.02).
- **Time systems** (`time-system-registry.ts`): registration by key; activation rejects unknown
  keys (01.01, 01.02).
- **Contexts** (`time-context-base.ts`, `global-time-context.ts`, `independent-time-context.ts`):
  `TimeContextBase extends TimeContext` implements the 9 frozen methods and adds the superset
  surface — clock activation (`setClock`), offsets, time of interest, and per-field change events
  (`timeSystemChanged`/`clockChanged`/`offsetsChanged`/`timeOfInterestChanged`) as plain subjects.
  Covers bounds validation (01.03), TOI containment (01.04), all change events (01.05), fixed vs
  real-time mode (03.01), clock-relative bounds (03.03). `GlobalTimeContext` is the injectable
  singleton; `IndependentTimeContext` is a per-object instance (02.02).
- **Time API** (`time-api.service.ts`): registration passthrough plus `getContext(objectPath)`
  resolution — global by default (02.01), an object's own independent context (02.02), or the
  nearest ancestor's (02.03). `objectPath` is root-most first, matching the browse convention.
- **URL sync** (`url-time-sync.service.ts`): writes the `tc.*` search params on change via the
  existing `UrlParamsService`; writes only affected keys, only on change, and only fixed-mode
  bounds (no real-time tick churn). `tc.mode` is `fixed` or the active clock key (04.03).

C05-owned UI:

- **Conductor** (`app/shell/conductor/**`): injects `GlobalTimeContext`; renders fixed-mode bounds
  vs real-time clock controls and a live current-time display (04.01, 04.02).
- **Display objects** (`app/time/**`): clock view + provider (05.03); timer state machine, timer
  view + provider with start/pause/stop/restart controls (05.04); legacy timer migration (05.05);
  `register-time-views.ts` registers the providers through C15's view registry.

Wiring:

- `app.config.ts` binds `{ provide: TimeContext, useExisting: GlobalTimeContext }` (closing the
  latent gap), registers the default formats/systems/clock and time views, and starts
  `UrlTimeSyncService` **last** so startup defaults are never written back over existing URL state.
- `core/src/public-api.ts` exports the new C05 time symbols.

## Deliberate gaps (deferred, not stubbed)

- **OMCT-C05-L2-03.05 (remote-telemetry clock)** and **03.06 (latest-available-data clock)** are
  deferred to the C06 wave. Both require the historical/latest telemetry route that only lands with
  C06 (open contract #5, B05). Traced in `app/time/register-default-time.ts`, mirroring how C01
  traced its deferred 02.07 clock-half. No partial implementation. 20 of 22 L2s are delivered.

## ATDD flow

1. Acceptance specs first (`describe('OMCT-C05-L2-XX.YY …')`), all Jest — co-located core library
   specs for the engine/contexts/clocks/formats, and zoneless Angular TestBed component specs for
   the conductor and display objects. The e2e suite is C16-owned, so no Playwright ATs were added.
2. Implement to green.
3. Gates: `npm test` (54 suites / 173 tests), `npm run build` (production), `npm run e2e`
   (25/25 — C15 regression, incl. the `tc.mode=local` preservation test and the six-region shell
   smoke, confirming the now-live conductor introduces no regression).

## Notes

- Branch protocol (§5b): C05 owns `core/src/lib/time/**` (except skeleton `time-context.ts`),
  `app/shell/conductor/**`, and the new `app/time/**`. Two flagged cross-ownership touches, called
  out in the commit message like C01 flagged `main.ts`: `core/src/public-api.ts` (barrel exports)
  and `app/app.config.ts` (unassigned wiring file).
- The frozen `TimeContext` (9 methods) is unchanged, so the five consumers keep a stable contract.
- No backend change.
