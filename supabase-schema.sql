-- POINTS Supabase backend schema (T069 migration)
-- Run once in Supabase SQL Editor. Safe to re-run.
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
  group_name text not null default '未分组',
  color text not null default '#111111',
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
create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references auth.users(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  max_uses integer not null default 20 check (max_uses between 1 and 500),
  uses integer not null default 0 check (uses >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  actor_id uuid not null references auth.users(id),
  action text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists people_team_created_idx on public.people(team_id,created_at);
create index if not exists ledger_team_created_idx on public.ledger(team_id,created_at desc);
create index if not exists invites_code_active_idx on public.team_invites(code) where active=true;

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.people enable row level security;
alter table public.ledger enable row level security;
alter table public.team_invites enable row level security;
alter table public.audit_events enable row level security;

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
drop policy if exists people_manager_all on public.people;
create policy people_manager_all on public.people for all to authenticated using (public.is_team_manager(team_id)) with check (public.is_team_manager(team_id));
drop policy if exists ledger_read on public.ledger;
create policy ledger_read on public.ledger for select to authenticated using (public.is_team_member(team_id));
drop policy if exists invite_manager_read on public.team_invites;
create policy invite_manager_read on public.team_invites for select to authenticated using (public.is_team_manager(team_id));
drop policy if exists audit_read on public.audit_events;
create policy audit_read on public.audit_events for select to authenticated using (public.is_team_member(team_id));

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

create or replace function public.create_team_invite(p_team_id uuid,p_max_uses integer default 20)
returns text language plpgsql security definer set search_path=public
as $$
declare invite_code text;
begin
  if auth.uid() is null or not public.is_team_manager(p_team_id) then raise exception '没有创建邀请码的权限'; end if;
  if p_max_uses < 1 or p_max_uses > 500 then raise exception '邀请码使用次数无效'; end if;
  invite_code := upper(substr(encode(gen_random_bytes(8),'hex'),1,10));
  insert into public.team_invites(team_id,code,created_by,max_uses) values(p_team_id,invite_code,auth.uid(),p_max_uses);
  return invite_code;
end; $$;

create or replace function public.accept_team_invite(p_code text)
returns uuid language plpgsql security definer set search_path=public
as $$
declare invite_row public.team_invites%rowtype;
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  select * into invite_row from public.team_invites
    where code=upper(trim(p_code)) and active=true and expires_at>now() and uses<max_uses
    for update;
  if not found then raise exception '邀请码无效、已过期或已达到使用次数'; end if;
  insert into public.team_members(team_id,user_id,role)
    values(invite_row.team_id,auth.uid(),'member')
    on conflict(team_id,user_id) do nothing;
  update public.team_invites set uses=uses+1 where id=invite_row.id;
  return invite_row.team_id;
end; $$;

create or replace function public.add_person(p_team_id uuid,p_name text,p_group text default '未分组',p_color text default '#111111')
returns uuid language plpgsql security definer set search_path=public
as $$
declare new_id uuid;
begin
  if auth.uid() is null or not public.is_team_manager(p_team_id) then raise exception '没有成员管理权限'; end if;
  if char_length(trim(p_name))<1 or char_length(trim(p_name))>40 then raise exception '成员名称长度无效'; end if;
  insert into public.people(team_id,name,group_name,color) values(p_team_id,trim(p_name),coalesce(nullif(trim(p_group),''),'未分组'),p_color) returning id into new_id;
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
  insert into public.audit_events(team_id,actor_id,action,detail)
    values(p_team_id,auth.uid(),'积分调整',p_person_id::text||' '||p_delta::text);
  return new_id;
end; $$;

create or replace function public.undo_score(p_ledger_id uuid)
returns boolean language plpgsql security definer set search_path=public
as $$
declare entry public.ledger%rowtype;
begin
  select * into entry from public.ledger where id=p_ledger_id for update;
  if not found then raise exception '流水记录不存在'; end if;
  if not public.is_team_manager(entry.team_id) then raise exception '没有撤销权限'; end if;
  update public.people set score=score-entry.delta where id=entry.person_id;
  delete from public.ledger where id=entry.id;
  insert into public.audit_events(team_id,actor_id,action,detail)
    values(entry.team_id,auth.uid(),'撤销积分',entry.id::text);
  return true;
end; $$;

revoke all on function public.create_team(text) from public;
revoke all on function public.create_team_invite(uuid,integer) from public;
revoke all on function public.accept_team_invite(text) from public;
revoke all on function public.add_person(uuid,text,text,text) from public;
revoke all on function public.add_score(uuid,uuid,integer,text) from public;
revoke all on function public.undo_score(uuid) from public;
grant execute on function public.create_team(text) to authenticated;
grant execute on function public.create_team_invite(uuid,integer) to authenticated;
grant execute on function public.accept_team_invite(text) to authenticated;
grant execute on function public.add_person(uuid,text,text,text) to authenticated;
grant execute on function public.add_score(uuid,uuid,integer,text) to authenticated;
grant execute on function public.undo_score(uuid) to authenticated;
grant select on public.teams,public.team_members,public.people,public.ledger,public.team_invites,public.audit_events to authenticated;
grant update,delete on public.people to authenticated;
-- Enable Realtime for people and ledger in Supabase Database > Publications.

-- Shared team snapshot used by the POINTS Android/web client.
create table if not exists public.team_state (
  team_id uuid primary key references public.teams(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);
alter table public.team_state enable row level security;
drop policy if exists team_state_member_access on public.team_state;
create policy team_state_member_access on public.team_state
  for all to authenticated
  using (public.is_team_member(team_id))
  with check (public.is_team_member(team_id) and updated_by=auth.uid());
grant select,insert,update on public.team_state to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.team_state;
exception when duplicate_object then null;
end $$;
