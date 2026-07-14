# C05 — Time coordination and time utilities

## OMCT-C05-L1-01 — Time-system and bounds management

Open MCT shall coordinate active time semantics, visible bounds, and a time of interest.

### OMCT-C05-L2-01.01 — Time-system registration

Open MCT shall register time systems by unique key.

Acceptance criteria:

- **GIVEN** a time-system definition with a key, name, and time format
- **WHEN** an extension registers the definition
- **THEN** Open MCT shall make that time system available for activation

Implementation evidence: `src/api/time/TimeAPI.js`, `src/api/time/TimeAPISpec.js`.

### OMCT-C05-L2-01.02 — Time-system activation

Open MCT shall activate only a registered time system.

Acceptance criteria:

- **GIVEN** a requested time-system key
- **WHEN** a consumer sets the active time system
- **THEN** Open MCT shall activate a registered key and reject an unknown key

Implementation evidence: `src/api/time/TimeContext.js`, `src/api/time/TimeAPISpec.js`.

### OMCT-C05-L2-01.03 — Bounds validation

Open MCT shall accept time bounds only when their start and end values form a valid range.

Acceptance criteria:

- **GIVEN** proposed numeric start and end bounds
- **WHEN** a consumer sets the bounds
- **THEN** Open MCT shall store valid bounds and reject invalid bounds

Implementation evidence: `src/api/time/TimeContext.js`, `src/api/time/TimeAPISpec.js`.

### OMCT-C05-L2-01.04 — Time-of-interest containment

Open MCT shall clear the time of interest when new bounds exclude it.

Acceptance criteria:

- **GIVEN** an active time of interest and replacement bounds
- **WHEN** the replacement bounds no longer contain that time
- **THEN** Open MCT shall clear the time of interest

Implementation evidence: `src/api/time/TimeContext.js`, `src/api/time/TimeAPISpec.js`.

### OMCT-C05-L2-01.05 — Time change events

Open MCT shall notify listeners of time-system, bounds, mode, tick, and time-of-interest
changes.

Acceptance criteria:

- **GIVEN** a listener for a supported time event
- **WHEN** the corresponding time state changes
- **THEN** Open MCT shall invoke the listener with the updated state

Implementation evidence: `src/api/time/TimeAPI.js`, `src/api/time/TimeContext.js`,
`src/api/time/TimeAPISpec.js`.

## OMCT-C05-L1-02 — Global and independent time contexts

Open MCT shall provide global time and optional hierarchy-local independent time contexts.

### OMCT-C05-L2-02.01 — Global context default

Open MCT shall use the global time context when no object in a path declares independent
time.

Acceptance criteria:

- **GIVEN** an object path without independent-time configuration
- **WHEN** a view requests its time context
- **THEN** Open MCT shall return the global context

Implementation evidence: `src/api/time/TimeAPI.js`,
`src/api/time/independentTimeAPISpec.js`.

### OMCT-C05-L2-02.02 — Independent context creation

Open MCT shall create an independent time context for an object configured to own one.

Acceptance criteria:

- **GIVEN** an object path containing independent-time configuration
- **WHEN** a view requests its time context
- **THEN** Open MCT shall return a context with bounds and clock state independent of the
  global context

Implementation evidence: `src/api/time/IndependentTimeContext.js`,
`src/api/time/independentTimeAPISpec.js`.

### OMCT-C05-L2-02.03 — Ancestor context inheritance

Open MCT shall use the nearest ancestor's independent time context for descendants that do
not own one.

Acceptance criteria:

- **GIVEN** an object path whose ancestor owns an independent context
- **WHEN** a descendant view requests time
- **THEN** Open MCT shall return that ancestor context

Implementation evidence: `src/api/time/TimeAPI.js`,
`src/api/time/independentTimeAPISpec.js`.

## OMCT-C05-L1-03 — Clock and mode control

Open MCT shall support fixed-time and real-time operation through registered clocks.

### OMCT-C05-L2-03.01 — Fixed and real-time modes

Open MCT shall report fixed mode without an active clock and real-time mode with one.

Acceptance criteria:

- **GIVEN** a time context
- **WHEN** its active clock is cleared or set
- **THEN** Open MCT shall report fixed mode or real-time mode respectively

Implementation evidence: `src/api/time/TimeContext.js`, `src/api/time/TimeAPISpec.js`.

### OMCT-C05-L2-03.02 — Registered-clock activation

Open MCT shall activate only a registered clock.

Acceptance criteria:

- **GIVEN** registered clocks and a requested clock key
- **WHEN** the time API sets the clock
- **THEN** Open MCT shall subscribe to a registered clock and reject an unknown key

Implementation evidence: `src/api/time/TimeAPI.js`, `src/api/time/TimeAPISpec.js`.

### OMCT-C05-L2-03.03 — Clock-relative bounds

Open MCT shall update real-time bounds from clock ticks and configured offsets.

Acceptance criteria:

- **GIVEN** an active clock with start and end offsets
- **WHEN** the clock emits a tick
- **THEN** Open MCT shall derive current bounds from the tick value and offsets

Implementation evidence: `src/api/time/TimeContext.js`, `src/api/time/TimeAPISpec.js`.

### OMCT-C05-L2-03.04 — Local clock

Open MCT shall provide a local clock that emits current wall-clock time at its configured
interval.

Acceptance criteria:

- **GIVEN** the Coordinated Universal Time (UTC) plugin and a local-clock listener
- **WHEN** the clock interval elapses
- **THEN** Open MCT shall invoke the listener with current epoch time

Implementation evidence: `src/plugins/utcTimeSystem/LocalClock.js`,
`src/plugins/utcTimeSystem/pluginSpec.js`.

### OMCT-C05-L2-03.05 — Remote telemetry clock

Open MCT shall derive clock ticks from a configured telemetry object.

Acceptance criteria:

- **GIVEN** a remote-clock object identifier with compatible telemetry metadata
- **WHEN** the remote clock initializes and receives telemetry
- **THEN** Open MCT shall request the latest value, subscribe for updates, and emit parsed
  time ticks

Implementation evidence: `src/plugins/remoteClock/RemoteClock.js`,
`src/plugins/remoteClock/RemoteClockSpec.js`.

### OMCT-C05-L2-03.06 — Latest-available-data clock

Open MCT shall expose a clock whose value tracks latest available telemetry data.

Acceptance criteria:

- **GIVEN** an installed latest-available-data clock
- **WHEN** the time API activates that clock
- **THEN** Open MCT shall use its reported latest-data time for real-time bounds

Implementation evidence: `src/plugins/latestDataClock/LADClock.js`,
`src/plugins/latestDataClock/plugin.js`.

## OMCT-C05-L1-04 — Time controls and URL state

Open MCT shall provide controls that expose and preserve the active time configuration.

### OMCT-C05-L2-04.01 — Time conductor modes

Open MCT shall display fixed-mode bounds controls and real-time clock controls for the
active context.

Acceptance criteria:

- **GIVEN** an installed time conductor
- **WHEN** the active context changes between fixed and real-time modes
- **THEN** Open MCT shall display the controls applicable to that mode

Implementation evidence: `src/plugins/timeConductor/ConductorComponent.vue`,
`src/plugins/timeConductor/pluginSpec.js`.

### OMCT-C05-L2-04.02 — Current real-time display

Open MCT shall display the current clock value while the time conductor is in real-time
mode.

Acceptance criteria:

- **GIVEN** a real-time context with an active clock
- **WHEN** the clock ticks
- **THEN** Open MCT shall update the conductor's current-time display

Implementation evidence: `src/plugins/timeConductor/ConductorClock.vue`,
`src/plugins/timeConductor/pluginSpec.js`.

### OMCT-C05-L2-04.03 — URL synchronization

Open MCT shall synchronize global time mode and settings with URL search parameters.

Acceptance criteria:

- **GIVEN** the URL time-settings synchronizer
- **WHEN** the active clock, time system, bounds, or offsets change
- **THEN** Open MCT shall update the corresponding URL state

Implementation evidence: `src/plugins/URLTimeSettingsSynchronizer/URLTimeSettingsSynchronizer.js`,
`src/plugins/URLTimeSettingsSynchronizer/pluginSpec.js`.

## OMCT-C05-L1-05 — Time formatting and time-display objects

Open MCT shall format, parse, validate, and display implemented time representations.

### OMCT-C05-L2-05.01 — UTC and duration formats

Open MCT shall format, parse, and validate UTC timestamps and durations.

Acceptance criteria:

- **GIVEN** epoch milliseconds or a supported UTC or duration string
- **WHEN** the registered formatter processes the value
- **THEN** Open MCT shall produce or parse the supported representation and report its
  validity

Implementation evidence: `src/plugins/utcTimeSystem/UTCTimeFormat.js`,
`src/plugins/utcTimeSystem/DurationFormat.js`, `src/plugins/utcTimeSystem/pluginSpec.js`.

### OMCT-C05-L2-05.02 — Local and ISO formats

Open MCT shall provide local-time and International Organization for Standardization (ISO)
timestamp formats.

Acceptance criteria:

- **GIVEN** the local-time and ISO format plugins
- **WHEN** a consumer formats, parses, or validates a timestamp
- **THEN** Open MCT shall apply the selected local or ISO representation

Implementation evidence: `src/plugins/localTimeSystem/LocalTimeFormat.js`,
`src/plugins/ISOTimeFormat/ISOTimeFormat.js`.

### OMCT-C05-L2-05.03 — Clock object

Open MCT shall display a configurable clock object.

Acceptance criteria:

- **GIVEN** a clock domain object with timezone, 12-hour or 24-hour, and display-format
  configuration
- **WHEN** its view renders
- **THEN** Open MCT shall display time according to that configuration

Implementation evidence: `src/plugins/clock/components/ClockComponent.vue`,
`src/plugins/clock/pluginSpec.js`.

### OMCT-C05-L2-05.04 — Timer state machine

Open MCT shall display and control countdown and count-up timers in started, paused,
stopped, and restarted states.

Acceptance criteria:

- **GIVEN** a timer domain object and its configured target time
- **WHEN** an applicable timer action changes state
- **THEN** Open MCT shall render the elapsed or remaining duration for the new state

Implementation evidence: `src/plugins/timer/components/TimerComponent.vue`,
`src/plugins/timer/actions`, `src/plugins/timer/pluginSpec.js`.

### OMCT-C05-L2-05.05 — Legacy timer migration

Open MCT shall migrate legacy timer properties into the current configuration structure.

Acceptance criteria:

- **GIVEN** a persisted timer in the legacy property format
- **WHEN** the timer interceptor loads it
- **THEN** Open MCT shall expose equivalent values under the current configuration

Implementation evidence: `src/plugins/timer/plugin.js`, `src/plugins/timer/pluginSpec.js`.

