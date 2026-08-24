const STORAGE_KEY = "kotori-luogu-ai-v1";
const BG_DB_NAME = "kotori-luogu-ai-backgrounds";
const BG_DB_STORE = "images";
const PARTICLES = ["✨", "🌸", "💭", "⭐", "🍬", "🫧", "🎀", "🩷"];

function createDefaultCategories() {
    return Array.from({ length: 14 }, (_, index) => ({
        id: `day-${index + 1}`,
        title: `Day ${index + 1}`,
        summary: "这里可以写今天准备刷的题型、目标和提醒。",
        problems: []
    }));
}

const defaultState = {
    currentTab: "plan",
    currentCategoryId: "day-1",
    categories: createDefaultCategories(),
    methods: [],
    settings: {
        githubRepo: "",
        aiProvider: "openai",
        aiBaseUrl: "https://api.openai.com/v1",
        aiModel: "gpt-4o-mini",
        apiKey: "",
        backgrounds: [],
        currentBg: -1,
        musicIds: []
    }
};

let state = structuredClone(defaultState);
let uiState = {
    categoryFormVisible: false,
    problemFormVisible: false,
    loadingProblemId: null,
    loadingChatProblemId: null
};
let bgDb = null;
let backgroundImageCache = {};

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
    } catch (error) {
        console.warn("Failed to save state:", error);
        return false;
    }
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        state = migrateState(parsed);
    } catch (error) {
        console.warn("Failed to load state:", error);
    }
}

function openBackgroundDb() {
    return new Promise((resolve, reject) => {
        if (!("indexedDB" in window)) {
            reject(new Error("IndexedDB is not available."));
            return;
        }
        const request = indexedDB.open(BG_DB_NAME, 1);
        request.onupgradeneeded = (event) => {
            event.target.result.createObjectStore(BG_DB_STORE);
        };
        request.onsuccess = (event) => {
            bgDb = event.target.result;
            resolve(bgDb);
        };
        request.onerror = () => reject(request.error);
    });
}

function bgDbPut(key, value) {
    return new Promise((resolve, reject) => {
        const tx = bgDb.transaction(BG_DB_STORE, "readwrite");
        tx.objectStore(BG_DB_STORE).put(value, key);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
    });
}

function bgDbDelete(key) {
    return new Promise((resolve, reject) => {
        const tx = bgDb.transaction(BG_DB_STORE, "readwrite");
        tx.objectStore(BG_DB_STORE).delete(key);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
    });
}

function bgDbGetAll() {
    return new Promise((resolve, reject) => {
        const tx = bgDb.transaction(BG_DB_STORE, "readonly");
        const request = tx.objectStore(BG_DB_STORE).openCursor();
        const result = {};
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (!cursor) {
                resolve(result);
                return;
            }
            result[cursor.key] = cursor.value;
            cursor.continue();
        };
        request.onerror = () => reject(request.error);
    });
}

function isDataUrl(value) {
    return typeof value === "string" && value.startsWith("data:image/");
}

function resolveBackgroundSrc(value) {
    if (isDataUrl(value)) return value;
    return backgroundImageCache[value] || "";
}

async function migrateBackgroundsToIndexedDb() {
    if (!bgDb) return;
    let changed = false;
    const migrated = [];
    for (const item of state.settings.backgrounds || []) {
        if (isDataUrl(item)) {
            const key = `bg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            await bgDbPut(key, item);
            backgroundImageCache[key] = item;
            migrated.push(key);
            changed = true;
        } else {
            migrated.push(item);
        }
    }
    if (changed) {
        state.settings.backgrounds = migrated;
        saveState();
    }
}

function migrateState(parsed) {
    const merged = {
        ...structuredClone(defaultState),
        ...parsed,
        settings: {
            ...structuredClone(defaultState.settings),
            ...(parsed.settings || {})
        }
    };

    merged.categories = Array.isArray(parsed.categories) && parsed.categories.length
        ? parsed.categories.map((category, index) => ({
            id: category.id || `day-${index + 1}`,
            title: category.title || `Day ${index + 1}`,
            summary: category.summary || "",
            problems: Array.isArray(category.problems)
                ? category.problems.map((problem, problemIndex) => ({
                    id: problem.id || `${category.id || `day-${index + 1}`}-problem-${problemIndex + 1}`,
                    title: problem.title || "未命名题目",
                    link: problem.link || "",
                    description: problem.description || "",
                    html: problem.html || problem.htmlContent || problem.problemHtml || "",
                    code: problem.code || "",
                    wrongBook: Boolean(problem.wrongBook),
                    collapsed: Boolean(problem.collapsed),
                    analysisRecords: Array.isArray(problem.analysisRecords)
                        ? problem.analysisRecords.map((record, recordIndex) => ({
                            id: record.id || `analysis-${problemIndex}-${recordIndex}`,
                            createdAt: record.createdAt || formatNow(),
                            model: record.model || merged.settings.aiModel || "unknown-model",
                            content: record.content || "",
                            expanded: Boolean(record.expanded)
                        }))
                        : [],
                    chatRecords: Array.isArray(problem.chatRecords)
                        ? problem.chatRecords.map((record, recordIndex) => ({
                            id: record.id || `chat-${problemIndex}-${recordIndex}`,
                            createdAt: record.createdAt || formatNow(),
                            model: record.model || merged.settings.aiModel || "unknown-model",
                            question: record.question || "",
                            answer: record.answer || "",
                            expanded: Boolean(record.expanded)
                        }))
                        : [],
                    insightRecords: Array.isArray(problem.insightRecords)
                        ? problem.insightRecords.map((record, recordIndex) => ({
                            id: record.id || `insight-${problemIndex}-${recordIndex}`,
                            createdAt: record.createdAt || formatNow(),
                            updatedAt: record.updatedAt || "",
                            title: record.title || `收获 ${recordIndex + 1}`,
                            content: record.content || "",
                            expanded: Boolean(record.expanded)
                        }))
                        : []
                }))
                : []
        }))
        : createDefaultCategories();

    merged.methods = Array.isArray(parsed.methods)
        ? parsed.methods.map((method, index) => ({
            id: method.id || `method-${index + 1}`,
            title: method.title || "未命名方法",
            content: method.content || "",
            createdAt: method.createdAt || formatNow()
        }))
        : [];

    if (!merged.currentCategoryId || !merged.categories.some((item) => item.id === merged.currentCategoryId)) {
        merged.currentCategoryId = merged.categories[0]?.id || "day-1";
    }

    return merged;
}

function formatNow() {
    return new Date().toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function renderMarkdown(content) {
    if (!content) return "<p>暂无内容。</p>";
    if (window.marked) {
        marked.setOptions({ breaks: true, gfm: true });
        return marked.parse(content);
    }
    return `<pre>${escapeHtml(content)}</pre>`;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function compressBackgroundImage(file, maxSize = 1600, quality = 0.78) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith("image/")) {
            reject(new Error("请选择图片文件。"));
            return;
        }

        const reader = new FileReader();
        reader.onerror = () => reject(new Error("图片读取失败。"));
        reader.onload = (event) => {
            const image = new Image();
            image.onerror = () => reject(new Error("图片解析失败。"));
            image.onload = () => {
                const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
                const width = Math.max(1, Math.round(image.width * scale));
                const height = Math.max(1, Math.round(image.height * scale));
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(image, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", quality));
            };
            image.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function getCurrentCategory() {
    return state.categories.find((item) => item.id === state.currentCategoryId) || state.categories[0];
}

function initParticles() {
    const container = document.getElementById("particles");
    container.innerHTML = "";
    for (let index = 0; index < 14; index += 1) {
        const particle = document.createElement("span");
        particle.className = "particle";
        particle.textContent = PARTICLES[Math.floor(Math.random() * PARTICLES.length)];
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 6}s`;
        particle.style.animationDuration = `${6 + Math.random() * 3}s`;
        container.appendChild(particle);
    }
}

function applyBackground() {
    const layer = document.getElementById("bg-layer");
    const { backgrounds, currentBg } = state.settings;
    const src = Array.isArray(backgrounds) ? resolveBackgroundSrc(backgrounds[currentBg]) : "";
    if (src) {
        layer.style.backgroundImage = `url("${src}")`;
        layer.classList.add("has-bg");
    } else {
        layer.style.backgroundImage = "";
        layer.classList.remove("has-bg");
    }
}

function updateHeaderLinks() {
    const githubLink = document.getElementById("github-link");
    const href = state.settings.githubRepo?.trim();
    githubLink.href = href || "#";
    githubLink.style.opacity = href ? "1" : "0.72";
}

function renderMusic() {
    const container = document.getElementById("music-container");
    const ids = state.settings.musicIds || [];
    if (!ids.length) {
        container.innerHTML = '<p class="empty-hint">可以在设置里添加网易云歌曲 ID 或分享链接。</p>';
        return;
    }

    container.innerHTML = ids.map((id) => `
        <iframe
            frameborder="no"
            border="0"
            marginwidth="0"
            marginheight="0"
            height="86"
            src="https://music.163.com/outchain/player?type=2&id=${escapeHtml(id)}&auto=0&height=66">
        </iframe>
    `).join("");
}

function renderMusicManageList() {
    const list = document.getElementById("music-manage-list");
    const ids = state.settings.musicIds || [];
    if (!ids.length) {
        list.innerHTML = "";
        return;
    }

    list.innerHTML = ids.map((id, index) => `
        <div class="music-manage-item">
            <span>歌曲 ${escapeHtml(id)}</span>
            <button class="btn btn-danger btn-sm" data-music-del="${index}" type="button">删除</button>
        </div>
    `).join("");
}

function renderBgPreviews() {
    const list = document.getElementById("bg-preview-list");
    const backgrounds = state.settings.backgrounds || [];
    if (!backgrounds.length) {
        list.innerHTML = "";
        return;
    }

    list.innerHTML = backgrounds.map((item, index) => `
        <div class="bg-preview-item ${state.settings.currentBg === index ? "active" : ""}" data-bg-select="${index}">
            <img src="${resolveBackgroundSrc(item)}" alt="背景 ${index + 1}">
            <button class="bg-preview-delete" data-bg-del="${index}" type="button">×</button>
        </div>
    `).join("");
}

function renderProgress() {
    const totalProblems = state.categories.reduce((sum, category) => sum + category.problems.length, 0);
    const analysedProblems = state.categories.reduce((sum, category) => (
        sum + category.problems.filter((problem) => problem.analysisRecords.length > 0).length
    ), 0);
    const totalAnalyses = state.categories.reduce((sum, category) => (
        sum + category.problems.reduce((inner, problem) => inner + problem.analysisRecords.length, 0)
    ), 0);
    const wrongBookCount = state.categories.reduce((sum, category) => (
        sum + category.problems.filter((problem) => problem.wrongBook).length
    ), 0);

    const percent = totalProblems ? Math.round((analysedProblems / totalProblems) * 100) : 0;
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (percent / 100) * circumference;

    document.getElementById("progress-ring").style.strokeDashoffset = offset;
    document.getElementById("progress-percent").textContent = `${percent}%`;
    document.getElementById("progress-count").textContent = `${analysedProblems}/${totalProblems}`;
    document.getElementById("stat-total-categories").textContent = `${state.categories.length} 个分类`;
    document.getElementById("stat-total-analyses").textContent = `${totalAnalyses} 条分析`;
    document.getElementById("stat-total-wrong").textContent = `${wrongBookCount} 本错题`;
}

function renderCategoryNav() {
    const container = document.getElementById("category-nav");
    container.innerHTML = state.categories.map((category, index) => `
        <button class="day-btn ${category.id === state.currentCategoryId ? "active" : ""}" data-category-id="${category.id}" type="button">
            <div class="day-btn-top">
                <div class="day-title-group">
                    <span class="day-num" title="${escapeHtml(category.title || `Day ${index + 1}`)}">${escapeHtml(category.title || `Day ${index + 1}`)}</span>
                    <span class="day-edit-btn" data-edit-category="${category.id}" title="修改标题">✎</span>
                </div>
                <span class="category-count">${category.problems.length} 题</span>
            </div>
            <div class="day-meta">${escapeHtml(category.summary || "点击查看今天的题目列表")}</div>
        </button>
    `).join("");
}

function renderPlanTab() {
    const currentCategory = getCurrentCategory();
    const tab = document.getElementById("tab-plan");

    if (!currentCategory) {
        tab.innerHTML = `
            <div class="empty-panel">
                <p>还没有分类，先在左侧添加一个吧。</p>
            </div>
        `;
        return;
    }

    const formCard = `
        <div class="inline-form-card problem-form-card ${uiState.problemFormVisible ? "" : "hidden"}" id="problem-form-card">
            <h3 class="form-title">添加题目 / 资料</h3>
            <div class="form-grid">
                <input id="problem-title-input" type="text" placeholder="题目名称，例如 P1177 模板排序 / 期末力学题 03">
                <input id="problem-link-input" type="text" placeholder="题目链接，可填洛谷、OJ、课程网页或任意参考页面">
                <textarea id="problem-desc-input" class="full-width" rows="5" placeholder="题干描述、输入输出、样例、你的理解，或者想让 AI 特别关注的点"></textarea>
                <div class="html-upload-row full-width">
                    <label class="btn btn-secondary btn-sm" for="problem-html-file">上传 HTML / TXT</label>
                    <input id="problem-html-file" type="file" accept=".html,.htm,.txt,text/html,text/plain" hidden>
                    <span class="form-hint">也可以直接把题目网页源代码粘贴到下面，AI 会作为题目资料读取。</span>
                </div>
                <textarea id="problem-html-input" class="full-width html-source-input" rows="6" placeholder="题目所在网页的 HTML / 复制下来的网页正文（可选）"></textarea>
            </div>
            <div class="inline-form-actions">
                <button id="save-problem-btn" class="btn btn-primary" type="button">保存题目</button>
                <button id="cancel-problem-btn" class="btn btn-secondary" type="button">取消</button>
            </div>
        </div>
    `;

    const problemCards = currentCategory.problems.length
        ? currentCategory.problems.map((problem) => renderProblemCard(problem, currentCategory)).join("")
        : `
            <div class="empty-panel">
                <p>这个分类还没有题目。</p>
                <p style="margin-top:8px;">点击“添加题目”，把洛谷题目和代码分析入口放进来。</p>
            </div>
        `;

    tab.innerHTML = `
        <div class="day-header">
            <h2>${escapeHtml(currentCategory.title)}</h2>
            <p class="day-goal">${escapeHtml(currentCategory.summary || "这里是今天的题单和 AI 诊断区。")}</p>
            <div class="header-actions">
                <button id="toggle-problem-form-btn" class="btn btn-warm" type="button">+ 添加题目</button>
                <button id="rename-category-btn" class="btn btn-secondary" type="button">编辑当前分类</button>
                <button id="delete-category-btn" class="btn btn-danger" type="button">删除当前分类</button>
            </div>
        </div>
        ${renderProblemCatalog(currentCategory)}
        ${formCard}
        ${problemCards}
    `;
}

function renderProblemCatalog(category) {
    if (!category.problems.length) {
        return "";
    }

    return `
        <nav class="problem-catalog" aria-label="题目目录">
            <div class="problem-catalog-head">
                <div>
                    <h3>题目目录</h3>
                    <p>当前分类共 ${category.problems.length} 道题，新添加的题目会自动出现在这里。</p>
                </div>
                <span class="problem-catalog-count">${category.problems.length} 题</span>
            </div>
            <div class="problem-catalog-list">
                ${category.problems.map((problem, index) => `
                    <button class="problem-catalog-item" data-catalog-problem="${problem.id}" type="button">
                        <span class="catalog-index">${index + 1}</span>
                        <span class="catalog-title">${escapeHtml(problem.title)}</span>
                        ${problem.analysisRecords.length ? '<span class="catalog-mark catalog-mark-ai">AI</span>' : ""}
                        ${problem.wrongBook ? '<span class="catalog-mark catalog-mark-wrong">错题</span>' : ""}
                    </button>
                `).join("")}
            </div>
        </nav>
    `;
}

function renderProblemCard(problem, category) {
    const latestRecord = problem.analysisRecords[problem.analysisRecords.length - 1];
    const analysisLabel = latestRecord
        ? `最近分析：${escapeHtml(latestRecord.createdAt)}`
        : "还没有分析记录";
    const hasSourceDetail = Boolean(problem.description || problem.html);
    const htmlLength = (problem.html || "").trim().length;

    return `
        <article class="problem-card ${problem.wrongBook ? "is-wrong" : ""} ${problem.collapsed ? "is-collapsed" : ""}" data-problem-id="${problem.id}" id="problem-${problem.id}">
            <div class="problem-top">
                <div class="problem-info">
                    <div class="problem-title-row">
                        <span class="problem-title">${escapeHtml(problem.title)}</span>
                        ${problem.link ? `<a class="problem-link" href="${escapeHtml(problem.link)}" target="_blank" rel="noreferrer">打开资料</a>` : ""}
                        <span class="badge badge-ai">${problem.analysisRecords.length} 条分析</span>
                        <span class="badge badge-chat">${(problem.chatRecords || []).length} 条问答</span>
                        <span class="badge badge-insight">${(problem.insightRecords || []).length} 条收获</span>
                        ${htmlLength ? `<span class="badge badge-source">HTML ${Math.round(htmlLength / 1024) || 1}KB</span>` : ""}
                        ${problem.wrongBook ? '<span class="badge badge-wrong">已加入错题本</span>' : ""}
                    </div>
                    ${hasSourceDetail ? `
                        <details class="problem-source-details">
                            <summary>题目资料 ${problem.description ? "题干" : ""}${problem.description && problem.html ? " + " : ""}${problem.html ? "HTML" : ""}</summary>
                            ${problem.description ? `<div class="problem-desc">${escapeHtml(problem.description)}</div>` : ""}
                            ${problem.html ? `<pre class="problem-html-preview">${escapeHtml(problem.html.slice(0, 4000))}${problem.html.length > 4000 ? "\n...（HTML 较长，已折叠预览；AI 会读取保存的完整内容）" : ""}</pre>` : ""}
                        </details>
                    ` : ""}
                </div>
                <div class="problem-tools">
                    <button class="btn btn-ghost btn-sm" data-toggle-problem-fold="${problem.id}" type="button">${problem.collapsed ? "展开" : "折叠"}</button>
                    <button class="btn btn-secondary btn-sm" data-edit-problem="${problem.id}" type="button">编辑</button>
                    <button class="btn btn-danger btn-sm" data-delete-problem="${problem.id}" type="button">删除</button>
                </div>
            </div>

            <div class="problem-fold-body">
            <div class="problem-code-wrap">
                <label class="field-caption" for="code-${problem.id}">代码 / 草稿输入区</label>
                <textarea id="code-${problem.id}" class="problem-code" data-problem-code="${problem.id}" placeholder="把你的 C++ / Python / Java 代码、伪代码、证明草稿或解题想法粘贴到这里；也可以留空，只向 AI 提问。">${escapeHtml(problem.code || "")}</textarea>
            </div>

            <div class="problem-action-row">
                <span class="problem-meta">${analysisLabel}</span>
                <div class="problem-primary-actions">
                    <button class="btn diagnose-btn ${uiState.loadingProblemId === problem.id ? "is-loading" : ""}" data-diagnose-problem="${problem.id}" type="button">
                        ${uiState.loadingProblemId === problem.id ? "分析中..." : "🔮 AI 分析"}
                    </button>
                    <button class="btn btn-secondary" data-toggle-wrong="${problem.id}" type="button">
                        ${problem.wrongBook ? "移出错题本" : "加入错题本"}
                    </button>
                </div>
            </div>

            <div class="ai-question-box">
                <label class="field-caption" for="question-${problem.id}">直接向 AI 提问</label>
                <textarea id="question-${problem.id}" class="ai-question-input" data-ai-question="${problem.id}" placeholder="例如：这道题怎么建模？这段代码哪里错了？请根据我上传的题干/HTML/代码给提示，不要直接给完整答案。"></textarea>
                <div class="ai-question-actions">
                    <span class="problem-meta">会自动带上当前题目、链接、题干、HTML 和代码作为上下文。</span>
                    <button class="btn btn-primary ${uiState.loadingChatProblemId === problem.id ? "is-loading" : ""}" data-ask-problem="${problem.id}" type="button">
                        ${uiState.loadingChatProblemId === problem.id ? "回答中..." : "向 AI 提问"}
                    </button>
                </div>
            </div>

            <div class="insight-box">
                <div class="insight-box-head">
                    <div>
                        <strong>我的收获</strong>
                        <p>把这道题真正学到的东西分条沉淀下来，每条都可以折叠、编辑和继续补充。</p>
                    </div>
                </div>
                <div class="insight-editor">
                    <input id="insight-title-${problem.id}" data-insight-title="${problem.id}" type="text" placeholder="收获标题，例如：状态设计要先想清楚含义">
                    <textarea id="insight-content-${problem.id}" data-insight-content="${problem.id}" placeholder="写下你的收获、易错点、反思、模板提醒或下次刷到类似题时要注意的地方。"></textarea>
                    <div class="insight-actions">
                        <span class="problem-meta" data-insight-editing-label="${problem.id}">新增一条收获记录。</span>
                        <div class="problem-primary-actions">
                            <button class="btn btn-primary btn-sm" data-save-insight="${problem.id}" type="button">保存收获</button>
                            <button class="btn btn-secondary btn-sm hidden" data-cancel-insight-edit="${problem.id}" type="button">取消编辑</button>
                        </div>
                    </div>
                </div>
                <div class="insight-history accordion-list">
                    ${(problem.insightRecords || []).length
                        ? problem.insightRecords.map((record, index) => renderInsightRecord(problem.id, record, index)).join("")
                        : '<div class="analysis-empty">还没有收获记录。可以把“这题以后怎么一眼认出来”写在这里。</div>'}
                </div>
            </div>

            <div class="chat-history accordion-list">
                ${(problem.chatRecords || []).length
                    ? problem.chatRecords.map((record, index) => renderChatRecord(problem.id, record, index)).join("")
                    : '<div class="analysis-empty">你向 AI 的每次提问都会保存在这里，并且每条对话都可以折叠。</div>'}
            </div>

            <div class="accordion-list">
                ${problem.analysisRecords.length
                    ? problem.analysisRecords.map((record, index) => renderAnalysisRecord(problem.id, record, index)).join("")
                    : '<div class="analysis-empty">点击上面的“AI 诊断”后，分析记录会保存在这里，并且支持折叠查看。</div>'}
            </div>
            </div>
        </article>
    `;
}

function renderAnalysisRecord(problemId, record, index) {
    return `
        <div class="accordion-item ${record.expanded ? "open" : ""}" id="analysis-${record.id}">
            <button class="accordion-header" data-toggle-analysis="${problemId}:${record.id}" type="button">
                <div class="accordion-title">
                    <strong>第 ${index + 1} 次 AI 诊断</strong>
                    <span>${escapeHtml(record.createdAt)} · ${escapeHtml(record.model)}</span>
                </div>
                <span class="accordion-caret">${record.expanded ? "收起 ▲" : "展开 ▼"}</span>
            </button>
            <div class="accordion-body">
                <div class="analysis-content">${renderMarkdown(record.content)}</div>
                <div class="analysis-toolbar">
                    <button class="btn btn-danger btn-sm" data-delete-analysis="${problemId}:${record.id}" type="button">删除这条记录</button>
                </div>
            </div>
        </div>
    `;
}

function renderMethodsTab() {
    const tab = document.getElementById("tab-methods");
    tab.innerHTML = `
        <div class="method-board">
            <div class="method-board-header">
                <h2>思维新方法</h2>
                <p>把你在刷题过程中总结出的套路、判定信号、易错点和抽象模型沉淀下来。</p>
            </div>

            <div class="method-inputs">
                <input id="method-title-input" type="text" placeholder="方法标题，例如：二分答案先判断什么">
                <textarea id="method-content-input" placeholder="支持 Markdown。可以写识别信号、适用条件、模板提醒、反例和易错点。"></textarea>
                <div class="inline-form-actions">
                    <button id="save-method-btn" class="btn btn-primary" type="button">保存方法</button>
                </div>
            </div>

            ${state.methods.length
                ? state.methods.map((method) => `
                    <article class="method-card">
                        <div class="method-card-head">
                            <div>
                                <h3>${escapeHtml(method.title)}</h3>
                                <div class="method-meta">${escapeHtml(method.createdAt)}</div>
                            </div>
                            <button class="btn btn-danger btn-sm" data-delete-method="${method.id}" type="button">删除</button>
                        </div>
                        <div class="method-content">${renderMarkdown(method.content)}</div>
                    </article>
                `).join("")
                : '<div class="empty-panel">还没有思维方法记录，可以先总结一条你今天新学会的套路。</div>'}
        </div>
    `;
}

function renderWrongTab() {
    const tab = document.getElementById("tab-wrong");
    const wrongProblems = state.categories.flatMap((category) => (
        category.problems
            .filter((problem) => problem.wrongBook)
            .map((problem) => ({ category, problem }))
    ));

    tab.innerHTML = `
        <div class="wrong-board">
            <div class="wrong-board-header">
                <h2>错题本</h2>
                <p>这里汇总你主动标记进错题本的题目和它们的历史 AI 分析记录。</p>
            </div>

            ${wrongProblems.length
                ? wrongProblems.map(({ category, problem }) => `
                    <article class="wrong-card">
                        <div class="wrong-card-head">
                            <div>
                                <h3>${escapeHtml(problem.title)}</h3>
                                <div class="wrong-meta">${escapeHtml(category.title)} · ${problem.link ? "已附洛谷链接" : "未填写链接"}</div>
                            </div>
                            <button class="btn btn-secondary btn-sm" data-focus-problem="${problem.id}" type="button">跳到原题</button>
                        </div>
                        ${problem.description ? `<div class="problem-desc">${escapeHtml(problem.description)}</div>` : ""}
                        <div class="wrong-records accordion-list">
                            ${problem.analysisRecords.length
                                ? problem.analysisRecords.map((record, index) => renderAnalysisRecord(problem.id, record, index)).join("")
                                : '<div class="analysis-empty">这道题还没有 AI 分析记录。</div>'}
                        </div>
                    </article>
                `).join("")
                : '<div class="empty-panel">还没有加入错题本的题目。</div>'}
        </div>
    `;
}

function renderAll() {
    renderProgress();
    renderCategoryNav();
    renderPlanTab();
    renderMethodsTab();
    renderWrongTab();
    syncTabState();
    syncSettingsInputs();
    renderMusic();
    renderMusicManageList();
    renderBgPreviews();
    applyBackground();
    updateHeaderLinks();
}

function syncTabState() {
    document.querySelectorAll(".tab").forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.tab === state.currentTab);
    });
    document.querySelectorAll(".tab-content").forEach((panel) => {
        panel.classList.toggle("active", panel.id === `tab-${state.currentTab}`);
    });
}

function syncSettingsInputs() {
    document.getElementById("set-ai-provider").value = state.settings.aiProvider || "openai";
    document.getElementById("set-ai-base-url").value = state.settings.aiBaseUrl || "";
    document.getElementById("set-ai-model").value = state.settings.aiModel || "";
    document.getElementById("set-ai-key").value = state.settings.apiKey || "";
    document.getElementById("set-github-repo").value = state.settings.githubRepo || "";
}

function openSettings() {
    document.getElementById("settings-modal").classList.add("open");
}

function closeSettings() {
    document.getElementById("settings-modal").classList.remove("open");
}

function toggleCategoryForm(forceVisible) {
    uiState.categoryFormVisible = typeof forceVisible === "boolean" ? forceVisible : !uiState.categoryFormVisible;
    const card = document.getElementById("category-form-card");
    card.classList.toggle("hidden", !uiState.categoryFormVisible);
    if (uiState.categoryFormVisible) {
        document.getElementById("category-title-input").focus();
    } else {
        document.getElementById("category-title-input").value = "";
        document.getElementById("category-summary-input").value = "";
    }
}

function toggleProblemForm(forceVisible, initial = null) {
    uiState.problemFormVisible = typeof forceVisible === "boolean" ? forceVisible : !uiState.problemFormVisible;
    renderPlanTab();
    if (!uiState.problemFormVisible) return;

    if (initial) {
        document.getElementById("problem-title-input").value = initial.title || "";
        document.getElementById("problem-link-input").value = initial.link || "";
        document.getElementById("problem-desc-input").value = initial.description || "";
        document.getElementById("save-problem-btn").dataset.editProblemId = initial.id;
    }
}

function addCategory(title, summary) {
    const category = {
        id: `day-${Date.now()}`,
        title: title.trim(),
        summary: summary.trim(),
        problems: []
    };
    state.categories.push(category);
    state.currentCategoryId = category.id;
    saveState();
    renderAll();
}

function updateCurrentCategory(title, summary) {
    const category = getCurrentCategory();
    if (!category) return;
    category.title = title.trim() || category.title;
    category.summary = summary.trim();
    saveState();
    renderAll();
}

function updateCategoryById(categoryId, title, summary) {
    const category = state.categories.find((item) => item.id === categoryId);
    if (!category) return;
    category.title = title.trim() || category.title;
    category.summary = summary.trim();
    saveState();
    renderAll();
}

function deleteCurrentCategory() {
    if (state.categories.length === 1) {
        alert("至少保留一个分类，避免主页变成空白。");
        return;
    }

    const current = getCurrentCategory();
    if (!current) return;
    const confirmed = confirm(`确定删除分类「${current.title}」吗？里面的题目和分析记录也会一起删除。`);
    if (!confirmed) return;

    state.categories = state.categories.filter((item) => item.id !== current.id);
    state.currentCategoryId = state.categories[0].id;
    saveState();
    renderAll();
}

function addProblemToCurrentCategory(title, link, description, html = "") {
    const category = getCurrentCategory();
    if (!category) return;

    category.problems.push({
        id: `problem-${Date.now()}`,
        title: title.trim(),
        link: link.trim(),
        description: description.trim(),
        html: html.trim(),
        code: "",
        wrongBook: false,
        collapsed: false,
        analysisRecords: [],
        chatRecords: [],
        insightRecords: []
    });

    saveState();
    uiState.problemFormVisible = false;
    renderAll();
}

function updateProblem(problemId, patch) {
    const problem = findProblem(problemId)?.problem;
    if (!problem) return;
    Object.assign(problem, patch);
    saveState();
    renderAll();
}

function deleteProblem(problemId) {
    const match = findProblem(problemId);
    if (!match) return;
    const confirmed = confirm(`确定删除题目「${match.problem.title}」吗？`);
    if (!confirmed) return;

    match.category.problems = match.category.problems.filter((item) => item.id !== problemId);
    saveState();
    renderAll();
}

function toggleProblemFold(problemId) {
    const problem = findProblem(problemId)?.problem;
    if (!problem) return;
    problem.collapsed = !problem.collapsed;
    saveState();
    renderAll();
}

function findProblem(problemId) {
    for (const category of state.categories) {
        const problem = category.problems.find((item) => item.id === problemId);
        if (problem) return { category, problem };
    }
    return null;
}

function saveMethod(title, content) {
    state.methods.unshift({
        id: `method-${Date.now()}`,
        title: title.trim(),
        content: content.trim(),
        createdAt: formatNow()
    });
    saveState();
    renderAll();
}

function deleteMethod(methodId) {
    state.methods = state.methods.filter((item) => item.id !== methodId);
    saveState();
    renderAll();
}

function toggleAnalysis(problemId, recordId) {
    const record = findProblem(problemId)?.problem.analysisRecords.find((item) => item.id === recordId);
    if (!record) return;
    record.expanded = !record.expanded;
    saveState();
    renderAll();
}

function deleteAnalysis(problemId, recordId) {
    const problem = findProblem(problemId)?.problem;
    if (!problem) return;
    problem.analysisRecords = problem.analysisRecords.filter((item) => item.id !== recordId);
    saveState();
    renderAll();
}

function renderChatRecord(problemId, record, index) {
    return `
        <div class="accordion-item ${record.expanded ? "open" : ""}" id="chat-${record.id}">
            <button class="accordion-header" data-toggle-chat="${problemId}:${record.id}" type="button">
                <div class="accordion-title">
                    <strong>第 ${index + 1} 次提问：${escapeHtml(record.question.slice(0, 32))}${record.question.length > 32 ? "..." : ""}</strong>
                    <span>${escapeHtml(record.createdAt)} · ${escapeHtml(record.model)}</span>
                </div>
                <span class="accordion-caret">${record.expanded ? "收起 ▲" : "展开 ▼"}</span>
            </button>
            <div class="accordion-body">
                <div class="chat-question">
                    <strong>我的问题</strong>
                    <p>${escapeHtml(record.question)}</p>
                </div>
                <div class="analysis-content">${renderMarkdown(record.answer)}</div>
                <div class="analysis-toolbar">
                    <button class="btn btn-danger btn-sm" data-delete-chat="${problemId}:${record.id}" type="button">删除这条对话</button>
                </div>
            </div>
        </div>
    `;
}

function toggleChat(problemId, recordId) {
    const record = findProblem(problemId)?.problem.chatRecords.find((item) => item.id === recordId);
    if (!record) return;
    record.expanded = !record.expanded;
    saveState();
    renderAll();
}

function deleteChat(problemId, recordId) {
    const problem = findProblem(problemId)?.problem;
    if (!problem) return;
    problem.chatRecords = problem.chatRecords.filter((item) => item.id !== recordId);
    saveState();
    renderAll();
}

function renderInsightRecord(problemId, record, index) {
    return `
        <div class="accordion-item insight-item ${record.expanded ? "open" : ""}" id="insight-${record.id}">
            <button class="accordion-header" data-toggle-insight="${problemId}:${record.id}" type="button">
                <div class="accordion-title">
                    <strong>${index + 1}. ${escapeHtml(record.title || "未命名收获")}</strong>
                    <span>${escapeHtml(record.createdAt)}${record.updatedAt ? ` · 更新于 ${escapeHtml(record.updatedAt)}` : ""}</span>
                </div>
                <span class="accordion-caret">${record.expanded ? "收起 ▲" : "展开 ▼"}</span>
            </button>
            <div class="accordion-body">
                <div class="analysis-content">${renderMarkdown(record.content)}</div>
                <div class="analysis-toolbar">
                    <button class="btn btn-secondary btn-sm" data-edit-insight="${problemId}:${record.id}" type="button">编辑这条收获</button>
                    <button class="btn btn-danger btn-sm" data-delete-insight="${problemId}:${record.id}" type="button">删除这条收获</button>
                </div>
            </div>
        </div>
    `;
}

function saveInsight(problemId) {
    const problem = findProblem(problemId)?.problem;
    if (!problem) return;
    const titleInput = document.querySelector(`[data-insight-title="${problemId}"]`);
    const contentInput = document.querySelector(`[data-insight-content="${problemId}"]`);
    const title = titleInput?.value.trim() || "";
    const content = contentInput?.value.trim() || "";
    const editingId = titleInput?.dataset.editingInsightId || "";

    if (!title) {
        alert("请先给这条收获写一个标题。");
        return;
    }
    if (!content) {
        alert("请先写下这条收获的内容。");
        return;
    }
    if (!Array.isArray(problem.insightRecords)) {
        problem.insightRecords = [];
    }

    if (editingId) {
        const record = problem.insightRecords.find((item) => item.id === editingId);
        if (record) {
            record.title = title;
            record.content = content;
            record.updatedAt = formatNow();
            record.expanded = true;
        }
    } else {
        problem.insightRecords.unshift({
            id: `insight-${Date.now()}`,
            createdAt: formatNow(),
            updatedAt: "",
            title,
            content,
            expanded: true
        });
    }

    problem.insightRecords.forEach((record, index) => {
        if (editingId ? record.id !== editingId : index !== 0) record.expanded = false;
    });
    saveState();
    renderAll();
}

function toggleInsight(problemId, recordId) {
    const record = findProblem(problemId)?.problem.insightRecords.find((item) => item.id === recordId);
    if (!record) return;
    record.expanded = !record.expanded;
    saveState();
    renderAll();
}

function deleteInsight(problemId, recordId) {
    const problem = findProblem(problemId)?.problem;
    if (!problem) return;
    problem.insightRecords = (problem.insightRecords || []).filter((item) => item.id !== recordId);
    saveState();
    renderAll();
}

function editInsight(problemId, recordId) {
    const problem = findProblem(problemId)?.problem;
    const record = problem?.insightRecords?.find((item) => item.id === recordId);
    if (!record) return;
    const titleInput = document.querySelector(`[data-insight-title="${problemId}"]`);
    const contentInput = document.querySelector(`[data-insight-content="${problemId}"]`);
    const label = document.querySelector(`[data-insight-editing-label="${problemId}"]`);
    const cancelButton = document.querySelector(`[data-cancel-insight-edit="${problemId}"]`);
    if (!titleInput || !contentInput) return;

    titleInput.value = record.title || "";
    contentInput.value = record.content || "";
    titleInput.dataset.editingInsightId = record.id;
    if (label) label.textContent = `正在编辑：${record.title || "未命名收获"}`;
    if (cancelButton) cancelButton.classList.remove("hidden");
    titleInput.scrollIntoView({ behavior: "smooth", block: "center" });
    titleInput.focus();
}

function cancelInsightEdit(problemId) {
    const titleInput = document.querySelector(`[data-insight-title="${problemId}"]`);
    const contentInput = document.querySelector(`[data-insight-content="${problemId}"]`);
    const label = document.querySelector(`[data-insight-editing-label="${problemId}"]`);
    const cancelButton = document.querySelector(`[data-cancel-insight-edit="${problemId}"]`);
    if (titleInput) {
        titleInput.value = "";
        delete titleInput.dataset.editingInsightId;
    }
    if (contentInput) contentInput.value = "";
    if (label) label.textContent = "新增一条收获记录。";
    if (cancelButton) cancelButton.classList.add("hidden");
}

function normaliseBaseUrl(baseUrl) {
    const trimmed = (baseUrl || "").trim().replace(/\/+$/, "");
    if (!trimmed) return "";
    if (trimmed.endsWith("/chat/completions")) return trimmed;
    if (trimmed.endsWith("/v1")) return `${trimmed}/chat/completions`;
    return `${trimmed}/v1/chat/completions`;
}

function normaliseAnthropicUrl(baseUrl) {
    const trimmed = (baseUrl || "").trim().replace(/\/+$/, "");
    if (!trimmed) return "https://api.anthropic.com/v1/messages";
    if (trimmed.endsWith("/messages")) return trimmed;
    if (trimmed.endsWith("/v1")) return `${trimmed}/messages`;
    return `${trimmed}/v1/messages`;
}

function trimForPrompt(value, maxLength, label) {
    const text = (value || "").trim();
    if (!text || text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}\n\n[${label} 内容较长，已截断前 ${maxLength} 字符。请基于可见内容分析；如信息不足请说明。]`;
}

function buildProblemContext(category, problem) {
    return [
        `分类：${category.title}`,
        `题目/资料名称：${problem.title}`,
        `题目/资料链接：${problem.link || "未提供"}`,
        "",
        "题干描述 / 用户补充：",
        trimForPrompt(problem.description, 12000, "题干描述") || "未提供",
        "",
        "题目网页 HTML / 网页正文：",
        trimForPrompt(problem.html, 30000, "网页 HTML") || "未提供",
        "",
        "用户代码 / 草稿 / 当前思路：",
        "```",
        trimForPrompt(problem.code, 24000, "代码") || "（用户还没有填写代码或草稿）",
        "```"
    ].join("\n");
}

function buildPrompt(category, problem) {
    return [
        "请作为耐心、严谨的题目讲解与代码诊断导师，帮助我分析下面这份题目资料。",
        "资料可能来自洛谷，也可能是我手写的题干、课程题目、网页 HTML 或其他 OJ 页面。",
        "",
        buildProblemContext(category, problem),
        "",
        "请按以下结构输出：",
        "1. 先判断题目资料是否完整；如果 HTML 中有噪音，请提取真正题意。",
        "2. 题目涉及的核心算法、数学思想或建模方法。",
        "3. 读题时应该抓住的关键词、约束和边界条件。",
        "4. 如果我提供了代码/草稿，请指出可能的错误、漏洞、边界问题和可优化之处。",
        "5. 给我一份更稳妥的修正思路或解题路线，优先讲思考过程，不要无脑直接贴完整答案。"
    ].join("\n");
}

function buildQuestionPrompt(category, problem, question) {
    return [
        "请作为题目讲解与代码诊断导师，回答我针对当前资料提出的问题。",
        "资料可能来自洛谷，也可能是我手写的题干、课程题目、网页 HTML 或其他 OJ 页面。",
        "",
        buildProblemContext(category, problem),
        "",
        "我的问题：",
        question,
        "",
        "回答要求：",
        "1. 优先解释思路，不要一上来直接给完整代码。",
        "2. 如果问题涉及代码错误，请指出最可能出错的位置和原因。",
        "3. 如果题目上下文不足，请明确说明你做了哪些假设。"
    ].join("\n");
}

function describeAiError(error) {
    const message = error?.message || "未知错误";
    if (error?.status === 502 || /\b502\b|bad response status code 502/i.test(message)) {
        return [
            "模型服务暂时不可用或中转接口响应异常。",
            "可以先等几十秒后重试；如果连续失败，去设置里换一个模型或检查 Base URL。",
            `原始信息：${message}`
        ].join("\n");
    }
    if (error?.status === 401 || /unauthorized|invalid api key|401/i.test(message)) {
        return `API Key 可能无效或已过期，请在设置里重新填写。\n原始信息：${message}`;
    }
    if (error?.status === 429 || /rate limit|quota|429/i.test(message)) {
        return `请求频率或额度可能超限，可以稍后再试，或切换到另一个可用模型。\n原始信息：${message}`;
    }
    return message;
}

async function requestAiText(systemPrompt, userPrompt) {
    if (!state.settings.apiKey.trim()) {
        throw new Error("请先在设置里填写 API Key。");
    }

    const provider = state.settings.aiProvider || "openai";
    const endpoint = provider === "anthropic"
        ? normaliseAnthropicUrl(state.settings.aiBaseUrl)
        : normaliseBaseUrl(state.settings.aiBaseUrl);
    if (!endpoint) {
        throw new Error("请先在设置里填写 Base URL。");
    }

    const response = await fetch(endpoint, provider === "anthropic"
        ? {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": state.settings.apiKey.trim(),
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: state.settings.aiModel.trim() || "claude-3-5-sonnet-latest",
                max_tokens: 1800,
                temperature: 0.3,
                system: systemPrompt,
                messages: [
                    {
                        role: "user",
                        content: userPrompt
                    }
                ]
            })
        }
        : {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${state.settings.apiKey.trim()}`
            },
            body: JSON.stringify({
                model: state.settings.aiModel.trim() || "gpt-4o-mini",
                temperature: 0.3,
                messages: [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: userPrompt
                    }
                ]
            })
        });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = payload.error?.message || payload.message || `请求失败（${response.status}）`;
        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    const content = provider === "anthropic"
        ? (payload.content || []).filter((item) => item.type === "text").map((item) => item.text).join("\n\n")
        : payload.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error("API 返回为空，未拿到回答内容。");
    }

    return {
        content,
        model: state.settings.aiModel.trim() || (provider === "anthropic" ? "claude-3-5-sonnet-latest" : "gpt-4o-mini")
    };
}

async function askProblemAi(problemId, question) {
    const match = findProblem(problemId);
    if (!match) return;
    if (!question.trim()) {
        alert("请先写下你想问 AI 的问题。");
        return;
    }

    uiState.loadingChatProblemId = problemId;
    renderPlanTab();
    syncTabState();

    try {
        const systemPrompt = "你是一位耐心、严谨的算法竞赛导师。请围绕用户给出的题目、代码和问题进行讲解，重视思路、边界与调试方法。";
        const userPrompt = buildQuestionPrompt(match.category, match.problem, question.trim());
        const result = await requestAiText(systemPrompt, userPrompt);

        if (!Array.isArray(match.problem.chatRecords)) {
            match.problem.chatRecords = [];
        }
        match.problem.chatRecords.push({
            id: `chat-${Date.now()}`,
            createdAt: formatNow(),
            model: result.model,
            question: question.trim(),
            answer: result.content,
            expanded: true
        });
        match.problem.chatRecords.forEach((record, index) => {
            if (index !== match.problem.chatRecords.length - 1) record.expanded = false;
        });

        saveState();
        renderAll();
    } catch (error) {
        alert(`AI 回答失败：${describeAiError(error)}`);
        if (/API Key|Base URL/.test(error.message)) {
            openSettings();
        }
    } finally {
        uiState.loadingChatProblemId = null;
        renderPlanTab();
        syncTabState();
    }
}

async function diagnoseProblem(problemId) {
    const match = findProblem(problemId);
    if (!match) return;

    const { category, problem } = match;
    if (![problem.link, problem.description, problem.html, problem.code].some((item) => (item || "").trim())) {
        alert("请先填写洛谷链接、题干描述、网页 HTML 或代码中的至少一项。");
        return;
    }
    if (!state.settings.apiKey.trim()) {
        alert("请先在设置里填写 API Key。");
        openSettings();
        return;
    }

    const provider = state.settings.aiProvider || "openai";
    const endpoint = provider === "anthropic"
        ? normaliseAnthropicUrl(state.settings.aiBaseUrl)
        : normaliseBaseUrl(state.settings.aiBaseUrl);
    if (!endpoint) {
        alert("请先在设置里填写 Base URL。");
        openSettings();
        return;
    }

    uiState.loadingProblemId = problemId;
    renderPlanTab();
    syncTabState();

    try {
        const systemPrompt = "你是一位耐心、严谨的算法竞赛导师，擅长根据题意和代码定位错误、指出边界问题，并提炼题目涉及的算法思想。";
        const userPrompt = buildPrompt(category, problem);
        const response = await fetch(endpoint, provider === "anthropic"
            ? {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": state.settings.apiKey.trim(),
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model: state.settings.aiModel.trim() || "claude-3-5-sonnet-latest",
                    max_tokens: 1800,
                    temperature: 0.3,
                    system: systemPrompt,
                    messages: [
                        {
                            role: "user",
                            content: userPrompt
                        }
                    ]
                })
            }
            : {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${state.settings.apiKey.trim()}`
                },
                body: JSON.stringify({
                    model: state.settings.aiModel.trim() || "gpt-4o-mini",
                    temperature: 0.3,
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        {
                            role: "user",
                            content: userPrompt
                        }
                    ]
                })
            });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            const message = payload.error?.message || payload.message || `请求失败（${response.status}）`;
            const error = new Error(message);
            error.status = response.status;
            throw error;
        }

        const content = provider === "anthropic"
            ? (payload.content || []).filter((item) => item.type === "text").map((item) => item.text).join("\n\n")
            : payload.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error("API 返回为空，未拿到分析内容。");
        }

        problem.analysisRecords.push({
            id: `analysis-${Date.now()}`,
            createdAt: formatNow(),
            model: state.settings.aiModel.trim() || (provider === "anthropic" ? "claude-3-5-sonnet-latest" : "gpt-4o-mini"),
            content,
            expanded: true
        });
        problem.analysisRecords.forEach((record, index) => {
            if (index !== problem.analysisRecords.length - 1) record.expanded = false;
        });

        saveState();
        renderAll();
    } catch (error) {
        alert(`AI 诊断失败：${describeAiError(error)}`);
    } finally {
        uiState.loadingProblemId = null;
        renderPlanTab();
        syncTabState();
    }
}

function parseMusicId(input) {
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) return trimmed;
    const queryMatch = trimmed.match(/[?&]id=(\d+)/);
    if (queryMatch) return queryMatch[1];
    const songMatch = trimmed.match(/song\/(\d+)/);
    if (songMatch) return songMatch[1];
    return null;
}

function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "kotori-luogu-ai-backup.json";
    link.click();
    URL.revokeObjectURL(link.href);
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const parsed = JSON.parse(event.target.result);
            state = migrateState(parsed);
            saveState();
            renderAll();
            alert("导入成功。");
        } catch (error) {
            alert("导入失败，JSON 格式不正确。");
        }
    };
    reader.readAsText(file);
}

function setupEvents() {
    document.getElementById("settings-btn").addEventListener("click", openSettings);
    document.querySelector(".modal-close").addEventListener("click", closeSettings);
    document.querySelector(".modal-overlay").addEventListener("click", closeSettings);

    document.querySelector(".tabs").addEventListener("click", (event) => {
        const button = event.target.closest(".tab");
        if (!button) return;
        state.currentTab = button.dataset.tab;
        saveState();
        syncTabState();
    });

    document.getElementById("category-nav").addEventListener("click", (event) => {
        const editButton = event.target.closest("[data-edit-category]");
        if (editButton) {
            event.preventDefault();
            event.stopPropagation();
            const category = state.categories.find((item) => item.id === editButton.dataset.editCategory);
            if (!category) return;
            const title = prompt("修改当天标题：", category.title);
            if (title === null) return;
            const summary = prompt("修改当天说明：", category.summary || "");
            if (summary === null) return;
            updateCategoryById(category.id, title, summary);
            return;
        }

        const button = event.target.closest("[data-category-id]");
        if (!button) return;
        state.currentCategoryId = button.dataset.categoryId;
        saveState();
        renderAll();
    });

    document.getElementById("toggle-category-form-btn").addEventListener("click", () => toggleCategoryForm());
    document.getElementById("cancel-category-btn").addEventListener("click", () => toggleCategoryForm(false));
    document.getElementById("save-category-btn").addEventListener("click", () => {
        const title = document.getElementById("category-title-input").value.trim();
        const summary = document.getElementById("category-summary-input").value.trim();
        if (!title) {
            alert("请填写分类标题。");
            return;
        }
        addCategory(title, summary);
        toggleCategoryForm(false);
    });

    document.getElementById("main-content").addEventListener("click", (event) => {
        const target = event.target;

        if (target.closest("#toggle-problem-form-btn")) {
            toggleProblemForm();
            return;
        }

        if (target.closest("#cancel-problem-btn")) {
            uiState.problemFormVisible = false;
            renderPlanTab();
            syncTabState();
            return;
        }

        if (target.closest("#save-problem-btn")) {
            const button = target.closest("#save-problem-btn");
            const title = document.getElementById("problem-title-input").value.trim();
            const link = document.getElementById("problem-link-input").value.trim();
            const description = document.getElementById("problem-desc-input").value.trim();
            const html = document.getElementById("problem-html-input").value.trim();
            if (!title) {
                alert("请先填写题目名称。");
                return;
            }

            const editId = button.dataset.editProblemId;
            if (editId) {
                updateProblem(editId, { title, link, description, html });
            } else {
                addProblemToCurrentCategory(title, link, description, html);
            }
            return;
        }

        if (target.closest("#rename-category-btn")) {
            const current = getCurrentCategory();
            const title = prompt("修改分类标题：", current.title);
            if (title === null) return;
            const summary = prompt("修改分类说明：", current.summary || "");
            if (summary === null) return;
            updateCurrentCategory(title, summary);
            return;
        }

        if (target.closest("#delete-category-btn")) {
            deleteCurrentCategory();
            return;
        }

        const catalogButton = target.closest("[data-catalog-problem]");
        if (catalogButton) {
            const match = findProblem(catalogButton.dataset.catalogProblem);
            if (match && match.problem.collapsed) {
                match.problem.collapsed = false;
                saveState();
                renderPlanTab();
                syncTabState();
            }
            const article = document.querySelector(`[data-problem-id="${catalogButton.dataset.catalogProblem}"]`);
            if (article) {
                article.scrollIntoView({ behavior: "smooth", block: "start" });
                article.classList.remove("problem-highlight");
                void article.offsetWidth;
                article.classList.add("problem-highlight");
            }
            return;
        }

        const foldButton = target.closest("[data-toggle-problem-fold]");
        if (foldButton) {
            toggleProblemFold(foldButton.dataset.toggleProblemFold);
            return;
        }

        const diagnoseButton = target.closest("[data-diagnose-problem]");
        if (diagnoseButton) {
            diagnoseProblem(diagnoseButton.dataset.diagnoseProblem);
            return;
        }

        const askButton = target.closest("[data-ask-problem]");
        if (askButton) {
            const problemId = askButton.dataset.askProblem;
            const input = document.querySelector(`[data-ai-question="${problemId}"]`);
            askProblemAi(problemId, input ? input.value : "");
            return;
        }

        const wrongButton = target.closest("[data-toggle-wrong]");
        if (wrongButton) {
            const match = findProblem(wrongButton.dataset.toggleWrong);
            if (!match) return;
            match.problem.wrongBook = !match.problem.wrongBook;
            saveState();
            renderAll();
            return;
        }

        const editProblemButton = target.closest("[data-edit-problem]");
        if (editProblemButton) {
            const match = findProblem(editProblemButton.dataset.editProblem);
            if (!match) return;
            uiState.problemFormVisible = true;
            renderPlanTab();
            syncTabState();
            document.getElementById("problem-title-input").value = match.problem.title;
            document.getElementById("problem-link-input").value = match.problem.link;
            document.getElementById("problem-desc-input").value = match.problem.description;
            document.getElementById("problem-html-input").value = match.problem.html || "";
            document.getElementById("save-problem-btn").dataset.editProblemId = match.problem.id;
            return;
        }

        const deleteProblemButton = target.closest("[data-delete-problem]");
        if (deleteProblemButton) {
            deleteProblem(deleteProblemButton.dataset.deleteProblem);
            return;
        }

        const toggleAnalysisButton = target.closest("[data-toggle-analysis]");
        if (toggleAnalysisButton) {
            const [problemId, recordId] = toggleAnalysisButton.dataset.toggleAnalysis.split(":");
            toggleAnalysis(problemId, recordId);
            return;
        }

        const deleteAnalysisButton = target.closest("[data-delete-analysis]");
        if (deleteAnalysisButton) {
            const [problemId, recordId] = deleteAnalysisButton.dataset.deleteAnalysis.split(":");
            deleteAnalysis(problemId, recordId);
            return;
        }

        const toggleChatButton = target.closest("[data-toggle-chat]");
        if (toggleChatButton) {
            const [problemId, recordId] = toggleChatButton.dataset.toggleChat.split(":");
            toggleChat(problemId, recordId);
            return;
        }

        const deleteChatButton = target.closest("[data-delete-chat]");
        if (deleteChatButton) {
            const [problemId, recordId] = deleteChatButton.dataset.deleteChat.split(":");
            deleteChat(problemId, recordId);
            return;
        }

        const saveInsightButton = target.closest("[data-save-insight]");
        if (saveInsightButton) {
            saveInsight(saveInsightButton.dataset.saveInsight);
            return;
        }

        const cancelInsightButton = target.closest("[data-cancel-insight-edit]");
        if (cancelInsightButton) {
            cancelInsightEdit(cancelInsightButton.dataset.cancelInsightEdit);
            return;
        }

        const toggleInsightButton = target.closest("[data-toggle-insight]");
        if (toggleInsightButton) {
            const [problemId, recordId] = toggleInsightButton.dataset.toggleInsight.split(":");
            toggleInsight(problemId, recordId);
            return;
        }

        const editInsightButton = target.closest("[data-edit-insight]");
        if (editInsightButton) {
            const [problemId, recordId] = editInsightButton.dataset.editInsight.split(":");
            editInsight(problemId, recordId);
            return;
        }

        const deleteInsightButton = target.closest("[data-delete-insight]");
        if (deleteInsightButton) {
            const [problemId, recordId] = deleteInsightButton.dataset.deleteInsight.split(":");
            deleteInsight(problemId, recordId);
            return;
        }

        const saveMethodButton = target.closest("#save-method-btn");
        if (saveMethodButton) {
            const title = document.getElementById("method-title-input").value.trim();
            const content = document.getElementById("method-content-input").value.trim();
            if (!title || !content) {
                alert("标题和内容都要填写。");
                return;
            }
            saveMethod(title, content);
            return;
        }

        const deleteMethodButton = target.closest("[data-delete-method]");
        if (deleteMethodButton) {
            deleteMethod(deleteMethodButton.dataset.deleteMethod);
            return;
        }

        const focusProblemButton = target.closest("[data-focus-problem]");
        if (focusProblemButton) {
            const match = findProblem(focusProblemButton.dataset.focusProblem);
            if (!match) return;
            state.currentCategoryId = match.category.id;
            state.currentTab = "plan";
            saveState();
            renderAll();
            const article = document.querySelector(`[data-problem-id="${match.problem.id}"]`);
            if (article) article.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    });

    document.getElementById("main-content").addEventListener("change", async (event) => {
        if (event.target.id !== "problem-html-file") return;
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        const input = document.getElementById("problem-html-input");
        if (!input) return;
        try {
            input.value = await file.text();
        } catch (error) {
            alert(`读取文件失败：${error.message || error}`);
        }
    });

    document.getElementById("main-content").addEventListener("input", (event) => {
        const codeArea = event.target.closest("[data-problem-code]");
        if (codeArea) {
            const problem = findProblem(codeArea.dataset.problemCode)?.problem;
            if (!problem) return;
            problem.code = codeArea.value;
            saveState();
        }
    });

    document.getElementById("set-ai-base-url").addEventListener("input", (event) => {
        state.settings.aiBaseUrl = event.target.value;
        saveState();
    });
    document.getElementById("set-ai-provider").addEventListener("change", (event) => {
        state.settings.aiProvider = event.target.value;
        if (state.settings.aiProvider === "anthropic" && !state.settings.aiBaseUrl.trim()) {
            state.settings.aiBaseUrl = "https://api.anthropic.com";
        }
        if (state.settings.aiProvider === "openai" && !state.settings.aiBaseUrl.trim()) {
            state.settings.aiBaseUrl = "https://api.openai.com/v1";
        }
        saveState();
        syncSettingsInputs();
    });
    document.getElementById("set-ai-model").addEventListener("input", (event) => {
        state.settings.aiModel = event.target.value;
        saveState();
    });
    document.getElementById("set-ai-key").addEventListener("input", (event) => {
        state.settings.apiKey = event.target.value;
        saveState();
    });
    document.getElementById("set-github-repo").addEventListener("input", (event) => {
        state.settings.githubRepo = event.target.value;
        saveState();
        updateHeaderLinks();
    });

    document.getElementById("bg-upload-btn").addEventListener("click", () => {
        document.getElementById("bg-upload").click();
    });
    document.getElementById("bg-upload").addEventListener("change", async (event) => {
        const files = Array.from(event.target.files || []);
        for (const file of files) {
            try {
                const dataUrl = await compressBackgroundImage(file);
                let storedValue = dataUrl;
                if (bgDb) {
                    storedValue = `bg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                    await bgDbPut(storedValue, dataUrl);
                    backgroundImageCache[storedValue] = dataUrl;
                }
                state.settings.backgrounds.push(storedValue);
                if (state.settings.currentBg < 0) {
                    state.settings.currentBg = 0;
                }
                if (!saveState()) {
                    const removed = state.settings.backgrounds.pop();
                    if (bgDb && removed && !isDataUrl(removed)) {
                        delete backgroundImageCache[removed];
                        await bgDbDelete(removed).catch(() => {});
                    }
                    if (!state.settings.backgrounds.length) {
                        state.settings.currentBg = -1;
                    }
                    alert("图片保存失败：浏览器本地存储空间不足。请换一张更小的图片，或先删除旧背景。");
                    break;
                }
                renderAll();
            } catch (error) {
                alert(`图片上传失败：${error.message}`);
            }
        }
        event.target.value = "";
    });
    document.getElementById("bg-preview-list").addEventListener("click", (event) => {
        const deleteButton = event.target.closest("[data-bg-del]");
        if (deleteButton) {
            const index = Number(deleteButton.dataset.bgDel);
            const [removed] = state.settings.backgrounds.splice(index, 1);
            if (bgDb && removed && !isDataUrl(removed)) {
                delete backgroundImageCache[removed];
                bgDbDelete(removed).catch((error) => console.warn("Failed to delete background image:", error));
            }
            if (state.settings.currentBg >= state.settings.backgrounds.length) {
                state.settings.currentBg = state.settings.backgrounds.length - 1;
            }
            saveState();
            renderAll();
            return;
        }

        const selectButton = event.target.closest("[data-bg-select]");
        if (selectButton) {
            state.settings.currentBg = Number(selectButton.dataset.bgSelect);
            saveState();
            renderAll();
        }
    });
    document.getElementById("bg-reset-btn").addEventListener("click", () => {
        state.settings.currentBg = -1;
        saveState();
        applyBackground();
        renderBgPreviews();
    });

    document.getElementById("music-add-btn").addEventListener("click", () => {
        const input = document.getElementById("music-input");
        const musicId = parseMusicId(input.value);
        if (!musicId) {
            alert("请输入有效的网易云歌曲 ID 或链接。");
            return;
        }
        state.settings.musicIds.push(musicId);
        input.value = "";
        saveState();
        renderAll();
    });
    document.getElementById("music-manage-list").addEventListener("click", (event) => {
        const button = event.target.closest("[data-music-del]");
        if (!button) return;
        state.settings.musicIds.splice(Number(button.dataset.musicDel), 1);
        saveState();
        renderAll();
    });

    document.getElementById("export-btn").addEventListener("click", exportData);
    document.getElementById("import-btn").addEventListener("click", () => {
        document.getElementById("import-file").click();
    });
    document.getElementById("import-file").addEventListener("change", (event) => {
        const file = event.target.files?.[0];
        if (file) importData(file);
        event.target.value = "";
    });

    document.getElementById("bg-view-btn").addEventListener("click", () => {
        if (state.settings.currentBg < 0 || !resolveBackgroundSrc(state.settings.backgrounds[state.settings.currentBg])) {
            alert("请先在设置里上传背景图片。");
            return;
        }
        document.body.classList.add("bg-viewing");
    });
    document.getElementById("bg-view-exit").addEventListener("click", () => {
        document.body.classList.remove("bg-viewing");
    });

    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        if (document.body.classList.contains("bg-viewing")) {
            document.body.classList.remove("bg-viewing");
            return;
        }
        closeSettings();
    });
}

async function init() {
    loadState();
    try {
        await openBackgroundDb();
        backgroundImageCache = await bgDbGetAll();
        await migrateBackgroundsToIndexedDb();
    } catch (error) {
        console.warn("Background image database is unavailable:", error);
    }
    initParticles();
    setupEvents();
    renderAll();
}

document.addEventListener("DOMContentLoaded", init);
