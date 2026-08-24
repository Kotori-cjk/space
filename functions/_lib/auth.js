const COOKIE_NAME = 'kotori_space_session';
const SESSION_SECONDS = 7 * 24 * 60 * 60;

function base64Url(bytes) {
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signature(value, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return base64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))));
}

function readCookie(request) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match?.[1] || '';
}

export async function createSessionCookie(secret) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const value = `${expires}.${await signature(String(expires), secret)}`;
  return `${COOKIE_NAME}=${value}; Max-Age=${SESSION_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

export async function hasValidSession(request, secret) {
  if (!secret) return false;
  const [expiresText, supplied] = readCookie(request).split('.');
  const expires = Number(expiresText);
  if (!expires || expires < Math.floor(Date.now() / 1000) || !supplied) return false;
  return supplied === await signature(expiresText, secret);
}

export function safeNext(value) {
  const next = String(value || '/');
  return next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

export function loginPage(next = '/', error = '') {
  const safePath = safeNext(next).replace(/[&<>"]/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[character]);
  const message = error ? '<p class="error">密码不正确，请再试一次。</p>' : '<p>登录状态将在此 Space 主机保存 7 天。</p>';
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>进入 Colorful Seika</title><style>html{color-scheme:light}body{min-height:100vh;margin:0;display:grid;place-items:center;padding:20px;box-sizing:border-box;background:linear-gradient(135deg,#fff5f8,#edf6f2);color:#493f51;font-family:system-ui,"Noto Sans SC",sans-serif}.card{width:min(390px,100%);padding:34px;box-sizing:border-box;background:#fffdf9;border:1px solid #eadde2;box-shadow:0 24px 70px #74586b24}.eyebrow{color:#ae5576;font-size:12px;letter-spacing:.15em}.icon{font-size:34px}h1{margin:.4em 0;color:#527d70}p{color:#756d7c;line-height:1.7}.error{color:#b22f55}input,button{width:100%;min-height:48px;box-sizing:border-box;font:inherit}input{margin:10px 0;padding:0 14px;border:1px solid #d9ccd2;background:white}button{border:0;background:#527d70;color:white;cursor:pointer}</style></head><body><main class="card"><div class="icon">🔐</div><p class="eyebrow">KOTORI'S PRIVATE SPACE</p><h1>进入 Colorful Seika</h1>${message}<form method="post" action="/auth/login"><input name="password" type="password" autocomplete="current-password" placeholder="Password" required autofocus><input name="next" type="hidden" value="${safePath}"><button type="submit">确认进入</button></form></main></body></html>`;
}
