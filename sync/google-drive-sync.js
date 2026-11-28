import { decideSync, snapshotHash } from './sync-core.js';

const DRIVE_ORIGIN = 'https://www.googleapis.com';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const FILE_NAME = 'kotori-seika-space-sync.json';
const FILE_FIELDS = 'id,version';
const CLIENT_KEY = 'kotori-seika-drive-client-id';
const ALBUM_KEY = 'kotori-seika-drive-album';
const META_KEY = 'kotori-seika-drive-sync-v1';
const SYNC_DELAY = 10000;
const ui = {};
let account;
let accessToken = '';
let expiresAt = 0;
let busy = false;
let timer;
let sdk;

function isActive() { return window.SpaceDataBridge?.syncProvider === 'drive'; }
function clientSetting() {
  const config = window.SPACE_SYNC_CONFIG;
  if (config?.googleDriveOrigin && config.googleDriveOrigin !== location.origin) return '';
  return config?.googleDriveClientId || '';
}
function includeBackgrounds() { return localStorage.getItem(ALBUM_KEY) === '1'; }
function setStatus(message, kind = '') {
  ui.status.textContent = message;
  ui.status.dataset.kind = kind;
}

function connected() { return Boolean(account && accessToken && Date.now() < expiresAt); }

function render() {
  if (!ui.connect) return;
  const ready = connected();
  ui.account.textContent = ready ? `Google：${account.emailAddress || account.displayName || '已连接'}` : '尚未连接 Google Drive';
  ui.connect.hidden = ready;
  ui.connect.disabled = busy;
  ui.clientSettings.hidden = Boolean(ready || clientSetting());
  ui.album.disabled = busy;
  for (const button of [ui.now, ui.pull, ui.push, ui.disconnect]) {
    button.hidden = !ready;
    button.disabled = busy;
  }
}

function disconnect(message = '已断开 Google Drive。') {
  clearTimeout(timer);
  accessToken = '';
  expiresAt = 0;
  account = null;
  if (ui.status) setStatus(message);
  render();
}

function loadGoogle() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (!sdk) {
    sdk = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = resolve;
      script.onerror = () => {
        script.remove();
        reject(new Error('无法加载 Google 登录。请检查网络后重试。'));
      };
      document.head.append(script);
    }).catch(error => { sdk = null; throw error; });
  }
  return sdk;
}

async function drive(path, { method = 'GET', headers, body } = {}) {
  if (!isActive()) throw new Error('已切换同步服务。');
  const url = new URL(path, DRIVE_ORIGIN);
  if (url.origin !== DRIVE_ORIGIN) throw new Error('收到无效的 Drive 上传地址。');
  const response = await fetch(url, {
    method, body, cache:'no-store',
    headers: { ...headers, Authorization:`Bearer ${accessToken}` }
  });
  if (response.status === 401) {
    disconnect('Google 授权已过期，请重新连接。');
    throw new Error('Google 授权已过期，请重新连接。');
  }
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.error?.message || `Google Drive 请求失败（${response.status}）`);
  }
  return response;
}

async function findRemote() {
  const params = new URLSearchParams({
    spaces:'appDataFolder', q:`name = '${FILE_NAME}' and trashed = false`,
    fields:`nextPageToken,files(${FILE_FIELDS})`, pageSize:'100'
  });
  const files = [];
  do {
    const result = await (await drive(`/drive/v3/files?${params}`)).json();
    files.push(...(result.files || []));
    if (files.length > 1) throw new Error('Drive 中有多个 Space 同步文件，已暂停以保留各份数据。');
    if (!result.nextPageToken) break;
    params.set('pageToken', result.nextPageToken);
  } while (true);
  return files[0];
}

async function readRemote(file) {
  const response = await drive(`/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`);
  const payload = await response.json();
  if (payload?.kind !== 'kotori-seika-space' || payload.schemaVersion !== 1 || !payload.data) {
    throw new Error('Drive 同步文件格式不受支持。');
  }
  return payload;
}

function revision(file) { return file ? `${file.id}:${file.version}` : ''; }

async function verifyRemote(file) {
  const current = await findRemote();
  if (revision(current) !== revision(file)) throw new Error('Drive 数据已在另一台设备更新，请重新检查同步。');
}

async function upload(snapshot, file, albumEnabled) {
  const payload = { kind:'kotori-seika-space', schemaVersion:1, ...snapshot };
  if (file && !albumEnabled) {
    const previous = await readRemote(file);
    if (previous.album) payload.album = previous.album;
  }
  const media = new Blob([JSON.stringify(payload)], { type:'application/json' });
  await verifyRemote(file);
  const idPath = file ? `/${encodeURIComponent(file.id)}` : '';
  const session = await drive(`/upload/drive/v3/files${idPath}?uploadType=resumable&fields=${FILE_FIELDS}`, {
    method:file ? 'PATCH' : 'POST',
    headers:{ 'Content-Type':'application/json; charset=UTF-8', 'X-Upload-Content-Type':media.type, 'X-Upload-Content-Length':String(media.size) },
    body:file ? undefined : JSON.stringify({ name:FILE_NAME, parents:['appDataFolder'], mimeType:media.type })
  });
  const location = session.headers.get('Location');
  if (!location) throw new Error('Drive 未返回上传会话，请重试。');
  await verifyRemote(file);
  const response = await drive(location, { method:'PUT', body:media });
  return response.json();
}

function readMeta(albumEnabled) {
  try {
    const meta = JSON.parse(localStorage.getItem(META_KEY));
    if (meta?.accountId === account.permissionId && meta.clientId === account.clientId && meta.albumEnabled === albumEnabled) return meta;
  } catch { /* A missing sync baseline requires explicit direction. */ }
  return {};
}

function storeMeta(file, localHash, albumEnabled) {
  localStorage.setItem(META_KEY, JSON.stringify({
    accountId:account.permissionId, clientId:account.clientId, albumEnabled, revision:revision(file), localHash
  }));
}

async function run(mode = 'sync') {
  if (!isActive() || busy || !navigator.onLine) return;
  if (!connected()) {
    if (account) disconnect('Google 授权已过期，请重新连接。');
    return;
  }
  busy = true;
  render();
  setStatus('正在检查 Google Drive…');
  try {
    const bridge = window.SpaceDataBridge;
    const albumEnabled = includeBackgrounds();
    const options = { includeBackgrounds:albumEnabled };
    const snapshot = await bridge.exportSnapshot(options);
    const localHash = await snapshotHash(snapshot);
    const file = await findRemote();
    const meta = readMeta(albumEnabled);
    const remoteEtag = revision(file);
    const action = mode === 'sync' ? (file ? decideSync({
      remoteEtag, lastEtag:meta.revision || '', localHash, lastLocalHash:meta.localHash || ''
    }) : 'conflict') : mode;
    if (action === 'conflict') {
      setStatus(file ? '首次连接、切换图库同步或两端均有修改。请选择从 Drive 下载或上传本机数据。'
        : 'Drive 中还没有 Space 数据。请在有资料的设备点击「上传到 Drive」。', 'conflict');
      return;
    }
    if (action === 'pull' && !file) throw new Error('Drive 中还没有可下载的 Space 数据。');
    if (mode !== 'sync') {
      const message = action === 'pull' ? '从 Drive 导入数据会更新本机的同步内容。确认下载？'
        : `确认将本机同步内容${albumEnabled ? '和自定义背景图库' : ''}上传到你的 Google Drive？`;
      if (!window.confirm(message)) { setStatus('已取消同步操作。'); return; }
    }
    if (action === 'upload') {
      const updated = await upload(snapshot, file, albumEnabled);
      if (isActive() && account) storeMeta(updated, localHash, albumEnabled);
    }
    if (action === 'pull') {
      const payload = await readRemote(file);
      await verifyRemote(file);
      if (localHash !== await snapshotHash(await bridge.exportSnapshot(options))) {
        throw new Error('读取云端期间本机数据发生变化，请重新检查同步。');
      }
      if (!isActive() || !account) return;
      await bridge.importSnapshot(payload, options);
      const syncedHash = await snapshotHash(await bridge.exportSnapshot(options));
      if (isActive() && account) storeMeta(file, syncedHash, albumEnabled);
    }
    setStatus(action === 'upload' ? '本机数据已同步到 Drive。' : action === 'pull' ? '已载入 Google Drive 数据。' : '已与 Google Drive 同步。', 'ok');
  } catch (error) {
    setStatus(error.message, 'error');
  } finally { busy = false; render(); }
}

function connect() {
  if (busy || !isActive()) return;
  const clientId = (clientSetting() || ui.client.value).trim();
  if (!/^[\w-]+\.apps\.googleusercontent\.com$/.test(clientId)) {
    setStatus('请填写 Space 的 Google OAuth Web Client ID。', 'error');
    ui.client.focus();
    return;
  }
  const oauth = window.google?.accounts?.oauth2;
  if (!oauth) {
    setStatus('正在加载 Google 登录…');
    loadGoogle().then(() => setStatus('Google 登录已就绪，请点击「连接 Google Drive」。'))
      .catch(error => setStatus(error.message, 'error'));
    return;
  }
  const finish = message => { busy = false; setStatus(message, 'error'); render(); };
  busy = true;
  render();
  setStatus('请在 Google 窗口选择账号并授权。');
  try {
    localStorage.setItem(CLIENT_KEY, clientId);
    oauth.initTokenClient({
      client_id:clientId, scope:DRIVE_SCOPE, include_granted_scopes:false,
      error_callback:error => finish(error.type === 'popup_closed' ? '已关闭 Google 授权窗口。' : '无法打开 Google 授权窗口，请允许弹出窗口后重试。'),
      callback:async response => {
        if (!isActive()) { busy = false; disconnect(); return; }
        if (response.error || !response.access_token || !oauth.hasGrantedAllScopes(response, DRIVE_SCOPE)) {
          finish('Google Drive 授权未完成，请重新连接并授予应用数据访问权限。');
          return;
        }
        accessToken = response.access_token;
        expiresAt = Date.now() + Number(response.expires_in) * 1000;
        try {
          const { user } = await (await drive('/drive/v3/about?fields=user(permissionId,emailAddress,displayName)')).json();
          if (!user?.permissionId) throw new Error('Google Drive 未返回账号信息，请重新连接。');
          if (!isActive()) { busy = false; disconnect(); return; }
          account = { ...user, clientId };
        } catch (error) {
          disconnect(error.message);
          finish(error.message);
          return;
        }
        busy = false;
        render();
        await run();
      }
    }).requestAccessToken({ prompt:'select_account' });
  } catch (error) { finish(error.message); }
}

function schedule() {
  if (!isActive() || !connected()) return;
  clearTimeout(timer);
  timer = setTimeout(run, SYNC_DELAY);
}

export const driveSync = Object.freeze({
  get busy() { return busy; },
  schedule,
  requireDirection() { localStorage.removeItem(META_KEY); },
  scheduleAlbum() { if (isActive() && includeBackgrounds()) schedule(); },
  providerChanged() {
    if (!isActive()) { disconnect(); return; }
    if (!ui.connect) return;
    setStatus('用 Google 账号授权访问 Space 的应用数据目录。');
    loadGoogle().catch(error => { if (isActive()) setStatus(error.message, 'error'); });
    render();
  },
  init(panel) {
    for (const id of ['account', 'status', 'connect', 'now', 'pull', 'push', 'disconnect']) ui[id] = panel.querySelector(`#drive-${id}`);
    ui.client = panel.querySelector('#drive-client-id');
    ui.clientSettings = panel.querySelector('#drive-client-settings');
    ui.album = panel.querySelector('#drive-backgrounds');
    ui.client.value = localStorage.getItem(CLIENT_KEY) || '';
    ui.album.checked = includeBackgrounds();
    ui.album.addEventListener('change', () => {
      localStorage.setItem(ALBUM_KEY, ui.album.checked ? '1' : '0');
      if (connected()) void run();
    });
    ui.connect.addEventListener('click', connect);
    ui.now.addEventListener('click', () => run());
    ui.pull.addEventListener('click', () => run('pull'));
    ui.push.addEventListener('click', () => run('upload'));
    ui.disconnect.addEventListener('click', () => disconnect());
    window.addEventListener('online', () => run());
    document.addEventListener('visibilitychange', () => { if (!document.hidden) void run(); });
    setInterval(run, 60000);
  }
});
