# C02 — Domain objects, types, composition, and discovery, via ATDD

## Problem

Implement capability C02 (`docs/specs/C02-domain-objects-composition-and-discovery.md`,
**22 L2 requirements** across four L1s) on branch
`capability/c02-domain-objects-composition-and-discovery`, following the 11 detailed-design
diagrams in `docs/detailed-designs/C02-domain-objects-composition-and-discovery/` and using ATDD:
Jest acceptance specs written first from the GIVEN/WHEN/THEN criteria, then implementation until
green. C02 is Wave 2; it provides **B01** (shared object model), **B02** (retrieval/mutation/
observation), and **B03** (federated search), and consumes **B04** (persistence) and **B18**
(bootstrap).

## Current state (before this change)

- The B01/B02/B03 contract skeleton and the C04 persistence plumbing already existed: identifier
  and `DomainObject` models, `ObjectsGateway`/`SearchGateway`, `CouchObjectsGateway` (batches
  same-tick gets), save/version/conflict, migrations, and the `ObjectUpdatesService` whole-object
  update stream. `core/src/lib/objects/` held only `object-updates.service.ts`.
- The distinctive C02 API surface was absent: no type registry, no namespace-routed object API,
  interceptors, mutable objects, transactions, composition API/providers/policies/roots, or
  federated/in-memory search.
- The shared `DomainObject` shape (TS + C#) lacked the `persisted` timestamp named by
  OMCT-C02-L2-02.02 (open contract item 1).

## Design

New C02-owned services under `core/src/lib/objects/**` (skeleton-owned `models/**` and
`gateways/**` are consumed, not modified — except the one flagged contract change below):

- **Identity & types**: identifier conversion reuses `models/key-string.ts` (01.01);
  `type-registry.service.ts` registers/standardizes types (01.02); `object-api.service.ts` routes
  get/create/update to the namespace `ObjectProvider` (`object-provider.ts`,
  `gateway-object-provider.ts` wrapping `ObjectsGateway`) (01.03), shares in-flight get promises
  (01.04), applies interceptors (`interceptor-registry.ts`, 01.05), and substitutes a
  missing-object placeholder (`missing-object-interceptor.ts`, 01.06).
- **Lifecycle**: `object-api.service.ts` selects create vs update by persisted state (02.01),
  stamps `created`/`modified`/`persisted` keeping `persisted ≥ modified` (02.02), sets
  `createdBy`/`modifiedBy` from an optional injected `UserService` (02.03), and suppresses provider
  updates when normalized serializable state is unchanged (02.04). `mutable-domain-object.ts`
  provides property-path observers (02.05) and provider synchronization via `ObjectUpdatesService`
  (02.06). `transaction.ts` + `transaction-manager.service.ts` commit/cancel dirty objects (02.07).
- **Composition & hierarchy**: `composition-api.service.ts` returns a falsy result when no provider
  applies (03.01), registers providers (03.03), and gates relationships by policy
  (`composition-policy.ts`, 03.04). `default-composition-provider.ts` is model-backed —
  add/remove/reorder mutate the parent `composition` and persist through the save path (03.02).
  `composition-collection.ts` relays provider membership changes (03.03).
  `root-registry.service.ts` + `root-composition-provider.ts` expose roots in priority order
  (03.05). `object-api.service.ts` resolves the original path with a visited-set cycle guard (03.06).
- **Discovery**: `search-api.service.ts` runs registered providers in parallel and returns one
  promise per provider (04.01); `gateway-search-provider.ts` federates the existing `/api/search`;
  `in-memory-search-provider.ts` indexes objects for partial/exact matching (04.02) and executes
  in-process when shared workers are unavailable (04.03).

**Contract change (flagged)**: `persisted` added to `models/domain-object.ts` and
`Cupola.Core/Models/DomainObject.cs` (open contract item 1 resolved), committed separately as a
contract-skeleton change (mirroring C04's "Extend B04 contract skeleton" precedent). The store's
`with` expressions preserve the field, so a client-stamped value round-trips.

**Wiring**: `app/objects/register-default-objects.ts` (new C02 feature dir) registers the default
type, the missing-object interceptor, the model-backed and root composition providers, and the
federated + in-memory search providers; it is invoked from the `provideAppInitializer` in
`app/app.config.ts`. `core/src/public-api.ts` exports the new `objects/**` symbols. C15's browse
flow is deliberately **not** rewired through `ObjectApi`, so the shell e2e stays green; the new
services are additive and ready for C03+.

**Backend**: no new routes. Composition mutation persists through the existing `POST /api/objects`
save (`InMemoryObjectStore.Save` stores the whole object, incl. `Composition`).
`ObjectLifecycleEndpointTests` adds C02-tagged coverage for the `persisted` round-trip (02.02) and
composition-mutation-via-save round-trip (03.02).

## Deliberate gaps

**None.** All 22 L2s are delivered. One implementation nuance is recorded in
`in-memory-search-provider.ts`: 04.03's shared-worker offload is delivered as a worker-capable
interface with in-process execution (the specification's named fallback), not a physical
`SharedWorker` — full behavioural fidelity, no stub.

## ATDD flow

1. Acceptance specs first (`describe('OMCT-C02-L2-XX.YY …')`), all Jest — co-located in
   `core/src/lib/objects/`. Plus C02-tagged NUnit integration tests for the two server-observable
   behaviours. The e2e suite is C16-owned, so no Playwright ATs were added (C02's contracts are
   programmatic).
2. Implement to green.
3. Gates: `npm test` (76 suites / 257 tests), `npm run build` (production; bundle 508 kB, within
   the 1 MB error budget), `npm run e2e` (28/28 — C15/C16 regression clean), `dotnet test
   backend/Cupola.sln` (44 tests, incl. the two new C02 integration tests). Traceability spot-check:
   `dotnet test --filter "TestCategory=OMCT-C02-L2-02.02"`.

## Notes

- Branch protocol (§5b): C02 owns `core/src/lib/objects/**`, `api/src/lib/objects/**`,
  `api/src/lib/search/**`, `app/objects/**`, `Cupola.Api/Controllers/{Objects,Search}Controller.cs`,
  and its backend tests. **Flagged cross-ownership touches**, called out in the commit messages:
  `models/domain-object.ts` + `Cupola.Core/Models/DomainObject.cs` (`persisted`, a dedicated
  contract-skeleton commit), `core/src/public-api.ts` (barrel), and `app/app.config.ts` (wiring —
  as C05 flagged the same file).
- This branch also carries the C15 conformance audit (`docs/plans/c15-user-interface-shell.md`) per
  the "one combined branch" decision for this effort.
- The earlier exploration miscounted C02 as 18 L2s; the spec defines 22 (01.01–01.06, 02.01–02.07,
  03.01–03.06, 04.01–04.03), all delivered.
