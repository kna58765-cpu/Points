# POINTS

极简黑白风格的多人积分管理应用，目标平台 Android + iOS。

## 当前已完成
- 响应式黑白界面
- 成员添加、改名、加分、扣分
- 积分排行榜与流水
- 本地保存和基础离线访问
- PWA 基础配置与 GitHub Pages 自动部署工作流
- Supabase 云端客户端模块：邮箱注册/登录、团队创建、积分写入、团队数据读取、实时订阅接口
- Supabase 数据库结构与基础 RLS 安全策略（`supabase-schema.sql`）

## 启用云端同步
1. 打开 https://supabase.com/dashboard 并创建项目。
2. 进入 Project Settings → API，复制 Project URL 和 anon/public key。
3. 将 `supabase-config.example.js` 复制为 `supabase-config.js`，填入上述两项。
4. 在 Supabase SQL Editor 中运行仓库里的 `supabase-schema.sql`。
5. 在 Authentication 设置中确认启用 Email 登录。
6. 在 Database → Publications 中为 `people` 和 `ledger` 开启 Realtime。

**安全提醒：** 前端只能使用 anon/public key。绝对不要把 `service_role` key、数据库密码或其他服务器密钥提交到 GitHub。

## 当前阶段说明
Firebase 方案已放弃，云端基础已切换为 Supabase。现阶段云端模块和数据库脚本已提交，但主界面仍需接入登录、团队选择、成员云端读写和实时刷新；邀请成员及跨设备数据迁移也尚未完成。因此暂时不能宣称多人实时同步已经上线。

## 后续路线
1. 接入登录 / 注册界面
2. 创建团队与成员邀请
3. 将主界面的成员、积分流水接入云端
4. 启用实时监听并处理离线/网络异常
5. Android / iOS 真机测试与发布
