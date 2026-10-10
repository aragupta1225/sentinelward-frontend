# SentinelWard Frontend

Role-based clinical command interface for SentinelWard, owned by Antara Gupta.

The repository is a working, mock-driven React frontend. It keeps clinical urgency, signal trust, connection freshness, and device isolation independent, and it never implies that frontend actions modify patient treatment.

## Implemented application

- Protected routes, home screens, and read/action boundaries for all five specified demo roles.
- Ward dashboard with twelve beds, default-on name privacy, stopped-alarm summary, global high-alert strip, alert queue, live mock telemetry, keyboard navigation, and focus return.
- Bed Detail response, verdict explanation, six model checks, body/network witnesses, bedside confirmation, hand-check recording, escalation, isolation, undo, trend, and append-only action workflows.
- Alerts and escalation, census, security inventory, incident evidence, editable CERT-In report, biomedical ticket, briefing, action log, demo, and Telegram-template screens.
- Nurse/doctor alert workflow with Open, Acknowledged, and All views, a three-step escalation ladder, response history, and simulated Telegram message editing.
- IT security workflow with a 12-device inventory, live attack feed, network witness, fleet hunt, confirmed isolation/reconnect, incident timelines, downloadable evidence fingerprints, and human-controlled CERT-In reporting.
- Deterministic emergency, sensor, tampering, combined-threat, and connection-loss scenarios.
- Validated REST, WebSocket, and command adapter boundaries with mock mode as the safe default.
- Route-family code splitting keeps noncritical clinical, security, support, and demo screens out of the initial bundle.
- Resilient system font stacks avoid a runtime dependency on an external font service.
- Unit, component, full-route axe, and Playwright workflow coverage.

All authentication, patient telemetry, commands, incidents, evidence, reports, tickets, assignments, and messages are simulated until the owning backend team confirms and connects real contracts.

## Architecture

Components consume frontend domain models rather than raw transport payloads:

```text
transport payload
      ↓
Zod validation and mapping
      ↓
frontend domain model
      ↓
Zustand store
      ↓
React component
```

One runtime bootstrap selects the complete adapter set. Supported frontend configuration:

- `VITE_SENTINELWARD_RUNTIME_MODE`: `mock` by default, or `backend`.
- `VITE_SENTINELWARD_API_BASE_URL`: REST and command base URL; defaults to `/api`.
- `VITE_SENTINELWARD_WS_URL`: optional WebSocket URL; otherwise derived from the current host.

Backend mode is provisional and has not been verified against a real SentinelWard service.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173/ward`. The app redirects unauthenticated users to the development role selector.

## Verification

Install the Playwright browser once:

```bash
npx playwright install chromium
```

Run the complete gate:

```bash
npm run check
```

The gate runs lint, the unit/component suite, 26 Playwright tests, TypeScript compilation, and the production build. Playwright covers critical workflows, all material routes with axe color-contrast checks, and desktop plus tablet viewports.

## Source scope

The authoritative frontend scope defines 13 screens, S0 through S12. S4 is Alerts and escalation; Telegram is a secondary channel in addition to those screens. This practice repository contains Antara Gupta's frontend work only and will be integrated into the team repository later.
