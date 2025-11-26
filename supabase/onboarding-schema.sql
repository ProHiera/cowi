-- Onboarding wizard tables for survey-driven project creation
-- Run this after the base schema + ai-schema scripts.

create extension if not exists pgcrypto;

create table if not exists public.onboarding_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purpose text,
  target_audience text,
  model_preference text,
  hosting_target text,
  api_provider text,
  api_key_last_four text,
  recommend_template_id uuid references public.prompt_templates(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','completed','failed')),
  vercel_hook_url text,
  deploy_triggered_at timestamptz,
  deploy_response jsonb,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger handle_updated_at_onboarding_sessions
  before update on public.onboarding_sessions
  for each row execute function public.handle_updated_at();

alter table public.onboarding_sessions enable row level security;

create policy "Users manage their onboarding sessions"
  on public.onboarding_sessions
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
