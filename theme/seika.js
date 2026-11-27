(() => {
  'use strict';
  const root = new URL('../', document.currentScript.src);
  const key = 'kotori-seika-appearance-v1';
  let prefs = { theme: 'light', accent: 'green', motion: true };
  try { prefs = { ...prefs, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch {}
  const media = matchMedia('(prefers-color-scheme: dark)');
  const mobile = matchMedia('(max-width:800px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const rippleTargets = 'button, [role="button"], summary, .header-btn, .seika-nav a, .subject-link, .seika-article-toc a, .post-card a';
  let ripplet;
  let updateBannerWater = () => {};
  // Versioned browser distributions are served locally with their upstream licenses.
  import(new URL('theme/vendor/ripplet-1.1.0/ripplet.js', root)).then(module => { ripplet = module.default; })
    .catch(error => console.warn('Space click effect unavailable', error));

  function addRipple(event, keyboard = false) {
    if (!ripplet || !prefs.motion || reducedMotion.matches) return;
    const target = event.target.closest(rippleTargets);
    if (!target || target.closest('[inert], [draggable="true"]') || target.matches(':disabled, [aria-disabled="true"]') || !target.offsetWidth || !target.offsetHeight) return;
    const localLayer = target.closest('dialog[open], #sidebar, .modal.active, .modal.open, .image-lightbox');
    const effect = ripplet({ currentTarget:target, clientX:event.clientX, clientY:event.clientY }, {
      centered:keyboard,
      appendTo:localLayer ? 'parent' : 'body',
      color:'var(--seika-ripple)', opacity:.26,
      spreadingDuration:'420ms', spreadingTimingFunction:'cubic-bezier(.2,.62,.28,1)',
      clearingDuration:'470ms', clearingDelay:'60ms'
    });
    if (effect) {
      effect.classList.add('seika-click-effect');
      effect.setAttribute('aria-hidden', 'true');
      setTimeout(() => effect.remove(), 650);
    }
  }

  function initBannerWater(banner) {
    if (!('IntersectionObserver' in window)) return;
    let visible = false;
    let loading = false;
    let water;
    const shouldAnimate = () => visible && !document.hidden && prefs.motion && !reducedMotion.matches;
    updateBannerWater = async () => {
      if (!shouldAnimate()) { water?.pause(); return; }
      if (water) { water.resume(); return; }
      if (loading || water === null) return;
      loading = true;
      try {
        const { createLiquidRipple } = await import(new URL('theme/vendor/liquid-ripple-0.1.1/index.js', root));
        if (!shouldAnimate()) return;
        const canvas = document.createElement('canvas');
        canvas.className = 'seika-banner-water';
        canvas.setAttribute('aria-hidden', 'true');
        banner.prepend(canvas);
        water = createLiquidRipple(canvas, {
          palette:{ top:'#b6e2d0', bottom:'#82b9b3', glint:'#fff6e3' },
          wave:{ swell:.38, amplitude:.21, caustics:.17, specular:.55 },
          speed:.63, ambient:3700, interactive:false, maxRipples:4, dprCap:.6
        });
        if (!water) canvas.remove();
      } catch (error) {
        banner.querySelector('.seika-banner-water')?.remove();
        water = null;
        console.warn('Space banner effect unavailable', error);
      } finally { loading = false; }
    };
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updateBannerWater();
    }).observe(banner);
    document.addEventListener('visibilitychange', updateBannerWater);
    reducedMotion.addEventListener('change', () => updateBannerWater());
  }

  function initRoomDoors(nav, sidebar) {
    const doors = document.createElement('div');
    doors.className = 'seika-doorway';
    doors.hidden = true;
    doors.setAttribute('aria-hidden', 'true');
    doors.innerHTML = '<div class="seika-door-frame"><div class="seika-door-leaf"></div></div>';
    document.body.append(doors);
    const frame = doors.querySelector('.seika-door-frame');
    const leaf = doors.querySelector('.seika-door-leaf');
    const entries = [...(nav?.querySelectorAll('a') || []), ...(sidebar?.querySelectorAll('[data-subject], .subject-link') || [])];
    entries.forEach(entry => {
      const icon = document.createElement('span');
      icon.className = 'seika-door-icon';
      icon.setAttribute('aria-hidden', 'true');
      const originalIcon = entry.querySelector('.subj-icon');
      if (originalIcon) originalIcon.replaceWith(icon);
      else entry.prepend(icon);
    });

    function open(enter, subject) {
      if (!prefs.motion || reducedMotion.matches || !leaf.animate) return false;
      if (!doors.hidden) return true;
      doors.dataset.room = subject;
      doors.hidden = false;
      doors.animate([{ opacity:0 }, { opacity:1 }], { duration:145, fill:'both' });
      leaf.animate([
        { transform:'rotateY(0)' },
        { transform:'rotateY(0)', offset:.19 },
        { transform:'rotateY(87deg)' }
      ], { duration:385, easing:'cubic-bezier(.36,.08,.2,1)', fill:'both' }).finished.then(() => {
        enter();
        frame.animate([{ transform:'scale(1)' }, { transform:'scale(1.24)' }], { duration:240, easing:'ease-out' });
        return doors.animate([{ opacity:1 }, { opacity:0 }], { duration:240, fill:'both' }).finished;
      }).catch(error => console.warn('Space room entry unavailable', error)).finally(() => {
        doors.hidden = true;
        [...doors.getAnimations(), ...leaf.getAnimations()].forEach(animation => animation.cancel());
      });
      return true;
    }

    document.addEventListener('seika:open-room', event => {
      if (open(event.detail.enter, event.detail.subject)) event.preventDefault();
    });
    entries.filter(entry => entry.matches('a[href]')).forEach(link => {
      link.addEventListener('click', event => {
        if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.target || link.href === location.href) return;
        const path = new URL(link.href).pathname;
        const project = path.startsWith(new URL('algorithm/', root).pathname) || path.startsWith(new URL('cs-learning/', root).pathname);
        if (open(() => location.assign(link.href), project ? 'cs-project' : 'math-ode')) event.preventDefault();
      });
    });
  }

  function apply() {
    const mode = prefs.theme === 'system' ? (media.matches ? 'dark' : 'light') : prefs.theme;
    document.documentElement.dataset.seikaTheme = mode;
    if (document.getElementById('theme-toggle')) document.documentElement.dataset.theme = mode;
    document.documentElement.dataset.seikaAccent = prefs.accent;
    document.documentElement.dataset.seikaMotion = prefs.motion ? 'on' : 'off';
    updateBannerWater();
  }
  function save() { try { localStorage.setItem(key, JSON.stringify(prefs)); } catch {} apply(); }

  function initAppearance(toolbar, projectRoom, settingsBody) {
    const fields = document.createElement('div');
    fields.className = 'seika-appearance-fields';
    fields.innerHTML = '<label>显示模式<select name="theme"><option value="light">浅色</option><option value="dark">深色</option><option value="system">跟随系统</option></select></label><label>主题色<select name="accent"><option value="green">浅绿</option><option value="blue">天蓝</option></select></label><label>淡入淡出、悬停与涟漪<input name="motion" type="checkbox"></label>';
    const theme = fields.querySelector('[name="theme"]');
    const accent = fields.querySelector('[name="accent"]');
    const motion = fields.querySelector('[name="motion"]');
    function syncFields() {
      theme.value = prefs.theme;
      accent.value = prefs.accent;
      motion.checked = prefs.motion;
    }
    fields.addEventListener('change', () => {
      prefs = { theme:theme.value, accent:accent.value, motion:motion.checked };
      save();
    });

    if (settingsBody) {
      const group = document.createElement('section');
      group.className = 'settings-group';
      group.innerHTML = '<h3>外观</h3>';
      group.append(fields);
      settingsBody.prepend(group);
      document.getElementById('settings-btn').addEventListener('click', syncFields);
      syncFields();
      return;
    }

    const controls = document.createElement('div');
    controls.className = 'seika-controls';
    const appearanceButton = '<button class="seika-control" type="button" aria-label="外观设置" title="外观设置">⚙</button>';
    controls.innerHTML = projectRoom ? appearanceButton : '<button class="seika-control seika-theme-toggle" type="button" aria-label="切换深浅主题" title="切换深浅主题">◐</button>' + appearanceButton;
    controls.querySelector('.seika-theme-toggle')?.addEventListener('click', () => {
      prefs.theme = document.documentElement.dataset.seikaTheme === 'dark' ? 'light' : 'dark';
      save();
    });
    toolbar.append(controls);

    const dialog = document.createElement('dialog');
    dialog.className = 'seika-appearance';
    dialog.innerHTML = '<form method="dialog"><h2>外观设置</h2><button type="submit">完成</button></form>';
    dialog.querySelector('button').before(fields);
    document.body.append(dialog);
    controls.lastElementChild.addEventListener('click', () => { syncFields(); dialog.showModal(); });
    function closeDialog(e) { e.preventDefault(); if (!prefs.motion || reducedMotion.matches) { dialog.close(); return; } dialog.classList.add('seika-closing'); setTimeout(() => { dialog.close(); dialog.classList.remove('seika-closing'); }, 160); }
    dialog.addEventListener('submit', closeDialog);
    dialog.addEventListener('cancel', closeDialog);
  }

  apply();
  media.addEventListener('change', apply);
  window.addEventListener('storage', event => { if (event.key === key) { try { prefs = { ...prefs, ...JSON.parse(event.newValue || '{}') }; apply(); } catch {} } });
  document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('pointerdown', event => {
      if (event.isPrimary && event.button === 0) addRipple(event);
    });
    document.addEventListener('click', event => {
      if (event.detail === 0) addRipple(event, true);
    }, true);
    const room = document.querySelector('.seika-study-space #main-content');
    room?.addEventListener('seika:room-change', () => {
      if (!prefs.motion || reducedMotion.matches) return;
      const heading = room.dataset.room === 'tasks' ? null : room.querySelector('#subject-header');
      const view = room.querySelector('.view-content.active');
      [heading, view].filter(Boolean).forEach(element => {
        element.getAnimations().forEach(animation => {
          if (animation.id === 'room-entry') animation.cancel();
        });
        const entry = element.animate([{ opacity:.42, transform:'translateY(8px)' }, { opacity:1, transform:'none' }], {
          duration:390, easing:'cubic-bezier(.2,.7,.2,1)'
        });
        entry.id = 'room-entry';
      });
    });
    const header = document.getElementById('header');
    const sidebar = document.getElementById('sidebar');
    const pathname = location.pathname;
    const area = pathname.includes('/algorithm/') || pathname.includes('/code-analysis/') ? 'algorithm' : pathname.includes('/cs-learning/') ? 'cs' : 'space';
    const projectRoom = document.body.classList.contains('seika-project-room');
    const toolbar = header || document.createElement('header');
    if (!header) {
      toolbar.className = 'seika-toolbar';
      toolbar.innerHTML = projectRoom ? '<span class="seika-brand">CS Learning</span>' : `<a class="seika-brand" href="${root.href}">葉 Kotori's Seika</a>`;
      document.body.prepend(toolbar);
      document.body.classList.add('seika-document');
    }
    let nav;
    if (!room) {
      nav = document.createElement('nav');
      nav.className = 'seika-nav';
      nav.setAttribute('aria-label', '学习站导航');
      const destinations = [['space', '', '学习空间']];
      if (window.SPACE_PUBLIC !== true) destinations.push(['algorithm', 'algorithm/', '算法'], ['cs', 'cs-learning/', 'CS Learning']);
      nav.innerHTML = destinations
        .filter(([id]) => !projectRoom || id !== area)
        .map(([id, url, name]) => `<a href="${new URL(url, root)}" ${id === area ? 'class="active" aria-current="page"' : ''}>${name}</a>`).join('');
      toolbar.append(nav);
    }
    if (room || projectRoom) initRoomDoors(nav, sidebar);
    initAppearance(toolbar, projectRoom, room || projectRoom ? document.querySelector('#settings-modal .modal-body') : null);
    const banner = document.createElement('section'); banner.className = 'seika-banner'; banner.setAttribute('aria-label', '学习空间插画');
    if (room) {
      banner.setAttribute('aria-hidden', 'true');
    } else if (projectRoom) {
      banner.innerHTML = `<div class="seika-banner-copy"><p>${area === 'algorithm' ? '算法研习室' : '计算机研习室'}</p></div>`;
    } else {
      banner.innerHTML = '<div class="seika-banner-copy"><small>KOTORI’S LEARNING SPACE</small><p>风经过的地方，<br>知识也在慢慢生长。</p><span>日々、少しずつ。</span></div>';
    }
    toolbar.after(banner);
    if (area !== 'space') banner.classList.add('compact');
    else if (header) initBannerWater(banner);
    if (!header && prefs.motion && !reducedMotion.matches && 'IntersectionObserver' in window) {
      const reveal = new IntersectionObserver(entries => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return;
          target.classList.add('seika-revealed');
          reveal.unobserve(target);
        });
      });
      document.querySelectorAll('.post-card, .catalog-card, .question-card, .problem-card').forEach(card => reveal.observe(card));
    }
    if (pathname.includes('/algorithm/notes/')) {
      const article = document.querySelector('.markdown-preview');
      const headings = article ? [...article.querySelectorAll('h1, h2, h3')] : [];
      if (headings.length) {
        const usedIds = new Set();
        headings.forEach((heading, index) => {
          const base = heading.id || `section-${index + 1}`;
          let id = base, suffix = 2;
          while (usedIds.has(id)) id = `${base}-${suffix++}`;
          usedIds.add(id);
          heading.id = id;
        });
        const toc = document.createElement('nav');
        toc.className = 'seika-article-toc';
        toc.setAttribute('aria-label', '文章目录');
        toc.innerHTML = `<strong>文章目录</strong><div>${headings.map(heading => `<a class="toc-level-${heading.tagName.slice(1)}" href="#${encodeURIComponent(heading.id)}">${heading.textContent.trim() || '未命名章节'}</a>`).join('')}</div>`;
        const layout = document.createElement('div');
        layout.className = 'seika-article-layout';
        article.before(layout);
        layout.append(toc, article);
      }
    }
    const bg = document.getElementById('bg-layer');
    if (bg) {
      const sync = () => {
        const image = bg.style.backgroundImage;
        if (image && image !== 'none') banner.style.setProperty('--seika-banner-art', image);
        else banner.style.removeProperty('--seika-banner-art');
      };
      new MutationObserver(sync).observe(bg, { attributes: true, attributeFilter: ['style'] }); sync();
    }
    if (sidebar) {
      const profile = document.createElement('section'); profile.className = 'seika-profile';
      profile.innerHTML = `<img src="${new URL('theme/avatar.webp', root)}" alt="Kotori 头像">${room ? '<strong>Kotori 的小屋</strong>' : '<strong>Kotori</strong><p>Learning is a colorful journey.</p>'}`;
      sidebar.prepend(profile);
      const button = document.createElement('button'); button.type = 'button'; button.className = 'seika-control seika-sidebar-control'; button.setAttribute('aria-controls', 'sidebar'); toolbar.prepend(button);
      const shade = document.createElement('button'); shade.className = 'seika-drawer-shade'; shade.setAttribute('aria-label', '关闭侧栏'); document.body.append(shade);
      const dismiss = document.createElement('button'); dismiss.type = 'button'; dismiss.className = 'seika-control seika-drawer-dismiss'; dismiss.textContent = '收起左侧栏'; sidebar.prepend(dismiss);
      const collapseKey = area === 'space' ? 'kotori-seika-sidebar-collapsed' : `kotori-${area}-sidebar-collapsed`;
      let collapsed = false; try { collapsed = localStorage.getItem(collapseKey) === 'true'; } catch {}
      document.body.classList.toggle('sidebar-collapsed', collapsed);
      function update() { const expanded = mobile.matches ? document.body.classList.contains('seika-drawer-open') : !document.body.classList.contains('sidebar-collapsed'); button.textContent = expanded ? '◧' : '☰'; button.title = expanded ? '收起左侧栏' : '展开左侧栏'; button.setAttribute('aria-expanded', String(expanded)); button.setAttribute('aria-label', button.title); sidebar.inert = !expanded; }
      function close() { document.body.classList.remove('seika-drawer-open'); update(); }
      button.addEventListener('click', () => { if (mobile.matches) document.body.classList.toggle('seika-drawer-open'); else { collapsed = document.body.classList.toggle('sidebar-collapsed'); try { localStorage.setItem(collapseKey, String(collapsed)); } catch {} } update(); if (mobile.matches && document.body.classList.contains('seika-drawer-open')) dismiss.focus(); });
      function dismissDrawer() { close(); button.focus(); }
      shade.addEventListener('click', dismissDrawer);
      dismiss.addEventListener('click', dismissDrawer);
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('seika-drawer-open')) dismissDrawer(); });
      sidebar.addEventListener('click', e => { if (mobile.matches && e.target.closest('a, .subject-btn, .day-btn')) close(); });
      mobile.addEventListener('change', close); update();
    }
    // The Lab already owns its theme button; mirror its visual state without touching its progress.
    const labToggle = document.getElementById('theme-toggle');
    if (labToggle) {
      apply();
      labToggle.addEventListener('click', () => { prefs.theme = document.documentElement.dataset.theme || 'light'; save(); });
    }
  });
})();
