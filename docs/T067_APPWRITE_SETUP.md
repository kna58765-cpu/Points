# POINTS T067 Appwrite 接入准备（邀请码加入）

当前 T066 页面仍以 localStorage 为数据源。本次先建立 Appwrite 客户端接入骨架与安全配置规范，不代表云端同步或 APK 已上线。

## 已确定
- 后端：Appwrite Cloud
- Endpoint：https://nyc.cloud.appwrite.io/v1
- Project ID：6aff042d000ca36303b3
- 团队加入：邀请码
- 版本目标：T067
- 保留黑白简约 UI、JSON 导入/导出和本地备份。

## 项目所有者需在 Appwrite Console 完成
1. 登录 https://cloud.appwrite.io/ 并进入上述项目。
2. 在 Auth 启用 Email/Password。
3. 在 Platforms 添加实际部署域名及本地调试域名。
4. 创建 Database，记录 Database ID。
5. 创建集合：teams、memberships、members、transactions、audit_logs、invites。
6. 按下方字段建属性并配置索引。
7. 关闭集合公开访问。团队数据按成员关系授权；写操作由受控 Appwrite Function 执行。
8. 部署云函数：create-team、create-invite、accept-invite、change-score、manage-member、import-backup。函数必须验证当前执行用户，不能信任客户端传来的 role。

## 集合字段建议
- teams: name(string 60), ownerId(string 36), createdAt(datetime)
- memberships: teamId(string 36), userId(string 36), role(enum owner/admin/viewer), joinedAt(datetime)
- members: teamId(string 36), name(string 40), groupName(string 40), color(string 16), score(integer)
- transactions: teamId(string 36), memberId(string 36), delta(integer), note(string 120), actorId(string 36), createdAt(datetime), reversalOf(string 36, optional)
- audit_logs: teamId(string 36), actorId(string 36), action(string 60), detail(string 500), createdAt(datetime)
- invites: teamId(string 36), code(string 12), active(boolean), expiresAt(datetime), maxUses(integer), usedCount(integer), createdBy(string 36)

## 邀请码安全规则
- 邀请码由云函数用密码学安全随机数生成，建议至少 8 位。
- 接受邀请码由云函数原子校验有效期、剩余次数、团队状态和重复成员。
- 客户端不得直接创建 membership 或自行设置 role。
- 邀请码默认授予 viewer/普通成员权限；管理员只能由 owner 提升。
- 积分、流水、审计记录必须由受控云端逻辑一致写入。
- 前端、配置文件和 Git 仓库不得包含 Appwrite API Key 或服务端密钥。

## 配置
复制 appwrite-config.example.js 为 appwrite-config.js，填写 Database ID 和六个 Collection ID。该文件仅含公开 ID；确认 .gitignore 忽略本地配置文件。

## 当前代码状态
- appwrite.js：认证、会话、实时订阅客户端骨架。
- 邀请码接受流程保持关闭，直到云函数完成部署。
- cloud.js 是旧 Supabase 适配器；T067 主线统一使用 Appwrite，不要同时启用两套后端。
- 下一步：建立集合与云函数，再接入页面登录/团队选择、数据迁移和跨设备验收。
