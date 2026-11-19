# POINTS Appwrite 接入实施清单

> 当前是开发设计文档，不代表云端项目已经创建或联网功能已经上线。

## 1. 一次性云端准备
1. 由 POINTS 项目所有者登录 Appwrite Cloud 并创建项目。
2. 添加 Web 平台，填写 POINTS 实际部署域名。
3. 复制 Project ID 和 API Endpoint。
4. 在 Auth 中启用 Email/Password 登录。
5. 创建数据库及下列表，并配置团队级访问权限。

## 2. 数据表

### teams
- name: string
- owner_id: string
- created_at: datetime

### team_memberships
- team_id: string
- user_id: string
- role: enum(owner, admin, viewer)
- joined_at: datetime

### members
- team_id: string
- name: string
- group_name: string
- color: string
- score: integer
- created_at: datetime

### point_transactions
- team_id: string
- member_id: string
- delta: integer
- note: string
- actor_id: string
- created_at: datetime
- reversed_transaction_id: optional string

### audit_logs
- team_id: string
- actor_id: string
- action: string
- detail: string
- created_at: datetime

## 3. 安全要求
- 禁止在浏览器端保存 Appwrite API Key / Server API Secret。
- 数据库访问必须按团队成员关系授权。
- Viewer 只能读取；Admin 才能管理成员和积分；Owner 才能管理团队成员角色。
- 积分变更和流水写入应由服务端受控函数完成，并防止重复提交。
- 不把当前本地 PIN 当作云端身份认证。

## 4. 前端接入顺序
1. 新增云端连接配置与状态提示。
2. 新增注册、登录、退出和会话恢复。
3. 新增团队创建/加入与成员角色。
4. 实现本地 JSON 导入云端。
5. 接入成员、积分、流水、排行榜的云端读写。
6. 接入实时订阅与离线/断网提示。
7. 完成跨设备、越权访问、并发积分和迁移测试。

## 5. 上线前验收
- 两台设备登录同一团队后数据一致。
- 一台设备修改积分，另一台设备能收到实时更新。
- Viewer 无法写入，非团队成员无法读取。
- 积分、流水和审计记录不会因并发操作而不一致。
- JSON 导入前后核对成员数、总积分和流水数。
