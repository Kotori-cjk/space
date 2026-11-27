# Kotori's Colorful Seika

包含每日任务、学科笔记和 Code Analysis 的学习空间。学科目录与资料通过独立本机编辑器管理。

## 路由

- `/space/`：学习主页
- `/space/code-analysis/`：Code Analysis
- `/recite/`：独立公开课程背诵站

在线地址：<https://kotori-cjk.github.io/space/>

## 管理本机学科与资料

1. 在同级的 [HomePageEditor](https://github.com/Kotori-cjk/HomePageEditor) 中运行 `npm run editor`，打开 `http://localhost:8000/editor/`，在顶部切换到 **Space**。用「管理学科」新增、编辑、排序、归档和恢复学科卡片。
2. 选中学科后点「新增页面」。可以写 Markdown、从本机插入 Markdown 或纯文本、添加资料链接和附件，并调整页面顺序。
3. 用「卡片跳转地址」指定学科卡片的目标。点「编辑项目链接」修改侧栏项目的名称、地址和可见范围。
4. 在编辑器点「导出资料包」。在目标学习站选择「设置 → 数据管理 → 导入学科资料包」，选择导出的 JSON 文件。资料包包含目录、页面、附件和跳转设置。编辑器也可以重新导入资料包继续维护。

如果还要备份笔记、任务和图片，使用学习站设置中的「导出数据」。完整备份也包含学科资料，迁移时可在目标学习站通过「导入数据」恢复。

学科目录、页面和附件保存在当前站点的 IndexedDB 中。浏览器清除站点数据时会一并清除这些资料。已有任务、笔记和设置会在原站点地址沿用。首次打开学习站时显示原来的学科分组和空笔记页。要沿用这些分组，可以先从学习站导出数据，再在编辑器中导入。

## 本机预览与公开构建

在 `space/` 中运行：

```powershell
npm ci
npm run preview
```

本机预览地址为 `http://127.0.0.1:8000/`，沿用门禁。需要和编辑器同时运行时，可以用 `npm run preview -- --port=8001`。本机保留了旧版 `algorithm/`、`cs-learning/`、`ai-recite/` 和 `seed.js`。旧交互式页面可以直接在本机预览打开，也可以将对应的本机完整地址填入编辑器的「资料链接」。

```powershell
npm run build:public
npm run preview -- --public
```

公开构建生成 `.public-pages/`。GitHub Pages 工作流只上传这份包，访客可以在自己的浏览器导入学科资料包。编辑器、旧课程目录和个人预设均在公开部署包之外。旧课程目录和预设已从当前 Git 文件清单移出，并保留在本机。旧 Git 提交可能仍含有先前提交的资料。

## GitHub Gist 同步开发配置

1. 创建一个 Classic personal access token，仅勾选 `gist` scope。
2. 在每台设备的 Space 设置中粘贴该 Token 并连接；页面会在该 GitHub 账号下创建一个固定的 secret Gist。
3. Token 仅保留在该设备浏览器的 `localStorage`，不写入 Git 仓库、Space 数据或 Gist。
4. 运行 `npm ci`、`npm test`、`npm run build`，生成浏览器端 `sync/github-gist-sync.bundle.js`。

Gist 同步继续支持原有学科的笔记、NotebookLM 链接、通用及原有学科的任务、相关贴图、音乐与背景设置。学科目录、页面、附件和新建学科的笔记、任务及链接通过本地 JSON 备份迁移。门禁状态、Token 和其他凭据不包含在同步快照中。首次在第二台设备连接，或两台设备都产生修改时，页面会要求明确选择从云端下载或上传本机数据。

## 本机前端门禁

源码目录的私有 HTML 入口会检查统一登录状态。验证成功后保持 7 天，并返回用户原本访问的深层地址。

仓库只保存随机盐和 PBKDF2-SHA-256 派生结果，不保存密码明文。修改密码时在本机运行：

```powershell
powershell -ExecutionPolicy Bypass -File tools/set-password.ps1
```

这是静态前端门禁，资料文件本身仍可通过源码或绕过脚本读取。
