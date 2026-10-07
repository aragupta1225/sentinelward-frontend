# SentinelWard Frontend

Role-based clinical command interface for SentinelWard, owned by Antara Gupta.

## Current milestone

The first vertical slice implements one reusable, domain-driven bed tile with:

- all eight verdicts;
- deterministic loading, empty, stale, disconnected, untrusted, and isolated fixtures;
- live mock telemetry behind replaceable REST and WebSocket adapter interfaces;
- Canvas ECG and PPG snapshots;
- last-trusted-data retention for untrusted signals;
- explicit emergency and device-isolation presentation for `BOTH`;
- responsive and reduced-motion styles.

The complete Ward grid and Bed Detail screen are intentionally outside this milestone.

## Architecture

Components consume frontend domain models rather than backend payloads. Raw data is validated and mapped before it reaches application state:

```text
REST / WebSocket payloads
        ↓
Zod validation and mapping
        ↓
Frontend domain models
        ↓
Zustand store
        ↓
React components
```

Mock adapters implement the same boundaries planned for the future backend integration.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173/ward`.

## Verification

```bash
npm run check
```

This runs linting, unit/component tests, TypeScript compilation, and a production build.

## Open specification issue

The supplied source claims 13 web screens but defines 12 numbered web screens plus Telegram. No S4 is defined. This remains unresolved pending backend/team confirmation.
