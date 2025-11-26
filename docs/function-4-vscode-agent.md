# Function 4 – VSCode Agent (Draft)

Goal: capture IDE diagnostics (terminal output, Problems list) and feed them into Cowi so operators can translate, summarize, and push automated fixes + deployments.

## Scope

1. **Event ingestion** – VSCode extension POSTs events to `/api/agent/events` with payloads such as stderr snippets, problem JSON, or user-submitted fix plans.
2. **LLM-enriched processing** – server translates non-English logs, summarizes failures, and proposes 2–3 root cause hypotheses. Optional model configuration via env vars keeps cost under control.
3. **Diff generation** – when events include `filePath`, `originalSnippet`, and `proposedSnippet`, Cowi generates a unified patch that operators can approve via the web UI (or round-trip to the extension for auto apply/commit).
4. **Audit trail** – everything lands in `agent_events` with RLS enforced so each user/team can review prior incidents.

## Data model (`supabase/vscode-agent-schema.sql`)

```
agent_events
  id uuid pk
  user_id uuid → auth.users
  event_type text ('terminal' | 'problem' | 'translation' | 'diff')
  source text default 'vscode'
  status text ('received' | 'processing' | 'ready' | 'applied' | 'error')
  payload jsonb (raw event)
  language / detected_language
  translated_text, summary
  root_cause jsonb (array of hypothesis objects)
  file_path, original_snippet, proposed_snippet, fix_patch
  fix_status, resolution_notes
  metadata jsonb
  timestamps + handle_updated_at trigger
```

Policies: owner read/write only.

## APIs

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/agent/events` | `POST` | Record event, immediately run translator/summary/diff pipeline, return enriched record. |
| `/api/agent/events` | `GET` | List recent events for the signed-in user (`?limit=`). |
| `/api/agent/events/[id]` | `PATCH` | Update status (`processing`, `ready`, `applied`, `error`) plus resolution notes/fix state once an operator approves or rejects a patch. |

Payload example for `POST`:

```json
{
  "eventType": "terminal",
  "source": "vscode",
  "language": "ko",
  "payload": {
    "text": "에러: TypeError: Cannot read properties of undefined",
    "cwd": "c:/repo"
  },
  "filePath": "app/api/foo.ts",
  "originalSnippet": "const foo = bar.baz;",
  "proposedSnippet": "const foo = bar?.baz ?? defaultValue;"
}
```

## Env vars / cost control

- `VS_AGENT_SIGNING_KEY` – optional HMAC secret for VSCode extension webhooks.
- `AGENT_TRANSLATION_MODEL`, `AGENT_SUMMARY_MODEL` – optional model names when using an external LLM for translation/summarization.
- `AGENT_ASSIST_PROVIDER_KEY` – API key for the above provider.

When these are missing the agent falls back to inexpensive heuristics (basic language detection, key phrase summaries, diffing only when snippets are supplied).

## Next steps

- Build `/agent` UI surface (Function 4 frontend) with panes for incoming errors, translations, hypotheses, and patch approvals.
- Ship VSCode extension prototype that signs payloads and optionally executes returned patches + git commits/tests.
- Extend processing pipeline to log LLM cost into `prompt_usage_logs` just like Function 3.
