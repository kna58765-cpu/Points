-- POINTS T081: repair team dissolution RPC.
-- Run this once in Supabase SQL Editor after deploying T081.
create or replace function public.dissolve_team(p_team_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception '请先登录';
  end if;

  if not exists (
    select 1
    from public.teams
    where id = p_team_id
      and owner_id = auth.uid()
  ) then
    raise exception '只有团队创建者可以解散团队';
  end if;

  -- Related memberships, people, scores, invites and team snapshot
  -- are removed through the existing ON DELETE CASCADE constraints.
  delete from public.teams
  where id = p_team_id;

  return true;
end;
$$;

revoke all on function public.dissolve_team(uuid) from public;
grant execute on function public.dissolve_team(uuid) to authenticated;
