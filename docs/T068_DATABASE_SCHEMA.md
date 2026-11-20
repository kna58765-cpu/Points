# POINTS 云端数据库结构（T068）

Appwrite 项目：
- Endpoint: https://nyc.cloud.appwrite.io/v1
- Project ID: 6aff042d000ca36303b3

> 本文件是建库清单，不代表数据库已在 Appwrite Console 创建。公开客户端配置不具备管理权限。

## 创建 Database

建议 Database ID: `points-main`（若 Appwrite 要求自定义 ID，可自行填写并同步到客户端配置）。

## Collections

所有 collection 建议先关闭客户端直接写权限。敏感写操作必须由受信任的 Appwrite Function 执行。客户端仅按团队成员身份读取允许的数据。

### teams
| Attribute | Type | Required | Notes |
|---|---|---:|---|
| name | string(80) | yes | 团队名称 |
| ownerId | string(36) | yes | 创建者 Appwrite user ID |
| createdAt | datetime | yes | 创建时间 |
| status | string(20) | yes | active / disabled |

Indexes: ownerId, status

### memberships
| Attribute | Type | Required | Notes |
|---|---|---:|---|
| teamId | string(36) | yes | teams document ID |
| userId | string(36) | yes | Appwrite user ID |
| role | string(20) | yes | owner / admin / member |
| joinedAt | datetime | yes | 加入时间 |
| status | string(20) | yes | active / removed |

Indexes: unique(teamId,userId), userId, teamId

### members
| Attribute | Type | Required | Notes |
|---|---|---:|---|
| teamId | string(36) | yes | 所属团队 |
| displayName | string(60) | yes | 展示名称 |
| score | integer | yes | 当前积分，初始 0 |
| status | string(20) | yes | active / archived |
| createdAt | datetime | yes | 创建时间 |
| updatedAt | datetime | yes | 更新时间 |

Indexes: teamId, (teamId,status), (teamId,score)

### transactions
| Attribute | Type | Required | Notes |
|---|---|---:|---|
| teamId | string(36) | yes | 所属团队 |
| memberId | string(36) | yes | 被操作成员 |
| actorUserId | string(36) | yes | 操作者 |
| delta | integer | yes | 非零积分变化 |
| balanceAfter | integer | yes | 变更后积分 |
| note | string(160) | no | 备注 |
| createdAt | datetime | yes | 时间 |

Indexes: teamId, memberId, createdAt, (teamId,createdAt)

### audit_logs
| Attribute | Type | Required | Notes |
|---|---|---:|---|
| teamId | string(36) | yes | 所属团队 |
| actorUserId | string(36) | yes | 操作者 |
| action | string(40) | yes | 操作类型 |
| targetId | string(36) | no | 目标记录 |
| detailJson | string(4000) | no | 脱敏后的详情 |
| createdAt | datetime | yes | 时间 |

Indexes: teamId, actorUserId, createdAt

### invites
| Attribute | Type | Required | Notes |
|---|---|---:|---|
| teamId | string(36) | yes | 所属团队 |
| codeHash | string(128) | yes | 邀请码哈希，不存明文 |
| createdBy | string(36) | yes | 创建者 |
| expiresAt | datetime | yes | 过期时间 |
| maxUses | integer | yes | 最大使用次数 |
| usedCount | integer | yes | 已使用次数 |
| status | string(20) | yes | active / revoked / expired |
| createdAt | datetime | yes | 创建时间 |

Indexes: unique(codeHash), teamId, status, expiresAt

## 建库顺序

1. 创建 Database。
2. 按上述顺序创建 6 个 Collections。
3. 创建表中索引，尤其 memberships 的 teamId + userId 唯一索引、invites 的 codeHash 唯一索引。
4. 记录 Database ID 和六个 Collection ID，填入 appwrite-config.js。
5. Auth 开启 Email/Password。
6. 部署可信 Functions，并将 Function ID 填入配置。

## 权限原则

- 不给未登录用户读取团队数据的权限。
- 普通客户端不拥有积分、邀请、成员关系和审计记录的直接写权限。
- Functions 在服务端校验当前用户身份和团队角色。
- 不将 API Key、Function secret 或其他服务器凭据提交到 Git。
- 不把客户端传入的 userId / role 当作授权依据。
- 团队成员离开后立即失去该团队数据读取权限。
