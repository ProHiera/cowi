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

Visit `http://localhost:3000` to explore the flow. Supabase tables referenced in `supabase/types.gen.ts` should exist (or use the SQL in `/supabase` when added). Prompt templates and rooms gracefully fall back to mock data if the tables are empty.

### Apply the AI / Onboarding schema + generate types

1. Run the SQL in `supabase/ai-schema.sql`, `supabase/onboarding-schema.sql`, `supabase/prompt-library-schema.sql`, **and** `supabase/vscode-agent-schema.sql` against your project. Either paste them into the Supabase Dashboard SQL editor or run them locally:

	```bash
	# using psql + a direct connection string
	psql "$SUPABASE_DB_URL" -f supabase/ai-schema.sql

	# or via the Supabase CLI when linked to your project
	npx supabase db remote commit --file supabase/ai-schema.sql
	npx supabase db remote commit --file supabase/onboarding-schema.sql
	npx supabase db remote commit --file supabase/prompt-library-schema.sql
	npx supabase db remote commit --file supabase/vscode-agent-schema.sql
	```

2. Refresh the generated types whenever the schema changes:

	```bash
	npx supabase gen types typescript --project-id YOUR_PROJECT_REF --schema public > supabase/types.gen.ts
	```

### Environment variables for AI previews

- `COWI_FREE_MODEL_API_KEY` – optional shared API key so the built-in "cowi_free" provider can answer requests without a user secret.
- `COWI_FREE_MODEL_BASE_URL` – override the default mock endpoint if you proxy the free tier elsewhere.
- `VERCEL_DEPLOY_HOOK_URL` – optional hook called by the onboarding wizard once a survey is completed.
- `PROMPT_SUGGESTION_MODEL` / `PROMPT_SUGGESTION_PROVIDER_KEY` – optional model + API key used to enrich prompt recommendations. If omitted, the console falls back to rule-based scoring only.
- `VS_AGENT_SIGNING_KEY` – optional shared secret used to sign VSCode agent webhook payloads.
- `AGENT_TRANSLATION_MODEL` / `AGENT_SUMMARY_MODEL` – optional model names used for error translation + summarization.
- `AGENT_ASSIST_PROVIDER_KEY` – API key for the provider that serves translation/summary requests. When omitted, the agent falls back to heuristic summaries only.
- `MOBILE_BASE_URL` – prod web URL loaded by the Expo WebView shell (defaults to deployed Vercel domain).
- `MOBILE_STAGE_URL` – optional staging URL surfaced in the mobile settings screen for quick switching.

Custom provider keys are never stored in the database. Instead, create model configs in the UI and point `secret_reference` to an environment variable (e.g., `OPENAI_API_KEY`) that exists in `.env.local` on the server.

## Key directories

| Path | Purpose |
| --- | --- |
| `app/` | App Router routes + API handlers (`/wizard`, `/console`, `/studio`, `/project/[id]`, `/room/[id]`, `/prompts`, `/api/...`) |
| `components/` | shadcn/ui driven building blocks (ComboCard, PromptEditor, DeploymentForm, DomainSearchPanel, RoomView, etc.) |
| `lib/constants.ts` | Combo presets, status labels, fallback prompts |
| `lib/data/*` | Server helpers that talk to Supabase via `lib/supabase/server-client.ts` |
| `lib/supabase/*` | Server/browser clients ready for Supabase Auth + Realtime |
| `apps/mobile` | Expo Router project hosting the React Native WebView shell for Function 5 |

## Planned integrations

- **AI code generation** – plug LLM calls inside `PromptStudioPanel` save routine. Use Supabase Edge Functions or Vercel AI SDK.
- **Deployment automation** – extend `/api/projects/[id]` PATCH to trigger Vercel Deploy Hooks, GitHub repo scaffolding, and environment syncing.
- **Domain providers** – replace mock data in `DomainSearchPanel` with Namecheap / Route53 API responses.
- **Auth & realtime presence** – wire Supabase Auth to populate `room_participants` and secure project data via RLS policies.
- **Mobile shell** – extend `apps/mobile` to progressively replace the WebView with native screens once shared service modules are extracted.

## Mobile WebView (Function 5)

The Expo project under `apps/mobile` bootstraps a React Native shell that loads the deployed web app while providing a native settings screen for switching between prod/stage URLs. To run it locally:

```bash
# from repository root
npm install # ensure root + mobile deps
npm run mobile

# alternatively inside apps/mobile
cd apps/mobile
npm install
npx expo start --tunnel
```

Environment overrides:

- `MOBILE_BASE_URL` controls the default URL opened by the WebView.
- `MOBILE_STAGE_URL` adds a quick shortcut in the settings panel.

Refer to `docs/function-5-mobile.md` for architecture notes and the roadmap toward full native parity.

## Deployment

Deploy the Next.js app to Vercel. Provision Supabase (Postgres + Auth + Realtime) separately and supply the env vars noted above.
