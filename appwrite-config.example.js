// POINTS T068 public Appwrite client configuration. Never put API keys here.
export const appwriteConfig = {
  endpoint: "https://nyc.cloud.appwrite.io/v1",
  projectId: "6aff042d000ca36303b3",
  databaseId: "REPLACE_WITH_DATABASE_ID",
  collections: {
    teams: "REPLACE_WITH_TEAMS_COLLECTION_ID",
    memberships: "REPLACE_WITH_MEMBERSHIPS_COLLECTION_ID",
    members: "REPLACE_WITH_MEMBERS_COLLECTION_ID",
    transactions: "REPLACE_WITH_TRANSACTIONS_COLLECTION_ID",
    auditLogs: "REPLACE_WITH_AUDIT_LOGS_COLLECTION_ID",
    invites: "REPLACE_WITH_INVITES_COLLECTION_ID"
  },
  functions: {
    createTeam: "REPLACE_WITH_CREATE_TEAM_FUNCTION_ID",
    createInvite: "REPLACE_WITH_CREATE_INVITE_FUNCTION_ID",
    acceptInvite: "REPLACE_WITH_ACCEPT_INVITE_FUNCTION_ID",
    changeScore: "REPLACE_WITH_CHANGE_SCORE_FUNCTION_ID",
    manageMember: "REPLACE_WITH_MANAGE_MEMBER_FUNCTION_ID",
    importBackup: "REPLACE_WITH_IMPORT_BACKUP_FUNCTION_ID"
  }
};
