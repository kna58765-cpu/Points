import { Client, Account, Databases, ID, Query } from "https://esm.sh/appwrite@17.0.0";
import { appwriteConfig as config } from "./appwrite-config.js";

const authConfigured = Boolean(config.endpoint && config.projectId);
const databaseConfigured = Boolean(config.databaseId &&
  !config.databaseId.startsWith("REPLACE_") &&
  Object.values(config.collections).every(v => v && !v.startsWith("REPLACE_")));

export const appwriteReady = authConfigured;
export const appwriteDatabaseReady = authConfigured && databaseConfigured;
export const client = authConfigured ? new Client().setEndpoint(config.endpoint).setProject(config.projectId) : null;
export const account = authConfigured ? new Account(client) : null;
export const db = appwriteDatabaseReady ? new Databases(client) : null;

function requireAuth() {
  if (!authConfigured) throw new Error("Appwrite 项目地址或 Project ID 尚未配置。");
}
function requireDatabase() {
  requireAuth();
  if (!databaseConfigured) throw new Error("云端数据库尚未配置，请先创建数据库和集合。");
}

export async function register(email, password, name) {
  requireAuth();
  await account.create(ID.unique(), email, password, name);
  return account.createEmailPasswordSession(email, password);
}
export async function login(email, password) {
  requireAuth();
  return account.createEmailPasswordSession(email, password);
}
export async function logout() {
  requireAuth();
  return account.deleteSession("current");
}
export async function currentUser() {
  requireAuth();
  try { return await account.get(); }
  catch (e) { if (e.code === 401) return null; throw e; }
}
export function watchCollection(collectionId, callback) {
  requireDatabase();
  return client.subscribe("databases." + config.databaseId + ".collections." + collectionId + ".documents", callback);
}
export async function listMyTeams(userId) {
  requireDatabase();
  const result = await db.listDocuments(config.databaseId, config.collections.memberships,
    [Query.equal("userId", userId), Query.limit(100)]);
  return result.documents;
}
export async function findTeamByInviteCode(inviteCode) {
  requireDatabase();
  const result = await db.listDocuments(config.databaseId, config.collections.invites,
    [Query.equal("code", inviteCode.trim().toUpperCase()), Query.equal("active", true), Query.limit(1)]);
  return result.documents[0] || null;
}
// Joining a team must be performed by a trusted Appwrite Function, never by client-side writes.
export async function acceptInvite() {
  throw new Error("邀请码加入云函数尚未部署，暂不可加入团队。");
}
export { config as appwriteConfig };
