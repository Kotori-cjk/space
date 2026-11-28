import {
  IMAGE_STORE as IDB_STORE, LEGACY_SUBJECTS, SPACE_STATE_KEY as STORAGE_KEY, downloadBlob, isLocalSubject,
  openSpaceDatabase, openSubjectLibrary, readSubjectPack, resourceUrl, setupSubjectPages
} from './subjects.js?v=4';

const EMOJIS = ['✿','❀','🌸','⭐','💫','🎀','🦋','🌙'];
const CATEGORY_ICONS = { 数学:'📐', 物理:'⚛️', 计算机:'💻', AI:'🤖' };
const DEFAULT_SUBJECT_COLORS = new Map(LEGACY_SUBJECTS.map(({ id, color }) => [id, color]));
let subjectLibrary;
let subjectPages;
let renderedCatalog;
let renderedProjects;
const subjectById = id => subjectLibrary.subjects.find(subject => subject.id === id);

/* ===== IndexedDB Image Store (50MB+) ===== */
let idb = null;
let imageCache = {}; // key → dataURL, loaded on init

function idbPut(key, data) {
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(data, key);
    tx.oncomplete = resolve;
    tx.onerror = e => reject(e.target.error);
  });
}
function idbDel(key) {
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(key);
    tx.oncomplete = resolve;
    tx.onerror = e => reject(e.target.error);
  });
}
function idbGetAll() {
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const req = store.openCursor();
    const result = {};
    req.onsuccess = e => {
      const c = e.target.result;
      if (c) { result[c.key] = c.value; c.continue(); }
      else resolve(result);
    };
    req.onerror = e => reject(e.target.error);
  });
}

/* ===== State ===== */
let state = {
  currentView: 'math-ode',
  notes: {},
  tasks: [],
  subjectLinks: {},
  settings: {
    obsidianVault: 'Obsidian Vault',
    obsidianFolders: {},
    musicIds: [],
    backgrounds: [],
    currentBg: -1
  }
};
let editingTaskId = null;
let taskEditDraft = null;
let taskIndexMode = 'date';
let taskCalendarCollapsed = false;
let taskTodoOpen = true;
try {
  taskIndexMode = localStorage.getItem('kotori-task-index-mode') === 'category' ? 'category' : 'date';
  taskCalendarCollapsed = localStorage.getItem('kotori-task-calendar-collapsed') === 'true';
  taskTodoOpen = localStorage.getItem('kotori-task-todo-open') !== 'false';
} catch (_) {}
let taskCalendarMonth = today().slice(0, 7);
let taskSelectedDate = taskIndexMode === 'date' ? today() : '';
const TASK_REMINDER_WINDOW = 24 * 60 * 60 * 1000;
const TASK_REMINDER_KEY = 'kotori-task-reminders';
let taskRemindersChecking = false;

function save(options = {}) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateSaveStatus(true);
    if (options.sync !== false) window.spaceSync?.schedule();
  } catch(e) {
    console.warn('Save failed', e);
    updateSaveStatus(false);
    showToast('⚠ 保存失败：存储空间可能不足（' + Math.round(JSON.stringify(state).length/1024) + 'KB），建议导出备份');
  }
}
function updateSaveStatus(ok) {
  const el = document.getElementById('save-indicator');
  if (!el) return;
  const t = new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  el.textContent = ok ? `💾 已保存 ${t}` : '⚠ 保存失败';
  el.className = 'save-indicator ' + (ok ? 'ok' : 'err');
}
function showToast(msg) {
  const el = document.getElementById('save-toast');
  if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 5000);
}
function load() {
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    if (d) {
      const p = JSON.parse(d);
      state = {...state, ...p, settings:{...state.settings,...(p.settings||{})},
        subjectLinks:{...state.subjectLinks,...(p.subjectLinks||{})},
        notes:{...state.notes,...(p.notes||{})}};
      if (!state.tasks) state.tasks = [];
      if (state.currentView==='math') state.currentView='math-ode';
      if (state.currentView==='physics') state.currentView='physics-mech';
      const subjectMigrations = {
        math:'math-ode',
        physics:'physics-mech',
        'math-probability':'math-ode',
        'math-analysis':'math-ode',
        'math-linalg':'math-ode',
        'physics-elec':'physics-general',
        'cs':'cs-ics',
        'ai':'ai-cv'
      };
      Object.entries(subjectMigrations).forEach(([oldKey,newKey]) => {
        ['notes','subjectLinks'].forEach(field => {
          if (p[field]?.[oldKey] && !p[field]?.[newKey]) state[field][newKey] = p[field][oldKey];
        });
        if (p.settings?.obsidianFolders?.[oldKey] && !p.settings?.obsidianFolders?.[newKey]) {
          state.settings.obsidianFolders[newKey] = p.settings.obsidianFolders[oldKey];
        }
        if (state.currentView === oldKey) state.currentView = newKey;
      });
      ['notes','subjectLinks'].forEach(field => {
        if (state[field].math) { if(!state[field]['math-ode']) state[field]['math-ode']=state[field].math; delete state[field].math; }
        if (state[field].physics) { if(!state[field]['physics-mech']) state[field]['physics-mech']=state[field].physics; delete state[field].physics; }
      });
      const of = state.settings.obsidianFolders || {};
      if (of.math) { if(!of['math-ode']) of['math-ode']=of.math; delete of.math; }
      if (of.physics) { if(!of['physics-mech']) of['physics-mech']=of.physics; delete of.physics; }
      state.settings.obsidianFolders = of;
      normalizeTasks();
      return true;
    }
  } catch(e) { console.warn('Load failed',e); }
  return false;
}

function applySubjectCatalog() {
  for (const { id } of subjectLibrary.subjects) state.notes[id] ||= {};
  if (state.currentView !== 'tasks' && subjectById(state.currentView)?.archived !== false) {
    state.currentView = subjectLibrary.subjects.find(subject => !subject.archived)?.id || 'tasks';
  }
}

/* ===== Migrate old base64 data into IndexedDB ===== */
async function migrateImages() {
  let changed = false;
  // Backgrounds: move base64 → IndexedDB key
  for (let i = 0; i < state.settings.backgrounds.length; i++) {
    const val = state.settings.backgrounds[i];
    if (val && val.startsWith('data:')) {
      const key = 'bg_' + uid();
      await idbPut(key, val);
      imageCache[key] = val;
      state.settings.backgrounds[i] = key;
      changed = true;
    }
  }
  // Note images: replace inline data:image URLs with idb: references
  for (const subj of Object.keys(state.notes)) {
    for (const date of Object.keys(state.notes[subj] || {})) {
      for (const note of (state.notes[subj][date] || [])) {
        if (note.content && note.content.includes('](data:image')) {
          const re = /!\[([^\]]*)\]\((data:image[^)]+)\)/g;
          const replacements = [];
          let m;
          while ((m = re.exec(note.content)) !== null) {
            const key = 'note_' + uid();
            await idbPut(key, m[2]);
            imageCache[key] = m[2];
            replacements.push([m[0], `![${m[1]}](idb:${key})`]);
          }
          for (const [from, to] of replacements) {
            note.content = note.content.replace(from, to);
          }
          if (replacements.length) changed = true;
        }
      }
    }
  }
  if (changed) save();
}

/* ===== Utils ===== */
function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function now() { return new Date().toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}); }
function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
let saveTimer = null;
function debounceSave() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 500); }
let nextId = Date.now();
function uid() { return ''+(nextId++); }

function looksLikeMathBlock(content) {
  return /\\[a-zA-Z]+|[_^{}=+\-*/]|[∫∑√πηΔ]/.test(content);
}

function normalizeLatexBlocks(text) {
  return String(text).replace(/(^|\n)\s*\[\s*\n([\s\S]*?)\n\s*\]\s*(?=\n|$)/g, (match, prefix, body) => {
    const content = body.trim();
    if (!content || !looksLikeMathBlock(content)) return match;
    return `${prefix}$$\n${content}\n$$`;
  });
}

function protectDisplayMath(text) {
  const blocks = [];
  const protectedText = normalizeLatexBlocks(text).replace(/(^|\n)\s*\$\$\s*\n([\s\S]*?)\n\s*\$\$\s*(?=\n|$)/g, (match, prefix, body) => {
    const token = `KOTORI_MATH_BLOCK_${blocks.length}`;
    blocks.push({
      token,
      html: `<div class="math-block">$$\n${escHtml(body.trim())}\n$$</div>`
    });
    return `${prefix}${token}\n`;
  });
  return { text: protectedText, blocks };
}

function restoreDisplayMath(html, blocks) {
  return blocks.reduce((out, block) => {
    const wrapped = new RegExp(`<p>\\s*${block.token}\\s*</p>`, 'g');
    return out.replace(wrapped, block.html).replaceAll(block.token, block.html);
  }, html);
}

function renderMarkdown(text) {
  if (!text) return '';
  // Resolve idb: image references from cache
  text = text.replace(/\(idb:([^)]+)\)/g, (m, key) => '(' + (imageCache[key] || '#') + ')');
  const math = protectDisplayMath(text);
  if (typeof marked !== 'undefined') {
    marked.setOptions({breaks:true,gfm:true});
    return restoreDisplayMath(marked.parse(math.text), math.blocks);
  }
  return escHtml(text).replace(/\n/g,'<br>');
}

function renderLocalPage(target, text) {
  const template = document.createElement('template');
  template.innerHTML = renderMarkdown(text);
  const allowed = new Set('A BLOCKQUOTE BR CODE DD DEL DIV DL DT EM H1 H2 H3 H4 H5 H6 HR IMG INPUT LI OL P PRE S SPAN STRONG TABLE TBODY TD TH THEAD TR UL'.split(' '));
  for (const element of template.content.querySelectorAll('*')) {
    if (!allowed.has(element.tagName)) { element.remove(); continue; }
    const href = element.tagName === 'A' ? resourceUrl(element.getAttribute('href')) : '';
    const src = element.tagName === 'IMG' ? element.getAttribute('src') || '' : '';
    const alt = element.getAttribute('alt') || '';
    const math = element.classList.contains('math-block');
    const checkbox = element.tagName === 'INPUT' && element.type === 'checkbox';
    const checked = element.checked;
    for (const { name } of [...element.attributes]) element.removeAttribute(name);
    if (href) {
      element.href = href;
      element.target = '_blank';
      element.rel = 'noreferrer';
    }
    if (element.tagName === 'IMG') {
      if (!/^data:image\/(png|jpeg|gif|webp|avif);base64,[\w+/=]+$/i.test(src)) { element.replaceWith(alt); continue; }
      element.src = src;
      element.alt = alt;
    }
    if (element.tagName === 'INPUT') {
      if (!checkbox) { element.remove(); continue; }
      element.type = 'checkbox';
      element.checked = checked;
      element.disabled = true;
    }
    if (math) element.className = 'math-block';
  }
  target.replaceChildren(template.content);
  renderLatex(target);
}
function renderLatex(root) {
  if (!root) return;
  if (typeof renderMathInElement !== 'undefined') {
    renderMathInElement(root, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false }
      ],
      ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
      throwOnError: false
    });
  }
  renderLooseLatex(root);
}

function looksLikeLooseLatex(s) {
  const text = String(s || '').trim();
  if (!text || /[\u4e00-\u9fff]/.test(text)) return false;
  return /\\[a-zA-Z]+/.test(text) || /[A-Za-z]\s*_\s*\{[^}]+\}/.test(text) || /\^\s*\{[^}]+\}/.test(text);
}

function normalizeLooseLatexExpr(expr) {
  let text = String(expr || '').trim();
  while (text.endsWith(')')) {
    const opens = (text.match(/\(/g) || []).length;
    const closes = (text.match(/\)/g) || []).length;
    if (closes <= opens) break;
    text = text.slice(0, -1).trim();
  }
  return text;
}

function renderLatexFragment(expr) {
  expr = normalizeLooseLatexExpr(expr);
  if (typeof katex === 'undefined' || !looksLikeLooseLatex(expr)) return null;
  try {
    return katex.renderToString(expr, { throwOnError:false, displayMode:false });
  } catch(e) {
    return null;
  }
}

function replaceLooseLatexInText(text) {
  const source = String(text || '');
  if (!/[\\_^]/.test(source)) return null;
  const parts = [];
  let cursor = 0;
  const pushReplacement = (start, end, expr) => {
    if (start < cursor) return false;
    const html = renderLatexFragment(expr);
    if (!html) return false;
    if (start > cursor) parts.push(document.createTextNode(source.slice(cursor, start)));
    const span = document.createElement('span');
    span.className = 'loose-latex';
    span.innerHTML = html;
    parts.push(span);
    cursor = end;
    return true;
  };

  const patterns = [
    /[（(]([^，。；！？\n|]{2,220})[）)]/g,
    /\\[a-zA-Z]+[^\u4e00-\u9fff，。；！？\n|]{1,220}/g,
    /[A-Za-z]\s*_\s*\{[^}]+\}(?:\s*[-+=]\s*[^\u4e00-\u9fff，。；！？\n|]+)?/g
  ];

  const matches = [];
  patterns.forEach(re => {
    let m;
    while ((m = re.exec(source)) !== null) {
      const raw = m[0];
      const inner = m[1] || raw;
      const expr = m[1] ? raw : inner;
      if (looksLikeLooseLatex(inner)) matches.push({ start:m.index, end:m.index + raw.length, expr });
    }
  });
  matches.sort((a,b) => a.start - b.start || b.end - a.end);
  matches.forEach(m => pushReplacement(m.start, m.end, m.expr));
  if (!parts.length) return null;
  if (cursor < source.length) parts.push(document.createTextNode(source.slice(cursor)));
  return parts;
}

function renderLooseLatex(root) {
  if (typeof katex === 'undefined') return;
  const ignored = new Set(['SCRIPT','NOSCRIPT','STYLE','TEXTAREA','PRE','CODE']);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ignored.has(parent.tagName) || parent.closest('.katex, .katex-display')) {
        return NodeFilter.FILTER_REJECT;
      }
      return /[\\_^]/.test(node.nodeValue || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const replacements = replaceLooseLatexInText(node.nodeValue);
    if (!replacements) return;
    const frag = document.createDocumentFragment();
    replacements.forEach(part => frag.appendChild(part));
    node.parentNode.replaceChild(frag, node);
  });
}
function compressImage(file, maxW, q) {
  maxW=maxW||800; q=q||0.7;
  return new Promise(r => {
    const reader = new FileReader();
    reader.onload = e => { const img = new Image(); img.onload = () => {
      const c = document.createElement('canvas'); let w=img.width, h=img.height;
      if(w>maxW){h=h*maxW/w;w=maxW;} c.width=w;c.height=h;
      c.getContext('2d').drawImage(img,0,0,w,h); r(c.toDataURL('image/jpeg',q));
    }; img.src=e.target.result; }; reader.readAsDataURL(file);
  });
}
async function saveImageToIDB(dataUrl, prefix = 'img_') {
  const key = prefix + uid();
  await idbPut(key, dataUrl);
  imageCache[key] = dataUrl;
  return key;
}
function insertImageAtCursor(ta, ref) {
  const pos = ta.selectionStart||ta.value.length;
  const before = ta.value.substring(0,pos), after = ta.value.substring(ta.selectionEnd||pos);
  ta.value = before + (before.endsWith('\n')||!before?'':'\n') + `![image](${ref})\n` + after;
  ta.dispatchEvent(new Event('input',{bubbles:true}));
}

function attachmentImageKeys(tasks, notesBySubject) {
  const keys = new Set();
  const collect = item => {
    (item?.stickers || []).forEach(key => keys.add(key));
    const matches = String(item?.content || '').matchAll(/\(idb:([^)]+)\)/g);
    for (const match of matches) keys.add(match[1]);
  };
  tasks.forEach(collect);
  Object.values(notesBySubject).forEach(days => {
    Object.values(days || {}).forEach(notes => notes.forEach(collect));
  });
  return keys;
}
function stickerKeys(editor) {
  try { return JSON.parse(editor?.dataset.stickers || '[]'); }
  catch { return []; }
}
function renderStickerStrip(keys=[]) {
  if (!keys.length) return '';
  return `<div class="sticker-strip">${keys.map(key => {
    const src = imageCache[key];
    return src ? `<img src="${src}" alt="贴图">` : '';
  }).join('')}</div>`;
}
function renderStickerPicker(id, keys=[]) {
  return `<div class="sticker-editor" data-stickers='${JSON.stringify(keys)}' tabindex="0" title="点击后可直接粘贴剪贴板图片">
    <label class="note-tool-btn">🖼 贴图<input class="sticker-input" type="file" accept="image/*" multiple id="${id}"></label>
    <span class="sticker-paste-hint">点击此处后 Ctrl+V 粘贴</span>
    <div class="sticker-preview">${keys.map(key => {
      const src = imageCache[key];
      return src ? `<span><img src="${src}" alt="贴图"><button type="button" data-sticker-remove="${key}" aria-label="移除贴图">✕</button></span>` : '';
    }).join('')}</div>
  </div>`;
}
function updateStickerPicker(editor, keys) {
  if (!editor) return;
  editor.dataset.stickers = JSON.stringify(keys);
  const preview = editor.querySelector('.sticker-preview');
  if (preview) preview.innerHTML = keys.map(key => {
    const src = imageCache[key];
    return src ? `<span><img src="${src}" alt="贴图"><button type="button" data-sticker-remove="${key}" aria-label="移除贴图">✕</button></span>` : '';
  }).join('');
}
async function addStickerFiles(editor, files) {
  const imageFiles = Array.from(files || []).filter(file => file.type.startsWith('image/'));
  if (!editor || !imageFiles.length) return;
  const keys = await Promise.all(imageFiles.map(async file => saveImageToIDB(await compressImage(file, 480, 0.75))));
  updateStickerPicker(editor, [...stickerKeys(editor), ...keys]);
}
function pasteStickerImage(e) {
  const editor = e.target.closest?.('.sticker-editor');
  const items = e.clipboardData?.items;
  const files = items ? Array.from(items).filter(item => item.type.startsWith('image/')).map(item => item.getAsFile()) : [];
  if (!editor || !files.length) return false;
  e.preventDefault();
  addStickerFiles(editor, files);
  return true;
}

function setupImageLightbox() {
  const lightbox = document.createElement('div');
  lightbox.id = 'image-lightbox';
  lightbox.className = 'image-lightbox';
  lightbox.hidden = true;
  lightbox.innerHTML = '<div class="image-lightbox-toolbar"><button type="button" data-image-zoom="out" aria-label="缩小图片">－</button><button type="button" data-image-zoom="reset" aria-label="适应窗口">适应</button><button type="button" data-image-zoom="in" aria-label="放大图片">＋</button><button type="button" class="image-lightbox-close" aria-label="关闭原图预览">✕</button></div><div class="image-lightbox-stage"><img alt="贴图原图"></div>';
  document.body.append(lightbox);
  const image = lightbox.querySelector('img');
  let scale = 1;
  const fit = () => Math.min(1, (innerWidth - 96) / image.naturalWidth, (innerHeight - 120) / image.naturalHeight);
  const renderZoom = () => { image.style.width = `${Math.round(image.naturalWidth * scale)}px`; };
  const reset = () => { scale = fit(); renderZoom(); };
  const close = () => { lightbox.hidden = true; image.removeAttribute('src'); image.removeAttribute('style'); };
  document.addEventListener('click', e => {
    const source = e.target.closest?.('.sticker-preview img, .sticker-strip img');
    if (source) {
      image.src = source.currentSrc || source.src;
      image.alt = source.alt || '贴图原图';
      lightbox.hidden = false;
      return;
    }
    const zoom = e.target.closest?.('[data-image-zoom]')?.dataset.imageZoom;
    if (zoom && image.complete) {
      scale = zoom === 'in' ? Math.min(scale * 1.25, 4) : zoom === 'out' ? Math.max(scale / 1.25, fit()) : fit();
      renderZoom();
      return;
    }
    if (e.target === lightbox || e.target.closest?.('.image-lightbox-close')) close();
  });
  image.addEventListener('load', reset);
  lightbox.addEventListener('wheel', e => {
    if (lightbox.hidden || !image.complete) return;
    e.preventDefault();
    scale = e.deltaY < 0 ? Math.min(scale * 1.15, 4) : Math.max(scale / 1.15, fit());
    renderZoom();
  }, { passive:false });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !lightbox.hidden) close(); });
}

/* ===== Particles ===== */
function initParticles() {
  const c = document.getElementById('particles');
  for (let i=0;i<12;i++) {
    const p = document.createElement('span'); p.className='particle';
    p.textContent = EMOJIS[Math.floor(Math.random()*EMOJIS.length)];
    p.style.left = Math.random()*100+'%';
    p.style.animationDelay = Math.random()*6+'s';
    p.style.animationDuration = (5+Math.random()*4)+'s';
    c.appendChild(p);
  }
}

/* ===== Render ===== */
function renderAll() {
  const main = document.getElementById('main-content');
  const enteringRoom = main.dataset.room !== state.currentView;
  main.dataset.room = state.currentView;
  renderSubjectNav();
  renderTaskSummary();
  if (state.currentView === 'tasks') { renderTaskView(); }
  else { renderSubjectView(state.currentView); }
  if (enteringRoom) main.dispatchEvent(new Event('seika:room-change'));
}

function renderSubjectNav() {
  const nav = document.getElementById('subject-nav');
  if (renderedCatalog !== subjectLibrary.subjects) {
    const groups = [];
    for (const subject of subjectLibrary.subjects) {
      if (subject.archived) continue;
      if (groups.at(-1)?.category !== subject.category) groups.push({ category:subject.category, cards:[] });
      const url = resourceUrl(subject.url);
      const attributes = `class="subject-btn subject-card${subject.category ? ' sub' : ''}" data-subject="${subject.id}"`;
      const label = `<span class="seika-door-icon" aria-hidden="true"></span>${escHtml(subject.name)}`;
      groups.at(-1).cards.push(url
        ? `<a ${attributes} href="${escHtml(url)}">${label} ↗</a>`
        : `<button ${attributes} type="button">${label}</button>`);
    }
    const cards = groups.map(({ category, cards }) => {
      if (!category) return cards.join('');
      const icon = Object.hasOwn(CATEGORY_ICONS, category) ? CATEGORY_ICONS[category] + ' ' : '';
      return `<div class="subject-group"><div class="subject-group-header">${icon}${escHtml(category)}</div>${cards.join('')}</div>`;
    }).join('');
    for (const previous of nav.querySelectorAll('.subject-group, .subject-card')) previous.remove();
    nav.insertAdjacentHTML('afterbegin', cards);
    renderedCatalog = subjectLibrary.subjects;
  }
  const { projectLinks } = subjectLibrary;
  if (renderedProjects !== projectLinks) {
    for (const link of nav.querySelectorAll('[data-default-project]')) link.hidden = projectLinks !== null;
    for (const link of nav.querySelectorAll('.custom-project-link')) link.remove();
    for (const link of projectLinks || []) {
      nav.insertAdjacentHTML('beforeend', `<a class="subject-btn subject-link custom-project-link${link.localOnly ? ' private-only' : ''}"
        href="${escHtml(resourceUrl(link.url))}"><span class="seika-door-icon" aria-hidden="true"></span>${escHtml(link.title)} ↗</a>`);
    }
    renderedProjects = projectLinks;
  }
  document.querySelectorAll('.subject-btn[data-subject]').forEach(btn => {
    const active = btn.dataset.subject === state.currentView;
    btn.classList.toggle('active', active);
    if (active) btn.setAttribute('aria-current', 'true');
    else btn.removeAttribute('aria-current');
  });
}

function renderTaskSummary() {
  const todayStr = today();
  const pending = state.tasks.filter(t => !t.done && t.date === todayStr).length;
  document.getElementById('task-count').textContent = pending ? `${pending} 项待办` : '今日无待办';
}

/* ===== Subject View ===== */
function renderSubjectView(subj) {
  const s = subjectById(subj);
  if (!s) return;
  const sh = document.getElementById('subject-header');
  const vault = encodeURIComponent(state.settings.obsidianVault);
  const folder = state.settings.obsidianFolders[subj];
  const nlm = resourceUrl(state.subjectLinks[subj]?.notebookLM);

  sh.className = 'subject-header ' + subj;
  if (s.color === DEFAULT_SUBJECT_COLORS.get(subj)) delete sh.dataset.color;
  else sh.dataset.color = s.color;
  sh.innerHTML = `${s.category ? `<span class="subject-room-category">${escHtml(s.category)}</span>` : ''}
    <h2>${escHtml(s.name)}</h2>
    ${s.description ? `<p class="subject-description">${escHtml(s.description)}</p>` : ''}
    <div class="subject-links">
      ${folder ? `<a class="link-obsidian" href="obsidian://open?vault=${vault}&file=${encodeURIComponent(folder)}" title="打开Obsidian">📒 Obsidian</a>` : ''}
      ${nlm ? `<a class="link-nlm" href="${escHtml(nlm)}" target="_blank" rel="noreferrer" title="NotebookLM">📓 NotebookLM</a>` : ''}
    </div>`;
  sh.style.display = '';

  document.getElementById('view-notes').classList.add('active');
  document.getElementById('view-tasks').classList.remove('active');
  subjectPages.render(s);
  renderNotes(subj);
}

function renderNotes(subj) {
  const el = document.getElementById('view-notes');
  const notes = state.notes[subj] || {};
  const todayStr = today();
  const dates = Object.keys(notes).sort().reverse();

  let totalNotes = 0;
  dates.forEach(d => { totalNotes += (notes[d]||[]).length; });

  let html = `<div class="note-input-area">
    <h4>📝 写笔记</h4>
    <input type="text" id="note-title-input" class="note-title-input" placeholder="标题（知识点名称）...">
    <div class="note-toolbar">
      <button class="note-tool-btn" id="note-preview-btn">👁 预览</button>
      <label class="note-tool-btn">📷 插入正文图<input type="file" accept="image/*" id="note-img-input"></label>
      ${renderStickerPicker('note-sticker-input')}
    </div>
    <textarea id="note-textarea" placeholder="支持 Markdown 语法，可直接粘贴图片..."></textarea>
    <div class="note-preview" id="note-preview" style="display:none"></div>
    <div class="note-input-row">
      <button class="btn btn-primary btn-sm" id="note-submit-btn">发布笔记</button>
      <button class="btn btn-secondary btn-sm" id="note-cancel-edit-btn" hidden>取消编辑</button>
    </div>
  </div>`;

  if (totalNotes > 0) {
    html += `<div class="catalog-card">
      <div class="catalog-header" id="catalog-toggle">
        <h4>📑 笔记目录 (${totalNotes})</h4>
        <span class="catalog-caret">▼</span>
      </div>
      <div class="catalog-body" id="catalog-body">
        <input type="text" class="catalog-search" id="catalog-search" placeholder="搜索标题...">`;
    dates.forEach(date => {
      const dayNotes = notes[date] || [];
      if (!dayNotes.length) return;
      const label = date===todayStr ? `今天 (${date})` : date;
      html += `<div class="catalog-date-group"><div class="catalog-date-label">📅 ${label}</div>`;
      dayNotes.slice().reverse().forEach(n => {
        const t = n.title || n.content?.substring(0,20) || '无标题';
        html += `<a class="catalog-entry" data-scroll-to="${n.id}">→ ${escHtml(t)}</a>`;
      });
      html += `</div>`;
    });
    html += `</div></div>`;
  }

  if (!totalNotes) {
    html += `<div class="task-empty"><div class="big-icon">📝</div><p>还没有笔记，写下你的第一条吧~</p></div>`;
  }
  dates.forEach(date => {
    const dayNotes = notes[date];
    if (!dayNotes || !dayNotes.length) return;
    const label = date===todayStr ? `📅 今天 (${date})` : `📅 ${date}`;
    html += `<div class="note-date-group"><div class="note-date-label">${label}</div>`;
    dayNotes.slice().reverse().forEach((n,i) => {
      const realIdx = dayNotes.length - 1 - i;
      html += `<div class="note-card${n.collapsed ? ' collapsed' : ''}" id="note-anchor-${n.id}">
        <div class="note-card-head">
          <div>
            ${n.title ? `<div class="note-title-heading">${escHtml(n.title)}</div>` : ''}
            <div class="note-time">${n.time}${n.updatedAt ? ` · 更新于 ${n.updatedAt}` : ''}</div>
          </div>
          <div class="note-card-actions">
            <button class="note-fold" data-note-edit='${JSON.stringify({subj,date,idx:realIdx})}'>编辑</button>
            <button class="note-fold" data-note-fold='${JSON.stringify({subj,date,idx:realIdx})}'>${n.collapsed ? '展开' : '折叠'}</button>
          </div>
        </div>
        <div class="note-body">${renderMarkdown(n.content)}${renderStickerStrip(n.stickers)}</div>
        <button class="note-delete" data-note-del='${JSON.stringify({subj,date,idx:realIdx})}'>✕</button>
      </div>`;
    });
    html += `</div>`;
  });

  el.innerHTML = html;
  renderLatex(el);
}

/* ===== Task View ===== */
function taskSubjectOptions(selected='') {
  return `<option value="">通用</option>` + subjectLibrary.subjects.filter(subject => !subject.archived || subject.id === selected).map(subject => {
    const label = [subject.category, subject.name].filter(Boolean).join(' · ');
    return `<option value="${subject.id}"${selected===subject.id?' selected':''}>${escHtml(subject.icon)} ${escHtml(label)}${subject.archived ? '（已归档）' : ''}</option>`;
  }).join('');
}

function taskTagClass(subject) {
  if (subject?.startsWith('math-')) return 'task-tag-math';
  if (subject?.startsWith('physics-')) return 'task-tag-physics';
  if (subject?.startsWith('cs-')) return 'task-tag-cs';
  if (subject?.startsWith('ai-') || subject === 'research') return 'task-tag-ai';
  return 'task-tag-general';
}

function normalizeTasks() {
  const subjects = { math:'math-ode', 'math-probability':'math-ode', 'math-analysis':'math-ode', physics:'physics-mech', cs:'cs-ics', ai:'ai-cv' };
  state.tasks.forEach(task => {
    if (!task.id) task.id = uid();
    if (Object.hasOwn(subjects, task.subject)) task.subject = subjects[task.subject];
    task.steps = (Array.isArray(task.steps) ? task.steps : []).filter(Boolean).map(step => typeof step === 'string'
      ? { id:uid(), text:step, done:false, ddl:'' }
      : { id:step.id || uid(), text:step.text || '', done:!!step.done, ddl:step.ddl || '' });
    task.ddl = task.ddl || '';
    if (task.steps.length && task.steps.every(step => step.done)) task.done = true;
  });
}

function parseTaskStepLine(line) {
  const match = line.match(/^(.*?)\s+@\s*(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}))?$/);
  const text = (match ? match[1] : line).trim();
  const ddl = match ? `${match[2]}T${match[3] || '23:59'}` : '';
  return { id:uid(), text, done:false, ddl };
}

function dueTaskDeadlines(task, time) {
  if (task.done) return [];
  const deadlines = new Map();
  if (task.ddl) deadlines.set(task.ddl, '');
  task.steps.forEach(step => {
    if (!step.done && step.ddl && !deadlines.has(step.ddl)) deadlines.set(step.ddl, step.text);
  });
  return [...deadlines].map(([ddl, step]) => ({ ddl, step, time:Date.parse(ddl) }))
    .filter(deadline => deadline.time >= time && deadline.time <= time + TASK_REMINDER_WINDOW)
    .sort((a, b) => a.time - b.time);
}

async function checkTaskReminders() {
  if (window.Notification?.permission !== 'granted' || taskRemindersChecking) return;
  taskRemindersChecking = true;
  try {
    const notify = async () => {
      const time = Date.now();
      const sent = JSON.parse(localStorage.getItem(TASK_REMINDER_KEY) || '{}');
      const remaining = Object.fromEntries(Object.entries(sent).filter(([, deadline]) => deadline >= time));
      const reminders = state.tasks.flatMap(task => dueTaskDeadlines(task, time).map(deadline => ({
        key:JSON.stringify([task.id, deadline.ddl]), task, deadline
      }))).filter(reminder => !remaining[reminder.key]);
      if (!reminders.length) return;
      let registration;
      if (navigator.serviceWorker) {
        await navigator.serviceWorker.register('./task-notification-sw.js');
        registration = await navigator.serviceWorker.ready;
      }
      for (const { key, task, deadline } of reminders) {
        if (!state.tasks.includes(task) || !dueTaskDeadlines(task, Date.now()).some(item => item.ddl === deadline.ddl)) continue;
        const options = {
          body:`${deadline.step ? `${deadline.step} · ` : ''}截止于 ${new Date(deadline.time).toLocaleString('zh-CN', { hour12:false })}`,
          tag:key
        };
        if (registration) await registration.showNotification(task.title, options);
        else new Notification(task.title, options);
        remaining[key] = deadline.time;
        localStorage.setItem(TASK_REMINDER_KEY, JSON.stringify(remaining));
      }
    };
    if (navigator.locks) await navigator.locks.request(TASK_REMINDER_KEY, notify);
    else await notify();
  } catch (error) { console.warn('Task reminder failed', error); }
  finally { taskRemindersChecking = false; }
}

function ddlBadge(ddl, done=false) {
  if (!ddl) return '';
  const deadline = new Date(ddl);
  if (Number.isNaN(deadline.getTime())) return '';
  const diff = deadline.getTime() - Date.now();
  let status = '';
  if (!done && diff < 0) status = ' overdue';
  else if (!done && diff <= TASK_REMINDER_WINDOW) status = ' soon';
  const label = deadline.toLocaleString('zh-CN', {month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
  return `<span class="task-ddl${status}" title="截止时间 ${escHtml(deadline.toLocaleString('zh-CN'))}">⏰ ${escHtml(label)}</span>`;
}

function taskStepEditRow(step={ id:'', text:'', done:false, ddl:'' }) {
  return `<div class="task-edit-step" data-step-id="${escHtml(step.id || uid())}" data-done="${step.done?'true':'false'}">
    <button type="button" class="task-step-check${step.done?' checked':''}" data-edit-step-toggle aria-label="切换子步骤状态">${step.done?'✓':''}</button>
    <input type="text" class="task-edit-step-input" value="${escHtml(step.text)}" placeholder="子步骤内容">
    <input type="datetime-local" class="task-edit-step-ddl" value="${escHtml(step.ddl || '')}" aria-label="子步骤 DDL，留空继承主任务" title="留空继承主任务 DDL">
    <button type="button" class="task-step-remove" data-edit-step-remove aria-label="删除子步骤">✕</button>
  </div>`;
}

function taskGroups() {
  const groups = new Map();
  state.tasks.forEach((task, index) => {
    if (taskSelectedDate && task.date !== taskSelectedDate) return;
    const key = taskIndexMode === 'date' ? task.date : (subjectById(task.subject) ? task.subject : 'general');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ ...task, _idx:index });
  });
  const keys = taskIndexMode === 'date'
    ? [...groups.keys()].sort().reverse()
    : [...subjectLibrary.subjects.map(subject => subject.id), 'general'].filter(key => groups.has(key));
  return keys.map(key => ({
    key,
    label:taskIndexMode === 'date' ? (key === today() ? `今天 (${key})` : key) : (subjectById(key) ? `${subjectById(key).icon} ${subjectById(key).name}` : '📋 通用'),
    tasks:groups.get(key)
  }));
}

function renderTaskCalendar() {
  const [year, month] = taskCalendarMonth.split('-').map(Number);
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const days = new Date(year, month, 0).getDate();
  const byDate = new Map();
  state.tasks.forEach(task => {
    if (!byDate.has(task.date)) byDate.set(task.date, []);
    byDate.get(task.date).push(task);
  });
  let cells = '<span class="task-calendar-blank" aria-hidden="true"></span>'.repeat(firstWeekday);
  let total = 0, completed = 0;
  for (let day = 1; day <= days; day++) {
    const date = `${taskCalendarMonth}-${String(day).padStart(2, '0')}`;
    const tasks = byDate.get(date) || [];
    const done = tasks.filter(task => task.done).length;
    const rate = tasks.length ? Math.round(done / tasks.length * 100) : 0;
    const level = tasks.length ? (done === tasks.length ? 4 : (done ? Math.ceil(done / tasks.length * 3) : 0)) : 'empty';
    const label = `${date}，${tasks.length ? `已完成 ${done}/${tasks.length} 项任务，完成率 ${rate}%` : '无任务'}`;
    total += tasks.length;
    completed += done;
    const isToday = date === today();
    cells += `<button type="button" class="task-calendar-day${isToday ? ' is-today' : ''}${date === taskSelectedDate ? ' is-selected' : ''}" data-task-calendar-date="${date}" data-level="${level}" title="${label}${isToday ? '，今天' : ''}" aria-label="${label}${isToday ? '，今天' : ''}" aria-pressed="${date === taskSelectedDate}"${isToday ? ' aria-current="date"' : ''}><span>${day}</span>${isToday ? '<small>今天</small>' : ''}</button>`;
  }
  return `<section class="task-calendar" aria-label="任务完成日历">
    <div class="task-calendar-heading"><h4>完成日历</h4><button type="button" class="task-calendar-today" data-task-calendar-today>回到今天</button></div>
    <p class="task-calendar-current">今天 · ${today()}</p>
    <div class="task-calendar-controls">
      <button type="button" data-task-month-shift="-1" aria-label="上个月">‹</button>
      <label><span class="sr-only">查询月份</span><input type="month" id="task-calendar-month" min="0100-01" max="9999-12" value="${taskCalendarMonth}"></label>
      <button type="button" data-task-month-shift="1" aria-label="下个月">›</button>
    </div>
    <p class="task-calendar-summary">本月完成 ${completed} / ${total} 项任务</p>
    <div class="task-calendar-weekdays" aria-hidden="true">${['一','二','三','四','五','六','日'].map(day => `<span>${day}</span>`).join('')}</div>
    <div class="task-calendar-grid">${cells}</div>
    <div class="task-calendar-legend"><span>无任务 <i data-level="empty"></i></span><span>0% <i data-level="0"></i><i data-level="1"></i><i data-level="2"></i><i data-level="3"></i><i data-level="4"></i> 100%</span></div>
    <p class="task-calendar-hint">点击日期查询。把任务的拖动手柄拖到日期上即可改期。</p>
  </section>`;
}

function updateTaskCalendarVisibility() {
  document.getElementById('task-browser-sidebar-body').hidden = taskCalendarCollapsed;
  document.querySelector('.task-browser').classList.toggle('is-calendar-collapsed', taskCalendarCollapsed);
  const button = document.querySelector('[data-task-calendar-toggle]');
  button.setAttribute('aria-expanded', String(!taskCalendarCollapsed));
  button.setAttribute('aria-label', taskCalendarCollapsed ? '展开日历栏' : '收起日历栏');
  button.title = button.getAttribute('aria-label');
  button.textContent = taskCalendarCollapsed ? '▦' : '‹';
}

function renderTaskTodo(refreshChoices = false) {
  const panel = document.getElementById('task-todo');
  if (!panel) return;
  const time = Date.now();
  const pending = state.tasks.filter(task => !task.done);
  const entries = pending.map(task => ({ task, deadline:dueTaskDeadlines(task, time)[0] }))
    .filter(({ task, deadline }) => task.inTodo || deadline)
    .sort((a, b) => (a.deadline?.time ?? Infinity) - (b.deadline?.time ?? Infinity));
  panel.querySelector('.task-todo-count').textContent = `${entries.length} 项`;
  const list = panel.querySelector('.task-todo-list');
  const html = entries.length ? `<ul>${entries.map(({ task, deadline }) => `<li>
    <button type="button" class="task-todo-link" data-task-todo-open="${escHtml(task.id)}">${escHtml(task.title)}</button>
    ${deadline ? ddlBadge(deadline.ddl) : ''}
    ${task.inTodo ? `<button type="button" class="btn btn-secondary btn-sm" data-task-todo-remove="${escHtml(task.id)}" aria-label="将 ${escHtml(task.title)} 移出手动待办">移出</button>` : ''}
  </li>`).join('')}</ul>` : '<p class="task-calendar-hint">暂无待办</p>';
  if (list.innerHTML !== html) list.innerHTML = html;
  if (refreshChoices) {
    const select = document.getElementById('task-todo-select');
    const previous = select.value;
    const choices = pending.filter(task => !task.inTodo);
    select.innerHTML = '<option value="">选择已有任务</option>' + choices.map(task =>
      `<option value="${escHtml(task.id)}">${escHtml(task.title)} · ${escHtml(task.date)}</option>`).join('');
    if (choices.some(task => String(task.id) === previous)) select.value = previous;
    select.disabled = !choices.length;
    panel.querySelector('[data-task-todo-pin]').disabled = !choices.length;
  }
}

function updateTaskNotificationControl() {
  const button = document.querySelector('[data-task-notification-enable]');
  if (!button) return;
  const permission = window.Notification?.permission;
  button.disabled = permission !== 'default';
  button.textContent = {
    default:'启用截止提醒', granted:'已启用截止提醒', denied:'通知已被浏览器阻止'
  }[permission] || '此浏览器无法启用通知';
}

function saveTaskChanges() {
  save();
  renderTaskSummary();
  refreshTaskBrowser();
  void checkTaskReminders();
}

function moveTaskToDate(task, date) {
  if (!task || task.date === date) return;
  const time = Date.now();
  const ddl = `${date}T23:59`;
  if (Date.parse(task.ddl) < time) task.ddl = ddl;
  task.steps.forEach(step => {
    if (Date.parse(step.ddl) < time) step.ddl = ddl;
  });
  task.date = date;
  taskSelectedDate = date;
  taskCalendarMonth = date.slice(0, 7);
  saveTaskChanges();
  showToast(`已移动至 ${date}`);
}

function refreshTaskBrowser() {
  if (editingTaskId) taskEditDraft = document.querySelector('.task-card-edit') || taskEditDraft;
  else taskEditDraft = null;
  const groups = taskGroups();
  document.getElementById('task-browser-sidebar-body').innerHTML = `<nav class="task-index-panel" aria-label="任务索引">
    <div class="task-index-tabs" role="group" aria-label="索引方式">
      <button type="button" data-task-index-mode="date" aria-pressed="${taskIndexMode === 'date'}">日期索引</button>
      <button type="button" data-task-index-mode="category" aria-pressed="${taskIndexMode === 'category'}">任务索引</button>
    </div>
    ${taskIndexMode === 'category' ? `<div class="task-index-entries">${groups.length ? groups.map(group => {
      const pending = group.tasks.filter(task => !task.done).length;
      return `<button type="button" class="task-index-entry" data-task-group-scroll="${escHtml(group.key)}"><span>${escHtml(group.label)}</span><small>${pending ? `${pending} 未完成 / ${group.tasks.length}` : `${group.tasks.length} 项已完成`}</small></button>`;
    }).join('') : '<p class="empty-hint">暂无任务</p>'}</div>` : ''}
  </nav>${renderTaskCalendar()}`;
  document.getElementById('task-list-heading').innerHTML = `<h4>${taskSelectedDate ? `${taskSelectedDate} 的任务` : '全部任务'}<span>${groups.reduce((sum, group) => sum + group.tasks.length, 0)} 项</span></h4>${taskSelectedDate ? '<button type="button" class="btn btn-secondary btn-sm" data-task-clear-date>查看全部</button>' : ''}`;
  renderTaskGroups(groups);
  renderTaskTodo(true);
}

function renderTaskView() {
  taskEditDraft = null;
  document.getElementById('subject-header').style.display = 'none';
  subjectPages.render(null);
  document.getElementById('view-notes').classList.remove('active');
  document.getElementById('view-tasks').classList.add('active');

  const el = document.getElementById('view-tasks');

  let html = `<header class="task-workspace-heading"><h2>每日任务</h2></header>
  <div class="task-browser">
    <aside id="task-browser-sidebar" class="task-browser-sidebar" aria-label="任务日期与索引">
      <div class="task-calendar-sidebar-heading">
        <h3>日历与索引</h3>
        <button type="button" class="task-calendar-fold" data-task-calendar-toggle aria-controls="task-browser-sidebar-body"></button>
      </div>
      <div id="task-browser-sidebar-body" class="task-browser-sidebar-body"></div>
    </aside>
    <section class="task-browser-content" aria-label="任务列表">
  <details class="task-todo" id="task-todo"${taskTodoOpen ? ' open' : ''}>
    <summary>待办 <span class="task-todo-count"></span></summary>
    <div class="task-todo-tools">
      <select id="task-todo-select" aria-label="加入待办的已有任务"></select>
      <button type="button" class="btn btn-secondary btn-sm" data-task-todo-pin>加入</button>
      <button type="button" class="btn btn-secondary btn-sm" data-task-todo-new>新建待办</button>
      <button type="button" class="btn btn-secondary btn-sm" data-task-notification-enable></button>
    </div>
    <p class="task-calendar-hint">距截止时间不到 24 小时的未完成任务会自动加入。</p>
    <div class="task-todo-list"></div>
  </details>
  <details class="task-composer"><summary>＋ 添加任务</summary><div class="task-input-area">
    <div class="task-form">
      <input type="text" id="task-title-input" placeholder="任务标题">
      <textarea id="task-detail-input" placeholder="详情 (选填)"></textarea>
      <label class="task-field-label" for="task-ddl-input">⏰ 主任务 DDL</label>
      <input type="datetime-local" id="task-ddl-input">
      <textarea id="task-steps-input" class="task-steps-input" placeholder="子步骤（选填，每行一个）\n可单独指定：整理例题 @ 2026-07-20 23:00"></textarea>
      <p class="task-form-hint">子步骤默认继承主任务 DDL，也可单独指定。</p>
      ${renderStickerPicker('task-sticker-input')}
      <div class="task-form-bottom">
        <select id="task-subject-select">
          ${taskSubjectOptions()}
        </select>
        <label class="task-todo-checkbox"><input type="checkbox" id="task-add-todo"> 加入待办</label>
        <button class="btn btn-orange btn-sm" id="task-add-btn">添加</button>
      </div>
    </div>
  </div></details>`;

  html += `<div id="task-list-heading" class="task-list-heading"></div><div id="task-list"></div></section></div>
  <dialog class="task-move-dialog" id="task-move-dialog" aria-labelledby="task-move-title">
    <form id="task-move-form">
      <h4 id="task-move-title">移动任务</h4>
      <label for="task-move-date">目标日期</label>
      <input id="task-move-date" type="date" min="0100-01-01" max="9999-12-31" required>
      <div class="task-edit-actions">
        <button type="button" class="btn btn-secondary btn-sm" data-task-move-cancel>取消</button>
        <button type="submit" class="btn btn-primary btn-sm">确认移动</button>
      </div>
    </form>
  </dialog>`;
  el.innerHTML = html;
  updateTaskCalendarVisibility();
  updateTaskNotificationControl();
  el.querySelector('#task-todo').addEventListener('toggle', event => {
    if (!event.currentTarget.isConnected) return;
    taskTodoOpen = event.currentTarget.open;
    try { localStorage.setItem('kotori-task-todo-open', String(taskTodoOpen)); } catch (_) {}
  });
  refreshTaskBrowser();
}

function renderTaskGroups(groups) {
  let html = '';
  if (!groups.length) html = `<div class="task-empty"><div class="big-icon">✅</div><p>${taskSelectedDate ? '这一天没有任务' : '还没有任务~'}</p></div>`;
  groups.forEach(group => {
    html += `<section class="task-date-group" id="task-group-${encodeURIComponent(group.key)}"><div class="task-date-label">${escHtml(group.label)}</div>`;
    group.tasks.slice().sort((a, b) => b.date.localeCompare(a.date) || b._idx - a._idx).forEach(t => {
      const tagCls = taskTagClass(t.subject);
      const tagName = escHtml(subjectById(t.subject)?.name || '通用');
      const steps = Array.isArray(t.steps) ? t.steps : [];
      if (editingTaskId === t.id) {
        html += `<div class="task-card task-card-edit" data-task-idx="${t._idx}">
          <div class="task-edit-form">
            <input type="text" class="task-edit-title" value="${escHtml(t.title)}" placeholder="任务标题">
            <textarea class="task-edit-detail" placeholder="详情（选填）">${escHtml(t.detail || '')}</textarea>
            <select class="task-edit-subject">${taskSubjectOptions(t.subject)}</select>
            ${renderStickerPicker(`task-sticker-input-${t._idx}`, t.stickers || [])}
            <label class="task-field-label" for="task-edit-ddl">⏰ 主任务 DDL</label>
            <input id="task-edit-ddl" type="datetime-local" class="task-edit-ddl" value="${escHtml(t.ddl || '')}">
            <div class="task-edit-steps">
              <div class="task-edit-steps-label">子步骤 DDL 留空时继承主任务</div>
              ${steps.map(taskStepEditRow).join('')}
              <button type="button" class="task-add-step" data-edit-step-add>＋ 添加子步骤</button>
            </div>
            <div class="task-edit-actions">
              <button class="btn btn-primary btn-sm" data-task-save="${t._idx}">保存修改</button>
              <button class="btn btn-secondary btn-sm" data-task-cancel>取消</button>
            </div>
          </div>
        </div>`;
        return;
      }
      const completedSteps = steps.filter(step => step.done).length;
      html += `<div class="task-card${t.done?' done':''}" data-task-idx="${t._idx}">
        <button class="task-check" data-task-toggle="${t._idx}" aria-label="${t.done?'标记为未完成':'标记为完成'}">${t.done?'✓':''}</button>
        <div class="task-content">
          <div class="task-title">${escHtml(t.title)}</div>
          ${t.detail ? `<div class="task-detail">${escHtml(t.detail)}</div>` : ''}
          ${renderStickerStrip(t.stickers)}
          ${steps.length ? `<div class="task-steps">
            ${steps.map((step,stepIdx) => `<div class="task-step${step.done?' done':''}">
              <button class="task-step-check${step.done?' checked':''}" data-task-step-toggle="${t._idx}" data-step-idx="${stepIdx}" aria-label="切换子步骤状态">${step.done?'✓':''}</button>
              <span class="task-step-text">${escHtml(step.text)}</span>
              ${ddlBadge(step.ddl || t.ddl, step.done || t.done)}
            </div>`).join('')}
          </div>` : ''}
          <div class="task-meta"><span class="task-tag ${tagCls}">${tagName}</span>${taskIndexMode === 'category' ? `<time class="task-progress" datetime="${escHtml(t.date)}">${escHtml(t.date)}</time>` : ''}${steps.length ? `<span class="task-progress">${completedSteps}/${steps.length} 子步骤</span>` : ''}${ddlBadge(t.ddl, t.done)}</div>
        </div>
        <div class="task-actions">
          <button type="button" class="task-move" draggable="true" data-task-move="${escHtml(t.id)}" aria-label="移动任务" title="拖到日历，或点击选择日期"><span aria-hidden="true">⠿</span> 移动</button>
          <button class="task-edit" data-task-edit="${t._idx}">编辑</button>
          <button class="task-delete" data-task-del="${t._idx}" aria-label="删除任务">✕</button>
        </div>
      </div>`;
    });
    html += `</section>`;
  });

  document.getElementById('task-list').innerHTML = html;
  const editor = document.querySelector('.task-card-edit');
  if (editor && taskEditDraft && editor.dataset.taskIdx === taskEditDraft.dataset.taskIdx) editor.replaceWith(taskEditDraft);
}

/* ===== Background ===== */
function backgroundSource(ref) {
  if (typeof ref !== 'string') return '';
  return imageCache[ref] || (/^(?:data:image\/|https?:\/\/)/i.test(ref) ? ref : '');
}
function applyBackground() {
  const bg = document.getElementById('bg-layer');
  const src = backgroundSource(state.settings.backgrounds[state.settings.currentBg]);
  bg.style.backgroundImage = src ? `url(${JSON.stringify(src)})` : '';
  bg.classList.toggle('has-bg', Boolean(src));
  document.getElementById('bg-view-btn').hidden = !src;
}
function recoverableBackgrounds() {
  const used = attachmentImageKeys(state.tasks, state.notes);
  state.settings.backgrounds.forEach(key => used.add(key));
  return Object.entries(imageCache).filter(([key, src]) =>
    /^(?:bg|img)_/.test(key) && !used.has(key) && typeof src === 'string' && src.startsWith('data:image/'));
}
function renderBackgroundRecovery() {
  const recovery = document.getElementById('bg-recovery');
  const images = recoverableBackgrounds();
  recovery.hidden = !images.length;
  const list = document.getElementById('bg-recovery-list');
  list.replaceChildren();
  if (!recovery.open) return;
  for (const [key, src] of images) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'bg-preview-item';
    button.dataset.recoverBg = key;
    const image = new Image();
    image.loading = 'lazy';
    image.alt = `恢复图片 ${list.childElementCount + 1}`;
    image.src = src;
    button.append(image);
    list.append(button);
  }
}
function renderBgPreviews() {
  const el = document.getElementById('bg-preview-list');
  el.innerHTML = state.settings.backgrounds.map((key,i) => {
    const src = backgroundSource(key);
    const preview = src ? `<img src="${escHtml(src)}" alt="背景图片 ${i + 1}">` : '<span>图片缺失</span>';
    return `<div class="bg-preview-item${state.settings.currentBg===i?' active':''}" data-bg-select="${i}">
      ${preview}<button class="bg-preview-delete" data-bg-del="${i}">✕</button></div>`;
  }).join('');
  renderBackgroundRecovery();
}
function saveBackgrounds() {
  save({ sync: false });
  applyBackground();
  renderBgPreviews();
}

/* ===== Music ===== */
function renderMusic() {
  const c = document.getElementById('music-container');
  const ids = state.settings.musicIds;
  if (!ids.length) { c.innerHTML='<p class="empty-hint">在设置中添加网易云音乐~</p>'; return; }
  c.innerHTML = ids.map(id =>
    `<iframe frameborder="no" width="100%" height="86" src="https://music.163.com/outchain/player?type=2&id=${id}&auto=0&height=66" style="margin-bottom:6px;border-radius:8px"></iframe>`
  ).join('');
}
function renderMusicManageList() {
  const el = document.getElementById('music-manage-list');
  const ids = state.settings.musicIds;
  if (!ids.length) { el.innerHTML='<p class="empty-hint">暂未添加</p>'; return; }
  el.innerHTML = ids.map((id,i) =>
    `<div class="music-manage-item"><span>🎵 ID: ${id}</span><button data-music-del="${i}">✕</button></div>`
  ).join('');
}
function parseMusicId(input) {
  input=input.trim(); if(/^\d+$/.test(input)) return input;
  let m=input.match(/[?&]id=(\d+)/); if(m) return m[1];
  m=input.match(/song\/(\d+)/); if(m) return m[1]; return null;
}

/* ===== Settings ===== */
function openSettings() {
  document.getElementById('set-obsidian-vault').value = state.settings.obsidianVault;
  function renderFields(containerId, prefix, valueFor, placeholder) {
    document.getElementById(containerId).innerHTML = subjectLibrary.subjects.map(subject => {
      const id = prefix + subject.id;
      return `<label for="${id}">${escHtml(subject.icon + ' ' + subject.name)}${subject.archived ? '（已归档）' : ''}</label>
        <input type="text" id="${id}" placeholder="${placeholder}" value="${escHtml(valueFor(subject.id) || '')}">`;
    }).join('');
  }
  renderFields('subject-obsidian-settings', 'set-obs-', k => state.settings.obsidianFolders[k], '笔记文件夹');
  renderFields('subject-notebook-settings', 'set-nlm-', k => state.subjectLinks[k]?.notebookLM, 'NotebookLM URL');
  renderBgPreviews(); renderMusicManageList();
  document.getElementById('settings-modal').classList.add('open');
}
function closeSettings() {
  state.settings.obsidianVault = document.getElementById('set-obsidian-vault').value.trim()||'Obsidian Vault';
  subjectLibrary.subjects.forEach(({ id }) => {
    const folder = document.getElementById('set-obs-'+id);
    const notebook = document.getElementById('set-nlm-'+id);
    if (folder) state.settings.obsidianFolders[id] = folder.value.trim();
    if (notebook) state.subjectLinks[id] = { ...state.subjectLinks[id], notebookLM:notebook.value.trim() };
  });
  save(); updateObsidianLink();
  document.getElementById('settings-modal').classList.remove('open');
  renderAll();
}
function updateObsidianLink() {
  const vault = encodeURIComponent(state.settings.obsidianVault);
  document.getElementById('obsidian-link').href = `obsidian://open?vault=${vault}`;
}

/* ===== Export / Import (includes IndexedDB images) ===== */
async function exportData() {
  try {
    const [allImages, subjectLibraryBackup] = await Promise.all([idbGetAll(), subjectLibrary.exportBackup()]);
    const exportObj = { ...state, _images:allImages, subjectLibrary:subjectLibraryBackup };
    const blob = new Blob([JSON.stringify(exportObj,null,2)],{type:'application/json'});
    downloadBlob(blob, 'kotori-seika-backup.json');
    showToast('📤 已导出学科、资料、笔记和任务');
  } catch(error) {
    console.warn('Backup export failed', error);
    showToast('⚠ 导出失败，请检查浏览器存储和附件');
  }
}
async function applyImportedData(rawData, options = {}) {
  if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) throw new Error('无效备份');
  const { subjectLibrary:subjectBackup, ...d } = rawData;
  for (const field of ['notes', 'subjectLinks', 'settings', '_images']) {
    if (d[field] != null && (typeof d[field] !== 'object' || Array.isArray(d[field]))) throw new Error('无效备份字段');
  }
  if (d.tasks != null && (!Array.isArray(d.tasks) || d.tasks.some(task => !task || typeof task !== 'object'))) {
    throw new Error('无效备份任务');
  }
  if (subjectBackup) await subjectLibrary.importBackup(subjectBackup);
  // Restore images to IndexedDB
  if (d._images) {
    for (const [key, data] of Object.entries(d._images)) {
      await idbPut(key, data);
      imageCache[key] = data;
    }
    delete d._images;
  }
  state={...state,...d,settings:{...state.settings,...(d.settings||{}),
      obsidianFolders:{...state.settings.obsidianFolders,...d.settings?.obsidianFolders}},
    subjectLinks:{...state.subjectLinks,...(d.subjectLinks||{})},
    notes:{...state.notes,...(d.notes||{})}};
  if(!state.tasks) state.tasks=[];
  const importedSubjectMigrations = {
    math:'math-ode', physics:'physics-mech',
    'math-probability':'math-ode', 'math-analysis':'math-ode', 'math-linalg':'math-ode', 'physics-elec':'physics-general', 'cs':'cs-ics', 'ai':'ai-cv'
  };
  Object.entries(importedSubjectMigrations).forEach(([oldKey,newKey]) => {
    ['notes','subjectLinks'].forEach(field => {
      if (d[field]?.[oldKey] && !d[field]?.[newKey]) state[field][newKey] = d[field][oldKey];
    });
    if (d.settings?.obsidianFolders?.[oldKey] && !d.settings?.obsidianFolders?.[newKey]) {
      state.settings.obsidianFolders[newKey] = d.settings.obsidianFolders[oldKey];
    }
    if (state.currentView === oldKey) state.currentView = newKey;
  });
  normalizeTasks();
  if (!subjectBackup) {
    const ids = new Set([...Object.keys(state.notes), ...Object.keys(state.subjectLinks),
      ...Object.keys(state.settings.obsidianFolders), ...state.tasks.map(task => task.subject)]);
    await subjectLibrary.restoreLegacy(ids);
  }
  applySubjectCatalog();
  save({ sync: options.sync !== false });
  applyBackground(); renderMusic(); updateObsidianLink(); renderAll();
  void checkTaskReminders();
  if (options.notify !== false) alert('导入成功！');
}

async function importData(file) {
  try {
    const data = JSON.parse(await file.text());
    if (data?.subjectLibrary && (subjectLibrary.subjects.length || subjectLibrary.projectLinks !== null) &&
        !confirm('导入会替换当前学科目录、页面、附件和项目链接。是否继续？')) return;
    await applyImportedData(data);
  } catch(error) {
    console.warn('Backup import failed', error);
    alert('导入失败，请检查备份文件和浏览器存储空间。');
  }
}

async function importSubjectPack(file) {
  try {
    const pack = await readSubjectPack(file);
    if ((subjectLibrary.subjects.length || subjectLibrary.projectLinks !== null) &&
        !confirm('导入会替换当前学科目录、页面、附件和项目链接。是否继续？')) return;
    await subjectLibrary.importBackup(pack);
    if (state.currentView === 'tasks') {
      state.currentView = subjectLibrary.subjects.find(subject => !subject.archived)?.id || 'tasks';
    }
    applySubjectCatalog();
    renderAll();
    save({ sync:false });
    closeSettings();
    showToast('已导入学科资料包');
  } catch (error) {
    console.warn('Subject pack import failed', error);
    showToast(error?.name === 'InvalidStateError' ? error.message : '导入失败，请检查资料包和浏览器存储空间。');
  }
}

function legacyEntries(entries) {
  return Object.fromEntries(Object.entries(entries || {}).filter(([id]) => !isLocalSubject(id)));
}

window.SpaceDataBridge = Object.freeze({
  async exportSnapshot({ includeImages = true } = {}) {
    const notes = legacyEntries(state.notes);
    const tasks = state.tasks.filter(task => !isLocalSubject(task.subject));
    const allImages = includeImages ? await idbGetAll() : {};
    const images = {};
    if (includeImages) {
      attachmentImageKeys(tasks, notes).forEach(key => {
        if (allImages[key]) images[key] = allImages[key];
      });
    }
    return {
      data: {
        notes: structuredClone(notes),
        tasks: structuredClone(tasks),
        subjectLinks: structuredClone(legacyEntries(state.subjectLinks)),
        settings: { musicIds: structuredClone(state.settings.musicIds || []) }
      },
      images
    };
  },
  async importSnapshot(snapshot) {
    if (snapshot?.kind !== 'kotori-seika-space' || snapshot?.schemaVersion !== 1 || !snapshot?.data) {
      throw new Error('云端同步数据格式不受支持。');
    }
    const { notes, tasks, subjectLinks, settings } = structuredClone(snapshot.data);
    const incomingTasks = tasks?.filter(task => !isLocalSubject(task.subject));
    const localTasks = state.tasks.filter(task => isLocalSubject(task.subject));
    const data = {
      notes:legacyEntries(notes), subjectLinks:legacyEntries(subjectLinks),
      _images:snapshot.images || {}
    };
    if (incomingTasks) data.tasks = [...incomingTasks, ...localTasks];
    if (Array.isArray(settings?.musicIds)) data.settings = { musicIds: settings.musicIds };
    await applyImportedData(data, { notify: false, sync: false });
    showToast('☁️ 已载入云端同步数据');
  }
});

/* ===== Events ===== */
function setupEvents() {
  setupImageLightbox();
  // Subject navigation
  document.getElementById('sidebar').addEventListener('click', e => {
    const btn = e.target.closest('button.subject-btn[data-subject]');
    if (!btn) return;
    const subject = btn.dataset.subject;
    const enter = () => {
      if (state.currentView !== subject) {
        state.currentView = subject;
        save();
        renderAll();
      }
      const main = document.getElementById('main-content');
      const top = main.getBoundingClientRect().top;
      if (top < 0 || top > innerHeight * .65) main.scrollIntoView({ block:'start', behavior:'instant' });
      if (e.detail === 0 || matchMedia('(max-width:800px)').matches) {
        const heading = main.querySelector(subject === 'tasks' ? '.task-workspace-heading h2' : '#subject-header h2');
        if (heading) {
          heading.tabIndex = -1;
          heading.focus({ preventScroll:true });
        }
      }
    };
    const requested = new CustomEvent('seika:open-room', {
      cancelable:true, detail:{ subject, enter }
    });
    if (document.dispatchEvent(requested)) enter();
  });

  const vn = document.getElementById('view-notes');

  vn.addEventListener('click', e => {
    const stickerRemove = e.target.closest('[data-sticker-remove]');
    if (stickerRemove) {
      const editor = stickerRemove.closest('.sticker-editor');
      updateStickerPicker(editor, stickerKeys(editor).filter(key => key !== stickerRemove.dataset.stickerRemove));
      return;
    }
    const scrollEntry = e.target.closest('[data-scroll-to]');
    if (scrollEntry) {
      const target = document.getElementById('note-anchor-' + scrollEntry.dataset.scrollTo);
      if (target) {
        target.scrollIntoView({behavior:'smooth', block:'start'});
        target.classList.remove('note-highlight');
        void target.offsetWidth;
        target.classList.add('note-highlight');
        setTimeout(() => target.classList.remove('note-highlight'), 1700);
      }
      return;
    }
    if (e.target.closest('#catalog-toggle')) {
      const body = document.getElementById('catalog-body');
      const caret = document.querySelector('.catalog-caret');
      const collapsed = body.classList.toggle('collapsed');
      if (caret) caret.textContent = collapsed ? '▶' : '▼';
      return;
    }
    if (e.target.id === 'note-submit-btn') {
      const titleInput = document.getElementById('note-title-input');
      const ta = document.getElementById('note-textarea');
      const title = titleInput ? titleInput.value.trim() : '';
      const content = ta.value.trim();
      const stickers = stickerKeys(document.getElementById('note-sticker-input')?.closest('.sticker-editor'));
      if (!content && !title && !stickers.length) return;
      const subj = state.currentView;
      const editing = ta.dataset.editingNote ? JSON.parse(ta.dataset.editingNote) : null;
      if (editing) {
        const note = state.notes[editing.subj]?.[editing.date]?.[editing.idx];
        if (note) {
          note.title = title;
          note.content = content;
          note.stickers = stickers;
          note.updatedAt = now();
          save(); renderNotes(editing.subj);
        }
        return;
      }
      const d = today();
      if (!state.notes[subj][d]) state.notes[subj][d] = [];
      state.notes[subj][d].push({ id:uid(), title, content, stickers, time:now() });
      save(); renderNotes(subj);
      const ti = document.getElementById('note-title-input');
      if (ti) ti.focus();
      return;
    }
    if (e.target.id === 'note-cancel-edit-btn') {
      const titleInput = document.getElementById('note-title-input');
      const ta = document.getElementById('note-textarea');
      if (titleInput) titleInput.value = '';
      if (ta) {
        ta.value = '';
        delete ta.dataset.editingNote;
        ta.style.display = '';
      }
      const pv = document.getElementById('note-preview');
      if (pv) { pv.style.display = 'none'; pv.innerHTML = ''; }
      const submit = document.getElementById('note-submit-btn');
      if (submit) submit.textContent = '保存笔记';
      e.target.hidden = true;
      return;
    }
    if (e.target.id === 'note-preview-btn') {
      const ta = document.getElementById('note-textarea');
      const pv = document.getElementById('note-preview');
      if (pv.style.display==='none') {
        pv.innerHTML=renderMarkdown(ta.value); renderLatex(pv); pv.style.display='block'; ta.style.display='none';
        e.target.textContent='✏️ 编辑';
      } else {
        pv.style.display='none'; ta.style.display=''; e.target.textContent='👁 预览';
      }
      return;
    }
    const del = e.target.closest('[data-note-del]');
    if (del) {
      const d = JSON.parse(del.dataset.noteDel);
      if (state.notes[d.subj] && state.notes[d.subj][d.date]) {
        state.notes[d.subj][d.date].splice(d.idx,1);
        if (!state.notes[d.subj][d.date].length) delete state.notes[d.subj][d.date];
        save(); renderNotes(d.subj);
      }
    }
    const edit = e.target.closest('[data-note-edit]');
    if (edit) {
      const d = JSON.parse(edit.dataset.noteEdit);
      const note = state.notes[d.subj]?.[d.date]?.[d.idx];
      if (!note) return;
      const titleInput = document.getElementById('note-title-input');
      const ta = document.getElementById('note-textarea');
      const pv = document.getElementById('note-preview');
      if (titleInput) titleInput.value = note.title || '';
      if (ta) {
        ta.value = note.content || '';
        ta.dataset.editingNote = JSON.stringify(d);
        ta.style.display = '';
      }
      updateStickerPicker(document.getElementById('note-sticker-input')?.closest('.sticker-editor'), note.stickers || []);
      if (pv) { pv.style.display = 'none'; pv.innerHTML = ''; }
      const submit = document.getElementById('note-submit-btn');
      const cancel = document.getElementById('note-cancel-edit-btn');
      if (submit) submit.textContent = '更新笔记';
      if (cancel) cancel.hidden = false;
      document.querySelector('.note-input-area')?.scrollIntoView({behavior:'smooth', block:'start'});
      if (titleInput) titleInput.focus();
      return;
    }
    const fold = e.target.closest('[data-note-fold]');
    if (fold) {
      const d = JSON.parse(fold.dataset.noteFold);
      const note = state.notes[d.subj]?.[d.date]?.[d.idx];
      if (note) {
        note.collapsed = !note.collapsed;
        save(); renderNotes(d.subj);
      }
    }
  });

  // Image upload → IndexedDB
  vn.addEventListener('change', e => {
    if (e.target.id === 'note-img-input' && e.target.files[0]) {
      compressImage(e.target.files[0]).then(async dataUrl => {
        const key = await saveImageToIDB(dataUrl);
        const ta = document.getElementById('note-textarea');
        if (ta) insertImageAtCursor(ta, 'idb:' + key);
        e.target.value = '';
      });
    }
    if (e.target.matches?.('.sticker-input') && e.target.files.length) {
      const editor = e.target.closest('.sticker-editor');
      addStickerFiles(editor, e.target.files);
      e.target.value = '';
    }
  });

  vn.addEventListener('input', e => {
    if (e.target.id === 'catalog-search') {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.catalog-entry').forEach(el => {
        el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
      document.querySelectorAll('.catalog-date-group').forEach(g => {
        const hasVisible = Array.from(g.querySelectorAll('.catalog-entry')).some(e => e.style.display !== 'none');
        g.style.display = hasVisible ? '' : 'none';
      });
    }
  });

  // Image paste → IndexedDB
  vn.addEventListener('paste', async e => {
    if (pasteStickerImage(e)) return;
    if (!e.target.matches || !e.target.matches('#note-textarea')) return;
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (let i=0;i<items.length;i++) {
      if (items[i].type.indexOf('image')!==-1) {
        e.preventDefault();
        const dataUrl = await compressImage(items[i].getAsFile());
        const key = await saveImageToIDB(dataUrl);
        insertImageAtCursor(e.target, 'idb:' + key);
        break;
      }
    }
  });

  // Task view
  const vt = document.getElementById('view-tasks');
  let draggedTaskId = null;
  let dropDay = null;
  const moveDataType = 'application/x-seika-task';
  function markDropDay(day) {
    if (dropDay === day) return;
    dropDay?.classList.remove('is-drop-target');
    dropDay = day;
    dropDay?.classList.add('is-drop-target');
  }
  vt.addEventListener('dragstart', e => {
    const handle = e.target.closest('[data-task-move]');
    if (!handle) return;
    draggedTaskId = handle.dataset.taskMove;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(moveDataType, draggedTaskId);
    const card = handle.closest('.task-card');
    e.dataTransfer.setDragImage(card, 24, 16);
    vt.classList.add('is-dragging-task');
  });
  vt.addEventListener('dragover', e => {
    const day = draggedTaskId ? e.target.closest('[data-task-calendar-date]') : null;
    markDropDay(day);
    if (!day) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  });
  vt.addEventListener('dragleave', e => {
    if (dropDay && !dropDay.contains(e.relatedTarget)) markDropDay(null);
  });
  function endTaskDrag() {
    draggedTaskId = null;
    markDropDay(null);
    vt.classList.remove('is-dragging-task');
  }
  vt.addEventListener('dragend', endTaskDrag);
  vt.addEventListener('drop', e => {
    const day = e.target.closest('[data-task-calendar-date]');
    if (!day || !draggedTaskId || e.dataTransfer.getData(moveDataType) !== draggedTaskId) return;
    e.preventDefault();
    const task = state.tasks.find(task => String(task.id) === draggedTaskId);
    endTaskDrag();
    moveTaskToDate(task, day.dataset.taskCalendarDate);
  });
  vt.addEventListener('submit', e => {
    if (e.target.id !== 'task-move-form') return;
    e.preventDefault();
    const dialog = e.target.closest('dialog');
    const task = state.tasks.find(task => String(task.id) === dialog.dataset.taskId);
    dialog.close();
    moveTaskToDate(task, document.getElementById('task-move-date').value);
  });
  vt.addEventListener('click', async e => {
    const stickerRemove = e.target.closest('[data-sticker-remove]');
    if (stickerRemove) {
      const editor = stickerRemove.closest('.sticker-editor');
      updateStickerPicker(editor, stickerKeys(editor).filter(key => key !== stickerRemove.dataset.stickerRemove));
      return;
    }
    if (e.target.closest('[data-task-calendar-toggle]')) {
      taskCalendarCollapsed = !taskCalendarCollapsed;
      try { localStorage.setItem('kotori-task-calendar-collapsed', String(taskCalendarCollapsed)); } catch (_) {}
      updateTaskCalendarVisibility();
      return;
    }
    const notification = e.target.closest('[data-task-notification-enable]');
    if (notification) {
      try { await Notification.requestPermission(); }
      catch (error) { showToast('无法请求通知权限，请检查浏览器设置'); }
      updateTaskNotificationControl();
      void checkTaskReminders();
      return;
    }
    if (e.target.closest('[data-task-todo-new]')) {
      document.querySelector('.task-composer').open = true;
      document.getElementById('task-add-todo').checked = true;
      document.getElementById('task-title-input').focus();
      return;
    }
    const todoRemove = e.target.closest('[data-task-todo-remove]');
    const todoPin = e.target.closest('[data-task-todo-pin]');
    if (todoRemove || todoPin) {
      const id = todoRemove ? todoRemove.dataset.taskTodoRemove : document.getElementById('task-todo-select').value;
      const task = state.tasks.find(task => String(task.id) === id);
      if (task && !task.done) {
        task.inTodo = !todoRemove;
        save();
        renderTaskTodo(true);
      }
      return;
    }
    const todoLink = e.target.closest('[data-task-todo-open]');
    if (todoLink) {
      const index = state.tasks.findIndex(task => String(task.id) === todoLink.dataset.taskTodoOpen);
      if (index !== -1) {
        taskSelectedDate = state.tasks[index].date;
        taskCalendarMonth = taskSelectedDate.slice(0, 7);
        refreshTaskBrowser();
        const card = document.querySelector(`.task-card[data-task-idx="${index}"]`);
        card?.scrollIntoView({ block:'center' });
        card?.querySelector('.task-check')?.focus({ preventScroll:true });
      }
      return;
    }
    const move = e.target.closest('[data-task-move]');
    if (move) {
      const task = state.tasks.find(task => String(task.id) === move.dataset.taskMove);
      if (task) {
        const dialog = document.getElementById('task-move-dialog');
        dialog.dataset.taskId = String(task.id);
        document.getElementById('task-move-date').value = task.date;
        dialog.showModal();
      }
      return;
    }
    if (e.target.closest('[data-task-move-cancel]')) {
      document.getElementById('task-move-dialog').close();
      return;
    }
    const indexMode = e.target.closest('[data-task-index-mode]');
    if (indexMode) {
      taskIndexMode = indexMode.dataset.taskIndexMode;
      taskSelectedDate = taskIndexMode === 'date' ? today() : '';
      if (taskSelectedDate) taskCalendarMonth = taskSelectedDate.slice(0, 7);
      try { localStorage.setItem('kotori-task-index-mode', taskIndexMode); } catch (_) {}
      refreshTaskBrowser();
      return;
    }
    const calendarDay = e.target.closest('[data-task-calendar-date]');
    if (calendarDay || e.target.closest('[data-task-calendar-today]')) {
      taskSelectedDate = calendarDay ? calendarDay.dataset.taskCalendarDate : today();
      taskCalendarMonth = taskSelectedDate.slice(0, 7);
      refreshTaskBrowser();
      return;
    }
    const monthShift = e.target.closest('[data-task-month-shift]');
    if (monthShift) {
      const [year, month] = taskCalendarMonth.split('-').map(Number);
      const next = new Date(year, month - 1 + Number(monthShift.dataset.taskMonthShift), 1);
      if (next.getFullYear() >= 100 && next.getFullYear() <= 9999) {
        taskCalendarMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
        document.querySelector('.task-calendar').outerHTML = renderTaskCalendar();
      }
      return;
    }
    if (e.target.closest('[data-task-clear-date]')) {
      taskSelectedDate = '';
      refreshTaskBrowser();
      return;
    }
    const groupIndex = e.target.closest('[data-task-group-scroll]');
    if (groupIndex) {
      const target = document.getElementById(`task-group-${encodeURIComponent(groupIndex.dataset.taskGroupScroll)}`);
      if (target) {
        target.scrollIntoView({ behavior:'smooth', block:'start' });
        target.classList.remove('task-date-highlight');
        void target.offsetWidth;
        target.classList.add('task-date-highlight');
        setTimeout(() => target.classList.remove('task-date-highlight'), 1700);
      }
      return;
    }
    if (e.target.id === 'task-add-btn') {
      const title = document.getElementById('task-title-input').value.trim();
      if (!title) return;
      const detail = document.getElementById('task-detail-input').value.trim();
      const subject = document.getElementById('task-subject-select').value;
      const ddl = document.getElementById('task-ddl-input').value;
      const steps = document.getElementById('task-steps-input').value.split('\n')
        .map(text => text.trim()).filter(Boolean)
        .map(parseTaskStepLine).filter(step => step.text);
      const stickers = stickerKeys(document.getElementById('task-sticker-input')?.closest('.sticker-editor'));
      const inTodo = document.getElementById('task-add-todo').checked;
      state.tasks.push({ id:uid(), title, detail, subject, steps, stickers, ddl, date:today(), done:false, inTodo });
      if (taskSelectedDate) { taskSelectedDate = today(); taskCalendarMonth = today().slice(0, 7); }
      save(); renderAll();
      void checkTaskReminders();
      return;
    }
    const stepToggle = e.target.closest('[data-task-step-toggle]');
    if (stepToggle) {
      const task = state.tasks[+stepToggle.dataset.taskStepToggle];
      const step = task?.steps?.[+stepToggle.dataset.stepIdx];
      if (step) {
        step.done = !step.done;
        task.done = task.steps.every(step => step.done);
        saveTaskChanges();
      }
      return;
    }
    const tog = e.target.closest('[data-task-toggle]');
    if (tog) {
      const task = state.tasks[+tog.dataset.taskToggle];
      task.done = !task.done;
      task.steps.forEach(step => { step.done = task.done; });
      saveTaskChanges();
      return;
    }
    const edit = e.target.closest('[data-task-edit]');
    if (edit) {
      editingTaskId = state.tasks[+edit.dataset.taskEdit]?.id || null;
      taskEditDraft = null;
      document.querySelector('.task-card-edit')?.remove();
      refreshTaskBrowser();
      document.querySelector('.task-card-edit')?.scrollIntoView({behavior:'smooth', block:'center'});
      return;
    }
    if (e.target.closest('[data-task-cancel]')) { editingTaskId = null; refreshTaskBrowser(); return; }
    const editStepToggle = e.target.closest('[data-edit-step-toggle]');
    if (editStepToggle) {
      const row = editStepToggle.closest('.task-edit-step');
      const done = row.dataset.done !== 'true';
      row.dataset.done = String(done);
      editStepToggle.classList.toggle('checked', done);
      editStepToggle.textContent = done ? '✓' : '';
      return;
    }
    const editStepRemove = e.target.closest('[data-edit-step-remove]');
    if (editStepRemove) { editStepRemove.closest('.task-edit-step')?.remove(); return; }
    if (e.target.closest('[data-edit-step-add]')) {
      const steps = e.target.closest('.task-edit-steps');
      e.target.insertAdjacentHTML('beforebegin', taskStepEditRow());
      steps.querySelector('.task-edit-step:last-of-type .task-edit-step-input')?.focus();
      return;
    }
    const saveEdit = e.target.closest('[data-task-save]');
    if (saveEdit) {
      const idx = +saveEdit.dataset.taskSave;
      const task = state.tasks[idx];
      const card = saveEdit.closest('.task-card-edit');
      const title = card.querySelector('.task-edit-title').value.trim();
      if (!task || !title) { card.querySelector('.task-edit-title').focus(); return; }
      task.title = title;
      task.detail = card.querySelector('.task-edit-detail').value.trim();
      task.subject = card.querySelector('.task-edit-subject').value;
      task.stickers = stickerKeys(card.querySelector('.sticker-editor'));
      task.steps = Array.from(card.querySelectorAll('.task-edit-step')).map(row => ({
        id: row.dataset.stepId || uid(),
        text: row.querySelector('.task-edit-step-input').value.trim(),
        done: row.dataset.done === 'true',
        ddl: row.querySelector('.task-edit-step-ddl').value
      })).filter(step => step.text);
      task.ddl = card.querySelector('.task-edit-ddl').value;
      if (task.steps.length) task.done = task.steps.every(step => step.done);
      editingTaskId = null;
      saveTaskChanges();
      return;
    }
    const del = e.target.closest('[data-task-del]');
    if (del) { state.tasks.splice(+del.dataset.taskDel,1); editingTaskId = null; saveTaskChanges(); }
  });

  vt.addEventListener('change', e => {
    if (e.target.id === 'task-calendar-month') {
      if (/^\d{4}-\d{2}$/.test(e.target.value) && e.target.validity.valid) {
        taskCalendarMonth = e.target.value;
        document.querySelector('.task-calendar').outerHTML = renderTaskCalendar();
      }
      return;
    }
    if (!e.target.matches?.('.sticker-input') || !e.target.files.length) return;
    addStickerFiles(e.target.closest('.sticker-editor'), e.target.files);
    e.target.value = '';
  });
  vt.addEventListener('paste', e => {
    if (pasteStickerImage(e)) return;
    if (!e.target.matches?.('#task-detail-input, .task-edit-detail')) return;
    const items = e.clipboardData?.items;
    const files = items ? Array.from(items).filter(item => item.type.startsWith('image/')).map(item => item.getAsFile()) : [];
    if (!files.length) return;
    const editor = e.target.closest('.task-form, .task-edit-form')?.querySelector('.sticker-editor');
    if (!editor) return;
    e.preventDefault();
    addStickerFiles(editor, files);
  });

  // Settings
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.querySelector('.modal-close').addEventListener('click', closeSettings);
  document.querySelector('.modal-overlay').addEventListener('click', closeSettings);

  // Background upload → IndexedDB
  document.getElementById('bg-upload').addEventListener('change', e => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = async ev => {
        const key = await saveImageToIDB(ev.target.result, 'bg_');
        state.settings.backgrounds.push(key);
        if (!backgroundSource(state.settings.backgrounds[state.settings.currentBg])) {
          state.settings.currentBg = state.settings.backgrounds.length - 1;
        }
        saveBackgrounds();
      }; reader.readAsDataURL(file);
    }); e.target.value='';
  });
  document.getElementById('bg-preview-list').addEventListener('click', e => {
    const sel = e.target.closest('[data-bg-select]');
    if (sel && !e.target.closest('.bg-preview-delete')) {
      state.settings.currentBg=+sel.dataset.bgSelect; saveBackgrounds(); return;
    }
    const del = e.target.closest('[data-bg-del]');
    if (del) {
      const i=+del.dataset.bgDel;
      const key = state.settings.backgrounds[i];
      if (key && !key.startsWith('data:')) idbDel(key).catch(()=>{});
      delete imageCache[key];
      state.settings.backgrounds.splice(i,1);
      if (i < state.settings.currentBg) state.settings.currentBg--;
      else if (i === state.settings.currentBg) state.settings.currentBg = Math.min(i, state.settings.backgrounds.length - 1);
      saveBackgrounds();
    }
  });
  document.getElementById('bg-reset-btn').addEventListener('click', () => {
    state.settings.currentBg=-1; saveBackgrounds();
  });
  document.getElementById('bg-recovery').addEventListener('toggle', renderBackgroundRecovery);
  document.getElementById('bg-recovery-list').addEventListener('click', e => {
    const key = e.target.closest('[data-recover-bg]')?.dataset.recoverBg;
    if (!key || state.settings.backgrounds.includes(key) || !imageCache[key]) return;
    state.settings.currentBg = state.settings.backgrounds.push(key) - 1;
    saveBackgrounds();
  });

  // Music
  document.getElementById('music-add-btn').addEventListener('click', () => {
    const input = document.getElementById('music-input');
    const id = parseMusicId(input.value);
    if (!id) { alert('请输入有效的网易云音乐链接或歌曲ID'); return; }
    state.settings.musicIds.push(id); save(); renderMusic(); renderMusicManageList(); input.value='';
  });
  document.getElementById('music-manage-list').addEventListener('click', e => {
    const del = e.target.closest('[data-music-del]');
    if (del) { state.settings.musicIds.splice(+del.dataset.musicDel,1); save(); renderMusic(); renderMusicManageList(); }
  });

  // Export / Import
  document.getElementById('export-btn').addEventListener('click', () => exportData());
  document.getElementById('import-file').addEventListener('change', e => {
    if (e.target.files[0]) importData(e.target.files[0]); e.target.value='';
  });
  document.getElementById('subject-pack-file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) void importSubjectPack(file);
    e.target.value = '';
  });

  // Esc + bg viewing
  document.addEventListener('keydown', e => {
    if (e.key==='Escape') {
      if (document.body.classList.contains('bg-viewing')) { document.body.classList.remove('bg-viewing'); }
      else if (document.getElementById('settings-modal').classList.contains('open')) { closeSettings(); }
    }
  });
  document.getElementById('bg-view-btn').addEventListener('click', () => {
    closeSettings();
    const requested = new CustomEvent('seika:show-album', { cancelable: true });
    if (document.dispatchEvent(requested)) document.body.classList.add('bg-viewing');
  });
  document.getElementById('bg-view-exit').addEventListener('click', () => {
    document.body.classList.remove('bg-viewing');
  });
}

/* ===== Init (async: opens IndexedDB first) ===== */
async function init() {
  idb = await openSpaceDatabase();
  imageCache = await idbGetAll();
  load();
  subjectLibrary = await openSubjectLibrary(idb);
  applySubjectCatalog();
  subjectPages = setupSubjectPages(subjectLibrary, renderLocalPage, showToast);
  await migrateImages();
  updateObsidianLink();
  applyBackground();
  renderMusic();
  setupEvents();
  renderAll();
  const refreshDeadlines = () => {
    renderTaskTodo();
    updateTaskNotificationControl();
    void checkTaskReminders();
  };
  refreshDeadlines();
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshDeadlines();
  });
  window.addEventListener('beforeunload', () => save({ sync:false }));
  setInterval(() => { save({ sync:false }); refreshDeadlines(); }, 30000);
  await window.spaceSync?.init();
}
document.addEventListener('DOMContentLoaded', () => init());
