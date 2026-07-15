# ADR 0003 — Backend as Cupola.Api + Cupola.Core with SignalR real-time updates

- Status: Accepted
- Date: 2026-07-14
- Capability: C15 — User-interface shell

## Context

C15 is predominantly client-side shell behaviour. The server responsibilities cover:

- serving the domain-object tree for browse navigation (`OMCT-C15-L2-01.03`, `-01.04`);
- broadcasting object updates for shell observation (`-01.03`);
- exposing branding and build information (`-05.03`, `-05.04`); and
- searching objects and annotations (`-05.05`).

## Decision

A .NET 8 solution contains two production projects. `Cupola.Api` contains
attribute-routed Model–View–Controller (MVC) controllers, a SignalR
`RealtimeHub`, and dependency injection wiring. `Cupola.Core` contains
immutable record-based domain types, an `IObjectStore` interface, and an in-memory
seeded store. Real-time updates use SignalR; the controller broadcasts object
updates through `IHubContext` after a successful mutation.

The non-production `Cupola.Simulators` class library contains opt-in telemetry
generation. `Cupola.Api` neither references nor registers that library. The
accepted production scope excludes a database and authentication. The store
interface remains the only repository abstraction.

The backend uses NUnit. `Cupola.Core.UnitTests` exercises the store.
`Cupola.Api.IntegrationTests` uses `WebApplicationFactory`; its SignalR tests connect a
`HubConnection` to the test server. Simulator-dependent tests register
`Cupola.Simulators` through a specialized test host. Every test carries a
`[Requirement("OMCT-C15-L2-nn.nn")]` attribute that registers the identifier as an
NUnit category and property, so `dotnet test --filter "TestCategory=..."`
selects the tests tracing to a requirement.

## Rationale

The separate library prevents synthetic telemetry generation from becoming a production
dependency. Explicit test-host registration retains the simulator for integration testing
without changing the production composition root.

## Consequences

- Controllers keep SignalR concerns out of `Cupola.Core`, which stays
  unit-testable without a web host.
- The production `Cupola.Api` dependency graph and output exclude telemetry simulation.
- `Cupola.Api` emits no telemetry until a production integration publishes
  through the real-time transport.
- Integration tests retain opt-in telemetry generation without changing the
  production composition root.
- The in-memory store makes the seed tree the single source of truth shared
  by every endpoint and mirrored by the frontend end-to-end fixtures.
- Adding persistence later means implementing `IObjectStore` against a real
  store without touching controllers.
