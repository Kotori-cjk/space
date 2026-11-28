(() => {
  const root = document.documentElement;
  const main = document.getElementById('main-content');
  if (!main) return;

  const catalog = document.getElementById('subject-pages');
  const shelf = document.getElementById('sidebar');
  const taskView = document.getElementById('view-tasks');
  const background = document.getElementById('bg-layer');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const animationsOn = () => !motion.matches && root.dataset.seikaMotion !== 'off';

  const room = document.createElement('section');
  room.className = 'folio-room';
  room.setAttribute('aria-label', '林间书桌');
  room.innerHTML = `
    <div class="folio-wall" aria-hidden="true"></div>
    <div class="folio-tabletop" aria-hidden="true"></div>
    <p class="folio-room-title">林间书桌<small>拉开抽屉开始阅读</small></p>
    <button class="folio-lamp" type="button" aria-pressed="false"><span>台灯</span></button>
    <div class="folio-table">
    <section class="folio-album" aria-label="桌上的影集">
      <div class="folio-album-binding">
        <button class="folio-jacket" type="button" aria-label="翻开影集，查看背景" aria-controls="folio-album-photo" aria-expanded="false">
          <span class="folio-jacket-label">翻开影集</span>
        </button>
        <div class="folio-album-photo" id="folio-album-photo" hidden>
          <div class="folio-album-leaf folio-album-left" role="img" aria-label="书桌背景左页"><span class="folio-photo-print"></span></div>
          <div class="folio-album-leaf folio-album-right" role="img" aria-label="书桌背景右页"><span class="folio-photo-print"></span></div>
        </div>
        <button type="button" class="folio-quill" aria-label="拨动羽毛笔"></button>
      </div>
      <button type="button" class="folio-shut-album" hidden>合上影集</button>
    </section>
    <section class="folio-book" id="folio-book" aria-label="桌上的书" hidden>
      <div class="folio-binding">
        <div class="folio-viewport" tabindex="0" aria-label="书页"><div class="folio-leaf-content"></div></div>
        <button type="button" class="folio-quill" aria-label="拨动羽毛笔"></button>
      </div>
      <div class="folio-controls" aria-label="翻页">
        <button type="button" data-step="-1" aria-label="上一页">‹ 上一页</button>
        <div><button type="button" class="folio-return" hidden>待办</button><output class="folio-folio" aria-live="polite"></output></div>
        <button type="button" data-step="1" aria-label="下一页">下一页 ›</button>
      </div>
    </section>
    </div>`;

  const wall = room.querySelector('.folio-wall');
  const lamp = room.querySelector('.folio-lamp');
  const table = room.querySelector('.folio-table');
  const album = room.querySelector('.folio-album');
  const albumBinding = room.querySelector('.folio-album-binding');
  const jacket = room.querySelector('.folio-jacket');
  const photo = room.querySelector('.folio-album-photo');
  const shutAlbum = room.querySelector('.folio-shut-album');
  const albumQuill = album.querySelector('.folio-quill');
  const book = room.querySelector('.folio-book');
  const binding = room.querySelector('.folio-binding');
  const viewport = room.querySelector('.folio-viewport');
  const pageContent = viewport.firstElementChild;
  const counter = room.querySelector('output');
  const previous = room.querySelector('[data-step="-1"]');
  const next = room.querySelector('[data-step="1"]');
  const overview = room.querySelector('.folio-return');
  const toolbar = document.getElementById('header');
  toolbar.classList.add('folio-toolbar');
  const mobile = matchMedia('(max-width: 800px)');
  function sizePaper() {
    room.style.setProperty('--screen-height', `${innerHeight}px`);
  }
  window.addEventListener('resize', sizePaper);
  sizePaper();
  const grid = main.closest('.main-layout');
  grid.before(room);
  room.append(grid);
  grid.classList.add('folio-grid');
  grid.append(table);
  shelf.classList.add('folio-shelf');
  const heading = document.createElement('p');
  heading.className = 'folio-shelf-title';
  heading.textContent = '学科抽屉';
  shelf.prepend(heading);
  pageContent.append(main);
  document.body.classList.add('folio-live');
  function positionShelf() {
    room.style.setProperty('--rail-list-height', `${Math.max(145, innerHeight - toolbar.offsetHeight - 200)}px`);
    room.style.setProperty('--rail-top', `${toolbar.offsetHeight + 15}px`);
  }
  new ResizeObserver(positionShelf).observe(toolbar);
  window.addEventListener('resize', positionShelf);
  document.addEventListener('DOMContentLoaded', () => {
    const shade = document.querySelector('.seika-drawer-shade');
    if (shade) room.append(shade);
  }, { once: true });

  let drawer = null;
  let pending;
  let revealAnimation;
  let stopTurn;
  let turning = false;
  let forwarded = false;
  let selectingPage = false;
  let leaf = 0;
  let wheelTotal = 0;
  let wheelAt = 0;
  let touchStart;
  let selectedTask = null;
  let selectedTaskIndex = null;
  const taskCardId = card => card.querySelector('[data-task-move]')?.dataset.taskMove;
  const taskBook = () => main.dataset.room === 'tasks';

  function fitPaper() {
    if (turning || book.hidden) return;
    const { paddingTop, paddingBottom } = getComputedStyle(viewport);
    const needed = Math.ceil(pageContent.offsetHeight + parseFloat(paddingTop) + parseFloat(paddingBottom));
    book.style.setProperty('--content-height', `${needed}px`);
  }
  new ResizeObserver(fitPaper).observe(pageContent);

  function lampPosition() {
    const width = wall.clientWidth;
    const height = wall.clientHeight;
    const imageWidth = Math.max(width, height * 2.5);
    const imageHeight = imageWidth / 2.5;
    room.style.setProperty('--lamp-x', `${imageWidth * .892 - (imageWidth - width) * .75}px`);
    room.style.setProperty('--lamp-y', `${imageHeight * .477}px`);
  }
  new ResizeObserver(lampPosition).observe(wall);

  function syncLamp() {
    const dark = root.dataset.seikaTheme === 'dark';
    lamp.setAttribute('aria-pressed', String(dark));
    lamp.setAttribute('aria-label', dark ? '台灯，切换白天' : '台灯，切换夜晚');
    lamp.title = dark ? '切换白天' : '切换夜晚';
  }

  lamp.addEventListener('click', () => {
    const mode = root.dataset.seikaTheme === 'dark' ? 'light' : 'dark';
    const field = document.querySelector('.seika-appearance-fields [name="theme"]');
    if (!field) root.dataset.seikaTheme = mode;
    else {
      field.value = mode;
      field.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  new MutationObserver(syncLamp).observe(root, { attributes: true, attributeFilter: ['data-seika-theme'] });
  syncLamp();

  for (const quill of room.querySelectorAll('.folio-quill')) {
    let sway;
    quill.addEventListener('click', () => {
      sway?.cancel();
      sway = animationsOn()
        ? quill.animate([
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(-16deg) translateY(-3px)', offset: .23 },
          { transform: 'rotate(11deg) translateY(1px)', offset: .52 },
          { transform: 'rotate(-5deg)', offset: .76 },
          { transform: 'rotate(0deg)' }
        ], { duration: 540, easing: 'ease-out' })
        : quill.animate([{ filter: 'brightness(1.45)' }, { filter: 'none' }], { duration: 220 });
    });
  }

  if (background) {
    let selectedImage;
    const syncAlbumImage = () => {
      const image = background.style.backgroundImage;
      if (image === selectedImage) return;
      selectedImage = image;
      function applyImage(value, ratio) {
        if (image !== selectedImage) return;
        if (ratio) album.style.setProperty('--album-ratio', ratio);
        else album.style.removeProperty('--album-ratio');
        for (const print of album.querySelectorAll('.folio-photo-print')) print.style.backgroundImage = value;
      }
      const url = /^url\("(.*)"\)$/.exec(image)?.[1];
      if (!url) {
        applyImage('');
        return;
      }
      const picture = new Image();
      picture.onload = () => applyImage(image, picture.naturalWidth / picture.naturalHeight);
      picture.onerror = () => applyImage('');
      picture.src = url;
    };
    new MutationObserver(syncAlbumImage).observe(background, { attributes: true, attributeFilter: ['style'] });
    syncAlbumImage();
  }

  function decorateDrawers() {
    for (const node of shelf.querySelectorAll('.subject-btn')) {
      if (node.querySelector('.folio-label')) continue;
      const label = document.createElement('span');
      label.className = 'folio-label';
      label.textContent = Array.from(node.childNodes)
        .filter(child => child.nodeType === Node.TEXT_NODE)
        .map(child => child.textContent.trim()).join(' ').trim();
      node.replaceChildren(label);
      if (node.tagName !== 'A') {
        node.setAttribute('aria-controls', book.id);
        node.setAttribute('aria-expanded', 'false');
      }
    }
    if (drawer && !shelf.contains(drawer)) closeDrawer();
  }

  function markDrawer(node) {
    if (drawer) {
      delete drawer.dataset.pulled;
      if (drawer.tagName !== 'A') drawer.setAttribute('aria-expanded', 'false');
    }
    drawer = node;
    if (!drawer) return;
    drawer.dataset.pulled = '';
    if (drawer.tagName !== 'A') drawer.setAttribute('aria-expanded', 'true');
  }

  function showBook(show, animate = true) {
    revealAnimation?.cancel();
    room.toggleAttribute('data-open', show);
    book.hidden = !show;
    album.hidden = show;
    if (!show) {
      setAlbum(false);
      return;
    }
    fitPaper();
    if (!animate || !animationsOn()) return;
    revealAnimation = book.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 260,
      easing: 'cubic-bezier(.27,.66,.3,1)'
    });
  }

  function closeDrawer() {
    clearTimeout(pending);
    stopTurn?.();
    markDrawer(null);
    showBook(false);
  }

  function pages() {
    if (taskBook()) {
      const todo = taskView.querySelector('.task-todo');
      return todo ? [todo, ...taskView.querySelectorAll('.task-card')] : [];
    }
    if (!main.dataset.room || catalog.hidden) return [];
    return [...catalog.querySelectorAll('.subject-page-link'), null];
  }

  function updateControls() {
    const total = pages().length;
    previous.disabled = turning || leaf === 0;
    next.disabled = turning || leaf >= total - 1;
    overview.hidden = !taskBook() || leaf === 0;
    overview.disabled = turning;
    counter.textContent = total ? `${leaf + 1} / ${total}` : '1 / 1';
  }

  function selectLeaf(index, scroll = true) {
    const page = pages()[index];
    leaf = index;
    if (taskBook()) {
      taskView.dataset.folioTaskPage = index ? 'detail' : 'overview';
      taskView.querySelector('.folio-task-active')?.classList.remove('folio-task-active');
      if (index) page.classList.add('folio-task-active');
      selectedTask = index ? taskCardId(page) ?? selectedTask : null;
      selectedTaskIndex = index ? page.dataset.taskIdx : null;
      if (scroll) {
        taskView.removeAttribute('data-folio-calendar');
        taskView.querySelector('.folio-calendar-toggle')?.setAttribute('aria-expanded', 'false');
      }
    } else {
      main.dataset.folioLeaf = page ? 'reading' : 'notes';
      if (page && page.getAttribute('aria-pressed') !== 'true') {
        const documentPosition = scrollY;
        selectingPage = true;
        page.click();
        selectingPage = false;
        viewport.focus({ preventScroll: true });
        if (scrollY !== documentPosition) window.scrollTo({ top: documentPosition, behavior: 'instant' });
      }
    }
    if (scroll) viewport.scrollTop = 0;
    fitPaper();
    updateControls();
  }

  function openDrawer(animate = true) {
    if (!drawer) return;
    stopTurn?.();
    if (taskBook()) selectLeaf(0);
    else {
      const index = pages().findIndex(page => page?.getAttribute('aria-pressed') === 'true');
      selectLeaf(Math.max(0, index));
    }
    showBook(true, animate);
  }

  shelf.addEventListener('click', event => {
    const node = event.target.closest('.subject-btn');
    if (!node || forwarded || event.defaultPrevented || event.button !== 0 ||
        event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (drawer === node) {
      closeDrawer();
      if (mobile.matches) toolbar.querySelector('.seika-sidebar-control[aria-expanded="true"]')?.click();
      return;
    }
    clearTimeout(pending);
    stopTurn?.();
    markDrawer(node);
    pending = setTimeout(() => {
      if (!node.isConnected || drawer !== node) return;
      forwarded = true;
      node.click();
      forwarded = false;
    }, animationsOn() ? 235 : 0);
  }, true);

  document.addEventListener('seika:open-room', event => {
    const button = drawer;
    const enter = event.detail.enter;
    event.detail.enter = () => {
      enter();
      if (button && button === drawer) openDrawer();
    };
    queueMicrotask(() => {
      // Space enters synchronously when the door animation is disabled.
      if (!event.defaultPrevented && button && button === drawer) openDrawer();
    });
  }, true);
  new MutationObserver(decorateDrawers).observe(shelf, { childList: true, subtree: true });
  catalog.addEventListener('click', event => {
    const chapter = event.target.closest('.subject-page-link');
    if (!chapter || selectingPage) return;
    const index = pages().indexOf(chapter);
    if (index < 0) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void turnTo(index);
  }, true);
  new MutationObserver(() => {
    if (book.hidden || turning || !drawer) return;
    const items = pages();
    const index = items.findIndex(page => page?.getAttribute('aria-pressed') === 'true');
    if (main.dataset.folioLeaf !== 'notes') leaf = Math.max(0, index);
    else leaf = Math.max(0, items.length - 1);
    updateControls();
  }).observe(catalog, { childList: true, attributes: true, attributeFilter: ['hidden'] });
  window.addEventListener('pageshow', event => {
    if (event.persisted && drawer?.tagName === 'A') closeDrawer();
  });

  function syncTasks() {
    if (!taskBook() || !drawer) return;
    const index = selectedTask === null ? 0 : pages().findIndex((card, position) => position > 0 &&
      (taskCardId(card) === selectedTask || (card.matches('.task-card-edit') && card.dataset.taskIdx === selectedTaskIndex)));
    selectLeaf(Math.max(0, index), false);
    const groupList = taskView.querySelector('.task-list-heading');
    if (!groupList) return;
    const indexList = document.createElement('ol');
    indexList.className = 'folio-task-index';
    for (const card of pages().slice(1)) {
      const title = card.querySelector('.task-title');
      if (!title) continue;
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.folioTask = taskCardId(card);
      button.textContent = title.textContent;
      item.append(button);
      indexList.append(item);
    }
    taskView.querySelector('.folio-task-index')?.remove();
    if (indexList.childElementCount) groupList.after(indexList);
    if (!taskView.querySelector('.folio-calendar-toggle')) {
      const button = document.createElement('button');
      button.className = 'folio-calendar-toggle';
      button.type = 'button';
      button.textContent = '日历与索引';
      button.setAttribute('aria-controls', 'task-browser-sidebar');
      button.setAttribute('aria-expanded', 'false');
      taskView.querySelector('.task-workspace-heading').append(button);
    }
  }
  new MutationObserver(records => {
    if (records.some(({target}) => target === taskView || target.id === 'task-list')) syncTasks();
  }).observe(taskView, { childList: true, subtree: true });
  taskView.addEventListener('click', event => {
    const toggle = event.target.closest('.folio-calendar-toggle');
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(taskView.toggleAttribute('data-folio-calendar')));
      return;
    }
    const todo = event.target.closest('[data-task-todo-open],[data-folio-task]');
    const group = event.target.closest('[data-task-group-scroll]');
    const filter = event.target.closest('[data-task-index-mode],[data-task-calendar-date],[data-task-calendar-today],[data-task-clear-date]');
    if (!todo && !group && !filter) return;
    queueMicrotask(() => {
      if (filter) {
        selectLeaf(0, false);
        return;
      }
      const index = todo
        ? pages().findIndex(card => taskCardId(card) === (todo.dataset.taskTodoOpen || todo.dataset.folioTask))
        : pages().findIndex(card => card.parentElement.id === `task-group-${encodeURIComponent(group.dataset.taskGroupScroll)}`);
      if (index > 0) void turnTo(index);
    });
  });
  taskView.addEventListener('dragstart', event => {
    if (!event.target.closest('[data-task-move]')) return;
    if (!taskView.hasAttribute('data-folio-calendar')) taskView.querySelector('.folio-calendar-toggle')?.click();
    const toggle = taskView.querySelector('[data-task-calendar-toggle][aria-expanded="false"]');
    toggle?.click();
  });

  async function turnTo(index) {
    if (turning || book.hidden || index < 0 || index >= pages().length || index === leaf) return;
    wheelTotal = 0;
    if (!animationsOn() || !window.OpenPageFlip) {
      selectLeaf(index);
      return;
    }

    function snapshot() {
      const frame = document.createElement('div');
      frame.className = 'folio-fold-page';
      const copy = viewport.cloneNode(true);
      copy.querySelectorAll('[id]').forEach(node => {
        if (['subject-header','subject-pages','view-tasks','view-notes'].includes(node.id)) {
          const live = document.getElementById(node.id);
          if (getComputedStyle(live).display === 'none') node.style.display = 'none';
          else if (node.id === 'subject-pages') node.classList.add('folio-snapshot-reader');
        }
        node.removeAttribute('id');
      });
      frame.append(copy);
      return { frame, copy, scroll: viewport.scrollTop };
    }

    turning = true;
    updateControls();
    const backwards = index < leaf;
    const before = snapshot();
    selectLeaf(index);
    const after = snapshot();
    await flipPages(binding, backwards ? [after, before] : [before, after], backwards, () => {
      turning = false;
      fitPaper();
      updateControls();
    });
  }

  async function flipPages(surface, sequence, backwards, onFinish, spread = false) {
    const sheet = document.createElement('div');
    sheet.className = 'folio-turn';
    sheet.inert = true;
    sheet.setAttribute('aria-hidden', 'true');
    const host = document.createElement('div');
    sheet.append(host);
    host.append(...sequence.map(page => page.frame));
    surface.append(sheet);
    let engine;
    const dispose = (finished = false) => {
      engine?.destroy();
      sheet.remove();
      stopTurn = undefined;
      onFinish(finished);
    };
    stopTurn = dispose;
    try {
      const bounds = sheet.getBoundingClientRect();
      engine = window.OpenPageFlip.createBook(host, {
        width: spread ? bounds.width / 2 : surface.clientWidth,
        height: spread ? bounds.height : surface.clientHeight,
        layout: spread ? 'spread' : 'single',
        cover: spread,
        startPage: backwards ? 1 : 0,
        flipDuration: spread ? 820 : 600,
        shadowOpacity: .40,
        easing: time => time * time * (3 - 2 * time),
        autoSize: false,
        click: 'off',
        drag: false,
        swipe: false,
        hover: false
      });
      if (spread) {
        // Move the narrow binding from the centred cover to the centre of the spread.
        const slide = progress => {
          const remaining = backwards ? progress : 1 - progress;
          sheet.style.setProperty('--album-slide', `${-bounds.width / 4 * remaining}px`);
        };
        slide(0);
        engine.on('flipProgress', ({ progress }) => slide(progress));
      }
      for (const page of sequence) if (page.copy) page.copy.scrollTop = page.scroll;
      await (backwards ? engine.flipPrev('bottom') : engine.flipNext('bottom'));
    } finally {
      if (stopTurn === dispose) dispose(true);
    }
  }

  function setAlbum(open) {
    album.toggleAttribute('data-open', open);
    jacket.setAttribute('aria-expanded', String(open));
    jacket.hidden = open;
    photo.hidden = !open;
    shutAlbum.hidden = !open;
    albumQuill.hidden = open;
  }

  async function turnAlbum(open) {
    if (stopTurn || album.hidden || open === jacket.hidden) return;
    const commit = () => {
      setAlbum(open);
      const control = open ? shutAlbum : jacket;
      control.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      control.focus({ preventScroll: true });
    };
    if (!animationsOn() || !window.OpenPageFlip) {
      commit();
      return;
    }
    const side = 'max(0px, var(--album-wing))';
    const bottom = 'max(0px, calc(var(--photo-height) - var(--cover-height)))';
    const folded = { clipPath: `inset(0 ${side} ${bottom} ${side} round 6px)` };
    const unfolded = { clipPath: 'inset(0 0 round 6px)' };
    const foldTiming = { duration: 250, easing: 'cubic-bezier(.32,.1,.29,1)' };
    if (!open) {
      const retract = photo.animate([unfolded, folded], { ...foldTiming, fill: 'forwards' });
      stopTurn = () => {
        stopTurn = undefined;
        retract.cancel();
      };
      try {
        await retract.finished;
      } catch {
        return;
      }
      album.setAttribute('data-flipping', '');
      retract.cancel();
    }
    const cover = jacket.cloneNode(true);
    cover.hidden = false;
    const [left, right] = Array.from(photo.querySelectorAll('.folio-album-leaf'), leaf => leaf.cloneNode(true));
    left.dataset.density = 'hard';
    // Solo covers are paired with a back board so the two inner pages form one spread.
    const back = document.createElement('div');
    back.className = 'folio-jacket';
    album.setAttribute('data-flipping', '');
    void flipPages(albumBinding, [cover, left, right, back].map(frame => ({ frame })), !open, finished => {
      album.removeAttribute('data-flipping');
      if (!finished) return;
      commit();
      if (open) photo.animate([folded, unfolded], foldTiming);
    }, true);
  }

  function canTurnAtEdge(step) {
    const bounds = viewport.getBoundingClientRect();
    if (step < 0) return leaf > 0 && viewport.scrollTop <= 1 && bounds.top >= toolbar.offsetHeight - 2;
    return leaf < pages().length - 1 && bounds.bottom <= innerHeight + 2 &&
      viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= 2;
  }

  viewport.addEventListener('wheel', event => {
    if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
    const step = Math.sign(event.deltaY);
    if (!step) return;
    if (turning) {
      event.preventDefault();
      return;
    }
    if (!canTurnAtEdge(step)) {
      wheelTotal = 0;
      return;
    }
    event.preventDefault();
    if (event.timeStamp - wheelAt > 220 || Math.sign(wheelTotal) !== step) wheelTotal = 0;
    wheelAt = event.timeStamp;
    wheelTotal += event.deltaY * (event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? 220 : 1);
    if (Math.abs(wheelTotal) >= 72) void turnTo(leaf + step);
  }, { passive: false });

  viewport.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) return;
    touchStart = { y: event.touches[0].clientY, back: canTurnAtEdge(-1), forward: canTurnAtEdge(1) };
  }, { passive: true });
  viewport.addEventListener('touchend', event => {
    if (!touchStart) return;
    const dy = touchStart.y - event.changedTouches[0].clientY;
    if (dy > 56 && touchStart.forward) void turnTo(leaf + 1);
    if (dy < -56 && touchStart.back) void turnTo(leaf - 1);
    touchStart = undefined;
  }, { passive: true });
  viewport.addEventListener('touchcancel', () => { touchStart = undefined; });
  viewport.addEventListener('keydown', event => {
    if (event.target !== viewport || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    void turnTo(leaf + (event.key === 'ArrowRight' ? 1 : -1));
  });
  previous.addEventListener('click', () => void turnTo(leaf - 1));
  next.addEventListener('click', () => void turnTo(leaf + 1));
  overview.addEventListener('click', () => void turnTo(0));
  document.addEventListener('seika:show-album', event => {
    event.preventDefault();
    if (album.hidden) closeDrawer();
    if (jacket.hidden) shutAlbum.scrollIntoView({ block: 'nearest' });
    else void turnAlbum(true);
  });
  jacket.addEventListener('click', () => turnAlbum(true));
  shutAlbum.addEventListener('click', () => turnAlbum(false));

  decorateDrawers();
})();
