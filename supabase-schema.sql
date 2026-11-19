-- POINTS Supabase schema
create extension if not exists pgcrypto;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  owner_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);
create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  joined_at timestamptz not null default now(),
  primary key(team_id,user_id)
);
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  score integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.ledger (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  delta integer not null check (delta <> 0 and delta between -99999 and 99999),
  note text not null default '' check (char_length(note) <= 120),
  actor_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.people enable row level security;
alter table public.ledger enable row level security;

create or replace function public.is_team_member(tid uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.team_members where team_id=tid and user_id=auth.uid()) $$;
create or replace function public.is_team_manager(tid uuid)
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.team_members where team_id=tid and user_id=auth.uid() and role in ('owner','admin')) $$;

drop policy if exists teams_read on public.teams;
create policy teams_read on public.teams for select to authenticated using (public.is_team_member(id));
drop policy if exists members_read on public.team_members;
create policy members_read on public.team_members for select to authenticated using (public.is_team_member(team_id));
drop policy if exists people_read on public.people;
create policy people_read on public.people for select to authenticated using (public.is_team_member(team_id));
drop policy if exists people_manage on public.people;
create policy people_manage on public.people for all to authenticated using (public.is_team_manager(team_id)) with check (public.is_team_manager(team_id));
drop policy if exists ledger_read on public.ledger;
create policy ledger_read on public.ledger for select to authenticated using (public.is_team_member(team_id));
-- No direct ledger insert/update/delete policies: only the validated RPC may append entries.

create or replace function public.create_team(team_name text)
returns uuid language plpgsql security definer set search_path=public
as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  if char_length(trim(team_name)) < 1 or char_length(trim(team_name)) > 60 then raise exception '团队名称长度需为1至60个字符'; end if;
  insert into public.teams(name,owner_id) values(trim(team_name),auth.uid()) returning id into new_id;
  insert into public.team_members(team_id,user_id,role) values(new_id,auth.uid(),'owner');
  return new_id;
end; $$;

create or replace function public.add_score(p_team_id uuid,p_person_id uuid,p_delta integer,p_note text default '')
returns uuid language plpgsql security definer set search_path=public
as $$
declare new_id uuid;
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  if p_delta is null or p_delta=0 or abs(p_delta)>99999 then raise exception '积分数值无效'; end if;
  if not public.is_team_manager(p_team_id) then raise exception '没有积分管理权限'; end if;
  if not exists(select 1 from public.people where id=p_person_id and team_id=p_team_id) then raise exception '成员不存在'; end if;
  insert into public.ledger(team_id,person_id,delta,note,actor_id)
  values(p_team_id,p_person_id,p_delta,left(coalesce(p_note,''),120),auth.uid()) returning id into new_id;
  update public.people set score=score+p_delta where id=p_person_id;
  return new_id;
end; $$;

revoke all on function public.create_team(text) from public;
revoke all on function public.add_score(uuid,uuid,integer,text) from public;
grant execute on function public.create_team(text) to authenticated;
grant execute on function public.add_score(uuid,uuid,integer,text) to authenticated;
grant select on public.teams,public.team_members,public.people,public.ledger to authenticated;
grant select,insert,update,delete on public.people to authenticated;

-- Realtime: Supabase Dashboard > Database > Publications, enable teams' people and ledger tables.
