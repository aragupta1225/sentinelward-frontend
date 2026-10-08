# SentinelWard Frontend Working Agreement

Read this file and `PROGRESS.md` before making changes. This repository is owned by Antara Gupta and contains frontend work only. Do not create backend infrastructure or additional documentation files unless explicitly requested.

## Objectives

- Deliver a polished, accessible, role-based clinical command interface.
- Keep clinical urgency, signal trust, connection freshness, and device state visually independent.
- Preserve safety rules: never render a blank patient, never treat missing data as zero, never suppress an emergency because data is untrusted, and never imply that frontend automation changes treatment.
- Keep the application ready for later integration with the team backend without redesigning components.

## Stack and Architecture

- React, Vite, TypeScript, React Router, Zustand, Zod, Canvas waveforms, and uPlot trends.
- Components consume frontend domain models, never raw transport payloads.
- Keep the flow: transport payload -> Zod validation/mapping -> domain model -> Zustand store -> React component.
- Put backend reads, events, and mutations behind typed adapter interfaces. Keep provisional endpoint details inside adapters.
- Store role permissions and route access in configuration, not scattered component conditions.
- Prefer small reusable components, domain helpers, and focused stores over duplicated page logic.

## Code and UI Quality

- Keep TypeScript strict, avoid `any`, validate untrusted data, and handle loading, empty, stale, disconnected, untrusted, success, and failure states explicitly.
- Preserve existing behavior unless a change is intentional and tested. Remove dead code only after confirming it has no active route or dependency.
- Reuse design tokens and established patterns before adding styles. Status meaning must never depend on color alone.
- Maintain visible focus, semantic structure, keyboard operation, 44x44 px touch targets, reduced-motion support, and responsive layouts from desktop through portrait tablet.
- Do not announce continuous waveform updates. Announce new high alarms and connection changes once.
- Keep all user-facing ownership references spelled exactly `Antara Gupta`.

## Testing

- Add or update unit tests for domain logic, stores, adapters, and safety rules.
- Add component tests for user-visible states and interactions; prefer accessible queries.
- Run `npm run check` before marking a milestone complete. It must pass lint, Vitest, TypeScript, and the production build.
- Add axe checks for material screens. Add Playwright coverage for critical cross-route workflows when that milestone begins.
- Never weaken tests merely to make a change pass; document genuine limitations in `PROGRESS.md`.

## Mocks and Future APIs

- Mocks must be deterministic, typed, and implement the same interfaces as future adapters.
- Clearly label mock authentication, telemetry, actions, evidence, reports, tickets, and message templates as simulated.
- Do not describe accepted mock commands as backend execution.
- Backend contract changes should require mapper or adapter changes, not component rewrites.
- Treat role permissions, endpoints, WebSocket envelopes, recovery behavior, and metric formulas as provisional until confirmed.

## Autonomous Workflow

1. Read `AGENTS.md` and `PROGRESS.md`, then inspect Git status before editing.
2. Select the highest-priority actionable milestone and work on only that milestone.
3. Inspect affected code and tests, implement the smallest cohesive change, and preserve unrelated work.
4. Verify behavior and run the full quality gate.
5. Update `PROGRESS.md` with verified results, remaining debt, and the next action.
6. Continue to the next actionable milestone unless a major product decision, destructive action, or external dependency blocks safe progress.

## Git Safety

- Never overwrite or discard uncommitted user work. Do not use destructive reset, checkout, clean, rebase, force-push, or history rewriting without explicit instruction.
- Review `git diff` and `git status` before committing. Keep commits milestone-scoped and descriptive.
- Do not commit generated output, credentials, secrets, local environment files, or unrelated changes.
- Do not claim work is pushed until local and remote branch state has been verified.

## Definition of Done

A frontend feature is done only when:

- Its user flow, edge states, safety constraints, permissions, and responsive behavior are implemented.
- Backend-dependent behavior remains behind typed mocks/adapters and is labeled accurately.
- Keyboard and screen-reader behavior is intentional, with no color-only status communication.
- Relevant tests are added or updated and `npm run check` passes.
- No unrelated regression or unhandled failure path is introduced.
- `PROGRESS.md` records the verified result, limitations, and next milestone.
