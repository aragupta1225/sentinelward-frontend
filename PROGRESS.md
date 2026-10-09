# SentinelWard Frontend Progress

Last verified: 2026-10-09

Owner: Antara Gupta

Repository status at inspection: `main` matched `origin/main` at `6d947b0` before M1 implementation.

## Current Status

The repository is a working, mock-driven React frontend with all specified routes represented. The Ward and Bed Detail flows are the most mature. Operational screens and stateful workflows exist for doctor, IT, biomedical, operator, reporting, and demo use, but no real backend is connected and the current visual design is intentionally subject to later refinement.

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
- Unit, store, adapter, route, component, and limited axe regression coverage.

All listed behavior is frontend or mock behavior unless explicitly stated otherwise.

## Incomplete Features

- Backend mode is selectable but remains provisional and unverified against a real service. Configuration uses `VITE_SENTINELWARD_RUNTIME_MODE`, `VITE_SENTINELWARD_API_BASE_URL`, and optional `VITE_SENTINELWARD_WS_URL`; mock mode remains the default.
- Authentication, authorization, persistence, telemetry, incidents, evidence, reports, tickets, assignments, and Telegram delivery are not backed by real services.
- Report submission is intentionally absent; the UI supports draft/review only.
- WebSocket missed-event recovery invokes a hook, but recovery fetching and reconciliation are not implemented.
- End-to-end browser tests, full-route accessibility checks, visual regression, and automated responsive verification are not configured.
- Production deployment configuration, SPA deep-link fallback, CI, monitoring, and error reporting are not configured.
- Final UI polish is deferred; current styling is functional rather than approved final design.

## Bugs and Technical Debt

- No failing product bug was found during this inspection.
- Axe tests disable automated color-contrast checking and cover only a subset of routes; contrast requires a dedicated audit.
- `OperationalPages.tsx` and `index.css` concentrate many unrelated concerns and should be split gradually when affected features are changed.
- Legacy milestone/page components and the public `/lab/bed-tile` route remain after the full Ward and Bed Detail implementations.
- `README.md` describes the old first milestone and incorrectly says the Ward grid and Bed Detail are out of scope.
- Application state is memory-only and resets on refresh; this is acceptable for mocks but must remain clearly presented as simulated.
- The production JavaScript bundle is currently about 471 kB before gzip; route-level code splitting has not been applied.
- Google Fonts are loaded at runtime, creating an avoidable external availability dependency.

## Active Milestone

**M2 — Accessibility and workflow regression (queued; implementation not started).**

M1 is complete and verified. The next implementation work is browser-level workflow, accessibility, and responsive regression coverage.

### M1 Verified Result

- One typed bootstrap composition point selects the full adapter set from Zod-validated configuration, with mock mode as the safe default.
- Ward startup uses the configured REST and event interfaces, retains last-known fixtures on load failure, and aborts in-flight loading during cleanup.
- Ward and Bed Detail acknowledgement share one command path; no success state or activity is recorded before adapter acceptance.
- Automated coverage verifies mock/backend selection, invalid mode rejection, REST failure retention, command pending state, and command failure rollback.
- Existing mock workflows, safety behavior, and route access remain covered by the full passing quality gate.

### M2 Acceptance Criteria — Accessibility and Workflow Regression

- Playwright covers login/role routing, Ward-to-Bed focus return, acknowledgement versus bedside confirmation, isolation/undo, and one incident workflow.
- Axe runs across every material route with color contrast enabled or any tool limitation documented with a manual audit result.
- Desktop, landscape tablet, and portrait tablet layouts are verified; high alerts remain discoverable with a collapsed rail.
- Keyboard-only operation, live announcements, and reduced-motion behavior are verified without announcing waveform ticks.

## Prioritized Roadmap

1. Complete M2 end-to-end, accessibility, and responsive regression coverage.
2. Refactor oversized page/style modules while preserving behavior and tests.
3. Polish the shared design system and screen hierarchy after functional flows are stable.
4. Add route-level code splitting, local font strategy, CI, and deployment routing.
5. Integrate confirmed backend contracts through adapters and mappers only.

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
- Tests: 20 files passed; 69 tests passed.
- TypeScript and production build: passed.
- Build output: 163 modules; CSS 31.70 kB (7.38 kB gzip); JavaScript 470.68 kB (149.25 kB gzip).

## Next Recommended Actions

1. Begin M2 with Playwright configuration and the login/role-routing critical path.
2. Add Ward-to-Bed focus-return, acknowledgement-versus-bedside-confirmation, isolation/undo, and incident workflow coverage.
3. Expand axe coverage across material routes and document or resolve color-contrast limitations.
4. Verify desktop and tablet layouts, keyboard-only operation, live announcements, and reduced-motion behavior.
