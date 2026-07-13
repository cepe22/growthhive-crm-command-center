create table if not exists public.gh_project_tasks (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.gh_task_notifications (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.gh_project_tasks enable row level security;
alter table public.gh_task_notifications enable row level security;

revoke all on table public.gh_project_tasks from anon, authenticated;
revoke all on table public.gh_task_notifications from anon, authenticated;

-- Production grants access through a project-specific RLS function that checks
-- the server-only x-gh-sync-token header. The token hash is configured per environment.
