# Function 3 – Prompt Library & Recommendations

Goal: deliver a full prompt reuse system with personal/team storage, smart recommendations, LLM usage logging, and one-click deployment sync.

## Data model (Supabase)

New SQL: `supabase/prompt-library-schema.sql`

- `prompt_library_entries`
  - `id uuid default uuid_generate_v4()`
  - `user_id uuid not null references auth.users`
  - `team_id uuid null` (future use)
  - `title text not null`
  - `summary text null`
  - `content text not null`
  - `combo_type text` (matches `ComboType | 'all'`)
  - `tags text[] default '{}'`
  - `metadata jsonb null` (store tone, languages, etc.)
  - `is_shared boolean default false`
  - `usage_count integer default 0`
  - timestamps + RLS (owner or shared read, owner write)
- `prompt_usage_logs`
  - `id uuid`
  - `user_id uuid`
  - `project_id uuid null`
  - `prompt_id uuid null references prompt_library_entries`
  - `combo_type text`
  - `provider text`
  - `tokens_input integer`
  - `tokens_output integer`
  - `cost_usd numeric(10,4)`
  - `metadata jsonb`
  - `created_at timestamptz default now()`
- `prompt_recommendations` (materialized view via SQL or server view) – optional caching of computed scores.

RLS: enforce user ownership; shared prompts readable if `is_shared = true`.

### Types
- Update `supabase/types.gen.ts`, extend `lib/types.ts`:
  - `PromptLibraryEntry`, `PromptUsageLog`, `PromptRecommendation` interfaces.

## Server helpers / APIs

- `lib/data/prompt-library.ts`
  - `listUserPrompts({ filter })`
  - `createPromptEntry(payload)`
  - `updatePromptEntry(id, payload)`
  - `logPromptUsage(event)` – called from studio + auto-deploy flows
  - `getPromptRecommendations(context)` – returns scored list (based on tags/tokens/LLM suggestions)
- API routes:
  - `app/api/prompts/entries` (GET, POST)
  - `app/api/prompts/entries/[id]` (PATCH, DELETE)
  - `app/api/prompts/recommend` (POST) – accepts context (combo, purpose, past usage) and returns recommended templates
  - `app/api/prompts/apply` (POST) – copies chosen prompt into project/studio and optionally triggers deploy (calls existing helpers)

## Recommendation logic

1. **Rule-based baseline**: match `combo_type`, tags overlap, popularity (`usage_count`).
2. **LLM assist (optional)**: call provider using `PROMPT_SUGGESTION_MODEL` env (default to existing free provider). Cache result per context (combo + purpose + timestamp bucket) for 15 min to control cost.
3. **Usage feedback**: `prompt_usage_logs` increment counts; surface “This prompt saved you $X last week” style stats.

## UI/UX

- Route remains `/prompts` but redesigned into three sections:
  - **My Prompts** – CRUD table/list with share toggle, usage count, tags.
  - **Recommended** – horizontal cards driven by `getPromptRecommendations`.
  - **Usage & Auto-apply** – log viewer + “Apply to project” modal with deploy toggle.
- Components under `components/prompt-library/`:
  - `prompt-form.tsx` (drawer or dialog for create/edit)
  - `prompt-card.tsx`
  - `recommendations-rail.tsx`
  - `usage-chart.tsx` (basic chart or stats list)
- Integration with Studio:
  - When user clicks “Apply”, call `/api/prompts/apply` to persist selection + navigate to `/studio?promptId=...` or patch existing project prompt.

## Env / config

- Optional `PROMPT_SUGGESTION_MODEL` + `PROMPT_SUGGESTION_PROVIDER_KEY` for LLM recommendation call; falls back to rule-based if missing.
- Rate limit recommendation endpoint (per user) using Supabase RLS + front-end cooldown.

## Security / cost

- Never store full API keys in the prompt tables; only references.
- Limit LLM helper tokens, log every call cost in `prompt_usage_logs`.
- Shared prompts only expose metadata + sanitized content.

## Rollout plan

1. Create SQL + regenerate types.
2. Implement data helpers + API routes.
3. Replace `/prompts` page with new sections & components.
4. Connect Studio + Deploy flows to logging + auto apply.
5. Add console widgets (later) that visualize prompt usage.
