# POINTS T068 云端业务接口部署说明

本版本新增 `points-cloud.js`：客户端的所有团队/成员/积分写操作统一调用 Appwrite Functions。当前代码只完成客户端调用层，**云函数尚未部署，积分仍不会自动同步**。

## 需要创建的 Appwrite Functions

在 Appwrite Console 中创建 6 个 Functions，并把每个 Function 的 ID 填入 `appwrite-config.js` 的 `functions`：

| 配置键 | 建议 Function 名 | 责任 |
|---|---|---|
| createTeam | create-team | 创建团队并将调用者设为 owner |
| createInvite | create-invite | 仅管理员可创建邀请码，设置有效期/使用次数 |
| acceptInvite | accept-invite | 校验邀请码并加入团队，防止重复加入/超限 |
| changeScore | change-score | 校验角色、积分规则，原子写入成员积分、流水和审计记录 |
| manageMember | manage-member | 管理员创建/编辑/移除成员 |
| importBackup | import-backup | 管理员校验并导入备份 |

## Function 安全要求

1. 从 Appwrite Functions 的可信执行上下文读取当前用户身份，不接受客户端传入的 userId、role 或 ownerId 作为授权依据。
2. 每个请求都验证调用者是否属于目标团队，以及是否拥有对应角色。
3. 邀请码在服务端校验 active、expiresAt、maxUses、usedCount，并以事务/原子方式更新使用次数和 membership。
4. change-score 在服务端校验 delta 为非零整数、积分不低于零及团队积分规则；同一事务中更新成员积分、创建 transaction 和 audit log。
5. 数据库服务密钥只保存在 Function 环境变量中，绝不能放进 APK、前端配置或 Git 仓库。
6. 数据库文档权限仅授予必要的用户/团队读权限；所有敏感写入由 Function 使用服务端权限执行。
7. 返回统一 JSON：成功 `{"ok":true,"data":{...}}`；失败 `{"ok":false,"message":"..."}`，并设置合适 HTTP 状态码。

## 前端调用示例

```js
import { createTeam, createInvite, acceptInvite, changeScore } from "./points-cloud.js";

await createTeam("我的团队");
await createInvite(teamId, { expiresInHours: 24, maxUses: 5 });
await acceptInvite("ABCD1234");
await changeScore(teamId, memberId, 3, "完成任务");
```

## 当前状态

- 邮箱注册/登录：客户端已接入，需在 Appwrite Auth 开启 Email/Password。
- 云端业务调用层：T068 已加入。
- 云函数：待在 Appwrite Console 创建并配置 ID。
- 数据库/集合：仍待创建并填写 ID。
- 本地积分：继续保留；未完成云端配置前不会谎报同步成功。
