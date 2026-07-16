# Cupola cross-capability contracts — draft for review

This document is the output of
[`cross-capability-contract-prompt.md`](cross-capability-contract-prompt.md). It fixes every
boundary between the sixteen capabilities C01–C16 defined in
[`docs/specs`](../specs/README.md), so that independent capability teams build in parallel,
merge into `main`, and rebase onto `main` along a predictable path.

Status: **draft**. The facilitator shall review each contract against the specifications,
resolve the open contracts listed in section 6, and commit the contract skeleton (section 3)
to `main` before the capabilities diverge. Entity shapes that already exist in the
repository are reproduced exactly; shapes the specifications leave open are marked
`<TO SUPPLY: ...>` rather than invented.

---

## 1. Boundary inventory

| ID | Providing capability | Consuming capabilities | Surface kind | Surface | Evidence |
| --- | --- | --- | --- | --- | --- |
| B01 | C02 Domain objects | C03–C15 (all) | Shared data | `Identifier`, key string, `DomainObject`, composition list | OMCT-C02-L2-01.01, 03.01 |
| B02 | C02 Domain objects | C03, C09, C13, C15 | Module API + transport | Object get/composition/update/observe: `ObjectsGateway`, `/api/objects/*`, `ObjectUpdated` hub event | OMCT-C02-L2-01.03–02.06 |
| B03 | C02 Domain objects | C13, C15 | Module API + transport | Federated search: `SearchGateway`, `/api/search`, `SearchResults` envelope (annotation hits supplied by C13) | OMCT-C02-L2-04.01–04.03 |
| B04 | C04 Persistence | C02 | Module API | Object store provider `IObjectStore`; `ObjectSaveResult`; `ConnectionState` | OMCT-C04-L2-01.02, 02.01–02.03, 02.05–02.07 |
| B05 | C05 Time | C06, C07, C08, C11, C12 | Module API | Time systems, bounds, clocks, mode, tick, time-change events | OMCT-C05-L2-01.01–01.05, 03.02 |
| B06 | C06 Telemetry | C07, C08, C10, C11, C12 | Module API + transport | Telemetry request/subscription, datum, metadata, value formatting: `TelemetryService`, `RealtimeGateway.telemetry`, `/hubs/realtime` | OMCT-C06-L2-01.01–03.04 |
| B07 | C06 Telemetry | C07, C08 | Module API | Limit and staleness evaluation | OMCT-C06-L2-04.03, 04.04 |
| B08 | C10 Conditions and filtering | C06 (options), C07, C08 | Shared data | Telemetry filter definitions propagated in request options | OMCT-C10-L2-04.01–04.03 |
| B09 | C10 Conditions and filtering | C09, C15 | Module API | Conditional styles applied to views and layout items | OMCT-C10-L2-02.01 |
| B10 | C13 Notebooks and annotations | C02, C11, C15 | Shared data + module API | `Annotation` model, tags, targets, annotation search | OMCT-C13-L2-04.01–04.06, OMCT-C11-L2-03.02 |
| B11 | C12 Planning and timelines | C07, C11 | Spec | Time-strip child-view contract: shared time axis, independent time context | OMCT-C12-L2-02.01–02.03 |
| B12 | C14 Operational awareness | C13, C15 | Module API | User identity and active role | OMCT-C14-L2-01.01–01.03, OMCT-C13-L2-01.03 |
| B13 | C14 Operational awareness | C15 | Module API | Notifications (info/alert/error/progress) and indicators (priority-ordered) | OMCT-C14-L2-04.01–05.03 |
| B14 | C15 UI shell | C03, C07–C14 | Module API | View, inspector-view, toolbar, and action registries; selection | OMCT-C15-L2-01.05, 02.01–03.05 |
| B15 | C15 UI shell | All UI capabilities | Design system | `components` library public API, theme keys, object glyphs | OMCT-C15-L2-05.01–05.03 |
| B16 | C15 UI shell | C03, C09 | Module API | Routing, URL search parameters, route events, request abort on route change | OMCT-C15-L2-01.01–01.04 |
| B17 | C16 Quality and delivery | C09, C10, C11, C13 | Module API + convention | Sanitization and safe-navigation utilities (URL, rich text, CSV, opener isolation, filename) | OMCT-C16-L2-04.01–04.07 |
| B18 | C01 Application lifecycle | All | Module API + convention | Application configuration, capability registration hook, `BuildInfo` | OMCT-C01-L2-01.01–01.05 |
| B19 | C15 UI shell | Shell consumers | Transport | Branding: `/api/branding`, `BrandingInfo`, `BuildInfo` | OMCT-C15-L2-05.03, OMCT-C16-L2-06.01 |

Boundaries follow seams already present in the repository: the `frontend/projects/core`
model and gateway layer, the `frontend/projects/api` gateway implementations, the `/api` and
`/hubs` transport between frontend and backend, and the `backend/src/Cupola.Core` model
layer.

---

## 2. Contract per boundary

Each contract states its path, owner, consumers, and stability. Only the named owner may
change a contract file. Stability **high** marks surfaces expected to change least; these
shall stabilize first.

### B01 — Shared domain-object model

Paths: `frontend/projects/core/src/lib/models/identifier.ts`,
`frontend/projects/core/src/lib/models/domain-object.ts`,
`backend/src/Cupola.Core/Models/Identifier.cs`,
`backend/src/Cupola.Core/Models/DomainObject.cs`
Owner: C02 · Consumers: C03–C15 · Stability: **high** (shared data model — stabilize first)

```ts
// frontend/projects/core/src/lib/models/identifier.ts
export interface Identifier {
  namespace: string;
  key: string;
}
// Key-string form: `${namespace}:${key}`; namespace-less keys serialize as `${key}`.
```

```ts
// frontend/projects/core/src/lib/models/domain-object.ts
import { Identifier } from './identifier';
import { TelemetryMetadata } from './telemetry-metadata';

export interface DomainObject {
  identifier: Identifier;
  keyString: string;
  name: string;
  type: string;                       // type key registered under B18
  location: string | null;            // keyString of the parent
  composition: string[];              // keyStrings of children, in order
  telemetry?: TelemetryMetadata | null;
  created?: string;                   // ISO 8601
  modified?: string;                  // ISO 8601
  createdBy?: string;
  version?: number;                   // optimistic-concurrency version, bumped per accepted save (B04)
  modifiedBy?: string;                // save provenance (open item 1, resolved for B04)
}
```

The C# records in `backend/src/Cupola.Core/Models/` mirror these shapes field for field and
serialize to camelCase JSON. `modifiedBy` and `version` join the shared shape for B04
conflict detection and save provenance. Open: the `persisted` timestamp named by
OMCT-C02-L2-02.02/02.03 is absent from the current shape —
`<TO SUPPLY: whether the persisted timestamp joins the shared shape in this baseline>`.

### B02 — Object retrieval, mutation, and observation

Paths: `frontend/projects/core/src/lib/gateways/objects-gateway.ts`,
`backend/src/Cupola.Api/Controllers/ObjectsController.cs` (routes),
`backend/src/Cupola.Api/Contracts/UpdateObjectRequest.cs`
Owner: C02 · Consumers: C03, C09, C13, C15 · Stability: high

```ts
// frontend/projects/core/src/lib/gateways/objects-gateway.ts
import { Observable } from 'rxjs';
import { Annotation } from '../models/annotation';
import { DomainObject } from '../models/domain-object';
import { ObjectSaveResult } from '../models/object-save-result';

export abstract class ObjectsGateway {
  abstract getObject(keyString: string): Observable<DomainObject>;
  abstract getComposition(keyString: string): Observable<DomainObject[]>;
  abstract getAnnotations(keyString: string): Observable<Annotation[]>;
  abstract updateObject(keyString: string, changes: { name: string }): Observable<DomainObject>;
  abstract saveObject(object: DomainObject): Observable<ObjectSaveResult>;        // B04
  abstract getObjects(keyStrings: string[]): Observable<DomainObject[]>;          // B04
  abstract saveObjects(objects: DomainObject[]): Observable<ObjectSaveResult[]>;  // B04
}
```

```text
HTTP routes (owner C02):
GET  /api/objects/{keyString}               -> 200 DomainObject | 404
GET  /api/objects/{keyString}/composition   -> 200 DomainObject[] | 404
GET  /api/objects/{keyString}/annotations   -> 200 Annotation[] | 404
PUT  /api/objects/{keyString}               body { "name": string } -> 200 DomainObject | 400 | 404

Persistence routes serving B04 (OMCT-C04-L2-02.01–02.03; owner C02, shapes owned by B04):
POST /api/objects                           body DomainObject -> 200 ObjectSaveResult | 409 ObjectSaveResult (conflict)
POST /api/objects/batch-get                 body { "keyStrings": string[] } -> 200 DomainObject[]
POST /api/objects/batch                     body DomainObject[] -> 200 ObjectSaveResult[]

Realtime (hub /hubs/realtime, method names owned by the contract skeleton):
client -> SubscribeToObject(keyString) / UnsubscribeFromObject(keyString)
server -> "ObjectUpdated"(DomainObject)   broadcast to group `object:{keyString}` after PUT
          and after every accepted POST save
```

Open: transaction commit/cancel semantics (OMCT-C02-L2-02.07) and composition mutation
routes (OMCT-C02-L2-03.02/03.03) — `<TO SUPPLY: authoring-transaction and
composition-mutation surface>`.

### B03 — Federated search

Paths: `frontend/projects/core/src/lib/gateways/search-gateway.ts`,
`frontend/projects/core/src/lib/models/search-results.ts`,
`backend/src/Cupola.Api/Contracts/SearchResponse.cs`
Owner: C02 · Consumers: C13 (annotation hits), C15 (shell search) · Stability: high

```ts
// frontend/projects/core/src/lib/gateways/search-gateway.ts
import { Observable } from 'rxjs';
import { SearchResults } from '../models/search-results';

export abstract class SearchGateway {
  abstract search(query: string): Observable<SearchResults>;
}
```

```ts
// frontend/projects/core/src/lib/models/search-results.ts
import { Annotation } from './annotation';
import { DomainObject } from './domain-object';

export interface SearchResults {
  objects: DomainObject[];
  annotations: Annotation[];
}
```

```text
GET /api/search?q={query} -> 200 { objects: DomainObject[], annotations: Annotation[] }
```

### B04 — Persistence provider

Path: `backend/src/Cupola.Core/Services/IObjectStore.cs`;
`backend/src/Cupola.Core/Services/ObjectSaveResult.cs`;
`frontend/projects/core/src/lib/models/object-save-result.ts`;
`frontend/projects/core/src/lib/models/connection-state.ts`
Owner: C04 · Consumers: C02 · Stability: medium

```csharp
// backend/src/Cupola.Core/Services/IObjectStore.cs — provider contract C02 routes against
public interface IObjectStore
{
    DomainObject? GetByKeyString(string keyString);
    IReadOnlyList<DomainObject>? GetComposition(string keyString);
    IReadOnlyList<Annotation>? GetAnnotationsFor(string keyString);
    DomainObject? UpdateName(string keyString, string name);
    IReadOnlyList<DomainObject> GetMany(IReadOnlyList<string> keyStrings);        // OMCT-C04-L2-02.02
    ObjectSaveResult Save(DomainObject domainObject);                             // OMCT-C04-L2-02.01
    IReadOnlyList<ObjectSaveResult> SaveMany(IReadOnlyList<DomainObject> domainObjects); // OMCT-C04-L2-02.03
    SearchResult Search(string? query);
}
```

```csharp
// backend/src/Cupola.Core/Services/ObjectSaveResult.cs — per-object save outcome
// Outcome is one of "created", "updated", "conflict"; on conflict, Object carries
// the current stored state (OMCT-C04-L2-02.03, OMCT-C04-L2-02.07).
public record ObjectSaveResult(string KeyString, string Outcome, DomainObject? Object);
```

```ts
// frontend/projects/core/src/lib/models/connection-state.ts (OMCT-C04-L2-02.06)
export type ConnectionState = 'pending' | 'connected' | 'disconnected' | 'unknown';
```

Save semantics: an unknown key string creates the object at version 1; a known key string
updates the object when the submitted `version` matches the stored `version`, and yields a
`conflict` outcome otherwise. The stored `version` increases by one per accepted save.

Change feed (OMCT-C04-L2-02.05, open item 4 resolved): the change-feed event is the
`ObjectUpdated`(`DomainObject`) hub broadcast defined under B02; consumers observe it
through `RealtimeGateway.objectUpdates(keyString)`. Connection-state vocabulary (open item
3 resolved): the four states above match OMCT-C04-L2-02.06.

### B05 — Time coordination

Path: `frontend/projects/core/src/lib/models/time.ts` (new),
`frontend/projects/core/src/lib/time/time-context.ts` (new)
Owner: C05 · Consumers: C06, C07, C08, C11, C12 · Stability: **high** (stabilize first)

```ts
// frontend/projects/core/src/lib/models/time.ts
export interface TimeSystem {
  key: string;
  name: string;
  timeFormat: string;          // key of a registered time format (OMCT-C05-L2-01.01)
}

export interface TimeBounds {
  start: number;               // inclusive, in time-system units
  end: number;                 // inclusive; end >= start shall hold (OMCT-C05-L2-01.03)
}

export type TimeMode = 'fixed' | 'realtime';

export interface ClockOffsets {
  start: number;               // negative offset from clock tick
  end: number;                 // positive offset from clock tick
}
```

```ts
// frontend/projects/core/src/lib/time/time-context.ts
import { Observable } from 'rxjs';
import { ClockOffsets, TimeBounds, TimeMode, TimeSystem } from '../models/time';

export abstract class TimeContext {
  abstract timeSystem(): TimeSystem;
  abstract bounds(): TimeBounds;
  abstract mode(): TimeMode;
  abstract clockOffsets(): ClockOffsets | null;
  abstract setTimeSystem(key: string, bounds?: TimeBounds): void;
  abstract setBounds(bounds: TimeBounds): void;                 // rejects end < start
  abstract boundsChanged(): Observable<TimeBounds>;             // OMCT-C05-L2-01.05
  abstract modeChanged(): Observable<TimeMode>;
  abstract tick(): Observable<number>;                          // clock ticks in realtime mode
}
// Views with independent time controls (C12 time strip) receive a TimeContext instance
// scoped to the view; the global context is the default (OMCT-C05-L2-02.01–02.03).
```

Open: tick value shape for telemetry-derived clocks (OMCT-C05-L2-03.05/03.06) and
time-of-interest events — `<TO SUPPLY: TOI and remote-clock surfaces>`.

### B06 — Telemetry request and subscription

Paths: `frontend/projects/core/src/lib/models/telemetry-value.ts`,
`frontend/projects/core/src/lib/models/telemetry-metadata.ts`,
`frontend/projects/core/src/lib/gateways/realtime-gateway.ts`,
`frontend/projects/core/src/lib/telemetry/telemetry-request.ts` (new),
`backend/src/Cupola.Api/Hubs/RealtimeHub.cs` (method and event names)
Owner: C06 · Consumers: C07, C08, C10, C11, C12 · Stability: **high** (stabilize first)

```ts
// frontend/projects/core/src/lib/models/telemetry-value.ts
export interface TelemetryValue {
  keyString: string;
  timestamp: string;           // ISO 8601 in the active time system
  value: number;
}
```

```ts
// frontend/projects/core/src/lib/models/telemetry-metadata.ts
export interface TelemetryMetadata {
  hints: string[];             // e.g. 'range', 'domain', 'image' (OMCT-C11-L2-01.01)
  unit?: string;
}
```

```ts
// frontend/projects/core/src/lib/telemetry/telemetry-request.ts
import { TimeBounds } from '../models/time';
import { TelemetryFilter } from '../models/telemetry-filter';

export interface TelemetryRequestOptions {
  bounds?: TimeBounds;         // defaults to the active time context (OMCT-C06-L2-01.03)
  strategy?: 'latest' | 'batch';   // OMCT-C06-L2-02.03–02.05
  filters?: TelemetryFilter[];     // B08, owned by C10
}
```

```text
Realtime transport (hub /hubs/realtime):
client -> SubscribeToTelemetry(keyString) / UnsubscribeFromTelemetry(keyString)
server -> "TelemetryReceived"(TelemetryValue)  to group `telemetry:{keyString}`

Historical transport (resolves open item #6):
GET /api/telemetry/{keyString}?start={ms}&end={ms} -> 200 TelemetryValue[] | 404
```

`RealtimeGateway` (existing, `frontend/projects/core/src/lib/gateways/realtime-gateway.ts`)
carries both B02 object updates and B06 telemetry; its file is part of the contract
skeleton:

```ts
export abstract class RealtimeGateway {
  abstract readonly connectionState: Signal<ConnectionState>;
  abstract connect(): void;
  abstract objectUpdates(keyString: string): Observable<DomainObject>;
  abstract telemetry(keyString: string): Observable<TelemetryValue>;
}
```

Resolved (open item #6): the historical route is `GET /api/telemetry/{keyString}` above; the
datum stays the scalar `TelemetryValue` (one domain field `timestamp`, one range field
`value`) with no envelope — a telemetry collection is an ordered `TelemetryValue[]` bounded by
the time context. The realtime event name is `"TelemetryReceived"` (aligns the doc to the
committed hub/gateway/simulator code).

### B07 — Limits and staleness

Path: `frontend/projects/core/src/lib/telemetry/limits.ts` (new)
Owner: C06 · Consumers: C07, C08 · Stability: medium

The specifications require limit evaluation (plot limit lines, gauge low/high limits, table
limit styling) (OMCT-C06-L2-04.03, OMCT-C07-L2-02.07, OMCT-C08-L2-03.03). Resolved (open item
#7): `limits.ts` exports the result shapes crossing the boundary —

```ts
export interface LimitEvaluation { level: string; name?: string; cssClass?: string; low?: number; high?: number; }
export interface StalenessEvent { keyString: string; isStale: boolean; timestamp: string; }
```

plus `LimitRange`/`LimitDefinition`. The `LimitProvider`/`StalenessProvider` interfaces and
their registries are C06-owned engine (`core/src/lib/telemetry/**`), not part of the boundary.

### B08 — Telemetry filters

Path: `frontend/projects/core/src/lib/models/telemetry-filter.ts` (new)
Owner: C10 · Consumers: C06 (request options), C07, C08 · Stability: medium

The specifications establish that filter definitions travel with telemetry requests and
persist per scope (OMCT-C10-L2-04.01–04.03) but do not enumerate the definition schema.
Open contract: `<TO SUPPLY: telemetry filter definition schema>`. Committed as a typed
placeholder referenced by `TelemetryRequestOptions` (B06).

### B09 — Conditional styles

Path: `frontend/projects/core/src/lib/models/conditional-style.ts` (new)
Owner: C10 · Consumers: C09, C15 (inspector styles pane) · Stability: medium

Open contract per OMCT-C10-L2-02.01/02.02: `<TO SUPPLY: conditional style properties
(background, border, text, visibility) and condition-output binding>`.

### B10 — Annotations

Path: `frontend/projects/core/src/lib/models/annotation.ts`
Owner: C13 · Consumers: C02 (search envelope), C11 (image annotations), C15 (inspector)
· Stability: high

```ts
// frontend/projects/core/src/lib/models/annotation.ts
export interface Annotation {
  keyString: string;
  text: string;
  targets: string[];           // keyStrings of annotated objects
  tags: string[];
  modified?: string;           // ISO 8601
}
```

Open: pixel-spatial target coordinates for image annotations (OMCT-C11-L2-03.02/03.03) and
tag comparator registration (OMCT-C13-L2-04.06) — `<TO SUPPLY: typed annotation target
schema per annotation type>`.

### B11 — Time-strip child-view contract

Path: `docs/capability-contracts/time-strip-children.md` (new, spec-kind contract)
Owner: C12 · Consumers: C07 (plots), C11 (imagery) · Stability: medium

A time-strip child view shall render against the `TimeContext` supplied by its container
(B05), align to the shared time axis, and expose no time controls of its own
(OMCT-C12-L2-02.01–02.03). Eligible children are time-based views: plots, plans, imagery,
and event views. The normative statement is this spec file; no code surface crosses the
boundary beyond B05 and B14.

### B12 — User identity

Path: `frontend/projects/core/src/lib/user/user.service.ts` (new),
`frontend/projects/core/src/lib/models/user.ts` (new)
Owner: C14 · Consumers: C13 (entry author), C15 (user indicator) · Stability: medium

```ts
// frontend/projects/core/src/lib/models/user.ts
export interface User {
  id: string;
  name: string;                // OMCT-C14-L2-01.01: identifier and name
}
```

```ts
// frontend/projects/core/src/lib/user/user.service.ts
import { Observable } from 'rxjs';
import { User } from '../models/user';

export abstract class UserService {
  abstract hasProvider(): boolean;                 // OMCT-C14-L2-01.01
  abstract currentUser(): Observable<User | null>;
  abstract activeRole(): Observable<string | null>; // OMCT-C14-L2-01.03
}
```

### B13 — Notifications and indicators

Path: `frontend/projects/core/src/lib/notifications/notification.service.ts` (new),
`frontend/projects/core/src/lib/notifications/indicator.ts` (new),
`frontend/projects/core/src/lib/faults/fault.ts` (new),
`frontend/projects/core/src/lib/faults/fault-provider.ts` (new)
Owner: C14 · Consumers: C15 (status bar) · Stability: medium

```ts
// frontend/projects/core/src/lib/notifications/notification.service.ts
export type NotificationSeverity = 'info' | 'alert' | 'error';   // OMCT-C14-L2-04.01

export interface ProgressUpdate {
  percent: number | null;     // null renders indeterminate progress
  text?: string;
}

export abstract class NotificationService {
  abstract info(message: string): void;
  abstract alert(message: string): void;
  abstract error(message: string): void;
  abstract progress(message: string): { update(p: ProgressUpdate): void; dismiss(): void };
}
```

```ts
// frontend/projects/core/src/lib/notifications/indicator.ts
export interface Indicator {
  key: string;
  priority: number;            // ordering in the status bar (OMCT-C14-L2-05.01)
  glyph?: string;
  text?: string;
}
```

```ts
// frontend/projects/core/src/lib/faults/fault.ts
export type FaultSeverity = 'CRITICAL' | 'WARNING' | 'WATCH';

export interface FaultValueInfo {
  value: number | string | null;
  rangeCondition?: string;
  monitoringResult?: string;
}

export interface Fault {
  id: string;                  // unique within its namespace
  name: string;
  namespace: string;
  triggerTime: string;         // ISO 8601
  severity: FaultSeverity;
  acknowledged: boolean;
  shelved: boolean;
  shortDescription?: string;
  seqNum?: number;
  currentValueInfo?: FaultValueInfo;
  triggerValueInfo?: FaultValueInfo;
}

export interface AcknowledgeOptions { comment?: string; }
export interface ShelveOptions { shelved: boolean; comment?: string; shelveDuration?: number; }
```

```ts
// frontend/projects/core/src/lib/faults/fault-provider.ts
export interface FaultProvider {
  supportsRequest(): boolean;
  supportsSubscribe(): boolean;
  request(): Promise<Fault[]>;                              // OMCT-C14-L2-03.01
  subscribe(onChange: (fault: Fault) => void): () => void;  // returns unsubscribe
  acknowledgeFault(fault: Fault, options?: AcknowledgeOptions): Promise<void>; // 03.03
  shelveFault(fault: Fault, options: ShelveOptions): Promise<void>;            // 03.04
}
```

Resolved: fault-management surface (OMCT-C14-L2-03.01–03.04) — a single provider serves a
single fault-management root, so `request`/`subscribe` are parameterless (Open MCT passes
the fault root domain object; with one root the parameter carries no information). Stubbed
behind `FakeFaultProvider` (`frontend/projects/api/src/lib/faults/fake-fault-provider.ts`,
delivered with C14).

### B14 — View, inspector, toolbar, and action registries

Paths (existing): `frontend/projects/core/src/lib/views/view-provider.ts`,
`frontend/projects/core/src/lib/views/inspector-view-provider.ts`,
`frontend/projects/core/src/lib/views/cupola-view.ts`,
`frontend/projects/core/src/lib/toolbars/toolbar-provider.ts`,
`frontend/projects/core/src/lib/actions/action.ts`,
`frontend/projects/core/src/lib/selection/selected-item.ts`
Owner: C15 · Consumers: C03 (actions), C07–C13 (views), C14 (indicators) · Stability: **high**

```ts
// frontend/projects/core/src/lib/views/view-provider.ts
export interface ViewProvider {
  key: string;
  name: string;
  glyph?: string;
  priority?: number;
  canView(object: DomainObject, objectPath: DomainObject[]): boolean;
  view(object: DomainObject, objectPath: DomainObject[]): CupolaView;
}
```

```ts
// frontend/projects/core/src/lib/views/inspector-view-provider.ts
export interface InspectorViewProvider {
  key: string;
  name: string;
  glyph: string;
  priority?: number;
  canView(selection: SelectedItem[]): boolean;
  view(selection: SelectedItem[]): CupolaView;
}
```

```ts
// frontend/projects/core/src/lib/actions/action.ts
export interface ActionContext {
  objectPath: DomainObject[];
  viewKey?: string;
  viewParentElement?: HTMLElement;
}

export interface Action {
  key: string;
  name: string;
  description?: string;
  glyph?: string;
  group?: string;
  priority?: number;
  showInStatusBar?: boolean;
  appliesTo?(context: ActionContext): boolean;
  invoke(context: ActionContext): void;
}
```

Providing capabilities register against these interfaces through the registries in
`frontend/projects/core/src/lib/views/*.service.ts`,
`.../toolbars/toolbar-registry.service.ts`, and `.../actions/action-registry.service.ts`;
registry service implementations remain C15-owned and shall not change the interface files
above without the B18-registration consumers being notified under section 5.

### B15 — Design system

Paths: `frontend/projects/components/src/public-api.ts` (library surface),
`frontend/projects/core/src/lib/theme/theme-key.ts`,
`frontend/projects/core/src/lib/models/object-glyph.ts`
Owner: C15 · Consumers: all UI capabilities · Stability: **high** (stabilize first)

The `components` library public API (tree, splitter, overlays, menus, forms, selection,
tooltips, views) and the theme-key and glyph vocabularies constitute the design-system
contract. Consuming capabilities shall import components only through
`frontend/projects/components/src/public-api.ts` and shall not restyle shared components
locally. Design references live in `docs/mocks/design-system/`.

### B16 — Routing and navigation

Paths (existing): `frontend/projects/core/src/lib/routing/route-events.service.ts`,
`frontend/projects/core/src/lib/routing/url-params.service.ts`,
`frontend/projects/core/src/lib/routing/abort-registry.ts`
Owner: C15 · Consumers: C03 (navigation actions), C09 (hyperlinks) · Stability: medium

Browse navigation addresses an object by key-string path; in-flight requests registered
with the abort registry are cancelled on route change (OMCT-C15-L2-01.01). Open: the full
route schema beyond browse paths — `<TO SUPPLY: route schema for non-browse views>`.

### B17 — Sanitization and safe navigation

Path: `frontend/projects/core/src/lib/security/sanitizers.ts` (new)
Owner: C16 · Consumers: C09 (hyperlink, web page), C10 (widget URLs), C11 (image open/save),
C13 (rich text) · Stability: high

```ts
// frontend/projects/core/src/lib/security/sanitizers.ts
export declare function sanitizeUrl(url: string): string | null;        // OMCT-C16-L2-04.01
export declare function sanitizeRichText(html: string): string;         // OMCT-C16-L2-04.02
export declare function neutralizeCsvCell(value: string): string;       // OMCT-C16-L2-04.03
export declare function sanitizeFilename(name: string): string;         // OMCT-C16-L2-04.07
export declare function openExternal(url: string): void;                // noopener,noreferrer
```

Consuming capabilities shall route every externally supplied URL, rich-text fragment, CSV
cell, and download filename through these functions; direct use of `window.open` or
unsanitized `innerHTML` is non-conforming.

### B18 — Application bootstrap and registration

Paths (existing): `frontend/projects/core/src/lib/config/cupola-config.ts`,
`frontend/projects/core/src/lib/models/build-info.ts`,
`backend/src/Cupola.Api/Program.cs` (composition root)
Owner: C01 · Consumers: all · Stability: high

```ts
// frontend/projects/core/src/lib/models/build-info.ts
export interface BuildInfo {
  version: string;
  buildDate: string;
  revision: string;
  branch: string;              // OMCT-C01-L2-01.05
}
```

Each capability contributes providers (views, actions, toolbars, gateways) through Angular
provider registration in its own feature directory; `cupola-config.ts` carries the shared
configuration shape. Open: a formal plugin-function signature (OMCT-C01-L2-01.01) —
`<TO SUPPLY: whether a plugin-install abstraction beyond Angular DI is in scope>`.

### B19 — Branding transport

Paths (existing): `frontend/projects/core/src/lib/models/branding-info.ts`,
`frontend/projects/core/src/lib/gateways/branding-gateway.ts`,
`backend/src/Cupola.Api/Controllers/BrandingController.cs`
Owner: C15 · Consumers: shell, about dialog (C16 disclosure) · Stability: high

```ts
export interface BrandingInfo {
  appTitle: string;
  tagline: string;
  smallLogoImage: string;
  aboutHtml: string;
  licenseUrl: string;
}
```

```text
GET /api/branding -> 200 { branding: BrandingInfo, buildInfo: BuildInfo }
   (exact envelope per BrandingController; the controller is the authority)
```

---

## 3. Committable contract skeleton

The skeleton is the set of files below. Files marked *existing* are already on `main` and
are adopted into the skeleton unchanged; files marked *new* shall be committed before any
capability diverges. Behind each contract stands a stub so a consuming capability builds
and tests before the provider finishes.

| Path | State | Content | Stub behind it |
| --- | --- | --- | --- |
| `frontend/projects/core/src/lib/models/identifier.ts` | existing | B01 | seeded fixtures `frontend/e2e/fixtures/objects.json` |
| `frontend/projects/core/src/lib/models/domain-object.ts` | existing | B01 | same |
| `frontend/projects/core/src/lib/models/annotation.ts` | existing | B10 | `frontend/e2e/fixtures/annotations.json` |
| `frontend/projects/core/src/lib/models/telemetry-value.ts` | existing | B06 | `FakeRealtimeGateway` |
| `frontend/projects/core/src/lib/models/telemetry-metadata.ts` | existing | B06 | seeded fixtures |
| `frontend/projects/core/src/lib/models/search-results.ts` | existing | B03 | `frontend/e2e/support/fake-backend.ts` |
| `frontend/projects/core/src/lib/models/connection-state.ts` | existing | B04 | `FakeRealtimeGateway` |
| `frontend/projects/core/src/lib/models/object-save-result.ts` | existing | B04 | `frontend/e2e/support/fake-backend.ts` |
| `frontend/projects/core/src/lib/models/build-info.ts` | existing | B18 | `frontend/e2e/fixtures/build-info.json` |
| `frontend/projects/core/src/lib/models/branding-info.ts` | existing | B19 | `frontend/e2e/fixtures/branding.json` |
| `frontend/projects/core/src/lib/models/time.ts` | new | B05 | `FakeTimeContext` (below) |
| `frontend/projects/core/src/lib/models/telemetry-filter.ts` | new | B08 placeholder | n/a until resolved |
| `frontend/projects/core/src/lib/models/conditional-style.ts` | new | B09 placeholder | n/a until resolved |
| `frontend/projects/core/src/lib/models/user.ts` | new | B12 | `FakeUserService` (below) |
| `frontend/projects/core/src/lib/gateways/objects-gateway.ts` | existing | B02 | `frontend/e2e/support/fake-backend.ts` |
| `frontend/projects/core/src/lib/gateways/search-gateway.ts` | existing | B03 | same |
| `frontend/projects/core/src/lib/gateways/realtime-gateway.ts` | existing | B02/B06 | `frontend/projects/api/src/lib/realtime/fake-realtime-gateway.ts` |
| `frontend/projects/core/src/lib/gateways/branding-gateway.ts` | existing | B19 | fixture-backed fake |
| `frontend/projects/core/src/lib/time/time-context.ts` | new | B05 | `FakeTimeContext` |
| `frontend/projects/core/src/lib/telemetry/telemetry-request.ts` | new | B06 | `FakeRealtimeGateway` |
| `frontend/projects/core/src/lib/telemetry/limits.ts` | new | B07 placeholder | n/a until resolved |
| `frontend/projects/core/src/lib/user/user.service.ts` | new | B12 | `FakeUserService` |
| `frontend/projects/core/src/lib/notifications/notification.service.ts` | new | B13 | `FakeNotificationService` |
| `frontend/projects/core/src/lib/notifications/indicator.ts` | new | B13 | same |
| `frontend/projects/core/src/lib/faults/fault.ts` | new | B13 | `FakeFaultProvider` (`frontend/projects/api/src/lib/faults/fake-fault-provider.ts`, delivered with C14) |
| `frontend/projects/core/src/lib/faults/fault-provider.ts` | new | B13 | same |
| `frontend/projects/core/src/lib/security/sanitizers.ts` | new | B17 | pass-through test doubles in unit tests |
| `frontend/projects/core/src/lib/views/view-provider.ts` | existing | B14 | registry fakes in existing specs |
| `frontend/projects/core/src/lib/views/inspector-view-provider.ts` | existing | B14 | same |
| `frontend/projects/core/src/lib/actions/action.ts` | existing | B14 | same |
| `frontend/projects/core/src/lib/toolbars/toolbar-provider.ts` | existing | B14 | same |
| `backend/src/Cupola.Core/Models/*.cs` | existing | B01/B06/B10/B18/B19 | `SeedData.cs` |
| `backend/src/Cupola.Core/Services/IObjectStore.cs`, `ObjectSaveResult.cs` | existing | B04 | `InMemoryObjectStore.cs` (C04) |
| `backend/src/Cupola.Api/Contracts/*.cs` | existing | B02/B03 | integration-test fixtures |
| `backend/src/Cupola.Api/Hubs/RealtimeHub.cs` | existing | B02/B06 method names | `TelemetrySimulator.cs` (C06) |
| `docs/capability-contracts/time-strip-children.md` | new | B11 | n/a (spec) |

New stub files, committed with the skeleton:

```ts
// frontend/projects/api/src/lib/time/fake-time-context.ts
import { Observable, ReplaySubject } from 'rxjs';
import { ClockOffsets, TimeBounds, TimeMode, TimeSystem, TimeContext } from 'core';

export class FakeTimeContext extends TimeContext {
  private readonly bounds$ = new ReplaySubject<TimeBounds>(1);
  private readonly mode$ = new ReplaySubject<TimeMode>(1);
  private current: { system: TimeSystem; bounds: TimeBounds; mode: TimeMode } = {
    system: { key: 'utc', name: 'UTC', timeFormat: 'iso' },
    bounds: { start: 0, end: 0 },
    mode: 'fixed',
  };
  timeSystem(): TimeSystem { return this.current.system; }
  bounds(): TimeBounds { return this.current.bounds; }
  mode(): TimeMode { return this.current.mode; }
  clockOffsets(): ClockOffsets | null { return null; }
  setTimeSystem(key: string, bounds?: TimeBounds): void { /* test hook */ }
  setBounds(bounds: TimeBounds): void {
    if (bounds.end < bounds.start) { throw new Error('end < start'); }
    this.current.bounds = bounds;
    this.bounds$.next(bounds);
  }
  boundsChanged(): Observable<TimeBounds> { return this.bounds$.asObservable(); }
  modeChanged(): Observable<TimeMode> { return this.mode$.asObservable(); }
  tick(): Observable<number> { return new ReplaySubject<number>(1).asObservable(); }
}
```

```ts
// frontend/projects/api/src/lib/user/fake-user.service.ts
import { Observable, of } from 'rxjs';
import { User, UserService } from 'core';

export class FakeUserService extends UserService {
  constructor(private readonly user: User | null = { id: 'operator', name: 'Operator' }) { super(); }
  hasProvider(): boolean { return this.user !== null; }
  currentUser(): Observable<User | null> { return of(this.user); }
  activeRole(): Observable<string | null> { return of(null); }
}
```

```ts
// frontend/projects/api/src/lib/notifications/fake-notification.service.ts
import { NotificationService, ProgressUpdate } from 'core';

export class FakeNotificationService extends NotificationService {
  readonly log: { severity: string; message: string }[] = [];
  info(message: string): void { this.log.push({ severity: 'info', message }); }
  alert(message: string): void { this.log.push({ severity: 'alert', message }); }
  error(message: string): void { this.log.push({ severity: 'error', message }); }
  progress(message: string) {
    this.log.push({ severity: 'progress', message });
    return { update: (_: ProgressUpdate) => {}, dismiss: () => {} };
  }
}
```

Placeholder contract files (B07, B08, B09) shall be committed containing only the open-
contract marker and an exported empty interface, so imports compile while the surface is
resolved.

---

## 4. Ownership map

Every path belongs to exactly one owner. "Skeleton" denotes the contract skeleton, owned by
spec management; only spec management merges changes under skeleton paths, on request of
the contract's owning capability (section 5). Paths not listed follow their nearest listed
ancestor.

| Path | Owner |
| --- | --- |
| `AGENTS.md`, `README.md`, `docs/specs/**`, `docs/adr/**`, `docs/detailed-designs/**`, `docs/capability-contracts/**` | Skeleton (spec management) |
| `docs/mocks/**` | C15 |
| `frontend/projects/core/src/lib/models/**` | Skeleton |
| `frontend/projects/core/src/lib/gateways/**` | Skeleton |
| `frontend/projects/core/src/lib/time/time-context.ts` | Skeleton |
| `frontend/projects/core/src/lib/time/**` (rest) | C05 |
| `frontend/projects/core/src/lib/telemetry/telemetry-request.ts`, `.../limits.ts` | Skeleton |
| `frontend/projects/core/src/lib/telemetry/**` (rest) | C06 |
| `frontend/projects/core/src/lib/user/user.service.ts` | Skeleton |
| `frontend/projects/core/src/lib/user/**` (rest) | C14 |
| `frontend/projects/core/src/lib/notifications/notification.service.ts`, `.../indicator.ts` | Skeleton |
| `frontend/projects/core/src/lib/notifications/**` (rest) | C14 |
| `frontend/projects/core/src/lib/faults/fault.ts`, `.../fault-provider.ts` | Skeleton |
| `frontend/projects/core/src/lib/faults/**` (rest) | C14 |
| `frontend/projects/core/src/lib/security/**` | C16 |
| `frontend/projects/core/src/lib/views/view-provider.ts`, `inspector-view-provider.ts`, `cupola-view.ts` | Skeleton |
| `frontend/projects/core/src/lib/views/**` (registries) | C15 |
| `frontend/projects/core/src/lib/actions/action.ts` | Skeleton |
| `frontend/projects/core/src/lib/actions/**` (rest) | C15 |
| `frontend/projects/core/src/lib/toolbars/toolbar-provider.ts`, `toolbar-control.ts` | Skeleton |
| `frontend/projects/core/src/lib/toolbars/**` (rest) | C15 |
| `frontend/projects/core/src/lib/selection/**`, `routing/**`, `theme/**`, `adaptive/**`, `branding/**` | C15 |
| `frontend/projects/core/src/lib/objects/**` | C02 |
| `frontend/projects/core/src/lib/config/**` | C01 |
| `frontend/projects/core/src/public-api.ts` | Skeleton |
| `frontend/projects/api/src/lib/objects/**`, `.../search/**` | C02 |
| `frontend/projects/api/src/lib/realtime/signalr-realtime-gateway.ts` | C06 |
| `frontend/projects/api/src/lib/realtime/fake-realtime-gateway.ts`, `cupola-e2e-hook.ts` | Skeleton |
| `frontend/projects/api/src/lib/branding/**` | C15 |
| `frontend/projects/api/src/lib/time/**`, `.../user/**`, `.../notifications/**` (fakes) | Skeleton |
| `frontend/projects/api/src/lib/faults/**` | C14 |
| `frontend/projects/api/src/public-api.ts` | Skeleton |
| `frontend/projects/components/**` | C15 |
| `frontend/projects/cupola/src/app/shell/**` | C15 |
| `frontend/projects/cupola/src/app/shell/conductor/**` | C05 |
| `frontend/projects/cupola/src/app/browse/**` | C15 |
| `frontend/projects/cupola/src/app/inspector/**` | C15 |
| `frontend/projects/cupola/src/app/inspector/plot-series/**` | C07 |
| `frontend/projects/cupola/src/app/inspector/annotations/**` | C13 |
| `frontend/projects/cupola/src/app/inspector/styles/**` | C10 |
| `frontend/projects/cupola/src/app/actions/**` | C03 |
| `frontend/projects/cupola/src/app/toolbars/**` | C15 |
| `frontend/projects/cupola/src/app/views/plot/**` | C07 |
| `frontend/projects/cupola/src/app/views/table/**` | C08 |
| `frontend/projects/cupola/src/app/views/imagery/**` | C11 |
| `frontend/projects/cupola/src/app/views/folder/**` | C09 |
| `frontend/projects/cupola/src/app/views/generic/**` | C15 |
| New feature directories, one per capability (e.g. `app/plans/**` C12, `app/notebook/**` C13, `app/conditions/**` C10, `app/faults/**` C14, `app/layouts/**` C09) | The named capability |
| `frontend/projects/cupola/src/app/operational/**` (C14 non-fault UI: indicators, operator status, notification area) | C14 |
| `backend/src/Cupola.Core/Models/**` | Skeleton |
| `backend/src/Cupola.Core/Services/IObjectStore.cs`, `SearchResult.cs`, `ObjectSaveResult.cs` | Skeleton |
| `backend/src/Cupola.Core/Services/InMemoryObjectStore.cs`, `SeedData.cs` | C04 |
| `backend/src/Cupola.Api/Contracts/**` | Skeleton |
| `backend/src/Cupola.Api/Hubs/RealtimeHub.cs` | Skeleton |
| `backend/src/Cupola.Api/Controllers/ObjectsController.cs`, `SearchController.cs` | C02 |
| `backend/src/Cupola.Api/Controllers/BrandingController.cs` | C15 |
| `backend/src/Cupola.Api/Services/TelemetrySimulator.cs` | C06 |
| `backend/src/Cupola.Api/Program.cs` | C01 |
| `backend/tests/**` | The capability owning the code under test; shared harness files skeleton |
| `frontend/e2e/**` | C16 |
| Workspace and build configuration (`frontend/angular.json`, `package.json`, `jest.config.js`, `playwright.config.ts`, `tsconfig*.json`, `backend/Cupola.sln`, `global.json`, CI workflows) | C16 |

Capability owners per C01–C16: `<TO SUPPLY: owner per capability, from the facilitator's
capability list>`.

---

## 5. Change-and-rebase protocol

### a. Changing a contract

1. The owning capability drafts the change against the committed contract file and records
   the affected consumers from the boundary inventory (section 1).
2. The owner submits the change as a dedicated pull request to `main` touching only
   skeleton paths; spec management reviews and merges it. A contract change shall not ride
   inside a capability merge.
3. Spec management announces the merged change to every consuming capability named in the
   inventory before any dependent capability merge proceeds.
4. Each consumer rebases per step (c) and adapts to the new contract in its own files.

### b. Merging a completed capability

5. The capability branch shall touch only files the ownership map assigns to that
   capability. A diff touching skeleton paths or another capability's paths blocks the
   merge until the offending change moves through step (a) or is dropped.
6. The owner rebases the branch onto current `main` (step c), runs the applicable gates —
   `npm run test` and `npm run e2e` from `frontend/`, `dotnet test backend/Cupola.sln` —
   and merges. Because capabilities edit disjoint files, sequential merges do not conflict.

### c. Rebasing an in-progress capability

7. The owner rebases onto `main` after any other capability merges. The rebase replays the
   capability's commits over files no other capability edits; the only incoming changes it
   can encounter are contract-skeleton changes.
8. A clean rebase is the default outcome. Any conflict signals an unannounced contract
   change: the owner resolves it by taking the committed contract from `main` as authority
   and adapting capability code to it — never by patching the contract locally.
9. After the rebase, the owner re-runs the gates in step 6 before continuing work.

---

## 6. Open contracts to resolve

The specifications are silent on the following surfaces that two capabilities exchange.
The facilitator shall resolve each before the consuming capability builds against it; none
has been invented here.

| # | Surface | Boundary | Blocking |
| --- | --- | --- | --- |
| 1 | Save provenance `persisted` timestamp in the shared object shape (`modifiedBy` and `version` resolved under B01/B04) | B01 | C02 |
| 2 | Authoring transaction and composition-mutation routes | B02 | C03 |
| 5 | Time-of-interest and telemetry-derived clock surfaces | B05 | C05/C06 |
| 8 | Telemetry filter definition schema | B08 | C10 |
| 9 | Conditional style schema | B09 | C09, C10 |
| 10 | Typed annotation target schema (including image pixel coordinates) | B10 | C11, C13 |
| 12 | Route schema for non-browse views | B16 | C09, C15 |
| 13 | Plugin-install abstraction beyond Angular DI | B18 | C01 |

Items 3 (connection-state vocabulary) and 4 (persistence change-feed event shape) are
resolved in the B04 contract; items 6 (historical telemetry route + datum/collection envelope)
and 7 (limit/staleness shapes) are resolved in the B06/B07 contracts by C06; item 11 (fault
object shape and fault-provider interface) is resolved in the B13 contract by C14. Item
numbering is stable, so the resolved rows are removed without renumbering the rest.
