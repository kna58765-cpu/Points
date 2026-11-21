import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "./supabase-config.js";

const configured = Boolean(
  supabaseConfig.url && supabaseConfig.anonKey &&
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseConfig.url) &&
  !supabaseConfig.anonKey.includes("YOUR_ANON")
);
export const cloudReady = configured;
export const supabase = configured ? createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
}) : null;

function client() {
  if (!supabase) throw new Error("Supabase 尚未配置，请先连接 POINTS 云端项目。");
  return supabase;
}
async function rpc(name, args) {
  const { data, error } = await client().rpc(name, args);
  if (error) throw error;
  return data;
}

export async function register(email, password, nickname) {
  const { data, error } = await client().auth.signUp({
    email, password, options: { data: { nickname: String(nickname || "").trim().slice(0, 40) } }
  });
  if (error) throw error;
  return data;
}
export async function joinWithInvite(code, nickname) {
  const db = client();
  const { data, error } = await db.auth.signInAnonymously({
    options: { data: { nickname: String(nickname || "").trim().slice(0, 40), invited: true } }
  });
  if (error) {
    if (/anonymous.*disabled|anonymous sign-ins are disabled/i.test(error.message || "")) {
      throw new Error("当前云端尚未开启匿名登录。请在 Supabase Authentication 设置中开启 Anonymous Sign-Ins。");
    }
    throw error;
  }
  try {
    await rpc("accept_team_invite", { p_code: String(code || "").trim().toUpperCase() });
    return data;
  } catch (joinError) {
    await db.auth.signOut();
    throw joinError;
  }
}
export async function login(email, password) {
  const { data, error } = await client().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}
export async function logout() {
  const { error } = await client().auth.signOut();
  if (error) throw error;
}
export async function currentUser() {
  const { data, error } = await client().auth.getUser();
  if (error && error.status !== 401) throw error;
  return data?.user || null;
}
export function onAuthStateChange(callback) {
  const { data } = client().auth.onAuthStateChange((_event, session) => callback(session?.user || null));
  return () => data.subscription.unsubscribe();
}
export async function createTeam(name) {
  return rpc("create_team", { team_name: String(name || "").trim() });
}
export async function dissolveTeam(teamId) {
  return rpc("dissolve_team", { p_team_id: teamId });
}
export async function createInvite(teamId, maxUses = 20) {
  return rpc("create_team_invite", { p_team_id: teamId, p_max_uses: maxUses });
}
export async function acceptInvite(code) {
  return rpc("accept_team_invite", { p_code: String(code || "").trim().toUpperCase() });
}
export async function addPerson(teamId, name, group = "未分组", color = "#111111") {
  return rpc("add_person", { p_team_id: teamId, p_name: name, p_group: group, p_color: color });
}
export async function addScore(teamId, personId, delta, note = "") {
  if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 99999) throw new Error("积分数值无效");
  return rpc("add_score", { p_team_id: teamId, p_person_id: personId, p_delta: delta, p_note: String(note).slice(0, 120) });
}
export async function undoScore(ledgerId) {
  return rpc("undo_score", { p_ledger_id: ledgerId });
}
export async function readTeam(teamId) {
  const db = client();
  const [team, members, people, ledger, audit] = await Promise.all([
    db.from("teams").select("*").eq("id", teamId).single(),
    db.from("team_members").select("*").eq("team_id", teamId),
    db.from("people").select("*").eq("team_id", teamId).order("created_at"),
    db.from("ledger").select("*").eq("team_id", teamId).order("created_at", { ascending: false }).limit(500),
    db.from("audit_events").select("*").eq("team_id", teamId).order("created_at", { ascending: false }).limit(300)
  ]);
  for (const result of [team, members, people, ledger, audit]) if (result.error) throw result.error;
  return { team: team.data, members: members.data, people: people.data, ledger: ledger.data, audit: audit.data };
}
export async function listMyTeams() {
  const db = client();
  const { data: memberships, error } = await db.from("team_members").select("team_id,role,joined_at").order("joined_at");
  if (error) throw error;
  if (!memberships?.length) return [];
  const ids = memberships.map(x => x.team_id);
  const { data: teams, error: teamError } = await db.from("teams").select("*").in("id", ids);
  if (teamError) throw teamError;
  return memberships.map(m => ({ ...m, team: teams.find(t => t.id === m.team_id) })).filter(x => x.team);
}
export function watchTeam(teamId, callback) {
  const db = client();
  const channel = db.channel("points-" + teamId)
    .on("postgres_changes", { event: "*", schema: "public", table: "people", filter: "team_id=eq." + teamId }, callback)
    .on("postgres_changes", { event: "*", schema: "public", table: "ledger", filter: "team_id=eq." + teamId }, callback)
    .on("postgres_changes", { event: "*", schema: "public", table: "team_members", filter: "team_id=eq." + teamId }, callback)
    .subscribe();
  return () => db.removeChannel(channel);
}

export async function loadTeamState(teamId) {
  const { data, error } = await client().from("team_state").select("state,updated_by,updated_at").eq("team_id", teamId).maybeSingle();
  if (error) throw error;
  return data || null;
}
export async function writeTeamState(teamId, state) {
  const user = await currentUser();
  if (!user) throw new Error("请先登录云端账号");
  const { error } = await client().from("team_state").upsert({
    team_id: teamId, state, updated_by: user.id, updated_at: new Date().toISOString()
  }, { onConflict: "team_id" });
  if (error) throw error;
}
export function watchTeamState(teamId, callback) {
  const db = client();
  const channel = db.channel("points-state-" + teamId)
    .on("postgres_changes", { event: "*", schema: "public", table: "team_state", filter: "team_id=eq." + teamId }, callback)
    .subscribe();
  return () => db.removeChannel(channel);
}
