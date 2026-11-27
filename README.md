# Kotori's Colorful Seika

可以在浏览器中编辑学科和资料的学习空间，包含每日任务、学科笔记和 Code Analysis。

## 路由

- `/space/`：学习主页
- `/space/code-analysis/`：Code Analysis
- `/recite/`：独立公开课程背诵站

在线地址：<https://kotori-cjk.github.io/space/>

## 管理本机学科与资料

1. 从侧栏打开「管理学科」，新增学科并填写名称、图标、分类、颜色和简介。用上下箭头改变卡片顺序，用「归档」「恢复」切换卡片显示状态。
2. 进入学科后点「新增页面」。可以直接写 Markdown、插入本机 Markdown 或纯文本、添加资料链接和附件。页面目录支持上下移动，选中页面后可编辑或删除。
3. 在「设置 → 数据管理」中导出 JSON 备份。备份包含学科目录、页面、附件、笔记、任务和图片。导入含学科目录的备份时，页面会提示确认替换当前目录。迁移到另一浏览器、电脑或站点地址时，先在原地址导出，再到新地址导入。

学科目录、页面和附件保存在当前站点的 IndexedDB 中。浏览器清除站点数据时会一并清除这些资料。已有任务、笔记和设置会在原站点地址沿用。首次升级已有数据时会载入原有学科，新开浏览器会从空目录开始。

## 本机预览与公开构建

在 `space/` 中运行：

```powershell
npm ci
npm run preview
```

本机预览地址为 `http://127.0.0.1:8000/`，沿用门禁。本机保留了旧版 `algorithm/`、`cs-learning/`、`ai-recite/` 和 `seed.js`。需要查看旧内容时可直接使用本机预览，或在新增页面的「资料链接」里填入对应本机路径。原有交互式 HTML 页面仍由各自的脚本运行。

```powershell
npm run build:public
npm run preview -- --public
```

公开构建生成 `.public-pages/`。GitHub Pages 工作流只上传这份包，访客可以直接打开空白工作台、创建自己的学科。旧课程目录和个人预设已从当前 Git 文件清单移出，并保留在本机。Git 历史与先前的部署仍可能包含旧资料；若要公开整个源码仓库，可用公开构建包建立一个全新的仓库。

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
