# POINTS

极简黑白风格的多人积分管理应用。

## 当前已完成
- 响应式黑白界面
- 成员添加、改名、加分、扣分
- 积分排行榜与流水
- 本地保存和基础离线访问
- PWA 基础配置与 GitHub Pages 自动部署工作流
- Firebase Authentication / Firestore 客户端基础模块
- Firestore 初始安全规则：成员读取、管理员追加积分流水、流水禁止修改和删除

## 启用云端同步前需要你完成
1. 打开 Firebase 控制台并创建项目。
2. 添加 Web 应用，复制 Firebase Web 配置。
3. 将 `firebase-config.example.js` 复制为 `firebase-config.js` 并填入配置。
4. 在 Firebase Authentication 中启用 Email/Password。
5. 创建 Firestore Database，并部署仓库中的 `firestore.rules`。

Firebase Web 配置不是服务账号私钥。**不要**把服务账号 JSON、Admin SDK 私钥或任何服务器密钥放进网页项目。Firestore 规则必须部署并经过测试后，才能开放真实多人使用。

## 当前阶段说明
云端基础代码已提交，但主界面仍运行本地数据模式。账号登录界面、邀请成员、云端数据迁移和实时监听尚未接通。多人同步功能尚未上线。

## 后续路线
1. 接入登录 / 注册 UI
2. 创建团队、成员邀请与权限
3. 云端成员、积分流水与实时同步
4. 数据迁移和异常处理
5. Android / iOS 真机测试与发布
