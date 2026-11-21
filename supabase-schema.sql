-- POINTS T092: email-only personal account data.
-- Authentication is provided by Supabase Auth (Email/Password).
create table if not exists public.personal_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.personal_state enable row level security;

drop policy if exists personal_state_owner_access on public.personal_state;
create policy personal_state_owner_access
  on public.personal_state
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.personal_state to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.personal_state;
exception when duplicate_object then null;
end $$;
