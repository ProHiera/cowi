# Function 2 – Operations Console

The operations console surfaces onboarding funnel progress, newly minted projects, and deployment triggers in one screen so operators can track and remediate issues after the survey wizard.

## Data sources

| Domain | Tables / helpers | Purpose |
| --- | --- | --- |
| Onboarding sessions | `onboarding_sessions` + `lib/data/onboarding.ts` | Capture survey responses, status (`draft/completed/failed`), deploy hook metadata |
| Projects | `projects`, `project_configs`, helpers in `lib/data/projects.ts` | Track created projects, associated stacks, current status in build lifecycle |
| Prompt templates | `lib/data/prompt-templates.ts` (mock fallback) | Provide recommended templates for context cards |
| Rooms / studio | `rooms`, `room_states` (future) | Optional realtime presence modules to embed later |

## Key metrics & widgets

1. **Pipeline summary cards** – counts of onboarding sessions (draft vs completed), projects by status (`prompt_ready`, `code_generated`, `deploy_configured`, `domain_ready`).
2. **Latest onboarding runs** – table showing user, purpose, template recommendation, deploy trigger result (status code, timestamp).
3. **Project health timeline** – per project list with stack, combo, latest status update, CTA to open project detail.
4. **Deploy hook activity** – log of POST attempts (status/ok/body excerpt) sourced from `deploy_response` JSON; highlight failures.
5. **Quick actions** – buttons to re-trigger deploy hook, start new onboarding session, or jump into Studio/Room for collaboration.

## API & server helpers

- Add consolidated query under `lib/data/console.ts` (new) to fetch:
  - Aggregated counts using Supabase RPC or client-side reduction.
  - Latest 10 onboarding sessions ordered by `updated_at`.
  - Latest 10 projects with `project_configs` and status fields.
- Expose `/api/console/summary` (GET) to hydrate client-side console with a single fetch.
- Optional `/api/console/deploy/[sessionId]` POST to retry deploy hook leveraging existing logic in `finalizeOnboardingSession` (refactor hook trigger into shared util to avoid duplication).

## UI composition

- Route: `/console` (server component) nested under `app/console/page.tsx` with loading skeletons.
- Components (under `components/console/`):
  - `metrics-grid.tsx` – cards for counts and conversion rate.
  - `onboarding-table.tsx` – table with status chips + deploy result tooltip.
  - `projects-timeline.tsx` – list with progress badges and CTA button.
  - `deploy-log-card.tsx` – small log viewer.
- Re-use existing shadcn/ui primitives (Card, Table, Badge, Button, Tabs) for consistency.

## Actions & interactions

- Each onboarding row: `Retry deploy` button → calls `/api/console/deploy/[sessionId]`.
- Project rows: `Open project` (link) and `Mark as configured` (PATCH `/api/projects/[id]`).
- Global `Start new wizard` button linking to `/wizard`.

## Open questions / follow-ups

- Do we need per-user scoping or global admin view? (Currently assumes signed-in user sees their own records.)
- Should deploy hook URL be stored per session or global env? (Now: per session metadata fallback.)
- Later features (Function 3+) may require hooking realtime updates into this console – design components with placeholder empty states for sockets.

## Implementation status

- Data aggregation helper in `lib/data/console.ts` + API routes under `app/api/console/*`.
- New React components under `components/console/` (metrics grid, onboarding table, project timeline, deploy log).
- Operations console page at `app/console/page.tsx` with loading state + sidebar navigation entry.
