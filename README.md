# POINTS

**当前版本：T092**

POINTS 是一款黑白极简风格的个人积分管理应用，支持 Android 与浏览器。

## 功能

- 邮箱注册、邮箱登录与退出
- 每个邮箱账号拥有独立的个人积分数据
- 成员添加、编辑、删除与分组
- 积分增加、扣除、批量调整与撤销
- 积分排行榜、成员详情与积分流水
- 操作记录
- JSON 数据备份与恢复
- 本地自动保存
- 登录后自动同步个人数据到 Supabase
- Android APK 固定签名，支持覆盖更新并保留本地数据

## 账号与数据

- 仅支持邮箱注册和邮箱登录。
- 不提供团队、邀请、邀请码或团队成员功能。
- 云端数据保存在 `public.personal_state`，每条记录归属于一个 Supabase 用户 ID。
- 数据库通过 Row Level Security 限制用户只能读取和修改自己的数据。
- 退出登录后，本机数据仍保留；登录其他账号时会加载该账号自己的数据。

## 本地开发

```bash
npm install
npm run build
```

Android APK 由 GitHub Actions 自动构建。正式 APK 使用仓库中配置的固定签名密钥，更新时应直接覆盖安装，不要先卸载旧版本。

## Supabase

需要在 `supabase-config.js` 中配置 Supabase URL 和 publishable/anon key。客户端不包含 service-role key。数据库结构见 `supabase-schema.sql`。
