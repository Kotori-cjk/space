export const SPACE_STATE_KEY = 'kotori-seika-v1';
export const IMAGE_STORE = 'images';
const MATERIAL_STORE = 'materials';
const CATALOG_KEY = 'catalog';
const COLORS = { green:'草绿', blue:'天蓝', plum:'淡紫', amber:'暖棕' };

export function openSpaceDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('kotori-seika-images', 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IMAGE_STORE)) db.createObjectStore(IMAGE_STORE);
      db.createObjectStore(MATERIAL_STORE);
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
}

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
    const url = new URL(value, import.meta.url);
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
    if (subject.url != null && subject.url !== '' && !resourceUrl(subject.url)) throw new Error('学科跳转地址不正确。');
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

function validateProjectLinks(links) {
  if (links == null) return;
  if (!Array.isArray(links) || links.some(link =>
    typeof link?.title !== 'string' || !link.title.trim() || !resourceUrl(link.url) || typeof link.localOnly !== 'boolean'
  )) throw new Error('项目跳转链接格式不正确。');
}

function legacyCard(subject) {
  return { ...subject, description:'', archived:false, pages:[] };
}

function fileIds(subjects) {
  return subjects.flatMap(subject => subject.pages.flatMap(page => page.files.map(file => file.id)));
}

export async function openSubjectLibrary(db) {
  function read(key) {
    return new Promise((resolve, reject) => {
      const request = db.transaction(MATERIAL_STORE).objectStore(MATERIAL_STORE).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  let catalog = await read(CATALOG_KEY);
  if (!catalog) {
    catalog = { revision:0, subjects:[] };
  }
  let { subjects, revision, projectLinks = null } = catalog;

  async function write(next, files = new Map(), replace = false, nextProjectLinks = projectLinks) {
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
        store.put({ revision:nextRevision, subjects:next, projectLinks:nextProjectLinks }, CATALOG_KEY);
      };
      transaction.oncomplete = resolve;
      transaction.onabort = () => reject(stale ? new DOMException('学科目录已在另一处更新，请刷新后再编辑。', 'InvalidStateError') : transaction.error);
    });
    subjects = next;
    revision = nextRevision;
    projectLinks = nextProjectLinks;
  }

  // The first local-first release wrote an empty catalog at revision 1.
  if (!revision || (revision === 1 && !subjects.length)) {
    try { await write(LEGACY_SUBJECTS.map(legacyCard)); }
    catch (error) {
      if (error.name !== 'InvalidStateError') throw error;
      ({ subjects, revision, projectLinks = null } = await read(CATALOG_KEY));
    }
  }

  return {
    get subjects() { return subjects; },
    get projectLinks() { return projectLinks; },
    readFile: read,
    async restoreLegacy(ids) {
      const present = new Set(subjects.map(subject => subject.id));
      const missing = LEGACY_SUBJECTS.filter(subject => ids.has(subject.id) && !present.has(subject.id));
      if (missing.length) await write([...subjects, ...missing.map(legacyCard)]);
    },
    async exportBackup() {
      const catalog = subjects;
      const links = projectLinks;
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
      return { version:1, subjects:catalog, files, projectLinks:links ?? undefined };
    },
    async importBackup(backup) {
      if (backup?.version !== 1) throw new Error('学科备份版本不受支持。');
      validateCatalog(backup.subjects);
      validateProjectLinks(backup.projectLinks);
      const files = new Map();
      for (const id of fileIds(backup.subjects)) {
        const data = backup.files?.[id];
        if (typeof data !== 'string' || !/^data:[^,]*;base64,/i.test(data)) throw new Error('备份缺少有效附件。');
        const response = await fetch(data);
        files.set(id, await response.blob());
      }
      await write(backup.subjects, files, true, backup.projectLinks ?? null);
    }
  };
}

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}

export function setupSubjectPages(library, renderBody, onError) {
  const region = document.getElementById('subject-pages');
  const selection = new Map();
  let subject;

  function render(next) {
    subject = next;
    region.hidden = !subject?.pages.length;
    if (region.hidden) return;
    const page = subject.pages.find(item => item.id === selection.get(subject.id)) || subject.pages[0];
    const links = subject.pages.map(item => `<li>
      <button type="button" class="subject-page-link" data-action="read-page" data-id="${item.id}" aria-pressed="${item.id === page?.id}">${escapeText(item.title)}</button>
    </li>`).join('');
    const url = resourceUrl(page?.url);
    region.innerHTML = `<header><h3>学科页面</h3></header>
      ${page ? `<div class="subject-page-layout"><ul class="subject-page-nav" aria-label="页面目录">${links}</ul>
      <article class="subject-page-reader"><header><h4>${escapeText(page.title)}</h4></header>
      <div class="note-body"></div>
      ${url ? `<a class="btn btn-secondary btn-sm subject-resource-link" href="${escapeText(url)}" target="_blank" rel="noreferrer">打开资料链接 ↗</a>` : ''}
      ${page.files.length ? `<ul class="subject-file-list">${page.files.map(file => `<li><button class="btn btn-secondary btn-sm" type="button" data-action="download" data-id="${file.id}">${escapeText(file.name)}</button></li>`).join('')}</ul>` : ''}
      </article></div>` : '<p class="subject-hint">还没有学科页面。</p>'}`;
    if (page) renderBody(region.querySelector('.subject-page-reader .note-body'), page.body);
  }

  region.addEventListener('click', async event => {
    const button = event.target.closest('[data-action]');
    if (!button || !subject) return;
    const { action, id } = button.dataset;
    if (action === 'read-page') {
      selection.set(subject.id, id);
      render(subject);
      region.querySelector('[aria-pressed="true"]')?.focus();
    }
    if (action !== 'download') return;
    try {
      const file = subject.pages.flatMap(page => page.files).find(item => item.id === id);
      const blob = await library.readFile(id);
      if (!file || !blob) throw new Error('找不到附件。');
      downloadBlob(blob, file.name);
    } catch {
      onError('附件读取失败，请刷新后重试。');
    }
  });

  return { render };
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readSubjectPack(file) {
  const payload = JSON.parse(await file.text());
  return payload?.subjectLibrary ?? payload;
}
