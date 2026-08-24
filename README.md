# Kotori's Colorful Seika

私人学习空间，包含学习主页、算法计划、Code Analysis 和 AI 背诵。课程背诵已拆分到独立公开站。

## 私有路由

- `/`：学习主页
- `/algorithm/`：算法计划（保留原 `luogu-journey` Git 历史）
- `/code-analysis/`：Code Analysis（保留原 `luogu-ai-journey` Git 历史）
- `/ai-recite/`：AI 背诵

## Cloudflare Pages 鉴权

Pages Functions 会统一拦截所有私有静态路由。必须在 Cloudflare 项目中配置：

- Secret `SPACE_PASSWORD`：新的共享密码，请勿写入仓库。
- Secret `SESSION_SECRET`：高熵随机字符串，用于 HMAC 签名。
- Variable `RECITE_URL`：公开背诵站地址，当前为 `https://kotori-cjk-recite.pages.dev/`。

登录成功后签发 7 天有效的 `HttpOnly; Secure; SameSite=Lax` Cookie。退出按钮会立即清除 Cookie；所有私有响应带 `X-Robots-Tag: noindex, nofollow`。

## 本地验证

```powershell
npx wrangler pages dev . --binding SPACE_PASSWORD=test-pass --binding SESSION_SECRET=test-session-secret --binding RECITE_URL=http://localhost:8001/
```

学习数据仍保存在浏览器 `localStorage`/IndexedDB。迁移域名前必须先从旧站导出 JSON，再在新域名导入。
