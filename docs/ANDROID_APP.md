# POINTS Android 应用构建说明

## 应用信息
- 应用版本：`T066`
- Android application ID：`com.kna58765.points`
- 显示名称：`POINTS`
- 构建方式：Capacitor Android 容器，复用当前 POINTS 界面与业务逻辑
- 输出：Debug APK（供测试安装）

## 自动构建
GitHub Actions 在向 `main` / `master` 推送代码后，或手动运行 `Build POINTS Android APK` 工作流时构建 APK。成功后在对应工作流运行记录底部下载 `POINTS-Android-APK` Artifact。

## 当前功能边界
当前版本仍以本机数据存储为主。Appwrite 邮箱账号入口已接入，但团队数据库、团队邀请、积分云端读写、实时同步和服务端角色权限尚未完成。登录成功不代表积分数据已经同步。

## 发布前事项
- 配置 Appwrite 对 Android WebView 的平台来源并验证登录请求。
- 完成团队数据库、成员关系、权限策略和受控积分写入。
- 验证离线启动、不同设备同步、账号退出与本地备份恢复。
- 正式发布前生成并安全保存 Android release 签名密钥；不要把密钥或密码提交到 Git。
