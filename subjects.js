export const MATERIAL_STORE = 'materials';
const CATALOG_KEY = 'catalog';
const COLORS = { green:'草绿', blue:'天蓝', plum:'淡紫', amber:'暖棕' };

export const LEGACY_SUBJECTS = [
  { id:'math-ode', name:'常微分方程', icon:'〰️', category:'数学', color:'green' },
  { id:'physics-mech', name:'理力', icon:'⚙️', category:'物理', color:'blue' },
  { id:'physics-general', name:'普物', icon:'🧲', category:'物理', color:'blue' },
  { id:'cs-ics', name:'ICS', icon:'🖥️', category:'计算机', color:'green' },
  { id:'cs-dsa', name:'数算', icon:'🧮', category:'计算机', color:'green' },
  { id:'ai-cv', name:'计算机视觉', icon:'👁️', category:'AI', color:'plum' },
  { id:'research', name:'科研', icon:'🔬', category:'AI', color:'plum' }
];
const legacyIds = new Set(LEGACY_SUBJECTS.map(subject => subject.id));
export const isLocalSubject = id => typeof id === 'string' && id.startsWith('subject-');

export function resourceUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value, location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function validateCatalog(subjects) {
  if (!Array.isArray(subjects)) throw new Error('学科备份格式不正确。');
  const ids = new Set();
  function register(id, pattern) {
    if (typeof id !== 'string' || !pattern.test(id) || ids.has(id)) throw new Error('备份包含无效或重复的标识。');
    ids.add(id);
  }
  function checkText(value) {
    if (typeof value !== 'string') throw new Error('备份文本格式不正确。');
  }
  for (const subject of subjects) {
    register(subject.id, legacyIds.has(subject.id) ? /^[a-z-]+$/ : /^subject-[0-9a-f-]{36}$/);
    [subject.name, subject.icon, subject.category, subject.description].forEach(checkText);
    if (!subject.name.trim() || !Object.hasOwn(COLORS, subject.color) || !Array.isArray(subject.pages)) {
      throw new Error('学科卡片格式不正确。');
    }
    for (const page of subject.pages) {
      register(page.id, /^page-[0-9a-f-]{36}$/);
      [page.title, page.body, page.url].forEach(checkText);
      if (!page.title.trim() || !Array.isArray(page.files)) throw new Error('学科页面格式不正确。');
      for (const file of page.files) {
        register(file.id, /^file-[0-9a-f-]{36}$/);
        checkText(file.name);
      }
    }
  }
}

function legacyCard(subject) {
  return { ...subject, description:'', archived:false, pages:[] };
}

function fileIds(subjects) {
  return subjects.flatMap(subject => subject.pages.flatMap(page => page.files.map(file => file.id)));
}

export async function openSubjectLibrary(db, hadLegacyState) {
  function read(key) {
    return new Promise((resolve, reject) => {
      const request = db.transaction(MATERIAL_STORE).objectStore(MATERIAL_STORE).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  let catalog = await read(CATALOG_KEY);
  if (!catalog) {
    catalog = { revision:0, subjects:hadLegacyState ? LEGACY_SUBJECTS.map(legacyCard) : [] };
  }
  let { subjects, revision } = catalog;

  async function write(next, files = new Map(), replace = false) {
    const previousRevision = revision;
    const nextRevision = revision + 1;
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(MATERIAL_STORE, 'readwrite');
      const store = transaction.objectStore(MATERIAL_STORE);
      let stale = false;
      const request = store.get(CATALOG_KEY);
      request.onsuccess = () => {
        if ((request.result?.revision || 0) !== previousRevision) {
          stale = true;
          transaction.abort();
          return;
        }
        for (const [id, blob] of files) store.put(blob, id);
        if (replace) {
          const kept = new Set(fileIds(next));
          for (const id of fileIds(subjects)) {
            if (!kept.has(id)) store.delete(id);
          }
        }
        store.put({ revision:nextRevision, subjects:next }, CATALOG_KEY);
      };
      transaction.oncomplete = resolve;
      transaction.onabort = () => reject(stale ? new DOMException('学科目录已在另一处更新，请刷新后再编辑。', 'InvalidStateError') : transaction.error);
    });
    subjects = next;
    revision = nextRevision;
  }

  if (!revision) {
    try { await write(subjects); }
    catch (error) {
      if (error.name !== 'InvalidStateError') throw error;
      ({ subjects, revision } = await read(CATALOG_KEY));
    }
  }

  return {
    get subjects() { return subjects; },
    write(next, files) { return write(next, files, true); },
    readFile: read,
    async restoreLegacy(ids) {
      const present = new Set(subjects.map(subject => subject.id));
      const missing = LEGACY_SUBJECTS.filter(subject => ids.has(subject.id) && !present.has(subject.id));
      if (missing.length) await write([...subjects, ...missing.map(legacyCard)]);
    },
    async exportBackup() {
      const catalog = subjects;
      // Read all blobs before another edit can remove an attachment from the catalog.
      const ids = fileIds(catalog);
      const blobs = await Promise.all(ids.map(read));
      const files = {};
      for (const [index, id] of ids.entries()) {
        if (!(blobs[index] instanceof Blob)) throw new Error('备份缺少附件。');
        files[id] = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blobs[index]);
        });
      }
      return { version:1, subjects:catalog, files };
    },
    async importBackup(backup) {
      if (backup?.version !== 1) throw new Error('学科备份版本不受支持。');
      validateCatalog(backup.subjects);
      const files = new Map();
      for (const id of fileIds(backup.subjects)) {
        const data = backup.files?.[id];
        if (typeof data !== 'string' || !/^data:[^,]*;base64,/i.test(data)) throw new Error('备份缺少有效附件。');
        const response = await fetch(data);
        files.set(id, await response.blob());
      }
      await write(backup.subjects, files, true);
    }
  };
}

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}

function move(list, id, direction) {
  const from = list.findIndex(item => item.id === id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= list.length) return;
  [list[from], list[to]] = [list[to], list[from]];
}

function orderButtons(item, index, length, scope) {
  return `<button type="button" class="btn btn-secondary btn-sm" data-action="${scope}-up" data-id="${item.id}" aria-label="上移 ${escapeText(item.name || item.title)}" ${index === 0 ? 'disabled' : ''}>↑</button>
    <button type="button" class="btn btn-secondary btn-sm" data-action="${scope}-down" data-id="${item.id}" aria-label="下移 ${escapeText(item.name || item.title)}" ${index === length - 1 ? 'disabled' : ''}>↓</button>`;
}

export function setupSubjectEditor(library, onChange, renderPageBody, showToast) {
  const dialog = document.getElementById('subject-editor');
  const heading = document.getElementById('subject-editor-title');
  const body = document.getElementById('subject-editor-body');
  const status = document.getElementById('subject-editor-status');
  const pages = document.getElementById('subject-pages');
  const selection = new Map();
  let subjectId = '';
  let pageId = '';
  let busy = false;
  let stagedFiles = new Map();
  let removedFiles = new Set();

  function button(action, text, id = '') {
    return `<button class="btn btn-secondary btn-sm" type="button" data-action="${action}" data-id="${id}">${text}</button>`;
  }

  function show(title, html) {
    heading.textContent = title;
    body.innerHTML = html;
    status.hidden = true;
    if (!dialog.open) dialog.showModal();
    body.querySelector('input:not([type=file]), button')?.focus();
  }

  function showList() {
    const cards = library.subjects.map((subject, index, all) => `<li>
      <span><strong>${escapeText(subject.icon)} ${escapeText(subject.name)}</strong>
      <small>${escapeText([subject.category, subject.archived ? '已归档' : ''].filter(Boolean).join(' · '))}</small></span>
      <div class="subject-actions">${orderButtons(subject, index, all.length, 'subject')}
      ${button('edit-subject', '编辑', subject.id)}
      ${button('archive-subject', subject.archived ? '恢复' : '归档', subject.id)}</div></li>`).join('');
    show('管理学科', `<p class="subject-hint">学科和页面保存在当前浏览器。用上下箭头调整顺序，归档后仍可恢复原有资料。</p>
      ${cards ? `<ul class="subject-editor-list">${cards}</ul>` : ''}${button('edit-subject', '新增学科')}`);
  }

  function editSubject(id) {
    subjectId = id;
    const subject = library.subjects.find(item => item.id === id);
    show(subject ? '编辑学科' : '新增学科', `<form data-editor="subject" class="subject-editor-form">
      <label>学科名称<input name="name" maxlength="48" required value="${escapeText(subject?.name || '')}"></label>
      <div class="subject-editor-fields">
        <label>图标<input name="icon" maxlength="12" value="${escapeText(subject?.icon || '')}" placeholder="📚"></label>
        <label>分类<input name="category" maxlength="30" value="${escapeText(subject?.category || '')}"></label>
        <label>颜色<select name="color">${Object.entries(COLORS).map(([key, label]) => `<option value="${key}" ${subject?.color === key ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
      </div>
      <label>简介<textarea name="description" rows="2" maxlength="240">${escapeText(subject?.description || '')}</textarea></label>
      <div class="subject-actions"><button class="btn btn-primary" type="submit">保存学科</button>${button('subject-list', '返回学科列表')}</div>
    </form>`);
  }

  function editPage(id) {
    pageId = id;
    stagedFiles = new Map();
    removedFiles = new Set();
    const subject = library.subjects.find(item => item.id === subjectId);
    const page = subject?.pages.find(item => item.id === id);
    if (!subject) return;
    show(page ? '编辑页面' : '新增页面', `<form data-editor="page" class="subject-editor-form">
      <label>页面标题<input name="title" maxlength="90" required value="${escapeText(page?.title || '')}"></label>
      <label>正文（Markdown）<textarea name="markdown" rows="9">${escapeText(page?.body || '')}</textarea></label>
      <label class="subject-import-label">从文件插入正文<input type="file" name="markdownFile" accept=".md,.markdown,.txt,.text"></label>
      <label>资料链接<input name="url" placeholder="https://… 或站内相对路径" value="${escapeText(page?.url || '')}"></label>
      <label class="subject-import-label">附加本地文件<input type="file" name="attachments" multiple></label>
      <ul class="subject-editor-list" id="subject-file-list"></ul>
      <div class="subject-actions"><button class="btn btn-primary" type="submit">保存页面</button>
      ${button('close', '取消')}${page ? button('delete-page', '删除页面', page.id) : ''}</div>
    </form>`);
    renderFiles();
  }

  function renderFiles() {
    const current = library.subjects.find(item => item.id === subjectId)?.pages.find(item => item.id === pageId);
    const pending = Array.from(stagedFiles, ([id, file]) => ({ id, name:file.name }));
    const files = [...(current?.files || []).filter(file => !removedFiles.has(file.id)), ...pending];
    body.querySelector('#subject-file-list').innerHTML = files.map(file => `<li><span>${escapeText(file.name)}</span>${button('remove-file', '移除', file.id)}</li>`).join('');
  }

  function render(subject) {
    pages.hidden = !subject;
    if (!subject) return;
    subjectId = subject.id;
    const page = subject.pages.find(item => item.id === selection.get(subject.id)) || subject.pages[0];
    const selected = page?.id;
    const links = subject.pages.map((item, index) => `<li><button type="button" class="subject-page-link" data-action="read-page" data-id="${item.id}" aria-pressed="${item.id === selected}">${escapeText(item.title)}</button>
      <div class="subject-actions">${orderButtons(item, index, subject.pages.length, 'page')}</div></li>`).join('');
    const url = resourceUrl(page?.url);
    pages.innerHTML = `<header><h3>学科页面</h3>${button('edit-page', '新增页面')}</header>
      ${links ? `<div class="subject-page-layout"><ul class="subject-page-nav" aria-label="页面目录">${links}</ul>
      <article class="subject-page-reader"><header><h4>${escapeText(page.title)}</h4>${button('edit-page', '编辑页面', page.id)}</header>
      <div class="note-body"></div>
      ${url ? `<a class="btn btn-secondary btn-sm subject-resource-link" href="${escapeText(url)}" target="_blank" rel="noreferrer">打开资料链接 ↗</a>` : ''}
      ${page.files.length ? `<ul class="subject-file-list">${page.files.map(file => `<li>${button('download', escapeText(file.name), file.id)}</li>`).join('')}</ul>` : ''}
      </article></div>` : '<p class="subject-hint">添加讲义、复习提纲或本地文件。</p>'}`;
    if (page) renderPageBody(pages.querySelector('.subject-page-reader .note-body'), page.body);
  }

  async function change(operation) {
    if (busy) return;
    busy = true;
    try { await operation(); }
    catch (error) {
      console.warn('Subject edit failed', error);
      const message = error?.name === 'InvalidStateError' ? error.message : '操作失败，请检查文件格式和浏览器存储空间后重试。';
      if (dialog.open) {
        status.textContent = message;
        status.hidden = false;
      } else showToast(message);
    } finally {
      busy = false;
    }
  }

  async function handleAction(action, id) {
    if (action === 'subject-list') { showList(); return; }
    if (action === 'edit-subject') { editSubject(id); return; }
    if (action === 'edit-page') { editPage(id); return; }
    if (action === 'close') { dialog.close(); return; }
    if (action === 'remove-file') {
      if (!stagedFiles.delete(id)) removedFiles.add(id);
      renderFiles();
      return;
    }
    if (action === 'download') {
      const file = library.subjects.find(item => item.id === subjectId)?.pages.flatMap(page => page.files).find(item => item.id === id);
      const blob = await library.readFile(id);
      if (!file || !blob) throw new Error('找不到附件。');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
    const next = structuredClone(library.subjects);
    const subject = next.find(item => item.id === subjectId);
    if (action === 'read-page') {
      selection.set(subjectId, id);
      render(subject);
      pages.querySelector('[aria-pressed="true"]')?.focus();
      return;
    }
    if (action === 'archive-subject') {
      const card = next.find(item => item.id === id);
      card.archived = !card.archived;
    } else if (action.startsWith('subject-')) {
      move(next, id, action.endsWith('-up') ? -1 : 1);
    } else if (action === 'delete-page') {
      if (!confirm('删除这个页面及其附件？')) return;
      subject.pages = subject.pages.filter(item => item.id !== id);
    } else if (action.startsWith('page-')) {
      move(subject.pages, id, action.endsWith('-up') ? -1 : 1);
    } else return;
    await library.write(next);
    onChange();
    if (action === 'delete-page') dialog.close();
    if (action.startsWith('subject-') || action === 'archive-subject') showList();
  }

  document.addEventListener('click', event => {
    const manage = event.target.closest('[data-subject-manager]');
    if (manage) {
      if (manage.dataset.subjectManager) editSubject(manage.dataset.subjectManager);
      else showList();
      return;
    }
    const action = event.target.closest('#subject-editor [data-action], #subject-pages [data-action]');
    if (action) void change(() => handleAction(action.dataset.action, action.dataset.id));
  });

  body.addEventListener('change', event => {
    const input = event.target;
    if (!input.files?.length) return;
    if (input.name === 'attachments') {
      for (const file of input.files) stagedFiles.set('file-' + crypto.randomUUID(), file);
      input.value = '';
      renderFiles();
    } else if (input.name === 'markdownFile') {
      const file = input.files[0];
      const form = input.form;
      input.value = '';
      void change(async () => {
        const text = await file.text();
        const textarea = form.elements.markdown;
        textarea.value = textarea.value ? textarea.value + '\n\n' + text : text;
        if (!form.elements.title.value) form.elements.title.value = file.name.replace(/\.[^.]+$/, '').slice(0, 90);
      });
    }
  });

  body.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    const value = name => data.get(name).trim();
    void change(async () => {
      const next = structuredClone(library.subjects);
      let subject = next.find(item => item.id === subjectId);
      if (form.dataset.editor === 'subject') {
        const name = value('name');
        if (!name) { form.elements.name.focus(); return; }
        const isNew = !subject;
        if (!subject) {
          subject = { id:'subject-' + crypto.randomUUID(), archived:false, pages:[] };
          next.push(subject);
        }
        Object.assign(subject, { name, icon:value('icon') || '📚', category:value('category'),
          description:value('description'), color:value('color') });
        await library.write(next);
        onChange(isNew ? subject.id : undefined);
        dialog.close();
        return;
      }
      const title = value('title');
      const url = value('url');
      if (!title) { form.elements.title.focus(); return; }
      if (url && !resourceUrl(url)) {
        status.textContent = '请填写 HTTP、HTTPS 或站内链接。';
        status.hidden = false;
        form.elements.url.focus();
        return;
      }
      let page = subject.pages.find(item => item.id === pageId);
      if (!page) {
        page = { id:'page-' + crypto.randomUUID(), files:[] };
        subject.pages.push(page);
      }
      const files = page.files.filter(file => !removedFiles.has(file.id));
      for (const [id, file] of stagedFiles) files.push({ id, name:file.name });
      Object.assign(page, { title, body:data.get('markdown'), url, files });
      await library.write(next, stagedFiles);
      selection.set(subjectId, page.id);
      onChange();
      dialog.close();
    });
  });

  return { render };
}
