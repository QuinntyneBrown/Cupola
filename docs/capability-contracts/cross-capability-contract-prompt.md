# Cupola cross-capability contract drafting prompt

This prompt instantiates the
[Cross-Capability Contract Drafting Prompt](https://github.com/QuinntyneBrown/ai-hackathon-playbook/blob/main/playbooks/cross-capability-contract-prompt.md)
template for the Cupola repository. The facilitator issues the prompt below to draft the
cross-capability contracts, the ownership map, and the change-and-rebase protocol, then
reviews the output and commits the resulting contract skeleton to `main` before the
capabilities diverge.

## Inputs

| Field | Value |
| --- | --- |
| `{{PER_CAPABILITY_SPECS}}` | The per-capability requirement documents `docs/specs/C01` through `docs/specs/C16`, indexed by `docs/specs/README.md`, with sequence-level detailed designs under `docs/detailed-designs/` |
| `{{CAPABILITY_LIST}}` | Capabilities C01–C16 as listed in `docs/specs/README.md`; owners `<TO SUPPLY: assigned owner per capability>` |
| `{{STARTER_TEMPLATE}}` | The Cupola repository: an Angular 21 workspace under `frontend/` (`projects/cupola` app plus `projects/core`, `projects/components`, and `projects/api` libraries) and an ASP.NET Core 8 solution under `backend/` (`src/Cupola.Api`, `src/Cupola.Core`, `tests/`) |
| `{{REPO_CONVENTIONS}}` | Agent guidance in `AGENTS.md`; formatting via `frontend/.editorconfig` and `frontend/.prettierrc`; frontend tests `npm run test` (Jest) and `npm run e2e` (Playwright) from `frontend/`; backend tests `dotnet test backend/Cupola.sln` |
| `{{TARGET_BRANCH}}` | `main` |

## The prompt

```text
You are drafting the cross-capability contracts for a product built in parallel by
independent capability teams, each driving several coding agents. A clear specification
exists for every capability. Derive, from those specifications, the set of contracts that
fixes every boundary between capabilities, so that two developers who never speak can each
build a capability, merge it into a shared branch alongside other capabilities, and rebase
an in-progress capability onto that branch after others have merged — without their agents
inventing conflicting versions of any shared surface.

Inputs:
- Per-capability specifications: the requirement documents docs/specs/C01-application-lifecycle-and-extensibility.md
  through docs/specs/C16-quality-and-delivery.md, indexed by docs/specs/README.md, with
  supporting sequence-level detailed designs under docs/detailed-designs/.
- Capabilities and their owners:
  - C01 — Application lifecycle and extensibility: <TO SUPPLY: owner>
  - C02 — Domain objects, types, composition, and discovery: <TO SUPPLY: owner>
  - C03 — Object authoring and data portability: <TO SUPPLY: owner>
  - C04 — Persistence and synchronization: <TO SUPPLY: owner>
  - C05 — Time coordination and time utilities: <TO SUPPLY: owner>
  - C06 — Telemetry integration and processing: <TO SUPPLY: owner>
  - C07 — Plot and chart visualization: <TO SUPPLY: owner>
  - C08 — Tabular, gauge, and datum visualization: <TO SUPPLY: owner>
  - C09 — Layout and embedded-content presentation: <TO SUPPLY: owner>
  - C10 — Conditions, derived telemetry, and filtering: <TO SUPPLY: owner>
  - C11 — Imagery visualization and interaction: <TO SUPPLY: owner>
  - C12 — Planning, timelines, events, and activities: <TO SUPPLY: owner>
  - C13 — Notebooks and annotations: <TO SUPPLY: owner>
  - C14 — Operational awareness and collaboration: <TO SUPPLY: owner>
  - C15 — User-interface shell and interaction services: <TO SUPPLY: owner>
  - C16 — Compatibility, accessibility, security, and delivery: <TO SUPPLY: owner>
- Starter template and repository layout: the Cupola repository — an Angular 21 workspace
  under frontend/ containing the main application (frontend/projects/cupola) and the
  frontend/projects/core, frontend/projects/components, and frontend/projects/api
  libraries, plus a Playwright e2e suite under frontend/e2e; and an ASP.NET Core 8
  solution under backend/ containing backend/src/Cupola.Api, backend/src/Cupola.Core,
  and backend/tests. The frontend proxies /api and /hubs traffic to the backend, which
  serves seeded domain objects and real-time telemetry over SignalR.
- Repository conventions: agent guidance in AGENTS.md (architecture documentation shall
  conform to the Architecture Description Style Guide); formatting governed by
  frontend/.editorconfig and frontend/.prettierrc; frontend unit tests run with
  `npm run test` (Jest) and e2e tests with `npm run e2e` (Playwright) from frontend/;
  backend tests run with `dotnet test backend/Cupola.sln`.
- Target integration branch: main

Produce the following, in order.

1. Boundary inventory. From the specifications, list every boundary where one capability
   consumes another. For each boundary, name the providing capability, the consuming
   capability or capabilities, and the kind of surface exchanged — shared data, module API,
   transport, design system, navigation, identity, spec, or convention.

2. Contract per boundary. For each boundary, draft the contract as code, not prose: the
   exact entity shapes, type and function signatures, routes and request/response schemas,
   events, component props, or design tokens crossing it. State the single owning capability
   that may change the contract and the consuming capabilities. Mark each contract's
   stability — the surfaces expected to change least (typically the shared data model and the
   design system) shall be identified so they stabilize first.

3. Committable contract skeleton. Emit the contracts as files that can be committed to
   main before any capability diverges — type and entity definitions, interface
   declarations, route and schema stubs, design tokens, and component signatures. Behind each
   contract, emit a stub (a mock, a fake, or a fixture) so a consuming capability builds and
   tests before the providing capability is finished. Place every file at a concrete path in
   the repository layout.

4. Ownership map. Assign every file and directory to exactly one owner: either a single
   capability, or the contract skeleton owned by spec management. No file may be owned by two
   capabilities. This map is what makes parallel merges and rebases conflict-free by
   construction: capabilities edit disjoint files, and the only shared files are the
   contracts, which change rarely and through one owner.

5. Change-and-rebase protocol. Define, as numbered steps:
   a. How a contract change is made — once, in the committed contract, by its owner — and
      announced to every consuming capability before it merges.
   b. How a completed capability merges into main alongside others.
   c. How an in-progress capability rebases onto main after other capabilities
      have merged. Make explicit which files a rebase can touch — the contract skeleton only —
      so a clean rebase is the default and any conflict signals an unannounced contract change
      to resolve against the committed contract rather than patch locally.

Constraints:
- Define only cross-capability surfaces. Contracts internal to a single capability are out of
  scope and are defined by the team that owns the capability.
- Every contract shall be precise enough that an agent on either side builds against it
  without consulting the other team.
- Prefer boundaries that follow seams already present in the Cupola repository layout — the
  frontend/projects/api and frontend/projects/core library boundaries, the /api and /hubs
  transport boundary between frontend and backend, and the backend/src/Cupola.Core model
  boundary.
- Do not invent capabilities, entities, or routes absent from the specifications. Where a
  specification is silent on a surface two capabilities must exchange, flag it as an open
  contract to resolve rather than filling it in.

Output format:
- The boundary inventory as a table.
- Each contract as a fenced code block preceded by its path, owner, consumers, and stability.
- The ownership map as a table of path to owner.
- The change-and-rebase protocol as numbered steps.
```
