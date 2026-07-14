# C06 — Telemetry integration and processing

## OMCT-C06-L1-01 — Provider-based telemetry access

Open MCT shall route telemetry requests and subscriptions to compatible providers.

### OMCT-C06-L2-01.01 — Provider selection

Open MCT shall use the first registered telemetry provider that supports the requested
domain object and operation.

Acceptance criteria:

- **GIVEN** registered telemetry providers with support predicates
- **WHEN** telemetry is requested or subscribed
- **THEN** Open MCT shall skip nonmatching providers and invoke the matching provider

Implementation evidence: `src/api/telemetry/TelemetryAPI.js`,
`src/api/telemetry/TelemetryAPISpec.js`.

### OMCT-C06-L2-01.02 — Unsupported telemetry result

Open MCT shall return a consistent empty result when no provider supports a telemetry
request.

Acceptance criteria:

- **GIVEN** a domain object unsupported by all telemetry providers
- **WHEN** a consumer requests telemetry
- **THEN** Open MCT shall resolve the request with an empty collection

Implementation evidence: `src/api/telemetry/TelemetryAPI.js`,
`src/api/telemetry/TelemetryAPISpec.js`.

### OMCT-C06-L2-01.03 — Request option defaults

Open MCT shall supply current time bounds and time-system information when request options
omit them.

Acceptance criteria:

- **GIVEN** a telemetry request with incomplete options
- **WHEN** Open MCT dispatches it
- **THEN** Open MCT shall add defaults without overwriting explicitly supplied values

Implementation evidence: `src/api/telemetry/TelemetryAPI.js`,
`src/api/telemetry/TelemetryAPISpec.js`.

### OMCT-C06-L2-01.04 — Navigation cancellation

Open MCT shall abort cancellable telemetry requests when navigation changes the active
path.

Acceptance criteria:

- **GIVEN** an unresolved telemetry request associated with the current navigation
- **WHEN** the application path changes
- **THEN** Open MCT shall signal request cancellation

Implementation evidence: `src/api/telemetry/TelemetryRequestInterceptor.js`,
`src/api/telemetry/TelemetryAPISpec.js`.

## OMCT-C06-L1-02 — Shared realtime subscriptions

Open MCT shall distribute realtime telemetry efficiently to multiple consumers.

### OMCT-C06-L2-02.01 — Subscription sharing

Open MCT shall maintain one provider subscription per object and compatible strategy while
consumers are active.

Acceptance criteria:

- **GIVEN** multiple consumers subscribing to the same telemetry object
- **WHEN** their subscriptions overlap
- **THEN** Open MCT shall share the provider subscription and fan out received telemetry

Implementation evidence: `src/api/telemetry/TelemetryAPI.js`,
`src/api/telemetry/TelemetryAPISpec.js`.

### OMCT-C06-L2-02.02 — Final unsubscribe

Open MCT shall release a shared provider subscription after its last consumer unsubscribes.

Acceptance criteria:

- **GIVEN** a shared telemetry subscription with active consumers
- **WHEN** the final consumer unsubscribes
- **THEN** Open MCT shall invoke the provider unsubscribe function and remove the cache entry

Implementation evidence: `src/api/telemetry/TelemetryAPI.js`,
`src/api/telemetry/TelemetryAPISpec.js`.

### OMCT-C06-L2-02.03 — Latest strategy shape

Open MCT shall deliver one datum per callback to subscriptions using the `latest` strategy.

Acceptance criteria:

- **GIVEN** a provider that emits a telemetry batch
- **WHEN** a `latest` subscription receives it
- **THEN** Open MCT shall invoke the consumer with one latest datum

Implementation evidence: `src/api/telemetry/TelemetryAPI.js`,
`src/api/telemetry/TelemetryAPISpec.js`.

### OMCT-C06-L2-02.04 — Batch strategy shape

Open MCT shall deliver an array per callback to subscriptions using the `batch` strategy.

Acceptance criteria:

- **GIVEN** a batch-strategy subscription
- **WHEN** its provider supplies telemetry
- **THEN** Open MCT shall invoke the consumer with an array of data

Implementation evidence: `src/api/telemetry/TelemetryAPI.js`,
`src/api/telemetry/TelemetryAPISpec.js`.

### OMCT-C06-L2-02.05 — Legacy subscription compatibility

Open MCT shall preserve single-datum delivery for providers without batching support.

Acceptance criteria:

- **GIVEN** a legacy telemetry provider
- **WHEN** a consumer subscribes through the telemetry API
- **THEN** Open MCT shall relay the provider's single-datum callbacks unchanged

Implementation evidence: `src/api/telemetry/TelemetryAPI.js`,
`src/api/telemetry/TelemetryAPISpec.js`.

## OMCT-C06-L1-03 — Telemetry metadata and formatting

Open MCT shall describe and format telemetry values according to registered metadata.

### OMCT-C06-L2-03.01 — Metadata-provider priority

Open MCT shall select telemetry metadata by explicit provider priority and registration
order.

Acceptance criteria:

- **GIVEN** matching metadata providers
- **WHEN** metadata is requested
- **THEN** Open MCT shall select the highest-priority provider and use registration order to
  resolve equal priority

Implementation evidence: `src/api/telemetry/TelemetryMetadataManager.js`,
`src/api/telemetry/TelemetryAPISpec.js`.

### OMCT-C06-L2-03.02 — Domain and range ordering

Open MCT shall order metadata values by domain and range hints and their declared
priorities.

Acceptance criteria:

- **GIVEN** metadata with domain and range values
- **WHEN** a consumer obtains normalized metadata
- **THEN** Open MCT shall expose domain and range values in priority order

Implementation evidence: `src/api/telemetry/TelemetryMetadataManager.js`,
`src/api/telemetry/TelemetryAPISpec.js`.

### OMCT-C06-L2-03.03 — Default metadata

Open MCT shall derive metadata from a domain object's telemetry definition when no custom
provider supersedes it.

Acceptance criteria:

- **GIVEN** a telemetry domain object with metadata definitions
- **WHEN** metadata is requested
- **THEN** Open MCT shall return normalized metadata for those definitions

Implementation evidence: `src/api/telemetry/DefaultMetadataProvider.js`,
`src/api/telemetry/TelemetryAPI.js`.

### OMCT-C06-L2-03.04 — Value formatting

Open MCT shall format, parse, and validate telemetry values with the format named by
metadata.

Acceptance criteria:

- **GIVEN** telemetry metadata that names a registered format
- **WHEN** a consumer obtains and uses the value formatter
- **THEN** Open MCT shall apply that format's conversion and validation behaviour

Implementation evidence: `src/api/telemetry/TelemetryValueFormatter.js`,
`src/api/telemetry/TelemetryAPI.js`.

## OMCT-C06-L1-04 — Telemetry collections and evaluation services

Open MCT shall provide bounded collections and provider extensions for telemetry
interpretation.

### OMCT-C06-L2-04.01 — Collection acquisition

Open MCT shall return a telemetry collection configured for a domain object and time
context.

Acceptance criteria:

- **GIVEN** a telemetry-producing object
- **WHEN** a consumer requests a telemetry collection
- **THEN** Open MCT shall return a collection that can load historical data and subscribe to
  realtime data

Implementation evidence: `src/api/telemetry/TelemetryCollection.js`,
`src/api/telemetry/TelemetryAPISpec.js`.

### OMCT-C06-L2-04.02 — Time-metadata mismatch warning

Open MCT shall warn when collection metadata lacks the active time-system key.

Acceptance criteria:

- **GIVEN** a telemetry collection whose metadata does not define the active time domain
- **WHEN** the collection initializes
- **THEN** Open MCT shall issue a diagnostic warning

Implementation evidence: `src/api/telemetry/TelemetryCollection.js`,
`src/api/telemetry/TelemetryCollectionSpec.js`.

### OMCT-C06-L2-04.03 — Limit evaluation

Open MCT shall return the first applicable limit evaluation for a telemetry datum.

Acceptance criteria:

- **GIVEN** registered limit providers and a telemetry datum
- **WHEN** limit evaluation runs
- **THEN** Open MCT shall apply the matching provider's limit state

Implementation evidence: `src/api/telemetry/TelemetryAPI.js`,
`example/generator/SinewaveLimitProvider.js`.

### OMCT-C06-L2-04.04 — Staleness evaluation

Open MCT shall expose staleness state from an applicable telemetry provider.

Acceptance criteria:

- **GIVEN** a telemetry object supported by a staleness provider
- **WHEN** a consumer observes staleness
- **THEN** Open MCT shall relay provider changes and release provider resources on
  unsubscribe

Implementation evidence: `src/api/telemetry/TelemetryAPI.js`,
`example/exampleStalenessProvider/ExampleStalenessProvider.js`.

### OMCT-C06-L2-04.05 — Batching WebSocket

Open MCT shall multiplex logical telemetry subscriptions over a batching WebSocket worker.

Acceptance criteria:

- **GIVEN** consumers configured for the same WebSocket endpoint
- **WHEN** they subscribe and receive messages
- **THEN** Open MCT shall route endpoint messages to the corresponding logical subscribers

Implementation evidence: `src/api/telemetry/BatchingWebSocket.js`,
`src/api/telemetry/WebSocketWorker.js`.

