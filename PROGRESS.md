# SentinelWard Frontend Progress

Last verified: 2026-10-12

Owner: Antara Gupta

Repository status at Drive-spec audit: `main` matched `origin/main` at `b46a607`.

## Current Status

The repository is a working, mock-driven React frontend with all 13 specified S0-S12 screens and the secondary Telegram channel implementing their functional and visual Drive requirements. Antara Gupta's confirmed frontend scope is complete in mock mode.

An approved UI refresh is now in progress. The Ward establishes the new visual direction: a black application header with separate white oval navigation, a soft white/blue workspace, equal-size light bed cards, dark monitor-only waveforms, a light alert rail, and alarm colours reserved for clinical severity.

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
- S10 Briefing and Workload now provides the IBM Granite-labelled handover since 08:00, incident/untrusted-bed/open-ticket totals, per-bed Blind Time, and a two-hour nurse alarm-load chart with a textual threshold warning at 40.
- S11 Action Log now provides the exact six-column, 200-entry typed view, free-text search, automatic/person/undoable filtering, all-role read access, and IT-only append-only Undo for reversible automatic actions.
- S12 Demo Control now provides the exact seven scenarios, operator-only Run/Pause/Resume/Reset controls, 1×/2×/5× playback, and a live completed/next/upcoming timeline through typed run/reset boundaries.
- Deterministic timed scenarios cover the full 12-minute ward script, real emergency, loose sensor, drift, replay attack, fake flatline, and flood.
- The Telegram route now provides all eight specified event templates with their exact recipients, message copy, role-aware callback buttons, 12-second waveform previews for high alerts, same-message acknowledgement/escalation edits, and a one-message-per-second repeat-merging queue.
- Ward HR and SpO₂ numerals render at a verified minimum of 40 px on desktop, 1024×768, and 768×1024 layouts without horizontal overflow.
- The approved Ward UI uses twelve equal-height light bed cards, dark monitor-only waveform panels, a light-blue alert rail, blue non-clinical accents, clinically meaningful green only inside bed monitoring, and the existing alarm-only red/yellow/cyan semantics.
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

- Telegram behavior is fully represented in the frontend, but delivery to the real Telegram API remains an external integration and is deliberately not claimed by this mock-driven repository.
- No Antara-owned Drive checklist item remains incomplete in this frontend-only repository. The remaining items below require backend, Telegram, deployment, team-repository, or product authority outside the confirmed assignment.
- Backend mode is selectable but remains provisional and unverified against a real service. Configuration uses `VITE_SENTINELWARD_RUNTIME_MODE`, `VITE_SENTINELWARD_API_BASE_URL`, and optional `VITE_SENTINELWARD_WS_URL`; mock mode remains the default.
- Authentication, authorization, persistence, telemetry, incidents, evidence, reports, tickets, assignments, and Telegram delivery are not backed by real services.
- WebSocket missed-event recovery invokes a hook, but recovery fetching and reconciliation are not implemented.
- Screenshot-based visual regression is not configured; responsive behavior is covered functionally at desktop, landscape tablet, and portrait tablet viewports.
- Production deployment, CI, monitoring, and backend infrastructure are not configured and are outside Antara Gupta's confirmed frontend assignment unless explicitly added later.
- The Ward direction is approved; the same visual system still needs to be applied to the remaining screens before final cross-screen design approval.

## Bugs and Technical Debt

- No failing product bug was found during this inspection.
- Application state is memory-only and resets on refresh; this is acceptable for mocks but must remain clearly presented as simulated.
- The initial production JavaScript chunk is 365.04 kB before gzip; charting and the safety-critical Ward/Bed path still account for most of it.

## Active Milestone

**UI-R2 — Apply the approved Ward visual system across the remaining screens.**

The live R8 Part H functional checklist remains complete. The active work is visual only: preserve every verified workflow, exact clinical copy, role boundary, mock label, and safety invariant while bringing Bed Detail, Alerts, the remaining authenticated routes, Landing, and Login into the approved theme.

### UI-R1 Verified Result — Ward Visual Direction

- The application header is black with individual white oval navigation controls; the active route is a solid white pill with black text.
- The Ward workspace is soft white and blue. Patient cards are light while ECG/PPG waveform panels remain dark like bedside monitors.
- All twelve bed cards have the same measured height at the four-column desktop layout and retain responsive one-, two-, three-, and four-column behavior.
- The alert rail is a light clinical side panel with blue action rows; alarm priority remains explicit through text and the exact red, yellow, and cyan clinical tokens.
- Decorative green was replaced with blue. Green remains only where it communicates ECG, freshness, or trusted bed-monitoring state.
- The full quality gate passes with 116 unit/component tests, 33 Playwright tests, all 14 route axe scans, desktop/tablet responsive coverage, TypeScript compilation, and the production build.

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

### R8-F8 Verified Result — S10 Shift Briefing and Workload

- Nurse and doctor briefing access now opens a two-tab S10 view rather than the former generic assignment summary.
- The Briefing tab labels its plain-language handover as AI-written by IBM Granite and shows the required since-08:00 incident, untrusted-bed, open-ticket, and per-bed Blind Time evidence.
- The Workload tab displays alarms received by each nurse in the last two hours, a visible line at 40, exact alarm counts, and a textual warning chip for each nurse at or above the threshold.
- Workload warnings use neutral pattern and text instead of clinical alarm colors, so workload pressure cannot be mistaken for patient urgency.
- Typed mock and Zod-validated HTTP adapters isolate the provisional `GET /api/briefing?since=` and `GET /api/workload?hours=2` contracts; mock mode remains the safe default.
- The full quality gate passes with 101 unit/component tests and 30 Playwright tests, including all-route axe scans and desktop/tablet workflows.

### R8-F9 Verified Result — S11 Append-only Action Log

- All five roles can read the same action log, while Undo controls appear only for the IT role.
- The log uses the required Time, Agent or person, Action, Bed / device, Approved by, and Undo columns, with free-text search and All/Automatic/People/Undoable filters.
- A typed mock/backend adapter requests `GET /api/actions?limit=200`, validates the provisional response, and preserves deterministic mock behavior until backend confirmation.
- Reversible automatic isolation can be undone through the locked command boundary; the original row remains and a new human-approved record references it.
- Non-reversible clinical alert creation stays visible and cannot be undone, preserving the rule that tampering or operator actions must never suppress an emergency.
- The full quality gate passes with 106 unit/component tests and 31 Playwright tests, including all-route axe scans and desktop/tablet workflows.

### R8-F10 Verified Result — S12 Demo Control

- Demo Control remains hidden from every non-operator role and now exposes the exact seven scenarios: Full ward script (12 min), Real emergency only, Loose sensor, Drift, Replay attack, Fake flatline, and Flood.
- The operator can Run, Pause, Resume, and Reset ward fixtures, with selectable 1×, 2×, or 5× playback and disabled controls during pending commands.
- The live timeline shows the complete schedule, current elapsed time, progress, and textual done/next/upcoming state without using alarm colors for control state.
- Replay attack playback marks the monitor untrusted and isolated without creating a clinical alarm; emergency playback retains high clinical priority.
- Typed mock and Zod-validated HTTP adapters isolate the locked `POST /api/demo/run {scenario, speed}` and `POST /api/demo/reset` contracts; rejected commands do not change ward fixtures.
- The full quality gate passes with 110 unit/component tests and 32 Playwright tests, including all-route axe scans and desktop/tablet workflows.

### R8-F11 Verified Result — Exact Telegram Frontend Behavior

- The secondary Telegram screen now presents all eight specified events: real emergency, timed escalation, loose sensor, drifting sensor, untrusted monitor, combined emergency and tampering, IT-only device attack, and unclear readings.
- Each template preserves the specified recipient, bold first line, reason/action copy, time, and role-aware callback controls. Every callback payload is measured and remains within Telegram's 64-byte limit.
- High clinical alerts include a 12-second waveform preview and a measured photo caption below Telegram's 1,024-character limit.
- A callback edits the existing message instead of creating a duplicate; escalation also updates the same emergency message and advances its recipient.
- The per-chat queue releases at most one message per second and merges repeated notifications for the same bed into the existing message with a visible repeat count.
- Telegram remains a secondary representation of central Ward state and cannot suppress a clinical alarm or imply independent treatment action.
- Telegram acknowledgement now dispatches through the same typed command path as S4 and synchronizes the central alert and Ward state. Patient OK / NOT OK dispatches through the same bedside-check path as S3; rejection leaves both the message and clinical state unchanged.
- The full quality gate passes with 115 unit/component tests and 33 Playwright tests, including all-route axe scans and desktop/tablet workflows.

### R8-F12 Verified Result — Drive Functional Completion Audit

- Every S0-S12 route, role boundary, mock data path, safety invariant, and Telegram template was reconciled against the live R8 document and its Part H done checklist.
- The audit identified one functional gap: Telegram buttons edited their preview but did not update the central clinical source of truth.
- Telegram On my way now acknowledges the matching central alert and Ward bed only after typed command acceptance.
- Telegram Patient OK / NOT OK now records the same bedside response and append-only action as Bed Detail; NOT OK immediately preserves or raises the high clinical alert.
- Unit and browser regression coverage proves the message edit and shared clinical state change happen together, while rejected commands cannot create false success.
- The full quality gate passes with 115 unit/component tests and 33 Playwright tests, including 14 route axe scans and desktop/tablet workflows.

### R8-F13 Verified Result — Alarm-colour Safety and Motion

- The locked product tokens now distinguish calm blue accent and neutral status colours from the exact alarm-only red, yellow, and cyan tokens.
- Generic navigation, loading, trust, freshness, workload, security, connection, report, and button states no longer reuse clinical alarm colours.
- Bed tiles, alert priority chips, the alarm rail, activity markers, the global high-alert strip, and the landing alarm preview retain alarm colours because they represent real clinical priority.
- High tiles flash at 2 Hz and medium tiles at 0.67 Hz, within the specified frequency ranges; low tiles remain steady.
- Reduced-motion mode removes all flashing and replaces high/medium motion with a steady 8 px priority border, preserving urgency without animation.
- Browser tests verify exact alarm tokens, timing, steady low priority, reduced-motion fallback, and desktop/tablet behavior. All 14 route axe scans pass with colour contrast enabled.
- The full quality gate passes with 116 unit/component tests and 33 Playwright tests.

### R8-F14 Verified Result — Ward Two-metre Readability

- Compact Ward tiles now place HR and SpO₂ in two equal columns and render both numeric values at 40 px; BP uses a separate full-width row to preserve legibility without clipping.
- The layout retains patient identity, waveform, trust, verdict, action, freshness, and acknowledgement information on every tile.
- Browser assertions verify the computed HR and SpO₂ size is at least 40 px and each vital cell has no horizontal overflow.
- Desktop, 1024×768 landscape tablet, and 768×1024 portrait tablet projects all pass the same responsive and reduced-motion workflow.
- The final full gate passes with 116 unit/component tests, 33 Playwright tests, 14 route axe scans with colour contrast, TypeScript compilation, and the production build.

## Prioritized Roadmap

1. Apply the approved Ward visual system to Bed Detail and Alerts without changing clinical behavior.
2. Apply the shared theme to the remaining authenticated routes, then Landing and Login.
3. Run the full cross-screen accessibility and workflow gate before final design approval.
4. When the team repository and services exist, integrate the typed adapters without changing the verified UI safety invariants.

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
- Tests: 31 files passed; 116 tests passed.
- Browser regression: 33 Playwright tests passed across desktop Chromium, landscape tablet, and portrait tablet projects.
- Accessibility: 14 material routes passed automated axe checks with color contrast enabled.
- TypeScript and production build: passed.
- Build output: 185 modules; CSS 64.49 kB (13.55 kB gzip); initial JavaScript 365.80 kB (120.98 kB gzip), plus the Ward store, five lazy route-family chunks, and shared utility chunks.

## Next Recommended Actions

1. Continue UI-R2 with Bed Detail and Alerts, using the Ward as the approved reference.
2. Preserve the complete verified functional baseline and keep real backend, Telegram delivery, deployment, and team-repository integration outside this visual milestone.
3. Re-run all route axe scans, workflows, responsive checks, and the production build after each cohesive UI milestone.
