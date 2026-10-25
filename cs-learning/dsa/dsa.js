(() => {
  'use strict';

  const DATA = Array.isArray(window.DSA_LESSONS) ? [...window.DSA_LESSONS] : [];
  const view = document.body.dataset.dsaView;
  const progressKey = 'kotori-dsa-practice-progress-v1';
  const REFERENCE_REPOSITORY = 'https://github.com/ICUlizhi/Data-Structure-and-Algorithm-A-of-pku';
  const LUOGU_FOUNDATION = 'https://www.luogu.com.cn/training/list?type=srqc-jc';
  const LUOGU_ADVANCED = 'https://www.luogu.com.cn/training/list?type=srqc-jj';
  let selectedLevel = 'all';
  let query = '';
  let lessonQuery = '';

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
  const lessonUrl = id => `lesson.html?lesson=${encodeURIComponent(id)}`;
  const textParagraphs = value => String(value || '').split(/\n{2,}/).filter(Boolean)
    .map(part => `<p>${escapeHtml(part).replace(/\n/g, '<br>')}</p>`).join('');
  const sortedLessons = () => DATA.sort((a, b) => Number(a.order) - Number(b.order));
  const allPractice = lesson => (lesson.types || []).flatMap(type => (type.practice || []).map(problem => ({ type, problem })));

  function getProgress() {
    try { return JSON.parse(localStorage.getItem(progressKey) || '{}'); } catch { return {}; }
  }

  function saveProgress(value) {
    try { localStorage.setItem(progressKey, JSON.stringify(value)); } catch {}
  }

  function practiceId(lesson, type, problem) {
    return `${lesson.id}:${type.id}:${problem.id}`;
  }

  function progressCount(lesson) {
    const progress = getProgress();
    const items = allPractice(lesson);
    const finished = items.filter(({ type, problem }) => progress[practiceId(lesson, type, problem)] && progress[practiceId(lesson, type, problem)] !== '未做').length;
    return `${finished}/${items.length} 已记录`;
  }

  function outlineMarkup(currentId) {
    const lessons = sortedLessons();
    if (!lessons.length) return '<p class="dsa-outline-empty">课程内容准备中</p>';
    return lessons.map(lesson => `<a href="${lessonUrl(lesson.id)}" class="${lesson.id === currentId ? 'is-current' : ''}"><b>${String(lesson.order).padStart(2, '0')}</b> ${escapeHtml(lesson.title)}</a>`).join('');
  }

  function setCourseOutline(currentId) {
    const node = document.querySelector('[data-course-outline]');
    if (node) node.innerHTML = outlineMarkup(currentId);
  }

  function setupSidebar() {
    const sidebar = document.querySelector('[data-dsa-sidebar]');
    const button = document.querySelector('[data-sidebar-toggle]');
    if (!sidebar || !button) return;
    let collapsed = false;
    try { collapsed = localStorage.getItem('kotori-dsa-sidebar-collapsed') === 'true'; } catch {}
    sidebar.classList.toggle('is-collapsed', collapsed);
    const sync = () => {
      const isCollapsed = sidebar.classList.contains('is-collapsed');
      button.textContent = isCollapsed ? '展开' : '收起';
      button.setAttribute('aria-expanded', String(!isCollapsed));
    };
    button.addEventListener('click', () => {
      sidebar.classList.toggle('is-collapsed');
      try { localStorage.setItem('kotori-dsa-sidebar-collapsed', String(sidebar.classList.contains('is-collapsed'))); } catch {}
      sync();
    });
    sync();
  }

  function lessonMatches(lesson) {
    const searchText = [
      lesson.title, lesson.summary, ...(lesson.knowledge || []).flatMap(item => [item.title, item.body]),
      ...(lesson.types || []).flatMap(type => [type.title, type.category, type.features, ...(type.practice || []).flatMap(problem => [problem.title, problem.purpose])])
    ].join(' ').toLocaleLowerCase();
    const levelMatches = selectedLevel === 'all' || allPractice(lesson).some(({ problem }) => problem.level === selectedLevel);
    return levelMatches && (!query || searchText.includes(query));
  }

  function catalogCard(lesson) {
    const practice = allPractice(lesson);
    const tags = (lesson.types || []).slice(0, 4).map(type => `<span class="dsa-tag">${escapeHtml(type.title)}</span>`).join('');
    return `<article class="dsa-card">
      <p class="dsa-lesson-order">LESSON ${String(lesson.order).padStart(2, '0')}</p>
      <h2>${escapeHtml(lesson.title)}</h2>
      <p>${escapeHtml(lesson.summary || '本课内容正在整理。')}</p>
      <div class="dsa-tags">${tags || '<span class="dsa-tag">课程整理中</span>'}</div>
      <div class="dsa-card-footer"><span class="dsa-progress-count">${practice.length} 项练习安排 · ${progressCount(lesson)}</span><a href="${lessonUrl(lesson.id)}">进入本课 →</a></div>
    </article>`;
  }

  function renderCatalog() {
    setCourseOutline();
    const container = document.querySelector('[data-catalog]');
    if (!container) return;
    if (!DATA.length) {
      container.innerHTML = '<section class="dsa-empty"><strong>课程内容正在接入。</strong><br>目录、筛选、题目复盘和来源信息会在审核后的课程数据加入后显示。</section>';
      return;
    }
    const lessons = sortedLessons().filter(lessonMatches);
    container.innerHTML = lessons.length ? lessons.map(catalogCard).join('') : '<section class="dsa-empty">没有匹配的课程；可清除搜索或切换难度筛选。</section>';
  }

  function sourceMarkup(lesson) {
    const source = lesson.sourceUrl ? `<li><a href="${escapeHtml(lesson.sourceUrl)}" target="_blank" rel="noreferrer">本课课程资料 ↗</a></li>` : '';
    const repoPaths = (lesson.repoPaths || []).map(path => `<li><a href="${escapeHtml(encodeURI(`${REFERENCE_REPOSITORY}/blob/main/${path}`))}" target="_blank" rel="noreferrer">参考仓库文件：${escapeHtml(path)} ↗</a></li>`).join('');
    return `<section class="dsa-section"><h2 id="sources">来源与覆盖边界</h2><ul class="dsa-source-list">${source}<li><a href="${REFERENCE_REPOSITORY}" target="_blank" rel="noreferrer">ICUlizhi / Data-Structure-and-Algorithm-A-of-pku ↗</a></li>${repoPaths}<li><a href="${LUOGU_FOUNDATION}" target="_blank" rel="noreferrer">洛谷《深入浅出》基础篇官方分类 ↗</a></li><li><a href="${LUOGU_ADVANCED}" target="_blank" rel="noreferrer">洛谷《深入浅出》进阶篇官方分类 ↗</a></li></ul>${lesson.coverageNote ? `<p class="dsa-coverage-note">${escapeHtml(lesson.coverageNote)}</p>` : ''}</section>`;
  }

  function outlineCoverageMarkup(lesson) {
    const entries = lesson.outlineCoverage || [];
    if (!entries.length) return '';
    return `<section class="dsa-section dsa-coverage"><h2 id="coverage">本课覆盖检查</h2><details><summary>展开源大纲小节与本课对应内容（${entries.length} 项）</summary><div class="dsa-coverage-table-wrap"><table><thead><tr><th scope="col">源大纲小节</th><th scope="col">本课位置</th><th scope="col">覆盖</th><th scope="col">边界说明</th></tr></thead><tbody>${entries.map(item => `<tr><th scope="row">${escapeHtml(item.title || '未命名小节')}</th><td>${(item.related || []).map(value => `<span>${escapeHtml(value)}</span>`).join('') || '待关联'}</td><td><span class="dsa-coverage-status ${item.status === '直接' ? 'is-direct' : ''}">${escapeHtml(item.status || '待核对')}</span></td><td>${escapeHtml(item.boundary || '—')}</td></tr>`).join('')}</tbody></table></div></details></section>`;
  }

  function knowledgeMarkup(lesson) {
    if (lesson.reading) {
      const reading = lesson.reading;
      const units = reading.units || [];
      return `<section class="dsa-section dsa-reading"><h2 id="knowledge">图文讲解</h2>${textParagraphs(reading.intro)}<aside class="dsa-reading-compare"><strong>两份资料怎样对照</strong>${textParagraphs(reading.compare)}</aside><nav class="dsa-reading-toc" aria-label="本课讲解目录">${units.map(unit => `<a href="#${escapeHtml(unit.id)}">${escapeHtml(unit.title)}</a>`).join('')}</nav>${units.map(unit => `<section class="dsa-reading-unit"><h3 id="${escapeHtml(unit.id)}">${escapeHtml(unit.title)}</h3>${(unit.paragraphs || []).map(textParagraphs).join('')}<div class="dsa-walkthrough"><strong>跟着算一遍</strong>${textParagraphs(unit.walkthrough)}</div><div class="dsa-figures">${(unit.figures || []).map(figure => `<figure><a href="${escapeHtml(figure.file)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(figure.file)}" alt="${escapeHtml(figure.caption)}" loading="lazy" decoding="async"></a><figcaption>${escapeHtml(figure.caption)} <a href="${escapeHtml(figure.sourceUrl)}" target="_blank" rel="noreferrer">图源：${escapeHtml(figure.credit)} ↗</a></figcaption></figure>`).join('')}</div><div class="dsa-reading-sources"><strong>对照原文：</strong>${(unit.sources || []).map(source => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.title)} ↗</a>`).join('')}</div>${unit.relatedTypes?.length ? `<p class="dsa-reading-related">接着练：${unit.relatedTypes.map(id => `<a href="#type-${escapeHtml(id)}">${escapeHtml((lesson.types || []).find(type => type.id === id)?.title || id)}</a>`).join(' · ')}</p>` : ''}</section>`).join('')}<details class="dsa-quick-reference"><summary>速查条目（${(lesson.quickReference || []).length} 项；配合上面的讲解使用）</summary>${(lesson.quickReference || []).map((item, index) => `<section class="dsa-knowledge"><h4 id="knowledge-${index + 1}">${escapeHtml(item.title)}</h4>${textParagraphs(item.body)}</section>`).join('')}</details></section>`;
    }
    const entries = lesson.knowledge || [];
    if (!entries.length) return '';
    return `<section class="dsa-section"><h2 id="knowledge">知识点</h2><div class="dsa-knowledge-list">${entries.map((item, index) => `<section class="dsa-knowledge"><h3 id="knowledge-${index + 1}">${escapeHtml(item.title)}</h3>${textParagraphs(item.body)}</section>`).join('')}</div></section>`;
  }

  function templateMarkup(lesson) {
    const templates = lesson.templates || [];
    if (!templates.length) return '';
    return `<section class="dsa-section"><h2 id="templates">C++ 板子</h2><p class="dsa-code-note">以下为 C++17 函数片段，默认已包含 <code>#include &lt;bits/stdc++.h&gt;</code> 且使用 <code>using namespace std;</code>；它们用于说明接口和关键逻辑，并非每道题可直接提交的完整程序。</p><div class="dsa-template-list">${templates.map((template, index) => {
      const notes = Array.isArray(template.notes)
        ? `<ul>${template.notes.map(note => `<li>${escapeHtml(note)}</li>`).join('')}</ul>`
        : textParagraphs(template.notes);
      return `<section class="dsa-template"><h3 id="template-${escapeHtml(template.id || index + 1)}">${escapeHtml(template.title)}</h3><p><strong>适用：</strong>${escapeHtml(template.when || '待补充')}</p><p><strong>复杂度：</strong>${escapeHtml(template.complexity || '待补充')}</p><button type="button" class="dsa-copy-code" data-code-id="code-${index}">复制代码</button><pre><code id="code-${index}">${escapeHtml(template.code || '')}</code></pre>${notes}</section>`;
    }).join('')}</div></section>`;
  }

  function practiceMarkup(lesson, type, problem) {
    const progress = getProgress()[practiceId(lesson, type, problem)] || '未做';
    const status = ['未做', '做过', '待复习'].map(value => `<option value="${value}" ${value === progress ? 'selected' : ''}>${value}</option>`).join('');
    const searchText = [problem.id, problem.title, type.title, problem.purpose, problem.hint].filter(Boolean).join(' ').toLocaleLowerCase();
    return `<article class="dsa-practice" data-practice data-level="${escapeHtml(problem.level || '')}" data-practice-search="${escapeHtml(searchText)}">
      <div class="dsa-practice-header"><div><a href="${escapeHtml(problem.url || '#')}" target="_blank" rel="noreferrer">${escapeHtml(problem.source || '题目')} · ${escapeHtml(problem.id)} ${escapeHtml(problem.title)} ↗</a><div class="dsa-practice-meta"><span>${escapeHtml(problem.level || '未分级')}</span><span>${escapeHtml(problem.coverage || '直接')}</span></div></div><select class="dsa-practice-status" data-practice-status="${escapeHtml(practiceId(lesson, type, problem))}" aria-label="${escapeHtml(problem.title)} 的练习状态">${status}</select></div>
      <p><strong>训练目的：</strong>${escapeHtml(problem.purpose || '待补充')}</p>
      ${problem.hint ? `<details><summary>做题提示</summary><p>${escapeHtml(problem.hint)}</p></details>` : ''}
      ${problem.warning ? `<p><strong>易错提醒：</strong>${escapeHtml(problem.warning)}</p>` : ''}
    </article>`;
  }

  function typeMarkup(lesson, type, index) {
    const practice = type.practice || [];
    return `<section class="dsa-type" data-type-section>
      <header class="dsa-type-header"><div><p class="dsa-type-category">${escapeHtml(type.category || '课程理论专项')}</p><h3 id="type-${escapeHtml(type.id || index + 1)}">${escapeHtml(type.title)}</h3></div><span class="dsa-tag">${practice.length} 道正式题</span></header>
      <div class="dsa-columns"><section><h4>识别特征</h4><p>${escapeHtml(type.features || '待补充')}</p></section><section><h4>解题流程</h4><ol>${(type.steps || []).map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ol></section><section><h4>易错点</h4><ul>${(type.pitfalls || []).map(pitfall => `<li>${escapeHtml(pitfall)}</li>`).join('')}</ul></section></div>
      <div class="dsa-practice-list">${practice.map(problem => practiceMarkup(lesson, type, problem)).join('') || '<p class="dsa-empty">该题型的正式练习尚未接入。</p>'}</div>
    </section>`;
  }

  function setupPageOutline() {
    const outline = document.querySelector('[data-page-outline]');
    const article = document.querySelector('[data-lesson]');
    if (!outline || !article) return;
    const headings = [...article.querySelectorAll('h2[id], h3[id]')];
    outline.innerHTML = headings.map(heading => `<a class="level-${heading.tagName.slice(1)}" href="#${encodeURIComponent(heading.id)}">${escapeHtml(heading.textContent)}</a>`).join('');
  }

  function applyPracticeFilters() {
    document.querySelectorAll('[data-practice]').forEach(item => {
      const levelMatches = selectedLevel === 'all' || item.dataset.level === selectedLevel;
      const queryMatches = !lessonQuery || (item.dataset.practiceSearch || '').includes(lessonQuery);
      const visible = levelMatches && queryMatches;
      item.hidden = !visible;
    });
    document.querySelectorAll('[data-type-section]').forEach(section => {
      section.hidden = ![...section.querySelectorAll('[data-practice]')].some(item => !item.hidden);
    });
    const empty = document.querySelector('[data-practice-empty]');
    if (empty) empty.hidden = [...document.querySelectorAll('[data-practice]')].some(item => !item.hidden);
  }

  function setupFilters() {
    const search = document.querySelector('[data-search]');
    if (search) search.addEventListener('input', event => { query = event.target.value.trim().toLocaleLowerCase(); renderCatalog(); });
    const lessonSearch = document.querySelector('[data-lesson-search]');
    if (lessonSearch) lessonSearch.addEventListener('input', event => { lessonQuery = event.target.value.trim().toLocaleLowerCase(); applyPracticeFilters(); });
    document.querySelectorAll('[data-level-filter]').forEach(button => button.addEventListener('click', () => {
      selectedLevel = button.dataset.levelFilter;
      document.querySelectorAll('[data-level-filter]').forEach(item => item.classList.toggle('is-active', item === button));
      if (view === 'catalog') renderCatalog(); else applyPracticeFilters();
    }));
  }

  function setupPracticeStatus() {
    document.addEventListener('change', event => {
      const select = event.target.closest('[data-practice-status]');
      if (!select) return;
      const progress = getProgress();
      progress[select.dataset.practiceStatus] = select.value;
      saveProgress(progress);
    });
  }

  function setupCopyCode() {
    document.addEventListener('click', async event => {
      const button = event.target.closest('[data-code-id]');
      if (!button) return;
      const code = document.getElementById(button.dataset.codeId)?.textContent || '';
      try {
        await navigator.clipboard.writeText(code);
        button.textContent = '已复制';
        setTimeout(() => { button.textContent = '复制代码'; }, 1400);
      } catch {
        button.textContent = '请手动复制';
      }
    });
  }

  function renderLesson() {
    const id = new URLSearchParams(location.search).get('lesson');
    const lessons = sortedLessons();
    const lesson = lessons.find(item => item.id === id) || lessons[0];
    setCourseOutline(lesson?.id);
    const article = document.querySelector('[data-lesson]');
    if (!article) return;
    if (!lesson) {
      article.innerHTML = '<section class="dsa-empty"><strong>课程内容正在接入。</strong><br>请从数算目录稍后再试。</section>';
      return;
    }
    document.title = `${lesson.title} · 数算复习`;
    const position = lessons.indexOf(lesson);
    const previous = lessons[position - 1];
    const next = lessons[position + 1];
    article.innerHTML = `<header class="dsa-lesson-header"><p class="dsa-lesson-order">LESSON ${String(lesson.order).padStart(2, '0')}</p><h1>${escapeHtml(lesson.title)}</h1><p class="dsa-lesson-summary">${escapeHtml(lesson.summary || '')}</p>${lesson.prerequisites?.length ? `<div class="dsa-prerequisites">${lesson.prerequisites.map(item => `<span class="dsa-tag">前置：${escapeHtml(item)}</span>`).join('')}</div>` : ''}</header>
      ${knowledgeMarkup(lesson)}${templateMarkup(lesson)}${outlineCoverageMarkup(lesson)}
      <section class="dsa-section"><h2 id="types">题型与练习</h2><section class="dsa-controls"><label>课内搜索 <input type="search" data-lesson-search placeholder="搜索题号、题名或题型"></label><div class="dsa-filter-group" role="group" aria-label="练习难度筛选"><button type="button" class="is-active" data-level-filter="all">全部</button><button type="button" data-level-filter="基础">基础</button><button type="button" data-level-filter="巩固">巩固</button><button type="button" data-level-filter="提升">提升</button></div></section><p class="dsa-practice-empty" data-practice-empty hidden>没有匹配的练习；可清除课内搜索或切换难度筛选。</p><div class="dsa-type-list">${(lesson.types || []).map((type, index) => typeMarkup(lesson, type, index)).join('') || '<section class="dsa-empty">题型内容正在整理。</section>'}</div></section>
      <section class="dsa-section"><h2 id="review">复盘清单</h2><ul class="dsa-checklist">${(lesson.checklist || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>${sourceMarkup(lesson)}
      <nav class="dsa-navigation" aria-label="课程翻页"><a href="${previous ? lessonUrl(previous.id) : ''}">${previous ? `← ${escapeHtml(previous.title)}` : ''}</a><a href="${next ? lessonUrl(next.id) : ''}">${next ? `${escapeHtml(next.title)} →` : ''}</a></nav>`;
    setupPageOutline();
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupSidebar();
    setupPracticeStatus();
    setupCopyCode();
    if (view === 'lesson') renderLesson(); else renderCatalog();
    setupFilters();
  });
})();
