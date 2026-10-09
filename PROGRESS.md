# SentinelWard Frontend Progress

Last verified: 2026-10-09

Owner: Antara Gupta

Repository status at inspection: `main` matched `origin/main` at `888076f` before M5 implementation.

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
- Noncritical clinical, security, support, and demo route families are lazy-loaded behind an accessible status fallback; Ward and Bed Detail remain in the initial safety-critical bundle.
- The external Google Fonts request has been removed in favor of resilient system sans and monospace stacks.

All listed behavior is frontend or mock behavior unless explicitly stated otherwise.

## Incomplete Features

- Backend mode is selectable but remains provisional and unverified against a real service. Configuration uses `VITE_SENTINELWARD_RUNTIME_MODE`, `VITE_SENTINELWARD_API_BASE_URL`, and optional `VITE_SENTINELWARD_WS_URL`; mock mode remains the default.
- Authentication, authorization, persistence, telemetry, incidents, evidence, reports, tickets, assignments, and Telegram delivery are not backed by real services.
- Report submission is intentionally absent; the UI supports draft/review only.
- WebSocket missed-event recovery invokes a hook, but recovery fetching and reconciliation are not implemented.
- Screenshot-based visual regression is not configured; responsive behavior is covered functionally at desktop, landscape tablet, and portrait tablet viewports.
- Production deployment, CI, monitoring, and backend infrastructure are not configured and are outside Antara Gupta's confirmed frontend assignment unless explicitly added later.
- Final brand/design approval remains external; the current system is a consistent, accessible functional baseline.

## Bugs and Technical Debt

- No failing product bug was found during this inspection.
- Application state is memory-only and resets on refresh; this is acceptable for mocks but must remain clearly presented as simulated.
- The initial production JavaScript chunk is about 444 kB before gzip; charting and the safety-critical Ward/Bed path still account for most of it.

## Active Milestone

**Confirmed functional frontend scope complete — UI update pending.**

M5 is complete and verified. No additional functional milestone is authorized by the supplied frontend scope. The next confirmed phase is the user-directed UI update; backend-dependent work remains paused behind unconfirmed contracts.

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

### Current Scope Boundary

- Antara Gupta's confirmed responsibility is the SentinelWard frontend represented by the supplied screens, workflows, safety behavior, typed adapters, mock mode, accessibility, and responsive behavior.
- Do not add CI, hosting-provider configuration, monitoring, backend infrastructure, or speculative product features unless they are explicitly assigned.
- Do not invent S4, backend payloads, final permissions, recovery semantics, or report/Telegram delivery contracts.
- The next authorized implementation phase is UI refinement after direction from the user.

## Prioritized Roadmap

1. Update the existing UI when the user provides or confirms the visual direction.
2. Add screenshot-based visual regression only after that visual baseline is approved.
3. Integrate frontend-facing backend contracts through adapters and mappers only after the owning team confirms them.
4. Resolve the missing-S4/screen-count ambiguity only after product clarification.

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
- Build output: 168 modules; CSS 27.44 kB (6.72 kB gzip); initial JavaScript 444.39 kB (143.55 kB gzip), plus four lazy route-family chunks and three small shared chunks.

## Next Recommended Actions

1. Preserve the current verified functional baseline until UI direction is confirmed.
2. Keep mock mode as the safe default while backend contracts remain unconfirmed.
3. Do not begin infrastructure or speculative feature work under Antara Gupta's frontend scope.
