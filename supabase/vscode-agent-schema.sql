-- VSCode agent schema additions (Function 4)
-- Run inside Supabase/Postgres via Dashboard SQL editor or supabase CLI

create extension if not exists pgcrypto;

create table if not exists public.agent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('terminal','problem','translation','diff')),
  source text not null default 'vscode',
  status text not null default 'received' check (status in ('received','processing','ready','applied','error')),
  payload jsonb not null,
  language text,
  detected_language text,
  translated_text text,
  summary text,
  root_cause jsonb,
  file_path text,
  original_snippet text,
  proposed_snippet text,
  fix_patch text,
  fix_status text,
  resolution_notes text,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists agent_events_user_idx on public.agent_events(user_id, created_at desc);
create index if not exists agent_events_status_idx on public.agent_events(status);

create trigger handle_updated_at_agent_events
  before update on public.agent_events
  for each row execute function public.handle_updated_at();

alter table public.agent_events enable row level security;

create policy "agent events owner read" on public.agent_events
  for select
  using (auth.uid() = user_id);

create policy "agent events owner write" on public.agent_events
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
