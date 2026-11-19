import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { supabaseConfig } from "./supabase-config.js";

const configured = Boolean(supabaseConfig.url && supabaseConfig.anonKey &&
  !supabaseConfig.url.includes("YOUR_PROJECT") && !supabaseConfig.anonKey.includes("YOUR_ANON"));
export const cloudReady = configured;
export const supabase = configured ? createClient(supabaseConfig.url, supabaseConfig.anonKey) : null;

function requireCloud() {
  if (!configured) throw new Error("云端尚未配置，请先填写 Supabase 项目 URL 和 anon key。");
  return supabase;
}
export const authState = callback => requireCloud().auth.onAuthStateChange((_event, session) => callback(session?.user ?? null));
export async function register(email,password) {
  const {data,error}=await requireCloud().auth.signUp({email,password});
  if(error) throw error;
  return data;
}
export async function login(email,password) {
  const {data,error}=await requireCloud().auth.signInWithPassword({email,password});
  if(error) throw error;
  return data;
}
export async function logout() {
  const {error}=await requireCloud().auth.signOut();
  if(error) throw error;
}
export async function createTeam(name) {
  if(!name?.trim()) throw new Error("请输入团队名称");
  const {data,error}=await requireCloud().rpc("create_team",{team_name:name.trim()});
  if(error) throw error;
  return data;
}
export async function addScore(teamId,personId,delta,note="") {
  if(!Number.isInteger(delta)||delta===0||Math.abs(delta)>99999) throw new Error("积分数值无效");
  const {data,error}=await requireCloud().rpc("add_score",{p_team_id:teamId,p_person_id:personId,p_delta:delta,p_note:String(note).slice(0,120)});
  if(error) throw error;
  return data;
}
export async function readTeam(teamId) {
  const client=requireCloud();
  const [{data:team,error:e1},{data:members,error:e2},{data:people,error:e3},{data:ledger,error:e4}]=await Promise.all([
    client.from("teams").select("*").eq("id",teamId).single(),
    client.from("team_members").select("*").eq("team_id",teamId),
    client.from("people").select("*").eq("team_id",teamId).order("created_at"),
    client.from("ledger").select("*").eq("team_id",teamId).order("created_at",{ascending:false}).limit(200)
  ]);
  for(const error of [e1,e2,e3,e4]) if(error) throw error;
  return {team,members,people,ledger};
}
export function watchTeam(teamId,onChange) {
  const client=requireCloud();
  const channel=client.channel("points-team-"+teamId)
    .on("postgres_changes",{event:"*",schema:"public",table:"people",filter:"team_id=eq."+teamId},onChange)
    .on("postgres_changes",{event:"INSERT",schema:"public",table:"ledger",filter:"team_id=eq."+teamId},onChange)
    .subscribe();
  return () => client.removeChannel(channel);
}
