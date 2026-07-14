# C02 — Domain objects, types, composition, and discovery

## OMCT-C02-L1-01 — Typed and identifiable domain objects

Open MCT shall manage domain objects through stable identifiers, registered types, and
namespace-specific providers.

### OMCT-C02-L2-01.01 — Identifier conversion

Open MCT shall convert between `{ namespace, key }` identifiers and key strings without
losing either component.

Acceptance criteria:

- **GIVEN** a valid identifier or key string
- **WHEN** an extension converts and reconverts the value
- **THEN** Open MCT shall preserve the namespace and key

Implementation evidence: `src/api/objects/object-utils.js`,
`src/api/objects/test/object-utilsSpec.js`.

### OMCT-C02-L2-01.02 — Type registration and retrieval

Open MCT shall register domain-object type definitions by unique type key.

Acceptance criteria:

- **GIVEN** a type key and definition
- **WHEN** an extension adds the type and retrieves that key
- **THEN** Open MCT shall return the standardized registered type

Implementation evidence: `src/api/types/TypeRegistry.js`, `src/api/types/TypeRegistrySpec.js`.

### OMCT-C02-L2-01.03 — Provider routing

Open MCT shall route object operations to the provider registered for the identifier
namespace.

Acceptance criteria:

- **GIVEN** an identifier in a registered namespace
- **WHEN** an extension gets, creates, or updates the object
- **THEN** Open MCT shall invoke the corresponding namespace provider operation

Implementation evidence: `src/api/objects/ObjectAPI.js`, `src/api/objects/NamespaceProvider.js`.

### OMCT-C02-L2-01.04 — Concurrent-get coalescing

Open MCT shall coalesce simultaneous requests for the same object.

Acceptance criteria:

- **GIVEN** unresolved retrieval of one identifier
- **WHEN** another consumer requests the same identifier
- **THEN** Open MCT shall share the in-flight provider request

Implementation evidence: `src/api/objects/ObjectAPI.js`, `src/api/objects/ObjectAPISpec.js`.

### OMCT-C02-L2-01.05 — Retrieval interception

Open MCT shall apply matching object interceptors to retrieved domain objects.

Acceptance criteria:

- **GIVEN** a provider response and an applicable interceptor
- **WHEN** object retrieval resolves
- **THEN** Open MCT shall return the intercepted domain object

Implementation evidence: `src/api/objects/InterceptorRegistry.js`,
`src/api/objects/ObjectAPISpec.js`.

### OMCT-C02-L2-01.06 — Missing-object representation

Open MCT shall represent unavailable referenced objects with a missing-object placeholder.

Acceptance criteria:

- **GIVEN** a reference whose provider returns no domain object
- **WHEN** the missing-object interceptor processes the reference
- **THEN** Open MCT shall return a domain object identified as missing

Implementation evidence: `src/plugins/interceptors/missingObjectInterceptor.js`,
`src/plugins/interceptors/pluginSpec.js`.

## OMCT-C02-L1-02 — Domain-object lifecycle

Open MCT shall preserve object identity, change state, provenance, and transactional editing
throughout the domain-object lifecycle.

### OMCT-C02-L2-02.01 — Create and update selection

Open MCT shall call `create` for a new domain object and `update` for an existing domain
object.

Acceptance criteria:

- **GIVEN** a persistable object with or without a persisted timestamp
- **WHEN** the object is saved
- **THEN** Open MCT shall select the provider operation that corresponds to the object's
  persistence state

Implementation evidence: `src/api/objects/ObjectAPI.js`, `src/api/objects/ObjectAPISpec.js`.

### OMCT-C02-L2-02.02 — Persistence timestamps

Open MCT shall record creation and persistence timestamps during successful saves.

Acceptance criteria:

- **GIVEN** a provider accepts an object save
- **WHEN** save completes
- **THEN** Open MCT shall set the applicable `created` and `persisted` timestamps without
  placing `persisted` before `modified`

Implementation evidence: `src/api/objects/ObjectAPI.js`, `src/api/objects/ObjectAPISpec.js`.

### OMCT-C02-L2-02.03 — User provenance

Open MCT shall associate available active-user identity with object creation and
modification.

Acceptance criteria:

- **GIVEN** an active user and a domain object being saved
- **WHEN** the save creates or updates the object
- **THEN** Open MCT shall populate `createdBy` for creation or `modifiedBy` for update

Implementation evidence: `src/api/objects/ObjectAPI.js`, `src/api/objects/ObjectAPISpec.js`.

### OMCT-C02-L2-02.04 — Unchanged-object suppression

Open MCT shall avoid persisting an object whose serializable state has not changed.

Acceptance criteria:

- **GIVEN** a mutable domain object equal to its last persisted state
- **WHEN** a save is requested
- **THEN** Open MCT shall not call the provider update operation

Implementation evidence: `src/api/objects/ObjectAPI.js`, `src/api/objects/ObjectAPISpec.js`.

### OMCT-C02-L2-02.05 — Mutable observation

Open MCT shall notify observers of matching domain-object property changes.

Acceptance criteria:

- **GIVEN** a mutable domain object with an observer on a property path
- **WHEN** that property or a matching child property changes
- **THEN** Open MCT shall invoke the observer with the changed value

Implementation evidence: `src/api/objects/MutableDomainObject.js`,
`src/api/objects/ObjectAPISpec.js`.

### OMCT-C02-L2-02.06 — Provider synchronization

Open MCT shall synchronize mutable domain objects with provider-originated change events.

Acceptance criteria:

- **GIVEN** a mutable object backed by an observing provider
- **WHEN** the provider reports a change or refresh is requested
- **THEN** Open MCT shall update the live mutable object

Implementation evidence: `src/api/objects/MutableDomainObject.js`,
`src/api/objects/ObjectAPISpec.js`.

### OMCT-C02-L2-02.07 — Transaction commit and cancel

Open MCT shall commit or cancel all dirty objects as one active editing transaction.

Acceptance criteria:

- **GIVEN** an active transaction containing dirty objects
- **WHEN** the transaction is committed or cancelled
- **THEN** Open MCT shall save all dirty objects on commit or clear them without save on
  cancel

Implementation evidence: `src/api/objects/Transaction.js`, `src/api/objects/TransactionSpec.js`.

## OMCT-C02-L1-03 — Composition and hierarchy

Open MCT shall expose provider-backed and model-backed object hierarchies with controlled
membership and ordering.

### OMCT-C02-L2-03.01 — Composition availability

Open MCT shall return no composition collection for an object unsupported by every
composition provider.

Acceptance criteria:

- **GIVEN** a domain object with no matching composition provider
- **WHEN** a consumer requests its composition
- **THEN** Open MCT shall return a falsy result

Implementation evidence: `src/api/composition/CompositionAPI.js`,
`src/api/composition/CompositionAPISpec.js`.

### OMCT-C02-L2-03.02 — Model-backed composition

Open MCT shall load, add, remove, and reorder the default composition stored in a domain
object.

Acceptance criteria:

- **GIVEN** a mutable domain object with a composition array
- **WHEN** a consumer changes membership or order through the composition collection
- **THEN** Open MCT shall mutate the parent composition to reflect that operation

Implementation evidence: `src/api/composition/DefaultCompositionProvider.js`,
`src/api/composition/CompositionAPISpec.js`.

### OMCT-C02-L2-03.03 — Custom composition providers

Open MCT shall support static and dynamically observed custom composition providers.

Acceptance criteria:

- **GIVEN** a matching custom provider with load and optional observation operations
- **WHEN** a consumer obtains the object's composition
- **THEN** Open MCT shall load provider children and relay provider membership changes

Implementation evidence: `src/api/composition/CompositionProvider.js`,
`src/api/composition/CompositionAPISpec.js`.

### OMCT-C02-L2-03.04 — Composition policies

Open MCT shall reject a proposed parent-child relationship when any registered composition
policy rejects it.

Acceptance criteria:

- **GIVEN** a proposed child and registered composition policies
- **WHEN** composition eligibility is evaluated
- **THEN** Open MCT shall allow the relationship only when every applicable policy allows it

Implementation evidence: `src/api/composition/CompositionAPI.js`.

### OMCT-C02-L2-03.05 — Root registry

Open MCT shall expose registered root objects in priority order.

Acceptance criteria:

- **GIVEN** root identifiers registered with priorities
- **WHEN** root composition loads
- **THEN** Open MCT shall return the root domain objects in configured priority order

Implementation evidence: `src/api/objects/RootRegistry.js`,
`src/api/objects/RootObjectCompositionProvider.js`.

### OMCT-C02-L2-03.06 — Original-path resolution

Open MCT shall resolve an object's original hierarchy path without looping on cyclic
locations.

Acceptance criteria:

- **GIVEN** an object location chain that contains a cycle
- **WHEN** original-path resolution runs
- **THEN** Open MCT shall terminate and return the constructible path

Implementation evidence: `src/api/objects/ObjectAPI.js`, `src/api/objects/ObjectAPISpec.js`.

## OMCT-C02-L1-04 — Object discovery

Open MCT shall provide federated and in-memory search for discoverable domain objects.

### OMCT-C02-L2-04.01 — Federated provider search

Open MCT shall query provider search operations in parallel.

Acceptance criteria:

- **GIVEN** object providers that implement search
- **WHEN** a consumer submits a search query
- **THEN** Open MCT shall return separate promises for the provider result sets without
  serializing the searches

Implementation evidence: `src/api/objects/ObjectAPI.js`,
`src/api/objects/ObjectAPISearchSpec.js`.

### OMCT-C02-L2-04.02 — In-memory partial and exact search

Open MCT shall support partial and exact matching through its in-memory index.

Acceptance criteria:

- **GIVEN** indexed domain objects
- **WHEN** a query partially or exactly matches indexed content
- **THEN** Open MCT shall return the matching objects and return an empty result when no
  match exists

Implementation evidence: `src/api/objects/InMemorySearchProvider.js`,
`src/api/objects/InMemorySearchWorker.js`, `src/api/objects/ObjectAPISearchSpec.js`.

### OMCT-C02-L2-04.03 — Search fallback

Open MCT shall provide in-process search when shared workers are unavailable.

Acceptance criteria:

- **GIVEN** a browser environment without shared-worker support
- **WHEN** the in-memory index receives a search
- **THEN** Open MCT shall execute the search locally with equivalent matching behaviour

Implementation evidence: `src/api/objects/InMemorySearchProvider.js`,
`src/api/objects/ObjectAPISearchSpec.js`.

