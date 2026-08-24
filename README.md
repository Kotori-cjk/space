# Kotori's Colorful Seika

GitHub Pages 上的学习空间，包含学习主页、算法计划、Code Analysis 和 AI 背诵。

## 路由

- `/space/`：学习主页
- `/space/algorithm/`：算法计划（保留原 `luogu-journey` Git 历史）
- `/space/code-analysis/`：Code Analysis（保留原 `luogu-ai-journey` Git 历史）
- `/space/ai-recite/`：AI 背诵
- `/recite/`：独立公开课程背诵站

在线地址：<https://kotori-cjk.github.io/space/>

学习数据保存在当前域名的浏览器 `localStorage`/IndexedDB。设置面板支持 JSON 导入导出。

## 前端门禁

所有私有 HTML 入口都会先检查统一登录状态，直接访问算法、Code Analysis、AI 背诵或算法笔记也会跳转 `login.html`。验证成功后保持 7 天，并返回用户原本访问的深层地址。

仓库只保存随机盐和 PBKDF2-SHA-256 派生结果，不保存密码明文。修改密码时在本机运行：

```powershell
powershell -ExecutionPolicy Bypass -File tools/set-password.ps1
```

这是静态前端门禁，资料文件本身仍可通过源码或绕过脚本读取。
