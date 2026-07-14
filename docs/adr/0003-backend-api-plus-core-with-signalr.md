# ADR 0003 — Backend as Cupola.Api + Cupola.Core with SignalR real time

- Status: Accepted
- Date: 2026-07-14
- Capability: C15 — User-interface shell

## Context

C15 is predominantly client-side shell behaviour. The genuine server
responsibilities are: serving the domain-object tree for browse navigation
(`OMCT-C15-L2-01.03`, `-01.04`), broadcasting object updates so the shell can
observe them (`-01.03`), exposing branding and build information
(`-05.03`, `-05.04`), and object plus annotation search (`-05.05`).

## Decision

A .NET 8 solution with two source projects: `Cupola.Api` (attribute-routed
MVC controllers, a SignalR `RealtimeHub`, a telemetry simulator hosted
service, and DI wiring) and `Cupola.Core` (immutable-record domain models,
an `IObjectStore` interface, and an in-memory seeded store). Real-time
updates use SignalR; object updates are broadcast from the controller via
`IHubContext` after a successful mutation. No database, no auth, no
repository ceremony beyond the store interface.

Tests are NUnit: `Cupola.Core.UnitTests` (store-level) and
`Cupola.Api.IntegrationTests` (`WebApplicationFactory`, with SignalR tests
connecting a `HubConnection` to the test server). Every test carries a
`[Requirement("OMCT-C15-L2-nn.nn")]` attribute that registers the id as an
NUnit category and property, so `dotnet test --filter "TestCategory=..."`
selects the tests tracing to a requirement.

## Consequences

- Controllers keep SignalR concerns out of `Cupola.Core`, which stays
  unit-testable without a web host.
- The in-memory store makes the seed tree the single source of truth shared
  by every endpoint and mirrored by the frontend e2e fixtures.
- Adding persistence later means implementing `IObjectStore` against a real
  store without touching controllers.
