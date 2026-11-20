import { Client, Account, Databases, ID, Query } from "https://esm.sh/appwrite@17.0.0";
import { appwriteConfig as config } from "./appwrite-config.js";
const configured = Boolean(config.endpoint && config.projectId && config.databaseId &&
  !config.databaseId.startsWith("REPLACE_") &&
  Object.values(config.collections).every(v => v && !v.startsWith("REPLACE_")));
export const appwriteReady = configured;
export const client = configured ? new Client().setEndpoint(config.endpoint).setProject(config.projectId) : null;
export const account = configured ? new Account(client) : null;
export const db = configured ? new Databases(client) : null;
function requireConfig() {
  if (!configured) throw new Error("Appwrite 尚未配置，请先填写数据库 ID 和集合 ID。");
}
export async function register(email, password, name) {
  requireConfig(); await account.create(ID.unique(), email, password, name);
  return account.createEmailPasswordSession(email, password);
}
export async function login(email, password) {
  requireConfig(); return account.createEmailPasswordSession(email, password);
}
export async function logout() { requireConfig(); return account.deleteSession("current"); }
export async function currentUser() {
  requireConfig(); try { return await account.get(); }
  catch (e) { if (e.code === 401) return null; throw e; }
}
export function watchCollection(collectionId, callback) {
  requireConfig();
  return client.subscribe("databases." + config.databaseId + ".collections." + collectionId + ".documents", callback);
}
export async function listMyTeams(userId) {
  requireConfig();
  const result = await db.listDocuments(config.databaseId, config.collections.memberships,
    [Query.equal("userId", userId), Query.limit(100)]);
  return result.documents;
}
export async function findTeamByInviteCode(inviteCode) {
  requireConfig();
  const result = await db.listDocuments(config.databaseId, config.collections.invites,
    [Query.equal("code", inviteCode.trim().toUpperCase()), Query.equal("active", true), Query.limit(1)]);
  return result.documents[0] || null;
}
// Acceptance intentionally remains disabled until a trusted Appwrite Function is deployed.
export async function acceptInvite() {
  throw new Error("邀请码加入需先部署 Appwrite 云函数，避免客户端伪造团队权限。");
}
export { config as appwriteConfig };
