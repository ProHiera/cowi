## Cowi Flow OS

Combo-driven deployment assistant built with Next.js 15 App Router, Tailwind CSS v4, shadcn/ui, and Supabase (DB/Auth/Realtime). Users run through a continuous flow:

1. Choose a deployment combo (enterprise/web/app/custom)
2. Draft or reuse AI prompts
3. Capture code generation plan (mock template repo URLs for now)
4. Configure deployment inputs (repo/build/output/env)
5. Jump into domain search and realtime collaboration rooms

Everything still deploys to Vercel; alternate providers (AWS, Netlify, Expo) are concept-only.

## Getting started

```bash
npm install
cp .env.example .env.local # set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

Visit `http://localhost:3000` to explore the flow. Supabase tables referenced in `lib/types.ts` should exist (or use the SQL in `/supabase` when added). Prompt templates and rooms gracefully fall back to mock data if the tables are empty.

## Key directories

| Path | Purpose |
| --- | --- |
| `app/` | App Router routes + API handlers (`/studio`, `/project/[id]`, `/room/[id]`, `/prompts`, `/api/...`) |
| `components/` | shadcn/ui driven building blocks (ComboCard, PromptEditor, DeploymentForm, DomainSearchPanel, RoomView, etc.) |
| `lib/constants.ts` | Combo presets, status labels, fallback prompts |
| `lib/data/*` | Server helpers that talk to Supabase via `lib/supabase/server-client.ts` |
| `lib/supabase/*` | Server/browser clients ready for Supabase Auth + Realtime |

## Planned integrations

- **AI code generation** – plug LLM calls inside `PromptStudioPanel` save routine. Use Supabase Edge Functions or Vercel AI SDK.
- **Deployment automation** – extend `/api/projects/[id]` PATCH to trigger Vercel Deploy Hooks, GitHub repo scaffolding, and environment syncing.
- **Domain providers** – replace mock data in `DomainSearchPanel` with Namecheap / Route53 API responses.
- **Auth & realtime presence** – wire Supabase Auth to populate `room_participants` and secure project data via RLS policies.

## Deployment

Deploy the Next.js app to Vercel. Provision Supabase (Postgres + Auth + Realtime) separately and supply the env vars noted above.
