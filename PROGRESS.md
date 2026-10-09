# SentinelWard Frontend Progress

Last verified: 2026-10-09

Owner: Antara Gupta

Repository status at inspection: `main` matched `origin/main` at `f08f094` before M4 implementation.

## Current Status

The repository is a working, mock-driven React frontend with all specified routes represented. The Ward and Bed Detail flows are the most mature. Operational screens and stateful workflows exist for doctor, IT, biomedical, operator, reporting, and demo use, but no real backend is connected and the current visual design remains subject to later refinement.

The specification still has no S4: it defines 12 numbered web screens plus Telegram while claiming 13 web screens.

## Completed and Verified

- React/Vite/TypeScript application shell with protected routing and five provisional roles.
- Landing, development login, Ward, Bed Detail, Census, Security, Incident, CERT-In draft, Tickets, Briefing, Action Log, Demo Control, and Telegram template routes.
- Twelve-bed Ward grid, summary metrics, alert rail, recent activity, responsive column changes, collapsed-alert discoverability, arrow-key navigation, Enter-to-open, and focus return.
- Reusable Bed Tile covering all eight verdicts plus loading, unassigned, stale, disconnected, untrusted, and isolated states.
- Canvas ECG/PPG display, last-trusted-value retention, explicit data age, and no zero/flatline inference for missing data.
- Bed Detail overview, mock 30-minute uPlot trends, append-only actions, separate “On my way” and bedside confirmation, immediate high alert for “Patient NOT OK,” isolation, and referencing undo actions.
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

All listed behavior is frontend or mock behavior unless explicitly stated otherwise.

## Incomplete Features

- Backend mode is selectable but remains provisional and unverified against a real service. Configuration uses `VITE_SENTINELWARD_RUNTIME_MODE`, `VITE_SENTINELWARD_API_BASE_URL`, and optional `VITE_SENTINELWARD_WS_URL`; mock mode remains the default.
- Authentication, authorization, persistence, telemetry, incidents, evidence, reports, tickets, assignments, and Telegram delivery are not backed by real services.
- Report submission is intentionally absent; the UI supports draft/review only.
- WebSocket missed-event recovery invokes a hook, but recovery fetching and reconciliation are not implemented.
- Screenshot-based visual regression is not configured; responsive behavior is covered functionally at desktop, landscape tablet, and portrait tablet viewports.
- Production deployment configuration, SPA deep-link fallback, CI, monitoring, and error reporting are not configured.
- Final brand/design approval remains external; the current system is a consistent, accessible functional baseline.

## Bugs and Technical Debt

- No failing product bug was found during this inspection.
- Application state is memory-only and resets on refresh; this is acceptable for mocks but must remain clearly presented as simulated.
- The production JavaScript bundle is currently about 466 kB before gzip; route-level code splitting has not been applied.
- Google Fonts are loaded at runtime, creating an avoidable external availability dependency.

## Active Milestone

**M5 — Delivery performance and runtime independence (active).**

M4 is complete and verified. The next implementation work reduces the initial route bundle and removes the runtime font-service dependency without changing application behavior.

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

### M5 Acceptance Criteria — Delivery Performance and Runtime Independence

- Lazy-load noncritical route families with an accessible loading fallback while keeping Ward navigation and route guards stable.
- Remove the Google Fonts runtime request and use a resilient system font stack.
- Demonstrate a materially smaller initial JavaScript bundle without hiding safety-critical UI behind an extra interaction.
- Keep all unit, axe, and browser workflow coverage green and pass `npm run check`.

## Prioritized Roadmap

1. Complete M5 route-level code splitting and remove the runtime font dependency.
2. Add CI, production deployment routing, monitoring, and error reporting.
3. Add screenshot-based visual regression after the visual baseline is approved.
4. Integrate confirmed backend contracts through adapters and mappers only.

## Provisional Backend Dependencies

The following are **provisional and unresolved**; they must not block mock-mode frontend work:

- Complete REST endpoint list and payload schemas.
- WebSocket envelope, authentication, sequencing, reconnect, and missed-event recovery.
- Final five-role permission matrix and identity/session contract.
- Missing S4 and final screen count.
- Acknowledge, escalate, isolation, undo, trust-restoration, and bedside-check contracts.
- History, evidence, network detail, report generation/submission, and reset paths.
- Summary metric formulas and whether untrusted incoming values are exposed to the frontend.
- Error envelope, idempotency, command status, pagination, timestamps/time zones, and audit identifiers.

## Latest Verification

Command: `npm run check`

- Lint: passed.
- Tests: 20 files passed; 72 tests passed.
- Browser regression: 21 Playwright tests passed across desktop Chromium, landscape tablet, and portrait tablet projects.
- Accessibility: 13 material routes passed automated axe checks with color contrast enabled.
- TypeScript and production build: passed.
- Build output: 169 modules; CSS 27.18 kB (6.70 kB gzip); JavaScript 468.17 kB (149.14 kB gzip).

## Next Recommended Actions

1. Introduce route-family lazy boundaries with an accessible loading fallback.
2. Remove the external Google Fonts import and adopt resilient system font stacks.
3. Verify initial chunk reduction and route behavior across direct and in-app navigation.
4. Rerun the full unit, axe, browser, and production-build gate.
