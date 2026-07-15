# Capability development order and parallel-build ease

This document orders the development of the sixteen capabilities C01–C16 defined in
[`docs/specs`](specs/README.md) and rates the relative ease with which each capability can
be built in parallel with the others. The order and the ratings derive from the boundary
inventory B01–B19 and the ownership map in
[`docs/capability-contracts/cross-capability-contracts.md`](capability-contracts/cross-capability-contracts.md).
No dependency is asserted here that the boundary inventory does not record.

This document is planning guidance, not an architecture description and not a claim of
conformance to ISO/IEC/IEEE 42010:2022. Its prose follows the vocabulary, voice, and
normative-force rules of the
[Architecture Description Style Guide](https://github.com/QuinntyneBrown/architecture-description-style-guide).

## Ordering method

The order is a topological sort of the capabilities over the provider→consumer edges in the
boundary inventory, grouped into waves. A capability appears in the earliest wave in which
every module-API or transport surface it consumes is provided by a capability in an earlier
wave, or is fixed by the committed contract skeleton.

Two facts shape the result:

1. **The contract skeleton precedes all waves.** Per the cross-capability contracts
   document (sections 3 and 5), spec management commits the contract skeleton — shared
   models, gateway interfaces, and fake implementations — to `main` before the capability
   branches diverge. Every capability builds against these committed surfaces rather than
   against another capability's work in progress.
2. **The skeleton breaks the cycles.** Several boundary pairs are bidirectional
   (C06↔C10 via B06/B08, C02↔C13 via B02/B10, C14↔C15 via B12–B14). Because the shared
   data shapes and skeleton-owned service files on these boundaries are fixed up front,
   the cycles constrain integration order, not development start order.

## Development order

| Wave | Capabilities | Rationale |
| --- | --- | --- |
| 0 | Contract skeleton (spec management, not a capability) | Fixes B01–B19 surfaces on `main`; precondition for every wave. |
| 1 | C01 Application lifecycle · C04 Persistence · C05 Time coordination · C16 Quality and delivery | Consume no other capability's implementation. C01 provides B18 (bootstrap) to all; C04 provides B04 (`IObjectStore`) to C02; C05 provides B05 (time) to five consumers; C16 provides B17 (sanitization) and owns the workspace and build configuration. |
| 2 | C02 Domain objects · C15 User-interface shell | C02 consumes B04 and B18 and provides B01–B03 to nearly every other capability. C15 consumes the skeleton-owned model surfaces and provides B14 (registries), B15 (design system), B16 (routing), and B19 (branding) to the UI capabilities. |
| 3 | C06 Telemetry · C03 Object authoring · C14 Operational awareness | C06 consumes B05 and B01 and provides B06/B07 to five consumers. C03 consumes B01/B02 (C02) and B14/B16 (C15). C14 consumes B14/B15 and provides B12 (identity) and B13 (notifications). |
| 4 | C07 Plots · C08 Tables and gauges · C10 Conditions and filtering · C12 Planning and timelines · C13 Notebooks and annotations | All consume B06 or B12 surfaces provided in wave 3. C10 provides B08 (filters) and B09 (conditional styles); C12 provides the B11 time-strip spec; C13 provides B10 (annotations). C07/C08 consume B08 and B11 as fixed shared-data and spec surfaces. |
| 5 | C09 Layout · C11 Imagery | Largest consumed sets. C09 consumes B09 (C10), B16 (C15), and B17 (C16). C11 consumes B05, B06, B10 (C13), B11 (C12), and B17. |

The wave of a capability marks the earliest point at which its consumed provider
implementations exist; development against the skeleton fakes may start earlier at the
capability team's risk. Merges into `main` follow the change-and-rebase protocol in the
cross-capability contracts document regardless of wave.

## Parallel-build ease per capability

Ease ratings use a three-value scale:

- **High** — the capability consumes only the contract skeleton and wave-1 surfaces, owns
  exclusive paths, and provides at most one boundary; it can proceed with minimal
  coordination.
- **Medium** — the capability consumes several fixed contracts or provides boundaries that
  gate other teams; coordination is needed at contract-change and merge points only.
- **Low** — the capability sits on bidirectional boundaries, has the largest consumed
  surface set, or shares directories with other capabilities; sustained coordination is
  needed throughout development.

| Capability | Ease | Provides | Consumes | Rationale |
| --- | --- | --- | --- | --- |
| C01 Application lifecycle and extensibility | High | B18 | — | No inbound capability dependencies; exclusive ownership of `Program.cs` and `config/**`. B18 is a stable convention every other team codes against, so it stabilizes in wave 1. |
| C02 Domain objects, composition, and discovery | Medium | B01, B02, B03 | B04, B18 | Its own build is well isolated (objects controllers and gateways), but three high-stability boundaries gate C03–C15; contract changes need the section-5 protocol. B03 also receives annotation hits back from C13. |
| C03 Object authoring and data portability | Medium | — | B01, B02, B14, B16, B18 | Provides nothing others wait on; consumes only fixed contracts. Owns the exclusive `app/actions/**` directory, so file-level conflicts are unlikely. |
| C04 Persistence and synchronization | High | B04 | B18 | Single provided boundary behind the `IObjectStore` interface; exclusive backend store paths (`InMemoryObjectStore.cs`, `SeedData.cs`). C02 develops against the interface, not the implementation. |
| C05 Time coordination and time utilities | High | B05 | B18 | Self-contained time module (`core/src/lib/time/**` beyond the skeleton-owned `time-context.ts`); five consumers bind through skeleton types, not through C05 internals. |
| C06 Telemetry integration and processing | Medium | B06, B07 | B01, B05, B08, B18 | Critical-path provider for five visualization and planning consumers, so its contracts stabilize early. B08 filter options arrive from C10, but as a fixed shared-data shape. |
| C07 Plot and chart visualization | Medium | — | B01, B05–B08, B11, B14, B15, B18 | Consumes many surfaces, all fixed by the skeleton or by waves 1–4 providers. Owns exclusive view and inspector directories (`views/plot/**`, `inspector/plot-series/**`). |
| C08 Tabular, gauge, and datum visualization | Medium | — | B01, B05–B08, B14, B15, B18 | Same shape as C07 with a smaller consumed set (no B11); exclusive `views/table/**` directory. |
| C09 Layout and embedded-content presentation | Medium | — | B01, B02, B09, B14, B16, B17, B18 | Pure consumer, but its consumed set spans three providing waves (C02, C15/C16, C10), so integration testing completes last. Exclusive `views/folder/**` and `app/layouts/**` paths. |
| C10 Conditions, derived telemetry, and filtering | Low | B08, B09 | B01, B06, B14, B17, B18 | Bidirectional coupling with telemetry: it consumes B06 while its B08 filters feed back into C06/C07/C08 request options, and its B09 styles apply inside C09 and C15 views. Changes ripple in both directions. |
| C11 Imagery visualization and interaction | Low | — | B01, B05, B06, B10, B11, B14, B15, B17, B18 | Largest consumed set of any capability, spanning time, telemetry, annotations, the time-strip spec, and sanitization; it is the only capability that cannot fully integrate before wave 5. |
| C12 Planning, timelines, events, and activities | Medium | B11 | B01, B05, B06, B14, B18 | B11 is a spec surface, not code, so C07 and C11 implement it without waiting on C12's implementation. Owns a new exclusive feature directory (`app/plans/**`). |
| C13 Notebooks and annotations | Low | B10 | B01, B02, B03, B12, B14, B17, B18 | Bidirectional coupling with C02: it consumes object retrieval and search while supplying the annotation hits inside the B03 `SearchResults` envelope. B10 is also consumed by C02, C11, and C15. |
| C14 Operational awareness and collaboration | Medium | B12, B13 | B01, B14, B18 | Bidirectional with C15 (provides identity and notifications, consumes registries), but the skeleton owns the `user.service.ts` and `notification.service.ts` seam files, which confines coordination to those contracts. |
| C15 User-interface shell and interaction services | Low | B14, B15, B16, B19 | B01, B02, B03, B09, B10, B12, B13, B18 | The integration hub: four provided boundaries consumed by every UI capability, plus consumption of styles, annotations, identity, and notifications. It also owns shell and browse directories that host other capabilities' inspector subdirectories, so directory-level coordination persists throughout. |
| C16 Compatibility, accessibility, security, and delivery | High | B17 | B18 | Sanitization utilities and the e2e/build infrastructure have no inbound capability dependencies. One caveat: it owns the workspace and CI configuration, so its configuration changes should be batched to avoid rebasing every in-progress branch. |

## Reading the two together

Wave placement and ease answer different questions. C02 and C15 sit early in the order
because others wait on them, yet they rate Medium and Low because providing many boundaries
demands coordination. Conversely, C09 and C11 rate at or below Medium and sit in the final
wave, yet each team can begin against skeleton fakes at any time — only their end-to-end
integration is late. Staffing should therefore start the wave-1 and wave-2 providers first
and may start any High-rated capability immediately.
