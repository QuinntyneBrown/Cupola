# ADR 0005 — Deploy Cupola as a single Linux App Service serving one origin

- Status: Accepted
- Date: 2026-07-17
- Capability: Deployment and hosting (cross-capability)

## Context

Cupola is a marketing site, an Angular console, and a .NET 8 API with a SignalR
hub. The public demo is required to be cheap to run and simple to reason about,
without standing up a database, an identity provider, or a separate front door.

The frontend already makes this tractable. It calls the API with relative URLs
(`/api`, `/hubs/realtime`) and uses hash-based routing, so it does not care what
host or path prefix it is served from as long as its own assets resolve. That
means a single origin can serve every surface if the paths do not collide.

The design-system docs site is a separate concern with its own Static Web App
and workflow (ADR-adjacent, see `infra/design-system.bicep`); this decision does
not change it.

## Decision

Cupola deploys to **one** Azure App Service (Linux, Free F1 tier, resource group
`cupola-rg`, region `eastus2`) that serves everything from a single origin:

- the marketing site at `/`,
- the Angular console at `/app/`, built with `--base-href /app/`, and
- the .NET 8 API and SignalR hub at `/api` and `/hubs/realtime`, with health at
  `/health`.

The API host serves the two static bundles out of `wwwroot`. That `wwwroot` is
**assembled at CI time**, not by the API's project file: the workflow copies the
marketing folder to `wwwroot/` and the Angular build output to `wwwroot/app/`
before publishing. Nothing in `Cupola.Api.csproj` references the marketing or
frontend folders, so the two static surfaces stay decoupled from the backend
build and can change independently.

Provisioning is `infra/app.bicep` (plan + site only). Deployment is the GitHub
Actions workflow `.github/workflows/deploy-app.yml`, which authenticates with
OIDC and is gated on the repository variable `AZURE_WEBAPP_NAME` — until that
variable is set, the workflow is a no-op, so the repo is safe to fork and safe to
push to before Azure exists. A smoke gate follows every deploy: it polls
`/health` until it returns 200 (tolerating cold start), then asserts the
marketing marker at `/`, the `<cp-root>` element at `/app/`, and a branding
response at `/api/branding`.

There is **no database and no authentication**. The API uses the in-memory
seeded store from ADR 0003; its data resets to the seed tree whenever the app
restarts. This is accepted for a demo.

There is **no Azure SignalR Service**. SignalR runs in-process on the App
Service. The F1 tier caps concurrent WebSocket connections (~5), and past that
the SignalR client automatically negotiates down to Server-Sent Events or
long-polling, so real-time updates degrade rather than break under the demo's
light load.

## Rationale

A single origin removes cross-origin configuration (no CORS, no separate SPA
host, no reverse proxy) and lets the console keep calling relative URLs exactly
as it does in local development. Assembling `wwwroot` in CI rather than through
the project file keeps the backend build independent of the marketing and
frontend source trees, so each can evolve without touching the others.

Free F1 costs nothing, which matches the demo's intent. Its limits — cold start
after idle (`alwaysOn` is unavailable on F1), a 60 CPU-minute/day quota, and the
low concurrent-WebSocket cap — are acceptable for a low-traffic showcase and are
each recoverable by scaling the plan up to B1 without any code or topology
change. Gating the workflow on `AZURE_WEBAPP_NAME` and asserting real responses
in the smoke job keeps the pipeline honest without requiring every contributor
to own Azure credentials.

## Consequences

- One resource (plus its plan) hosts the entire product; there is a single URL
  to share and a single origin to reason about.
- Demo data is ephemeral: any restart (including the F1 idle recycle) reseeds the
  in-memory store, so the demo is not a system of record.
- The first request after idle pays a cold-start penalty (~10–30s); the smoke
  gate's health poll absorbs this, and real users see it only on the first hit.
- Heavy concurrent real-time load would exhaust the F1 WebSocket cap and push
  clients onto SSE/long-polling; this is invisible for demo-scale traffic.
- Scaling up is a plan SKU change (F1 → B1) with no change to the artifact, the
  workflow, or the app; adding persistence later means implementing `IObjectStore`
  against a real store (per ADR 0003) without touching this topology.
- The design-system Static Web App and its workflow are unaffected.
