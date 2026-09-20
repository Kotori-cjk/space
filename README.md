# Kotori's Colorful Seika

GitHub Pages 上的学习空间，包含学习主页、算法计划、Code Analysis 和 CS Learning。

## 路由

- `/space/`：学习主页
- `/space/algorithm/`：算法计划（保留原 `luogu-journey` Git 历史）
- `/space/code-analysis/`：Code Analysis（保留原 `luogu-ai-journey` Git 历史）
- `/space/cs-learning/`：CS Learning（当前包括 ICS 与数算）
- `/recite/`：独立公开课程背诵站

在线地址：<https://kotori-cjk.github.io/space/>

学习数据会先保存在当前域名的浏览器 `localStorage`/IndexedDB；设置面板支持 JSON 导入导出，并可在登录 GitHub 账号后同步主 Space 的笔记、任务、链接、音乐、背景和笔记图片。

## Supabase 同步开发配置

1. 创建 Supabase 免费项目，在 SQL Editor 执行 `supabase/schema.sql`。
2. 在 Authentication 的 URL Configuration 中添加生产地址 `https://kotori-cjk.github.io/space/` 与本地地址 `http://localhost:8000/`。
3. 在 Authentication 的 GitHub Provider 中填入 GitHub OAuth App 的 Client ID 与 Client Secret。
4. 将项目 URL 和 Publishable key 写入 `sync-config.js`。该 key 可公开；不要写入或提交 `service_role` key。
5. 运行 `npm ci`、`npm test`、`npm run build`，生成浏览器端 `sync/supabase-sync.bundle.js`。

同步采用本地优先保存和版本冲突保护。首次在第二台设备连接，或两台设备都产生修改时，页面会要求明确选择“使用云端数据”或“使用本机数据”，不会静默覆盖。门禁状态、GitHub 会话和其他凭据不包含在同步快照中。

## 前端门禁

所有私有 HTML 入口都会先检查统一登录状态，直接访问算法、Code Analysis、CS Learning 或算法笔记也会跳转 `login.html`。验证成功后保持 7 天，并返回用户原本访问的深层地址。

仓库只保存随机盐和 PBKDF2-SHA-256 派生结果，不保存密码明文。修改密码时在本机运行：

```powershell
powershell -ExecutionPolicy Bypass -File tools/set-password.ps1
```

这是静态前端门禁，资料文件本身仍可通过源码或绕过脚本读取。
