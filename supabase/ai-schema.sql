-- AI layer schema additions for multi-tenant model management
-- Run inside your Supabase/Postgres project (psql, dashboard SQL editor, or supabase CLI)

create extension if not exists pgcrypto;

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create table if not exists public.user_model_configs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  provider text not null check (provider in ('cowi_free','openai','anthropic','azure_openai','google','custom')),
  model_name text not null,
  mode text not null check (mode in ('chat','prompt_builder','code_generation','analysis')),
  secret_reference text,
  api_key_last_four text,
  base_url text,
  metadata jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_used_at timestamptz
);

create unique index if not exists user_model_configs_default_unique
  on public.user_model_configs (user_id)
  where is_default = true;

create table if not exists public.project_ai_settings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  preferred_mode text not null check (preferred_mode in ('chat','prompt_builder','code_generation','analysis')),
  model_config_id uuid references public.user_model_configs(id) on delete set null,
  fallback_provider text not null default 'cowi_free' check (fallback_provider in ('cowi_free','openai','anthropic','azure_openai','google','custom')),
  temperature numeric,
  max_output_tokens integer,
  system_prompt text,
  safety_level text not null default 'balanced' check (safety_level in ('strict','balanced','creative')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.project_ai_settings
  add constraint project_ai_settings_unique_project unique (project_id);

create trigger handle_updated_at_user_model_configs
  before update on public.user_model_configs
  for each row execute function public.handle_updated_at();

create trigger handle_updated_at_project_ai_settings
  before update on public.project_ai_settings
  for each row execute function public.handle_updated_at();

alter table public.user_model_configs enable row level security;
alter table public.project_ai_settings enable row level security;

create policy "Users manage only their model configs"
  on public.user_model_configs
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Project owners read/write AI settings"
  on public.project_ai_settings
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );
