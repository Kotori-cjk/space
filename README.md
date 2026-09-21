# Kotori's Colorful Seika

GitHub Pages 上的学习空间，包含学习主页、算法计划、Code Analysis 和 CS Learning。

## 路由

- `/space/`：学习主页
- `/space/algorithm/`：算法计划（保留原 `luogu-journey` Git 历史）
- `/space/code-analysis/`：Code Analysis（保留原 `luogu-ai-journey` Git 历史）
- `/space/cs-learning/`：CS Learning（当前包括 ICS 与数算）
- `/recite/`：独立公开课程背诵站

在线地址：<https://kotori-cjk.github.io/space/>

学习数据会先保存在当前域名的浏览器 `localStorage`/IndexedDB；设置面板支持 JSON 导入导出，并可通过 GitHub secret Gist 同步主 Space 的笔记、任务、链接、音乐和背景设置。

## GitHub Gist 同步开发配置

1. 创建一个 Classic personal access token，仅勾选 `gist` scope。
2. 在每台设备的 Space 设置中粘贴该 Token 并连接；页面会在该 GitHub 账号下创建一个固定的 secret Gist。
3. Token 仅保留在该设备浏览器的 `localStorage`，不写入 Git 仓库、Space 数据或 Gist。
4. 运行 `npm ci`、`npm test`、`npm run build`，生成浏览器端 `sync/github-gist-sync.bundle.js`。

同步采用本地优先保存和修订冲突保护。首次在第二台设备连接，或两台设备都产生修改时，页面会要求明确选择“从云端下载数据”或“上传本机数据到云端”，不会静默覆盖。门禁状态、Token 和其他凭据不包含在同步快照中。

## 前端门禁

所有私有 HTML 入口都会先检查统一登录状态，直接访问算法、Code Analysis、CS Learning 或算法笔记也会跳转 `login.html`。验证成功后保持 7 天，并返回用户原本访问的深层地址。

仓库只保存随机盐和 PBKDF2-SHA-256 派生结果，不保存密码明文。修改密码时在本机运行：

```powershell
powershell -ExecutionPolicy Bypass -File tools/set-password.ps1
```

这是静态前端门禁，资料文件本身仍可通过源码或绕过脚本读取。
