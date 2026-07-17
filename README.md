# Cupola

Cupola is an Open MCT-inspired mission operations shell with an Angular frontend and an
ASP.NET Core backend. It provides object browsing, telemetry visualization, search, and
frontend support for real-time updates over SignalR.

[![License: MIT](https://img.shields.io/badge/license-MIT-107C10.svg)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![.NET](https://img.shields.io/badge/.NET-8-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![Contributions welcome](https://img.shields.io/badge/contributions-welcome-0078D4.svg)](CONTRIBUTING.md)

[Documentation](#documentation) | [Contributing](CONTRIBUTING.md) | [Security](SECURITY.md) | [Support](SUPPORT.md)

## Live demo

The whole product runs from a single Azure App Service (Free F1 tier), served from one origin:

- `https://<app>.azurewebsites.net/` — the marketing site *(URL set after first deploy)*
- `https://<app>.azurewebsites.net/app/` — the Cupola console

Because the demo runs on the Free tier, a few caveats apply: the first request after the app has been idle cold-starts in roughly 10–30 seconds, the tier allows 60 CPU-minutes per day, and the seeded demo data resets to its initial state on every restart. See [ADR 0005](docs/adr/0005-single-app-service-deployment.md) for the hosting decision and [`infra/README.md`](infra/README.md) for provisioning and deployment.

## About the project

Cupola provides a mission-control style interface built from reusable frontend and backend feature libraries. The backend serves seeded domain objects and metadata, while the frontend composes views, inspectors, toolbars, and shell experiences that mirror operational workflows.

The repository also includes a reverse-engineered Open MCT requirements baseline and architecture decisions in `docs/` to support implementation traceability.

## Features

- Browse hierarchical domain objects and compositions
- View telemetry through plot, table, imagery, and generic views
- Inspect properties, annotations, elements, and visualization settings
- Search across both objects and annotations
- Subscribe to real-time telemetry updates over SignalR
- Update object names and propagate updates to connected clients
- Run deterministic frontend e2e journeys with a fake realtime gateway

## Getting started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)
- [Node.js](https://nodejs.org/) 20 or later
- npm 10 or later

### Local development

```bash
git clone https://github.com/QuinntyneBrown/Cupola.git
cd Cupola
```

Start backend (`http://localhost:5240`):

```bash
cd backend
dotnet restore
dotnet run --project src/Cupola.Api/Cupola.Api.csproj
```

The production `Cupola.Api` host starts without a telemetry generator. The simulator in
`backend/nonproduction/Cupola.Simulators` is registered only by simulator-dependent
integration tests.

Start frontend (`http://localhost:4200`) in a second terminal:

```bash
cd frontend
npm ci
npm run start
```

The frontend proxy routes `/api` and `/hubs` traffic to the backend.

## Technology

| Area | Technologies |
| --- | --- |
| Frontend application | Angular 21, TypeScript, RxJS |
| Frontend libraries | Angular CDK, custom `core`, `components`, and `api` packages |
| Backend | ASP.NET Core 8 Web API, SignalR |
| Data layer | In-memory object store with seeded domain objects |
| Testing | NUnit, Microsoft.AspNetCore.Mvc.Testing, Jest, Playwright |

## Testing

Run backend tests:

```bash
dotnet test backend/Cupola.sln
```

Run frontend unit tests:

```bash
cd frontend
npm run test
```

Run frontend e2e tests:

```bash
cd frontend
npm run e2e
```

## Project structure

```text
backend/                     .NET solution, API, core models, and integration/unit tests
backend/nonproduction/       Opt-in .NET simulators excluded from the production API
frontend/                    Angular workspace and e2e suite
frontend/projects/cupola/    Main Angular application
frontend/projects/core/      Core frontend domain and infrastructure library
frontend/projects/components/Shared UI primitives and shell components
frontend/projects/api/       API and realtime gateway abstractions
docs/specs/                  Reverse-engineered Open MCT requirements baseline
docs/adr/                    Architecture decision records
docs/mocks/                  Mock assets and design-system artifacts
```

## Documentation

| Document | Purpose |
| --- | --- |
| [Open MCT requirements index](docs/specs/README.md) | Capability map and requirements baseline |
| [Requirements coverage map](docs/specs/source-coverage.md) | Source-to-requirement traceability |
| [Architecture decisions](docs/adr/0001-frontend-app-plus-feature-libraries.md) | ADR sequence for key architectural choices |
| [Design-system mocks](docs/mocks/design-system/README.md) | Mock design-system references |
| [Frontend workspace README](frontend/README.md) | Angular workspace commands |

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, workflow, and pull-request expectations. Participation is governed by the [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

Contributors are listed in [CONTRIBUTORS.md](CONTRIBUTORS.md), and notable repository changes are tracked in [CHANGELOG.md](CHANGELOG.md).

## Security

Please do not open public issues for security vulnerabilities. Follow [SECURITY.md](SECURITY.md) to report security concerns privately.

## Governance

Project roles and decision-making expectations are documented in [GOVERNANCE.md](GOVERNANCE.md).

## License

Copyright (c) 2026 Cupola contributors. Released under the [MIT License](LICENSE).
