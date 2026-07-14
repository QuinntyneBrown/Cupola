# C14 — Operational awareness and collaboration

## OMCT-C14-L1-01 — User and role awareness

Open MCT shall expose active identity, roles, and role-dependent collaboration controls
through one user provider.

### OMCT-C14-L2-01.01 — Single user provider

Open MCT shall accept no more than one user provider per application instance.

Acceptance criteria:

- **GIVEN** an application with a configured user provider
- **WHEN** an extension attempts to configure another provider
- **THEN** Open MCT shall reject the second provider

Implementation evidence: `src/api/user/UserAPI.js`, `src/api/user/UserAPISpec.js`.

### OMCT-C14-L2-01.02 — Current identity

Open MCT shall return the current user supplied by the configured provider.

Acceptance criteria:

- **GIVEN** a user provider with an active identity
- **WHEN** an extension requests the current user
- **THEN** Open MCT shall return that user's identifier and name

Implementation evidence: `src/api/user/UserAPI.js`, `src/api/user/UserProvider.js`.

### OMCT-C14-L2-01.03 — Active role

Open MCT shall get, set, and observe the active role when the user provider supports roles.

Acceptance criteria:

- **GIVEN** a role-capable user provider
- **WHEN** the active role changes
- **THEN** Open MCT shall store the role and notify active-role listeners

Implementation evidence: `src/api/user/ActiveRoleSynchronizer.js`,
`src/api/user/UserAPI.js`.

### OMCT-C14-L2-01.04 — User indicator

Open MCT shall display the active user's name only when a user provider is configured.

Acceptance criteria:

- **GIVEN** an application with or without a user provider
- **WHEN** the user indicator renders
- **THEN** Open MCT shall display the active name only for the configured-provider case

Implementation evidence: `src/plugins/userIndicator/components/UserIndicator.vue`,
`src/plugins/userIndicator/pluginSpec.js`.

## OMCT-C14-L1-02 — Shared status and operator state

Open MCT shall publish observable object status and provider-authorized operator state.

### OMCT-C14-L2-02.01 — Status lifecycle

Open MCT shall set, retrieve, delete, and observe status by domain-object identifier.

Acceptance criteria:

- **GIVEN** an identifier and a status observer
- **WHEN** status is set or deleted
- **THEN** Open MCT shall update retrieval results and notify the observer

Implementation evidence: `src/api/status/StatusAPI.js`, `src/api/status/StatusAPISpec.js`.

### OMCT-C14-L2-02.02 — Operator status

Open MCT shall display and update provider-supported operator status.

Acceptance criteria:

- **GIVEN** an operator-status provider and current user
- **WHEN** the user changes an allowed status
- **THEN** Open MCT shall submit the status and display the provider result

Implementation evidence: `src/plugins/operatorStatus/operatorStatus/OperatorStatus.vue`,
`src/plugins/operatorStatus/operatorStatus/OperatorStatusIndicator.js`.

### OMCT-C14-L2-02.03 — Poll-question authorization

Open MCT shall change a poll question only when the status provider authorizes the current
user.

Acceptance criteria:

- **GIVEN** a current user and a status provider with poll-question capability
- **WHEN** that user attempts to change the question
- **THEN** Open MCT shall submit the change only when provider permission is true

Implementation evidence: `src/api/user/StatusAPI.js`, `src/api/user/UserStatusAPISpec.js`,
`src/plugins/operatorStatus/pollQuestion/PollQuestion.vue`.

## OMCT-C14-L1-03 — Fault management

Open MCT shall retrieve, observe, display, acknowledge, and shelve faults through a fault
provider.

### OMCT-C14-L2-03.01 — Fault request and subscription

Open MCT shall request current faults and subscribe to fault changes from a compatible
provider.

Acceptance criteria:

- **GIVEN** a configured fault provider
- **WHEN** the fault view initializes
- **THEN** Open MCT shall load current faults and relay subsequent provider updates

Implementation evidence: `src/api/faultmanagement/FaultManagementAPI.js`,
`src/api/faultmanagement/FaultManagementAPISpec.js`.

### OMCT-C14-L2-03.02 — Fault root and views

Open MCT shall expose a fault-management root with primary and inspector views.

Acceptance criteria:

- **GIVEN** the fault-management plugin and provider
- **WHEN** the plugin initializes
- **THEN** Open MCT shall register the root object and applicable fault list and inspector
  views

Implementation evidence: `src/plugins/faultManagement/FaultManagementPlugin.js`,
`src/plugins/faultManagement/pluginSpec.js`.

### OMCT-C14-L2-03.03 — Fault acknowledge

Open MCT shall invoke provider acknowledgement for an actionable fault.

Acceptance criteria:

- **GIVEN** a fault provider that supports acknowledgement and a selected fault
- **WHEN** the acknowledge action runs
- **THEN** Open MCT shall submit acknowledgement for that fault

Implementation evidence: `src/api/faultmanagement/FaultManagementAPI.js`,
`src/api/faultmanagement/FaultManagementAPISpec.js`.

### OMCT-C14-L2-03.04 — Fault shelving

Open MCT shall invoke provider shelving for an actionable fault.

Acceptance criteria:

- **GIVEN** a fault provider that supports shelving and a selected fault
- **WHEN** the shelve action runs
- **THEN** Open MCT shall submit shelving for that fault

Implementation evidence: `src/api/faultmanagement/FaultManagementAPI.js`,
`src/api/faultmanagement/FaultManagementAPISpec.js`.

## OMCT-C14-L1-04 — Notifications

Open MCT shall present transient information, persistent alerts and errors, and updateable
progress notifications.

### OMCT-C14-L2-04.01 — Information notification

Open MCT shall automatically dismiss an information notification after its configured
timeout.

Acceptance criteria:

- **GIVEN** an information message
- **WHEN** an extension publishes it
- **THEN** Open MCT shall display it with information severity and dismiss it after the
  timeout

Implementation evidence: `src/api/notifications/NotificationAPI.js`,
`src/api/notifications/NotificationAPISpec.js`.

### OMCT-C14-L2-04.02 — Alert and error persistence

Open MCT shall retain alert and error notifications until explicitly dismissed.

Acceptance criteria:

- **GIVEN** an alert or error message
- **WHEN** an extension publishes it
- **THEN** Open MCT shall display the corresponding severity without automatic dismissal

Implementation evidence: `src/api/notifications/NotificationAPI.js`,
`src/api/notifications/NotificationAPISpec.js`.

### OMCT-C14-L2-04.03 — Progress notification

Open MCT shall update and dismiss a progress notification through its returned control.

Acceptance criteria:

- **GIVEN** a published progress notification
- **WHEN** its message, progress text, percentage, or dismissal state changes
- **THEN** Open MCT shall update or remove the displayed notification

Implementation evidence: `src/api/notifications/NotificationAPI.js`,
`src/api/notifications/NotificationAPISpec.js`.

### OMCT-C14-L2-04.04 — Notification count

Open MCT shall display the current notification count in the notification indicator.

Acceptance criteria:

- **GIVEN** the notification indicator and active notifications
- **WHEN** the notification collection changes
- **THEN** Open MCT shall update the displayed count

Implementation evidence: `src/plugins/notificationIndicator/components/NotificationIndicator.vue`,
`src/plugins/notificationIndicator/pluginSpec.js`.

## OMCT-C14-L1-05 — Status indicators

Open MCT shall provide prioritized application indicators for internal and external status.

### OMCT-C14-L2-05.01 — Indicator registration and priority

Open MCT shall render registered HTML or Vue indicators in priority order.

Acceptance criteria:

- **GIVEN** indicators with priority values
- **WHEN** the indicator area renders
- **THEN** Open MCT shall order the rendered indicators by priority

Implementation evidence: `src/api/indicators/IndicatorAPI.js`,
`src/api/indicators/IndicatorAPISpec.js`.

### OMCT-C14-L2-05.02 — URL health indicator

Open MCT shall poll a configured URL and indicate reachable or unreachable state.

Acceptance criteria:

- **GIVEN** a URL indicator with endpoint and interval
- **WHEN** a poll succeeds or fails
- **THEN** Open MCT shall display the corresponding nominal or error state

Implementation evidence: `src/plugins/URLIndicatorPlugin/URLIndicator.js`,
`src/plugins/URLIndicatorPlugin/URLIndicatorSpec.js`.

### OMCT-C14-L2-05.03 — Performance indicator

Open MCT shall calculate and display browser rendering frames per second when the
performance indicator is installed.

Acceptance criteria:

- **GIVEN** the performance indicator
- **WHEN** animation frames are sampled
- **THEN** Open MCT shall update the calculated frames-per-second value

Implementation evidence: `src/plugins/performanceIndicator/plugin.js`,
`src/plugins/performanceIndicator/pluginSpec.js`.
