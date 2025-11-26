-- Prompt library schema additions (Function 3)
-- Run inside Supabase/Postgres via Dashboard SQL editor or supabase CLI

create extension if not exists pgcrypto;

create table if not exists public.prompt_library_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  summary text,
  content text not null,
  combo_type text default 'all' check (combo_type in ('enterprise','web','app','custom','all')),
  tags text[] not null default '{}',
  metadata jsonb,
  is_shared boolean not null default false,
  usage_count integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists prompt_library_entries_user_idx on public.prompt_library_entries(user_id);
create index if not exists prompt_library_entries_tags_idx on public.prompt_library_entries using gin(tags);
create index if not exists prompt_library_entries_combo_idx on public.prompt_library_entries(combo_type);

create table if not exists public.prompt_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  prompt_id uuid references public.prompt_library_entries(id) on delete set null,
  combo_type text,
  provider text,
  tokens_input integer,
  tokens_output integer,
  cost_usd numeric(10,4),
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists prompt_usage_logs_user_idx on public.prompt_usage_logs(user_id, created_at desc);
create index if not exists prompt_usage_logs_prompt_idx on public.prompt_usage_logs(prompt_id);

create trigger handle_updated_at_prompt_library_entries
  before update on public.prompt_library_entries
  for each row execute function public.handle_updated_at();

alter table public.prompt_library_entries enable row level security;
alter table public.prompt_usage_logs enable row level security;

create policy "prompt entries readable if owner or shared" on public.prompt_library_entries
  for select
  using (auth.uid() = user_id or is_shared = true);

create policy "prompt entries owner write" on public.prompt_library_entries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "usage logs view own" on public.prompt_usage_logs
  for select
  using (auth.uid() = user_id);

create policy "usage logs insert own" on public.prompt_usage_logs
  for insert
  with check (auth.uid() = user_id);
