(function () {
  const config = window.SPACE_GATE_CONFIG;
  const scriptUrl = new URL(document.currentScript.src);
  const rootUrl = new URL('./', scriptUrl);
  const accessKey = 'kotori-space-gate-v1';

  window.SpaceGate = Object.freeze({
    logout() {
      localStorage.removeItem(accessKey);
      location.replace(new URL('login.html?logout=1', rootUrl).href);
    }
  });

  document.documentElement.classList.add('space-gate-pending');
  const style = document.createElement('style');
  style.textContent = 'html.space-gate-pending{visibility:hidden!important}';
  document.head.appendChild(style);

  let access;
  try { access = JSON.parse(localStorage.getItem(accessKey) || 'null'); } catch (_) { access = null; }
  if (config && access?.hash === config.hash && access.expires > Date.now()) {
    document.documentElement.classList.remove('space-gate-pending');
    return;
  }

  localStorage.removeItem(accessKey);
  const currentUrl = new URL(location.href);
  const next = currentUrl.pathname.startsWith(rootUrl.pathname)
    ? currentUrl.pathname.slice(rootUrl.pathname.length) + currentUrl.search + currentUrl.hash
    : '';
  const loginUrl = new URL('login.html', rootUrl);
  if (next) loginUrl.searchParams.set('next', next);
  location.replace(loginUrl.href);
})();
