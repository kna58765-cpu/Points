import { Client, Functions } from "https://esm.sh/appwrite@17.0.0";
import { appwriteConfig as config } from "./appwrite-config.js";

const endpointReady = Boolean(config.endpoint && config.projectId);
const functionIds = config.functions || {};
const client = endpointReady
  ? new Client().setEndpoint(config.endpoint).setProject(config.projectId)
  : null;
const functions = client ? new Functions(client) : null;

const required = ["createTeam", "createInvite", "acceptInvite", "changeScore", "manageMember", "importBackup"];

export function cloudFunctionsReady() {
  return required.every(key => {
    const value = functionIds[key];
    return typeof value === "string" && value.length > 0 && !value.startsWith("REPLACE_");
  });
}

async function execute(key, payload = {}) {
  if (!functions) throw new Error("Appwrite 项目配置尚未就绪。");
  const functionId = functionIds[key];
  if (!functionId || functionId.startsWith("REPLACE_")) {
    throw new Error("云端业务函数尚未部署：" + key);
  }
  const execution = await functions.createExecution(
    functionId,
    JSON.stringify(payload),
    false,
    "/",
    "POST",
    { "Content-Type": "application/json" }
  );
  let result = {};
  try {
    result = execution.responseBody ? JSON.parse(execution.responseBody) : {};
  } catch {
    throw new Error("云端函数返回了无法识别的数据。");
  }
  if (execution.status !== "completed" || execution.responseStatusCode < 200 || execution.responseStatusCode >= 300) {
    throw new Error(result.message || result.error || "云端操作失败，请稍后重试。");
  }
  if (result.ok === false || result.error) {
    throw new Error(result.message || result.error || "云端操作失败。");
  }
  return result.data ?? result;
}

// Every mutation is delegated to a trusted Appwrite Function.
// The server must derive the user identity from the authenticated request,
// validate team membership/role, and write records transactionally.
export const createTeam = name => execute("createTeam", { name });
export const createInvite = (teamId, options = {}) => execute("createInvite", { teamId, ...options });
export const acceptInvite = code => execute("acceptInvite", { code: String(code || "").trim().toUpperCase() });
export const changeScore = (teamId, memberId, delta, note = "") => {
  if (!Number.isInteger(delta) || delta === 0) throw new Error("积分变动必须是非零整数。");
  return execute("changeScore", { teamId, memberId, delta, note: String(note).slice(0, 80) });
};
export const manageMember = (teamId, action, member = {}) => {
  if (!["create", "update", "delete"].includes(action)) throw new Error("不支持的成员操作。");
  return execute("manageMember", { teamId, action, member });
};
export const importBackup = (teamId, backup) => execute("importBackup", { teamId, backup });
