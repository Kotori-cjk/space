import { createClient } from '@supabase/supabase-js';
import { decideSync, snapshotHash } from './sync-core.js';

const META_KEY = 'kotori-seika-supabase-sync-v1';
const PAUSED_KEY = 'kotori-seika-supabase-paused-v1';

let client;
let session;
let busy = false;
let timer;
let pendingRemote = null;

const ui = {};

function config() {
  return window.SPACE_SYNC_CONFIG || {};
}

function clientConfigured() {
  return /^https:\/\/.+\.supabase\.co$/i.test(String(config().supabaseUrl || '').trim())
    && String(config().supabasePublishableKey || '').trim().length > 20;
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

function setSynced(message, updatedAt) {
  const time = new Date(updatedAt).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  setStatus(`${message} · 云端更新于 ${time}`, 'ok');
}

function accountLabel() {
  const metadata = session?.user?.user_metadata || {};
  return metadata.user_name || metadata.preferred_username || session?.user?.email || '已登录 GitHub 账号';
}

function render() {
  if (!ui.connect) return;
  const configured = clientConfigured();
  const connected = Boolean(session) && !isPaused();
  ui.account.textContent = session ? `GitHub：${accountLabel()}` : '尚未登录同步账号';
  ui.connect.hidden = !configured || connected;
  ui.connect.textContent = session && isPaused() ? '恢复同步' : '使用 GitHub 登录并同步';
  ui.sync.hidden = !connected;
  ui.pause.hidden = !connected;
  ui.pull.hidden = !pendingRemote;
  ui.push.hidden = !pendingRemote;
  if (!configured) setStatus('同步服务尚未完成配置，本地保存不受影响。');
  else if (isPaused()) setStatus('跨设备同步已暂停。');
  else if (!session) setStatus('使用 GitHub 登录后，其他登录同一账号的设备会同步。');
  else if (!busy && !pendingRemote && !ui.status.textContent) setStatus('已连接，等待同步。');
}

async function localSnapshot() {
  if (!window.SpaceDataBridge) throw new Error('Space 数据接口尚未初始化。');
  return window.SpaceDataBridge.exportSnapshot();
}

async function readRemote() {
  const { data, error } = await client
    .from('space_snapshots')
    .select('payload, version, updated_at')
    .eq('user_id', session.user.id)
    .maybeSingle();
  if (error) throw error;
  return data ? { version: String(data.version), updatedAt: data.updated_at, payload: data.payload } : null;
}

async function uploadRemote(snapshot, version = '') {
  const payload = {
    kind: 'kotori-seika-space',
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    ...snapshot
  };
  if (!version) {
    const { data, error } = await client
      .from('space_snapshots')
      .insert({ user_id: session.user.id, payload })
      .select('version, updated_at')
      .single();
    if (error) {
      if (error.code === '23505') {
        const conflict = new Error('云端数据刚刚被另一台设备创建。');
        conflict.code = 'sync_conflict';
        throw conflict;
      }
      throw error;
    }
    return { version: String(data.version), updatedAt: data.updated_at };
  }
  const { data, error } = await client
    .from('space_snapshots')
    .update({ payload, version: Number(version) + 1, updated_at: new Date().toISOString() })
    .eq('user_id', session.user.id)
    .eq('version', Number(version))
    .select('version, updated_at')
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const conflict = new Error('云端数据已被另一台设备更新。');
    conflict.code = 'sync_conflict';
    throw conflict;
  }
  return { version: String(data.version), updatedAt: data.updated_at };
}

async function applyRemote(remote) {
  await window.SpaceDataBridge.importSnapshot(remote.payload);
  const localHash = await snapshotHash(await localSnapshot());
  writeMeta({ version: remote.version, updatedAt: remote.updatedAt, localHash, lastSyncedAt: new Date().toISOString() });
}

async function syncNow() {
  if (busy || isPaused() || !clientConfigured() || !session || !navigator.onLine) return;
  busy = true;
  pendingRemote = null;
  render();
  setStatus('正在检查云端数据…');
  try {
    const snapshot = await localSnapshot();
    const localHash = await snapshotHash(snapshot);
    const remote = await readRemote();
    const meta = readMeta();
    const action = decideSync({
      remoteEtag: remote?.version || '',
      lastEtag: meta.version || '',
      localHash,
      lastLocalHash: meta.localHash || ''
    });
    if (action === 'noop') {
      setSynced('已同步', meta.updatedAt || new Date().toISOString());
    } else if (action === 'upload') {
      const remoteState = await uploadRemote(snapshot, remote?.version || '');
      writeMeta({ ...remoteState, localHash, lastSyncedAt: new Date().toISOString() });
      setSynced('本机修改已同步', remoteState.updatedAt);
    } else if (action === 'pull') {
      await applyRemote(remote);
      setSynced('已载入另一台设备的更新', remote.updatedAt);
    } else {
      pendingRemote = remote;
      setStatus('检测到本机与云端都有数据，请选择保留哪一份。', 'conflict');
    }
  } catch (error) {
    console.error('Supabase sync failed', error);
    setStatus(error.code === 'sync_conflict' ? error.message : '同步失败，请稍后重试。', 'error');
  } finally {
    busy = false;
    render();
  }
}

async function forcePull() {
  if (!pendingRemote || busy) return;
  if (!window.confirm('云端数据将替换本机当前的同步内容。建议先导出本机备份。确定继续吗？')) return;
  busy = true;
  setStatus('正在使用云端数据…');
  try {
    const updatedAt = pendingRemote.updatedAt;
    await applyRemote(pendingRemote);
    pendingRemote = null;
    setSynced('已使用云端数据', updatedAt);
  } catch (error) {
    console.error(error);
    setStatus('载入云端数据失败。', 'error');
  } finally { busy = false; render(); }
}

async function forcePush() {
  if (!pendingRemote || busy) return;
  if (!window.confirm('本机数据将替换云端当前的同步内容。确定继续吗？')) return;
  busy = true;
  setStatus('正在使用本机数据更新云端…');
  try {
    const snapshot = await localSnapshot();
    const localHash = await snapshotHash(snapshot);
    const remoteState = await uploadRemote(snapshot, pendingRemote.version);
    writeMeta({ ...remoteState, localHash, lastSyncedAt: new Date().toISOString() });
    pendingRemote = null;
    setSynced('已使用本机数据更新云端', remoteState.updatedAt);
  } catch (error) {
    console.error(error);
    pendingRemote = null;
    setStatus(error.code === 'sync_conflict' ? '云端再次变化，请重新同步后选择。' : '上传本机数据失败。', 'error');
  } finally { busy = false; render(); }
}

function schedule() {
  if (!session || isPaused() || busy) return;
  clearTimeout(timer);
  timer = setTimeout(syncNow, 1800);
}

async function connect() {
  localStorage.removeItem(PAUSED_KEY);
  setStatus('正在跳转至 GitHub 登录…');
  const { error } = await client.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: `${location.origin}${location.pathname}` }
  });
  if (error) {
    console.error(error);
    setStatus('GitHub 登录未能开始。', 'error');
    render();
  }
}

function pause() {
  localStorage.setItem(PAUSED_KEY, '1');
  clearTimeout(timer);
  setStatus('跨设备同步已暂停。');
  render();
}

async function init() {
  Object.assign(ui, {
    account: document.getElementById('sync-account'),
    status: document.getElementById('sync-status'),
    connect: document.getElementById('sync-connect-btn'),
    sync: document.getElementById('sync-now-btn'),
    pull: document.getElementById('sync-pull-btn'),
    push: document.getElementById('sync-push-btn'),
    pause: document.getElementById('sync-pause-btn')
  });
  if (!ui.connect) return;
  if (!clientConfigured()) { render(); return; }
  client = createClient(config().supabaseUrl, config().supabasePublishableKey);
  session = (await client.auth.getSession()).data.session;
  client.auth.onAuthStateChange((_event, nextSession) => {
    session = nextSession;
    render();
    if (session && !isPaused()) syncNow();
  });
  ui.connect.addEventListener('click', connect);
  ui.sync.addEventListener('click', syncNow);
  ui.pull.addEventListener('click', forcePull);
  ui.push.addEventListener('click', forcePush);
  ui.pause.addEventListener('click', pause);
  window.addEventListener('online', syncNow);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncNow(); });
  setStatus('');
  render();
  if (session && !isPaused()) await syncNow();
}

window.spaceSync = Object.freeze({ init, schedule, syncNow });
