/* Presentation layer for the captured configurator. Native Vue nodes and handlers stay intact. */
(() => {
  'use strict';
  const stylesheet = new URL('./styles/module-picker.css?v=1', document.currentScript.src).href;
  const wired = new WeakSet();
  const filters = new WeakMap();
  const categories = ['전체', '오픈형', '도어', '서랍', '유리'];
  const labels = {
    'Open element': '오픈형 모듈', 'Open with back panel': '오픈형 · 뒷판',
    'Open with side panel': '오픈형 · 옆판', 'Open with back/side panel': '오픈형 · 뒷판 / 옆판',
    'Flap down': '아래로 여는 도어', 'Flap down handle': '아래로 여는 도어 · 손잡이',
    'Flap down handle/key': '아래로 여는 도어 · 잠금 손잡이',
    'Flap upwards': '위로 여는 도어', 'Flap upwards handle': '위로 여는 도어 · 손잡이',
    'Double glass doors': '양문형 유리 도어', 'Glass door right': '오른쪽 유리 도어',
    'Glass door left': '왼쪽 유리 도어', 'Double doors/Handle': '양문 도어 · 손잡이',
    'Door/Handle right': '오른쪽 도어 · 손잡이', 'Door/Handle left': '왼쪽 도어 · 손잡이',
    'Double door': '양문 도어', 'Door right': '오른쪽 도어', 'Door left': '왼쪽 도어',
    'Drawer': '서랍', 'Drawer handle': '서랍 · 손잡이', 'Drawer handle/key': '서랍 · 잠금 손잡이',
    'Double drawer': '2단 서랍', 'Double drawer handle': '2단 서랍 · 손잡이',
    '와이드 서랍': '2단 서랍', 'Close element': '막힌 모듈',
    'Delete Panel': '패널 삭제', 'Delete Bar': '프레임 바 삭제',
    'Hole': '홀 손잡이', 'Handle': '일반 손잡이', 'Handle Key': '잠금 손잡이',
  };
  const categoryFor = name => /삭제/.test(name) ? '편집' : /유리/.test(name) ? '유리' : /서랍/.test(name) ? '서랍' : /도어/.test(name) ? '도어' : '오픈형';
  let root, queued = false;

  function setAttribute(node, name, value) {
    if (node.getAttribute(name) !== String(value)) node.setAttribute(name, value);
  }
  function disabled(card) {
    return card.classList.contains('pointer-events-none') || card.parentElement.classList.contains('pointer-events-none');
  }
  function wireCard(card, name, kind) {
    setAttribute(card, 'data-bf-card', kind);
    setAttribute(card, 'role', 'button');
    setAttribute(card, 'aria-label', name);
    const isDisabled = disabled(card);
    setAttribute(card, 'aria-disabled', isDisabled);
    setAttribute(card, 'tabindex', isDisabled ? '-1' : '0');
    setAttribute(card, 'aria-pressed', card.classList.contains('selectedoptn') || (kind === 'handle' && card.parentElement.classList.contains('selectedoptn')));
    if (wired.has(card)) return;
    wired.add(card);
    card.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (!disabled(card)) card.click();
    });
  }
  function addNote(surface, heading) {
    setAttribute(heading, 'data-bf-module-title', '');
    for (const node of heading.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && /^(2\.\s*)?(모듈 구성|Functions)$/.test(node.textContent.trim())) node.textContent = '모듈 구성';
    }
    if (surface.querySelector('[data-bf-module-intro]')) return;
    const intro = document.createElement('div');
    intro.setAttribute('data-bf-module-intro', '');
    const eyebrow = document.createElement('span');
    eyebrow.textContent = 'MAKE IT YOURS';
    const note = document.createElement('p');
    note.textContent = '모듈을 고른 뒤 가구의 원하는 칸에 적용하세요.';
    intro.append(eyebrow, note);
    heading.after(intro);
  }
  function addFilters(surface, grid) {
    let state = filters.get(surface);
    if (!state) {
      const bar = document.createElement('div');
      bar.setAttribute('data-bf-module-filters', '');
      bar.setAttribute('role', 'group');
      bar.setAttribute('aria-label', '모듈 종류');
      state = { value: '전체', bar };
      filters.set(surface, state);
      categories.forEach(category => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = category;
        button.addEventListener('click', () => {
          state.value = category;
          refresh();
        });
        bar.append(button);
      });
    }
    if (!state.bar.isConnected) grid.before(state.bar);
    for (const button of state.bar.children) setAttribute(button, 'aria-pressed', button.textContent === state.value);
    for (const card of grid.children) {
      setAttribute(card, 'data-bf-filtered', state.value !== '전체' && card.getAttribute('data-bf-category') !== state.value);
    }
  }
  function decorate(surface, overview) {
    setAttribute(surface, 'data-bf-module-surface', overview ? 'overview' : 'catalog');
    const tips = [...surface.querySelectorAll(overview ? '.tooltipcontent' : '#elementrow .tooltipcontent, #gripsrow .tooltipcontent')];
    const moduleGrids = new Set();
    for (const tip of tips) {
      const originalName = tip.textContent.trim();
      const name = labels[originalName] || originalName;
      if (tip.textContent.trim() !== name) tip.textContent = name;
      const card = tip.parentElement;
      if (!card.querySelector('img') || !name) continue;
      const kind = ['홀 손잡이', '일반 손잡이', '잠금 손잡이'].includes(name) ? 'handle' : 'module';
      wireCard(card, name, kind);
      setAttribute(tip, 'data-bf-card-name', '');
      const image = card.querySelector('img');
      setAttribute(image.parentElement, 'data-bf-card-image', '');
      if (kind === 'module') {
        setAttribute(card, 'data-bf-category', categoryFor(name));
        setAttribute(card.parentElement, 'data-bf-module-grid', '');
        moduleGrids.add(card.parentElement);
      } else {
        const wrapper = card.parentElement;
        setAttribute(wrapper, 'data-bf-handle-wrap', '');
        setAttribute(wrapper.parentElement, 'data-bf-handle-grid', '');
        if (overview) {
          const row = wrapper.parentElement.parentElement;
          setAttribute(row, 'data-bf-handle-layout', '');
          const key = wrapper.parentElement.nextElementSibling;
          if (key) setAttribute(key, 'data-bf-key-row', '');
        }
      }
    }
    for (const heading of surface.querySelectorAll('h2')) {
      if (/^(2\.\s*)?(모듈 구성|Functions)$/.test(heading.textContent.trim())) {
        if (overview) addNote(surface, heading);
      } else if (/^(손잡이|Handles)$/.test(heading.textContent.trim())) setAttribute(heading, 'data-bf-handle-title', '');
    }
    if (overview) {
      for (const grid of moduleGrids) addFilters(surface, grid);
      const all = [...surface.querySelectorAll('span')].find(node => /^(모든 모듈 보기|see all elements)$/.test(node.textContent.trim()));
      if (all) {
        setAttribute(all, 'data-bf-all-modules', '');
        setAttribute(all.parentElement, 'data-bf-all-row', '');
        setAttribute(all, 'role', 'button');
        setAttribute(all, 'tabindex', '0');
        if (!wired.has(all)) {
          wired.add(all);
          all.addEventListener('click', () => requestAnimationFrame(() => {
            const catalog = root.querySelector('#element');
            if (!catalog || !catalog.getClientRects().length) return;
            for (let node = catalog.parentElement; node; node = node.parentElement) {
              if (/(auto|scroll)/.test(getComputedStyle(node).overflowY)) { node.scrollTop = 0; break; }
            }
          }));
          all.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); all.click(); }
          });
        }
      }
    }
    for (const input of surface.querySelectorAll('input[type="checkbox"]')) {
      const label = input.closest('label');
      if (!label) continue;
      if (!/도어 열어보기|모든 잠금장치를 같은 열쇠로|Open fronts|Identical key for all locks/.test(label.parentElement.textContent)) continue;
      setAttribute(label, 'data-bf-switch', '');
      // :checked styles follow the native input property, including undo/redo.
      setAttribute(input, 'aria-label', /도어 열어보기|Open fronts/.test(label.parentElement.textContent) ? '도어 열어보기' : '모든 잠금장치를 같은 열쇠로');
    }
  }
  function refresh() {
    queued = false;
    const heading = root.querySelector('[data-bf-module-title]') || [...root.querySelectorAll('h2')].find(node => /^2\.\s*(모듈 구성|Functions)$/.test(node.textContent.trim()));
    if (heading) decorate(heading.parentElement, true);
    const catalog = root.querySelector('#element');
    if (catalog) decorate(catalog, false);
  }
  function schedule() {
    if (!queued) { queued = true; requestAnimationFrame(refresh); }
  }
  function attach() {
    root = window.FXC_SHADOW_ROOT;
    if (!root) return false;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = stylesheet;
    root.append(link);
    const observer = new MutationObserver(schedule);
    const observation = { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] };
    observer.observe(root, observation);
    refresh();
    window.addEventListener('pagehide', () => observer.disconnect());
    window.addEventListener('pageshow', event => {
      if (event.persisted) { observer.observe(root, observation); refresh(); }
    });
    return true;
  }
  if (!attach()) {
    const timer = setInterval(() => { if (attach()) clearInterval(timer); }, 100);
    window.addEventListener('pagehide', () => clearInterval(timer), { once: true });
  }
})();
