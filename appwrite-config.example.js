// POINTS T067 Appwrite public client configuration. Never put API keys here.
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
  }
};
