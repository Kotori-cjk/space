(function () {
  const config = window.SPACE_GATE_CONFIG;
  const accessKey = 'kotori-space-gate-v1';
  const form = document.getElementById('gate-form');
  const input = document.getElementById('gate-password');
  const message = document.getElementById('gate-message');
  const params = new URLSearchParams(location.search);

  if (params.get('logout') === '1') localStorage.removeItem(accessKey);

  function decodeBase64(value) {
    return Uint8Array.from(atob(value), character => character.charCodeAt(0));
  }

  function encodeBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  }

  async function derive(password) {
    const material = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    return crypto.subtle.deriveBits({
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: decodeBase64(config.salt),
      iterations: config.iterations
    }, material, 256);
  }

  function safeNext() {
    const next = params.get('next') || '';
    if (!next) return './';
    const rootUrl = new URL('./', location.href);
    const targetUrl = new URL(next, rootUrl);
    if (targetUrl.origin !== rootUrl.origin || !targetUrl.pathname.startsWith(rootUrl.pathname)) return './';
    return targetUrl.href;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    message.textContent = '验证中…';
    form.querySelector('button').disabled = true;
    try {
      const candidate = encodeBase64(await derive(input.value));
      if (candidate !== config.hash) {
        message.textContent = '密码不正确。';
        input.select();
        return;
      }
      localStorage.setItem(accessKey, JSON.stringify({
        hash: config.hash,
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000
      }));
      location.replace(safeNext());
    } catch (_) {
      message.textContent = '浏览器无法完成验证。';
    } finally {
      form.querySelector('button').disabled = false;
    }
  });
})();
