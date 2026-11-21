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
export async function register(email, password, nickname) {
  const { data, error } = await client().auth.signUp({
    email, password, options: { data: { nickname: String(nickname || "").trim().slice(0, 40) } }
  });
  if (error) throw error;
  return data;
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
export async function loadPersonalState() {
  const user = await currentUser();
  if (!user) throw new Error("请先登录邮箱账号");
  const { data, error } = await client().from("personal_state")
    .select("state,updated_at").eq("user_id", user.id).maybeSingle();
  if (error) throw error;
  return data || null;
}
export async function savePersonalState(state) {
  const user = await currentUser();
  if (!user) throw new Error("请先登录邮箱账号");
  const { error } = await client().from("personal_state").upsert({
    user_id: user.id, state, updated_at: new Date().toISOString()
  }, { onConflict: "user_id" });
  if (error) throw error;
}
export function watchPersonalState(userId, callback) {
  const db = client();
  const channel = db.channel("points-personal-" + userId)
    .on("postgres_changes", {
      event: "*", schema: "public", table: "personal_state", filter: "user_id=eq." + userId
    }, callback)
    .subscribe();
  return () => db.removeChannel(channel);
}
