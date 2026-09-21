import { decideSync, snapshotHash } from './sync-core.js';

const API_ROOT = 'https://api.github.com';
const TOKEN_KEY = 'kotori-seika-gist-token-v1';
const META_KEY = 'kotori-seika-gist-sync-v1';
const GIST_ID_KEY = 'kotori-seika-gist-id-v1';
const PAUSED_KEY = 'kotori-seika-gist-paused-v1';
const SYNC_DELAY = 10000;

let account = null;
let busy = false;
let timer;
let poller;
let pendingAction = null;

const ui = {};

function config() {
  return window.SPACE_SYNC_CONFIG || {};
}

function configured() {
  return Boolean(config().githubGistDescription && config().githubGistFileName);
}

function token() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

function isPaused() {
  return localStorage.getItem(PAUSED_KEY) === '1';
}

function readMeta() {
  try { return JSON.parse(localStorage.getItem(META_KEY) || '{}'); }
  catch { return {}; }
}

function writeMeta(value) {
  localStorage.setItem(META_KEY, JSON.stringify(value));
}

function setStatus(message, kind = '') {
  if (!ui.status) return;
  ui.status.textContent = message;
  ui.status.dataset.kind = kind;
}

function errorText(error, fallback) {
  const details = [error?.code && `[${error.code}]`, error?.message].filter(Boolean).join(' · ');
  return details ? details.slice(0, 220) : fallback;
}

function snapshotSummary(snapshot) {
  const data = snapshot?.data || {};
  const taskCount = Array.isArray(data.tasks) ? data.tasks.length : 0;
  const noteCount = Object.values(data.notes || {}).reduce((total, notes) => total + Object.keys(notes || {}).length, 0);
  return `含 ${taskCount} 条任务、${noteCount} 篇笔记`;
}

function snapshotSize(snapshot) {
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot)).byteLength;
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function setSynced(message, updatedAt, snapshot) {
  const time = new Date(updatedAt).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  setStatus(`${message} · 云端${snapshotSummary(snapshot)} · 更新于 ${time}`, 'ok');
}

function render() {
  if (!ui.connect) return;
  const connected = Boolean(account) && !isPaused();
  ui.account.textContent = account ? `GitHub：${account.login}` : '尚未连接 GitHub Gist';
  ui.tokenRow.hidden = Boolean(account);
  ui.connect.hidden = !configured() || connected;
  ui.connect.textContent = account && isPaused() ? '恢复同步' : '连接 GitHub Gist';
  ui.sync.hidden = !connected;
  ui.pull.hidden = !connected;
  ui.push.hidden = !connected;
  ui.pause.hidden = !connected;
  if (!configured()) setStatus('GitHub Gist 同步尚未完成配置，本地保存不受影响。');
  else if (isPaused()) setStatus('GitHub Gist 同步已暂停。');
  else if (!account) setStatus('粘贴仅含 gist 权限的 GitHub Token 后即可同步。');
  else if (!busy && !pendingAction && !ui.status.textContent) setStatus('已连接，等待同步。');
}

async function github(path, options = {}, accessToken = token()) {
  const { body, headers = {}, ...requestOptions } = options;
  const response = await fetch(`${API_ROOT}${path}`, {
    ...requestOptions,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (!response.ok) {
    let detail = {};
    try { detail = await response.json(); } catch { /* ignore non-JSON error body */ }
    const error = new Error(detail.message || `GitHub API ${response.status}`);
    error.code = response.status;
    throw error;
  }
  return response;
}

async function localSnapshot() {
  if (!window.SpaceDataBridge) throw new Error('Space 数据接口尚未初始化。');
  return window.SpaceDataBridge.exportSnapshot({ includeImages: false });
}

function storedGistId() {
  return localStorage.getItem(GIST_ID_KEY) || '';
}

function isSyncGist(gist) {
  return gist?.description === config().githubGistDescription && Boolean(gist.files?.[config().githubGistFileName]);
}

async function getGist(id) {
  const response = await github(`/gists/${encodeURIComponent(id)}`);
  return response.json();
}

async function findGist() {
  const id = storedGistId();
  if (id) {
    try {
      const gist = await getGist(id);
      if (isSyncGist(gist)) return gist;
    } catch (error) {
      if (error.code !== 404) throw error;
    }
    localStorage.removeItem(GIST_ID_KEY);
  }
  const response = await github('/gists?per_page=100');
  const gists = await response.json();
  const gist = gists.find(isSyncGist) || null;
  if (gist) localStorage.setItem(GIST_ID_KEY, gist.id);
  return gist;
}

async function readRemote() {
  const gist = await findGist();
  if (!gist) return null;
  const file = gist.files?.[config().githubGistFileName];
  if (!file || file.truncated) throw new Error('同步文件超过 GitHub Gist 的单文件读取上限。');
  const payload = JSON.parse(file.content);
  return { revision: gist.updated_at, updatedAt: gist.updated_at, payload };
}

async function uploadRemote(snapshot) {
  const payload = {
    kind: 'kotori-seika-space',
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    ...snapshot
  };
  const content = JSON.stringify(payload);
  const gist = await findGist();
  let response;
  if (!gist) {
    response = await github('/gists', {
      method: 'POST',
      body: {
        description: config().githubGistDescription,
        public: false,
        files: { [config().githubGistFileName]: { content } }
      }
    });
  } else {
    response = await github(`/gists/${encodeURIComponent(gist.id)}`, {
      method: 'PATCH',
      body: { files: { [config().githubGistFileName]: { content } } }
    });
  }
  const updated = await response.json();
  localStorage.setItem(GIST_ID_KEY, updated.id);
  return { revision: updated.updated_at, updatedAt: updated.updated_at };
}

async function applyRemote(remote) {
  await window.SpaceDataBridge.importSnapshot(remote.payload);
  const localHash = await snapshotHash(await localSnapshot());
  writeMeta({ revision: remote.revision, updatedAt: remote.updatedAt, localHash, lastSyncedAt: new Date().toISOString() });
}

async function syncNow() {
  if (busy || pendingAction || isPaused() || !account || !navigator.onLine) return;
  busy = true;
  render();
  setStatus('正在检查 GitHub Gist…');
  try {
    const snapshot = await localSnapshot();
    const localHash = await snapshotHash(snapshot);
    const remote = await readRemote();
    const meta = readMeta();
    const action = decideSync({
      remoteEtag: remote?.revision || '',
      lastEtag: meta.revision || '',
      localHash,
      lastLocalHash: meta.localHash || ''
    });
    if (action === 'noop') {
      setSynced('已同步', meta.updatedAt || new Date().toISOString(), remote?.payload || snapshot);
    } else if (action === 'upload') {
      const remoteState = await uploadRemote(snapshot);
      writeMeta({ ...remoteState, localHash, lastSyncedAt: new Date().toISOString() });
      setSynced('本机修改已同步', remoteState.updatedAt, snapshot);
    } else if (action === 'pull') {
      await applyRemote(remote);
      setSynced('已载入另一台设备的更新', remote.updatedAt, remote.payload);
    } else {
      setStatus(`此设备本机${snapshotSummary(snapshot)}；请明确选择“从云端下载数据”或“上传本机数据到云端”。`, 'conflict');
    }
  } catch (error) {
    console.error('GitHub Gist sync failed', error);
    setStatus(`同步失败：${errorText(error, '请稍后重试。')}`, 'error');
  } finally { busy = false; render(); }
}

function showConfirmation(action, message) {
  pendingAction = action;
  ui.confirmMessage.textContent = message;
  ui.confirm.hidden = false;
}

function clearConfirmation(message = '') {
  pendingAction = null;
  ui.confirm.hidden = true;
  if (message) setStatus(message);
}

async function downloadRemote() {
  if (busy || pendingAction) return;
  busy = true;
  setStatus('正在读取云端数据…');
  try {
    const remote = await readRemote();
    if (!remote) throw new Error('云端还没有同步数据，请先在有数据的设备上传。');
    showConfirmation({ type: 'download', remote }, `云端${snapshotSummary(remote.payload)}，将替换本机当前同步内容。建议先导出本机备份，再确认下载。`);
    setStatus('请确认是否从云端下载数据。');
  } catch (error) {
    console.error(error);
    setStatus(`从云端下载数据失败：${errorText(error, '未知原因')}`, 'error');
  } finally { busy = false; render(); }
}

async function uploadLocal() {
  if (busy || pendingAction) return;
  busy = true;
  setStatus('正在准备上传本机数据…');
  try {
    const snapshot = await localSnapshot();
    showConfirmation({ type: 'upload', snapshot }, `将本机${snapshotSummary(snapshot)}（同步包约 ${snapshotSize(snapshot)}）上传到 GitHub Gist，并覆盖当前云端数据。请确认执行。`);
    setStatus('请确认是否上传本机数据。');
  } catch (error) {
    console.error(error);
    setStatus(`上传本机数据失败：${errorText(error, '未知原因')}`, 'error');
  } finally { busy = false; render(); }
}

async function confirmAction() {
  const action = pendingAction;
  if (!action || busy) return;
  clearConfirmation();
  busy = true;
  try {
    if (action.type === 'download') {
      setStatus('正在从云端下载数据…');
      await applyRemote(action.remote);
      setSynced('已从云端下载数据', action.remote.updatedAt, action.remote.payload);
    } else {
      setStatus('正在上传本机数据…');
      const localHash = await snapshotHash(action.snapshot);
      const remoteState = await uploadRemote(action.snapshot);
      writeMeta({ ...remoteState, localHash, lastSyncedAt: new Date().toISOString() });
      setSynced('已上传本机数据', remoteState.updatedAt, action.snapshot);
    }
  } catch (error) {
    console.error(error);
    setStatus(action.type === 'upload'
      ? `上传本机数据失败：${errorText(error, '未知原因')}`
      : `从云端下载数据失败：${errorText(error, '未知原因')}`, 'error');
  } finally { busy = false; render(); }
}

function schedule() {
  if (!account || isPaused() || busy || pendingAction) return;
  clearTimeout(timer);
  timer = setTimeout(syncNow, SYNC_DELAY);
}

async function connect() {
  localStorage.removeItem(PAUSED_KEY);
  const accessToken = ui.tokenInput.value.trim() || token();
  if (!accessToken) {
    setStatus('请粘贴仅含 gist 权限的 GitHub Token。', 'error');
    return;
  }
  busy = true;
  let connected = false;
  setStatus('正在验证 GitHub Token…');
  try {
    const response = await github('/user', {}, accessToken);
    account = await response.json();
    localStorage.setItem(TOKEN_KEY, accessToken);
    ui.tokenInput.value = '';
    connected = true;
  } catch (error) {
    console.error(error);
    setStatus(`GitHub Token 无法使用：${errorText(error, '请重新创建。')}`, 'error');
  } finally { busy = false; render(); }
  if (connected) await syncNow();
}

function pause() {
  localStorage.setItem(PAUSED_KEY, '1');
  clearTimeout(timer);
  setStatus('GitHub Gist 同步已暂停。');
  render();
}

async function init() {
  Object.assign(ui, {
    account: document.getElementById('sync-account'),
    status: document.getElementById('sync-status'),
    tokenRow: document.getElementById('sync-token-row'),
    tokenInput: document.getElementById('sync-token-input'),
    connect: document.getElementById('sync-connect-btn'),
    sync: document.getElementById('sync-now-btn'),
    pull: document.getElementById('sync-pull-btn'),
    push: document.getElementById('sync-push-btn'),
    pause: document.getElementById('sync-pause-btn'),
    confirm: document.getElementById('sync-confirm'),
    confirmMessage: document.getElementById('sync-confirm-message'),
    confirmYes: document.getElementById('sync-confirm-yes'),
    confirmNo: document.getElementById('sync-confirm-no')
  });
  if (!ui.connect || !configured()) { render(); return; }
  ui.connect.addEventListener('click', connect);
  ui.sync.addEventListener('click', syncNow);
  ui.pull.addEventListener('click', downloadRemote);
  ui.push.addEventListener('click', uploadLocal);
  ui.pause.addEventListener('click', pause);
  ui.confirmYes.addEventListener('click', confirmAction);
  ui.confirmNo.addEventListener('click', () => clearConfirmation('已取消，本机和云端数据均未修改。'));
  window.addEventListener('online', syncNow);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncNow(); });
  poller = window.setInterval(syncNow, 60000);
  setStatus('');
  if (token()) await connect();
  else render();
}

window.spaceSync = Object.freeze({ init, schedule, syncNow });
