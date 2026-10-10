# SentinelWard Frontend Progress

Last verified: 2026-10-10

Owner: Antara Gupta

Repository status at Drive-spec audit: `main` matched `origin/main` at `b46a607`.

## Current Status

The repository is a working, mock-driven React frontend with all 13 specified S0-S12 screens represented. Landing, Login, Ward, Bed Detail, Alerts, Census, Security, Incident, and CERT-In Report now implement their functional Drive requirements. The remaining supporting screens still implement only a subset of the Drive specification.

The authoritative scope is the Drive folder supplied by the user, especially Antara Gupta's work plan v3, R8 screens spec v2, and locked integration doc 00 v1. Telegram is a secondary channel in addition to S0-S12; it does not replace S4.

## Completed and Verified

- React/Vite/TypeScript application shell with protected routing and five specified demo roles.
- Landing, development login, Ward, Bed Detail, Alerts, Census, Security, Incident, CERT-In draft, Tickets, Briefing, Action Log, Demo Control, and Telegram template routes.
- S4 Alerts and escalation for nurse and doctor roles: Open/Acknowledged/All views, the specified table fields, a complete three-step detail ladder, response history, simulated Telegram message editing, and an exact calm empty state.
- Deterministic 30-second demo escalation stops on acknowledgement, repeated events update rather than duplicate, integrity-only incidents never enter the clinical queue, and Ward-rail acknowledgements synchronize with S4.
- Twelve-bed Ward grid, summary metrics, alert rail, recent activity, responsive column changes, collapsed-alert discoverability, arrow-key navigation, Enter-to-open, and focus return.
- Reusable Bed Tile covering all eight verdicts plus loading, unassigned, stale, disconnected, untrusted, and isolated states.
- Canvas ECG/PPG display, last-trusted-value retention, explicit data age, and no zero/flatline inference for missing data.
- Bed Detail overview, mock 30-minute uPlot trends, append-only actions, separate “On my way” and bedside confirmation, immediate high alert for “Patient NOT OK,” isolation, and referencing undo actions.
- S3 Bed Detail explanation: top three reasons, all six named model checks, confidence, body/network witnesses, recent actions, manual escalation, and exact typed command paths for bedside and hand-check requests.
- Untrusted Bed Detail safely separates frozen last-trusted values from a grey patterned “incoming (not trusted)” box and provides a five-minute hand-check countdown with validated HR, portable-device SpO₂, notes, and an append-only record.
- S2 Ward privacy is on by default and can be deliberately revealed; the summary includes the mock stopped-alarm count and the authenticated frame keeps high clinical alarms visible across screens.
- Locked Ward behavior assigns `LOOSE_SENSOR` low priority and `DEVICE_ATTACK` no clinical priority, with textual sensor-silenced, IT-investigating, and manual-check cues on tiles.
- All five roles land on their specified home screens and protected routes follow the Drive access matrix; doctor and IT Ward views are read-only, Bed actions are nurse-only, and operator access is limited to Demo and the all-role log.
- S6 Security provides the 12-device inventory, live attack feed, per-device network witness, explicit cut-off confirmation, reconnecting undo, incident links, and same-model fleet hunt behind IT-only typed commands.
- S7 Incident provides the six-hour response clock, append-only timeline, downloadable evidence with byte size and SHA-256 fingerprint, affected-bed actions, referencing undo, report drafting, and reason-required closure without restoring device trust automatically.
- S8 CERT-In Report provides editable human-owned report fields, response countdown, readiness checklist, draft saving, simulated PDF download, and a human-only mark-sent action that remains disabled until facts, evidence, and approver are complete.
- S5 Census now follows the compact doctor/tele-ICU specification: occupied beds sorted by priority then trust, all required columns, explicit untrusted-data warning, last-trusted values, bedside-check and escalation state, read-only S3 navigation, and a typed mock Telegram ping to the bedside nurse.
- S0 Landing now provides the specified five-second product message, Nurse-preselected live-ward entry, four-bed read-only preview with one high alarm, explicit offline still state, three cause cards, and TessNova/IBM/GitHub footer.
- S1 Login now provides five described one-click role cards, chosen-button loading, inline failure and Retry, typed mock/backend session adapters, sessionStorage persistence, role-home routing, and logout cleanup with the required demo-account disclosure.
- S9 Biomedical Tickets now provides the New/In progress/Done board, device/bed problem cards, suggested fixes, 30-day issue counters, repeat-problem device list, and note-required status updates through the typed PATCH boundary.
- Deterministic timed scenarios for emergency, loose sensor, drifting sensor, tampering, BOTH, and connection loss.
- Stateful mock workflows for clinical assignments, security incident lifecycle, evidence metadata, biomedical tickets, report review, briefing/workload, and activity logs.
- Typed domain models, Zod payload mapping, REST and native WebSocket adapter implementations, reconnect policy, command adapter/gateway, and deterministic mock adapters.
- M1 runtime hardening: validated environment configuration selects one mock or backend adapter set for Ward REST, Ward events, and commands; mock mode is the safe default.
- Ward startup now loads through `WardRestAdapter` before subscribing through `WardEventSource`; the store no longer creates a concrete transport.
- Ward acknowledgement now enforces the provisional role policy, dispatches through the command boundary, displays a pending state, and restores the unacknowledged alert with visible failure feedback if the command fails.
- Accessibility foundations: semantic status text, visible focus, skip link, reduced motion, live-region announcements, and non-color status cues.
- M2 browser regression: Playwright covers protected routing, focus return, response versus bedside confirmation, isolation/undo, incident lifecycle, keyboard navigation, alert discoverability, reduced motion, and desktop/tablet layouts.
- Axe runs with color contrast enabled across all 13 material routes; shared Bed Tile semantics, Logout contrast, and event timestamp contrast were corrected from the audit findings.
- Unit, store, adapter, route, component, full-route axe, and critical browser workflow coverage.
- Operational routes are split into public, clinical, security, support, demo, and shared modules behind one stable barrel import.
- Styles are split into foundation/Ward, Bed Detail, and operational route modules while preserving the existing responsive and accessibility behavior.
- The obsolete Bed Tile lab route, legacy milestone pages, legacy Ward store, unused event-source mock, and their retired styles/tests have been removed.
- The README now documents the current routes, adapter boundary, mock-safe runtime configuration, and verified development commands.
- Shared typed primitives now provide consistent page headers, status chips, action buttons, panels, and explicit empty states across Ward, Bed Detail, and operational routes.
- Operational page hierarchy and responsive presentation are consistent while clinical copy, non-color status cues, 44-pixel actions, and mock-only boundaries remain intact.
- Noncritical clinical, security, support, and demo route families are lazy-loaded behind an accessible status fallback; Ward and Bed Detail remain in the initial safety-critical bundle.
- The external Google Fonts request has been removed in favor of resilient system sans and monospace stacks.

All listed behavior is frontend or mock behavior unless explicitly stated otherwise.

## Incomplete Features

- S10-S12 are partial: Blind Time/workload chart, log search/filter/undo, and demo pause/speed/full scenario controls are missing.
- Telegram delivery is not implemented; the current page has only three simplified templates and lacks exact templates, waveform image, callbacks, message editing, repeat merging, and escalation behavior.
- Automatic-action Undo is only implemented for isolation rather than every applicable automatic action.
- Backend mode is selectable but remains provisional and unverified against a real service. Configuration uses `VITE_SENTINELWARD_RUNTIME_MODE`, `VITE_SENTINELWARD_API_BASE_URL`, and optional `VITE_SENTINELWARD_WS_URL`; mock mode remains the default.
- Authentication, authorization, persistence, telemetry, incidents, evidence, reports, tickets, assignments, and Telegram delivery are not backed by real services.
- WebSocket missed-event recovery invokes a hook, but recovery fetching and reconciliation are not implemented.
- Screenshot-based visual regression is not configured; responsive behavior is covered functionally at desktop, landscape tablet, and portrait tablet viewports.
- Production deployment, CI, monitoring, and backend infrastructure are not configured and are outside Antara Gupta's confirmed frontend assignment unless explicitly added later.
- Final brand/design approval remains external; the current system is a consistent, accessible functional baseline.

## Bugs and Technical Debt

- No failing product bug was found during this inspection.
- Application state is memory-only and resets on refresh; this is acceptable for mocks but must remain clearly presented as simulated.
- The initial production JavaScript chunk is about 459 kB before gzip; charting and the safety-critical Ward/Bed path still account for most of it.

## Active Milestone

**R8-F8 — S10 briefing and workload workflow (active).**

The Drive audit supersedes the earlier completion assessment. The exact Antara Gupta frontend scope is approximately 75-80% complete. Functional Drive requirements will be completed in mock mode before the separate UI-polish phase.

### M1 Verified Result

- One typed bootstrap composition point selects the full adapter set from Zod-validated configuration, with mock mode as the safe default.
- Ward startup uses the configured REST and event interfaces, retains last-known fixtures on load failure, and aborts in-flight loading during cleanup.
- Ward and Bed Detail acknowledgement share one command path; no success state or activity is recorded before adapter acceptance.
- Automated coverage verifies mock/backend selection, invalid mode rejection, REST failure retention, command pending state, and command failure rollback.
- Existing mock workflows, safety behavior, and route access remain covered by the full passing quality gate.

### M2 Verified Result — Accessibility and Workflow Regression

- Playwright covers login/role routing, Ward-to-Bed focus return, acknowledgement versus bedside confirmation, isolation/undo, and one incident workflow.
- Axe runs across every material route with color contrast enabled and reports no automated violations.
- Desktop, landscape tablet, and portrait tablet layouts are verified without horizontal overflow; high alerts remain discoverable when collapsed.
- Keyboard navigation, live announcement boundaries, and reduced-motion behavior are verified without announcing waveform ticks.

### M3 Verified Result — Frontend Maintainability Cleanup

- `OperationalPages.tsx` is replaced by route-focused modules without changing active paths, permissions, or user-visible workflows.
- Global styles are separated into cohesive imports while preserving tokens, responsive behavior, and accessibility fixes.
- Dependency checks allowed the obsolete public Bed Tile lab route and legacy page/store/mock modules to be removed safely; the retired route now falls back to Ward for an authenticated operator.
- The README describes the current frontend, runtime modes, adapter architecture, and verified commands.
- The full quality gate passes with 68 unit/component tests and 21 Playwright tests.

### M4 Verified Result — Shared Design System and Screen Hierarchy Polish

- Reusable typed page headers, status chips, action controls, panels, and empty states replace route-specific variants.
- Ward, Bed Detail, census, security, incident, report, ticket, briefing, log, demo, login, and landing hierarchy uses the shared system.
- Exact clinical states, non-color cues, focus behavior, touch targets, and mock-only disclosure remain covered.
- Four focused primitive tests were added and the full quality gate passes.

### M5 Verified Result — Delivery Performance and Runtime Independence

- Clinical, security, support, and demo route families are emitted as independent lazy chunks with an accessible loading status.
- Ward, Bed Detail, landing, and login remain immediately available; route guards and direct navigation are unchanged.
- The Google Fonts runtime request is removed and all typography uses resilient system stacks.
- The initial JavaScript chunk fell from 468.17 kB to 444.39 kB (23.78 kB, about 5.1%) while all tests and the production build remain green.

### Drive Audit Result

- Antara Gupta owns S0-S12, Telegram message templates and frontend interactions with Aditya, README, and video visuals.
- R8 explicitly defines S4 Alerts and escalation; the prior “missing S4” assumption was incorrect.
- Locked doc 00 v1 defines verdict priorities, role-facing behavior, v1 message shapes, REST routes, `/ws`, and five safety rules.
- Backend-dependent functionality must stay behind typed mocks/adapters, but its specified frontend states and actions remain in scope.
- CI, deployment, monitoring, backend infrastructure, models, agents, and attack tooling remain out of scope.

### R8-F1 Verified Result — S4 Alerts and Escalation

- Protected `/alerts` navigation is available to nurse and doctor roles and redirects unrelated authenticated roles to Ward.
- Open, Acknowledged, and All views show alert time, bed, textual priority, reason, assignee, ladder step, waiting time, and actions.
- The accessible detail sheet shows the full three-step ladder, response history, and simulated Telegram message.
- High alerts escalate deterministically after 30 and 60 seconds in mock mode; acknowledgement stops escalation and edits the existing Telegram alert.
- Repeated events update rather than duplicate; integrity-only incidents stay outside the nurse queue; the empty state is exactly “No open alerts. All beds calm.”
- Ward-rail and S4 acknowledgement state synchronize through the shared typed command boundary.
- Unit, route, structural axe, browser workflow, full axe color-contrast, tablet, TypeScript, and production-build checks pass.

### R8-F2 Verified Result — S3 Bed Detail

- The “Why” panel displays the verdict confidence, three concise reasons, all six named model checks on a 0–1 scale, and the latest actions.
- Body and network witnesses remain separate and textual, so the explanation never depends on color alone.
- Untrusted beds keep the main display on the last trusted snapshot and expose incoming values only in a labelled, grey-patterned “incoming (not trusted)” box.
- Nurse and doctor actions include On my way, manual escalation, Patient OK / NOT OK, and a validated hand-check form; IT remains read-only for the new S3 actions.
- Hand checks persist HR, portable-device SpO₂, notes, recorder, time, a five-minute next-check schedule, and an append-only action entry without converting untrusted telemetry into trusted data.
- Escalation and manual readings dispatch through typed mock/backend command boundaries using the locked `/api/alerts/:id/escalate`, `/api/beds/:id/bedside-check`, and `/api/beds/:id/manual-reading` paths.
- Unit/component and browser tests cover the explanation count, untrusted boundary, permissions, escalation, hand-check persistence, and adapter paths; the full quality gate passes.

### R8-F3 Verified Result — S2 Ward Frame and Locked Access

- Ward names are hidden by default as initials plus age, with an explicit privacy control to reveal them.
- The five specified summary metrics include “Alarms stopped today,” and a persistent alarm-only strip keeps active high-priority beds visible across authenticated screens.
- Locked priorities are enforced: loose sensor is low/cyan, device attack has no nurse priority, and emergency/BOTH remain high without suppressing clinical escalation.
- Tile text distinguishes a safely silenced sensor alarm, an IT-only investigation, and a due manual check without relying on color alone.
- Nurse, doctor, IT, biomedical, and operator sessions land on their specified home routes; unrelated protected routes return each role to its own home instead of Ward.
- Ward acknowledgement is nurse-only, S3 actions are nurse-only, doctor and IT retain their specified read access, and operator no longer has broad clinical/security access.
- Unit, route, axe, browser role/privacy workflow, responsive tablet, TypeScript, and production-build checks pass.

### R8-F4 Verified Result — S6-S8 Security, Incident Evidence, and CERT-In Report

- IT users can inspect all 12 mock devices, message freshness/rate, firmware, network score, isolation state, and the live attack feed; selecting a device renders its network witness and supports same-model fleet hunt.
- Device cut-off requires explicit confirmation, dispatches through the typed command boundary, and records an append-only action; Undo reconnects the device while retaining and referencing the original action.
- Incident detail provides a six-hour clock, chronological timeline, affected beds/actions, evidence size and SHA-256 metadata, browser downloads, manual capture, containment, report drafting, and reason-required closure.
- Closing an incident never restores device trust or reconnects isolation automatically.
- CERT-In reports are editable and human-controlled: drafts can be saved or downloaded as a simulated PDF, while Mark sent stays disabled until facts, evidence, and approver checks pass and records the responsible human and time.
- Provisional backend endpoints remain isolated in typed adapters; mock mode is the safe default until the owning backend team confirms them.
- The full quality gate passes with 89 unit/component tests and 26 Playwright tests, including all-route axe scans and desktop/tablet workflows.

### R8-F5 Verified Result — S5 Doctor / Tele-ICU Census

- The occupied-bed census uses the exact S5 columns and deterministic ordering: clinical priority first, then lowest trust, then bed ID.
- Patient privacy uses initials and age. Untrusted rows are patterned and labelled, show frozen last-trusted vitals, and are paired with the specified warning not to act without a bedside check.
- Last bedside-check state and doctor-escalation state remain separate and visible for every bed.
- A doctor can send one explicit bedside-nurse Telegram ping through the typed command adapter; a rejected command leaves no sent state and displays failure feedback.
- Census rows open S3 in a genuine read-only role state. The development role switcher was removed from Bed Detail, and nurse/IT mutation controls are hidden from unauthorized roles.
- The full quality gate passes with 92 unit/component tests and 27 Playwright tests, including all-route axe scans and desktop/tablet workflows.

### R8-F6 Verified Result — S0 Landing and S1 Development Login

- The public landing page uses the exact headline and IBM LinuxONE product message, opens Login with Nurse preselected, explains the three safe response classes, and includes the required team/event/GitHub footer.
- A typed public adapter supplies the four-bed read-only preview from `/api/ward/preview` in backend mode and deterministic fixtures in mock mode; failure retains four non-updating beds and clearly says “Live demo offline.”
- Login exposes five described one-click role cards, a chosen-button spinner, inline failure with Retry, and the required demo-account disclosure.
- Session creation uses the locked `/api/session` boundary, persists the returned token/role/name in sessionStorage, restores after reload, routes each role home, and clears on Logout.
- Mock mode remains the safe default; no real authentication or backend availability is implied.
- The full quality gate passes with 97 unit/component tests and 28 Playwright tests, including all-route axe scans and desktop/tablet workflows.

### R8-F7 Verified Result — S9 Biomedical Ticket Board

- The biomedical home is a three-column New / In progress / Done board with one card per repair job.
- Every card shows the device and bed, concrete problem, suggested fix, and “times this device had issues (30 days)” count; a side list ranks repeat-problem devices.
- Moving a ticket requires a work note and dispatches the locked `PATCH /api/tickets/:id` command with status and note before changing the board.
- Rejected updates retain the original column and display failure feedback; accepted updates append an activity record.
- The full quality gate passes with 98 unit/component tests and 29 Playwright tests, including all-route axe scans and desktop/tablet workflows.

## Prioritized Roadmap

1. Complete S10 briefing and workload requirements.
2. Complete remaining S11-S12 functional gaps, then exact Telegram frontend behavior.
3. Begin the separate UI-polish phase only after functional scope is verified.

## Provisional Backend Dependencies

The locked Drive contracts guide frontend mocks, but these external integrations remain unavailable and must not block mock-mode frontend work:

- Running backend services for the locked REST endpoint list and `/ws` messages.
- Real authentication/session service and team-issued identities.
- WebSocket sequencing, authentication, and missed-event reconciliation beyond the locked message shapes.
- Server-side acknowledge, escalate, isolation, undo, trust-restoration, bedside-check, and manual-reading execution.
- History, evidence, network detail, report generation/submission, and reset paths.
- Summary metric formulas and whether untrusted incoming values are exposed to the frontend.
- Error envelope, idempotency, command status, pagination, timestamps/time zones, and audit identifiers.

## Latest Verification

Command: `npm run check`

- Lint: passed.
- Tests: 26 files passed; 98 tests passed.
- Browser regression: 29 Playwright tests passed across desktop Chromium, landscape tablet, and portrait tablet projects.
- Accessibility: 14 material routes passed automated axe checks with color contrast enabled.
- TypeScript and production build: passed.
- Build output: 176 modules; CSS 47.88 kB (10.37 kB gzip); initial JavaScript 359.52 kB (119.36 kB gzip), plus the Ward store, five lazy route-family chunks, and shared utility chunks.

## Next Recommended Actions

1. Implement R8-F8 S10 briefing and workload behavior as a typed mock-first vertical slice.
2. Preserve role boundaries, clinical priority visibility, and non-color warning cues while adding workload evidence.
3. Rerun the complete unit, axe, browser, and production-build gate before delivery.
