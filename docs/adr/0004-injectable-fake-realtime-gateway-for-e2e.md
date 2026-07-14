# ADR 0004 — Backend faked in frontend tests via injectable gateways

- Status: Accepted
- Date: 2026-07-14
- Capability: C15 — User-interface shell

## Context

Every frontend test runs against a faked backend. REST calls are
straightforward to intercept, but a live SignalR websocket is not
intercept-friendly, and Playwright acceptance tests still need to exercise
"observe object updates" (`OMCT-C15-L2-01.03`) and live telemetry
(`OMCT-C15-L2-02.05`) deterministically.

## Decision

The app reaches the backend only through injectable gateway abstractions
declared in `@cupola/core`: `ObjectsGateway`, `SearchGateway`,
`BrandingGateway`, and `RealtimeGateway`. Production binds the HTTP and
SignalR implementations from `@cupola/api`.

An `e2e` Angular build configuration swaps in `FakeRealtimeGateway`, which
exposes a `window.__cupolaE2E` hook (`pushObjectUpdate`, `pushTelemetry`,
`setConnectionState`). Playwright fakes REST with `page.route()` over JSON
fixtures that mirror the backend seed, and drives realtime events through the
hook. Jest uses `HttpTestingController` and stub gateways.

Locally-applied edits and server-pushed updates are merged in a single
`ObjectUpdatesService` so the shell reacts to both through one subscription
point.

## Consequences

- Playwright tests are deterministic: no timing dependence on a real hub, and
  simulated server events fire exactly when a test pushes them.
- The fixtures and the backend seed must be kept in agreement; both encode the
  same canonical object tree.
- The production real-time path is not exercised by e2e and is instead covered
  by the backend SignalR integration tests.
