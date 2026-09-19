(() => {
  'use strict';
  const root = new URL('../', document.currentScript.src);
  const key = 'kotori-seika-appearance-v1';
  let prefs = { theme: 'light', accent: 'green', motion: true };
  try { prefs = { ...prefs, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch {}
  const media = matchMedia('(prefers-color-scheme: dark)');
  const mobile = matchMedia('(max-width:800px)');
  function apply() {
    const mode = prefs.theme === 'system' ? (media.matches ? 'dark' : 'light') : prefs.theme;
    document.documentElement.dataset.seikaTheme = mode;
    if (document.getElementById('theme-toggle')) document.documentElement.dataset.theme = mode;
    document.documentElement.dataset.seikaAccent = prefs.accent;
    document.documentElement.dataset.seikaMotion = prefs.motion ? 'on' : 'off';
  }
  function save() { try { localStorage.setItem(key, JSON.stringify(prefs)); } catch {} apply(); }
  apply();
  media.addEventListener('change', apply);
  window.addEventListener('storage', event => { if (event.key === key) { try { prefs = { ...prefs, ...JSON.parse(event.newValue || '{}') }; apply(); } catch {} } });
  document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('header');
    const sidebar = document.getElementById('sidebar');
    const pathname = location.pathname;
    const area = pathname.includes('/algorithm/') || pathname.includes('/code-analysis/') ? 'algorithm' : pathname.includes('/cs-learning/') ? 'cs' : 'space';
    const toolbar = header || document.createElement('header');
    if (!header) { toolbar.className = 'seika-toolbar'; toolbar.innerHTML = `<a class="seika-brand" href="${root.href}">葉 Kotori's Seika</a>`; document.body.prepend(toolbar); document.body.classList.add('seika-document'); }
    const nav = document.createElement('nav'); nav.className = 'seika-nav'; nav.setAttribute('aria-label', '学习站导航');
    nav.innerHTML = [['space', '', '学习空间'], ['algorithm', 'algorithm/', '算法'], ['cs', 'cs-learning/', 'CS Learning']].map(([id, url, name]) => `<a href="${new URL(url, root)}" ${id === area ? 'class="active" aria-current="page"' : ''}>${name}</a>`).join('');
    toolbar.append(nav);
    const controls = document.createElement('div'); controls.className = 'seika-controls';
    controls.innerHTML = '<button class="seika-control" type="button" aria-label="切换深浅主题" title="切换深浅主题">◐</button><button class="seika-control" type="button" aria-label="外观设置" title="外观设置">⚙</button>';
    toolbar.append(controls);
    controls.children[0].addEventListener('click', () => { prefs.theme = document.documentElement.dataset.seikaTheme === 'dark' ? 'light' : 'dark'; save(); });
    const banner = document.createElement('section'); banner.className = 'seika-banner'; banner.setAttribute('aria-label', '学习空间插画');
    banner.innerHTML = '<div class="seika-banner-copy"><small>KOTORI’S LEARNING SPACE</small><p>风经过的地方，<br>知识也在慢慢生长。</p><span>日々、少しずつ。</span></div>';
    toolbar.after(banner);
    if (area !== 'space') banner.classList.add('compact');
    const bg = document.getElementById('bg-layer');
    if (bg) {
      const sync = () => { if (bg.style.backgroundImage && bg.style.backgroundImage !== 'none') banner.style.backgroundImage = `linear-gradient(90deg,#e3f4eef2,#e3f4ee8a 48%,transparent),${bg.style.backgroundImage}`; else banner.style.removeProperty('background-image'); };
      new MutationObserver(sync).observe(bg, { attributes: true, attributeFilter: ['style'] }); sync();
    }
    if (sidebar) {
      const profile = document.createElement('section'); profile.className = 'seika-profile';
      profile.innerHTML = `<img src="${new URL('theme/avatar.webp', root)}" alt="Kotori 头像"><strong>Kotori</strong><p>Learning is a colorful journey.</p>`;
      sidebar.prepend(profile);
      const button = document.createElement('button'); button.type = 'button'; button.className = 'seika-control'; button.setAttribute('aria-controls', 'sidebar'); toolbar.prepend(button);
      const shade = document.createElement('button'); shade.className = 'seika-drawer-shade'; shade.setAttribute('aria-label', '关闭侧栏'); document.body.append(shade);
      const collapseKey = area === 'space' ? 'kotori-seika-sidebar-collapsed' : `kotori-${area}-sidebar-collapsed`;
      let collapsed = false; try { collapsed = localStorage.getItem(collapseKey) === 'true'; } catch {}
      document.body.classList.toggle('sidebar-collapsed', collapsed);
      function update() { const expanded = mobile.matches ? document.body.classList.contains('seika-drawer-open') : !document.body.classList.contains('sidebar-collapsed'); button.textContent = expanded ? '◧' : '☰'; button.setAttribute('aria-expanded', String(expanded)); button.setAttribute('aria-label', expanded ? '收起侧栏' : '展开侧栏'); sidebar.inert = !expanded; }
      function close() { document.body.classList.remove('seika-drawer-open'); update(); }
      button.addEventListener('click', () => { if (mobile.matches) document.body.classList.toggle('seika-drawer-open'); else { collapsed = document.body.classList.toggle('sidebar-collapsed'); try { localStorage.setItem(collapseKey, String(collapsed)); } catch {} } update(); });
      shade.addEventListener('click', close); document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
      sidebar.addEventListener('click', e => { if (mobile.matches && e.target.closest('a, .subject-btn, .day-btn')) close(); });
      mobile.addEventListener('change', close); update();
    }
    const dialog = document.createElement('dialog'); dialog.className = 'seika-appearance';
    dialog.innerHTML = '<form method="dialog"><h2>外观设置</h2><label>显示模式<select name="theme"><option value="light">浅色</option><option value="dark">深色</option><option value="system">跟随系统</option></select></label><label>主题色<select name="accent"><option value="green">浅绿</option><option value="blue">天蓝</option></select></label><label>淡入淡出与悬停浮起<input name="motion" type="checkbox"></label><button type="submit">完成</button></form>';
    document.body.append(dialog);
    controls.children[1].addEventListener('click', () => { dialog.querySelector('[name=theme]').value = prefs.theme; dialog.querySelector('[name=accent]').value = prefs.accent; dialog.querySelector('[name=motion]').checked = prefs.motion; dialog.showModal(); });
    dialog.addEventListener('change', e => { prefs[e.target.name] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; save(); });
    function closeDialog(e) { e.preventDefault(); if (!prefs.motion || matchMedia('(prefers-reduced-motion:reduce)').matches) { dialog.close(); return; } dialog.classList.add('seika-closing'); setTimeout(() => { dialog.close(); dialog.classList.remove('seika-closing'); }, 160); }
    dialog.addEventListener('submit', closeDialog); dialog.addEventListener('cancel', closeDialog);
    // The Lab already owns its theme button; mirror its visual state without touching its progress.
    const labToggle = document.getElementById('theme-toggle');
    if (labToggle) {
      apply();
      labToggle.addEventListener('click', () => { prefs.theme = document.documentElement.dataset.theme || 'light'; save(); });
    }
  });
})();
