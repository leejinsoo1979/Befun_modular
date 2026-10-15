/* Collapse the native toolbar to its right edge without replacing its controls. */
(() => {
  'use strict';
  let stopped = false, frame = 0, collapsed = false, dispose = null;
  const css = `
    .befun-toolbar-dock{position:relative;z-index:30;display:flex;align-items:center;flex:0 0 auto;min-width:0;background:#fff;border:1px solid #e0e0e0;border-radius:999px}
    .befun-toolbar-viewport{width:var(--befun-toolbar-width);min-width:0;overflow:hidden;opacity:1;transition:width .24s cubic-bezier(.4,0,.2,1),opacity .14s ease}
    .befun-toolbar-dock[data-collapsed="true"] .befun-toolbar-viewport{width:0;opacity:0;pointer-events:none;visibility:hidden;transition:width .24s cubic-bezier(.4,0,.2,1),opacity .14s ease,visibility 0s .24s}
    .befun-toolbar-dock[data-collapsed="false"][data-animating="false"] .befun-toolbar-viewport{overflow:visible}
    [data-befun-toolbar-content]{width:max-content;flex-shrink:0;border:0!important;background:transparent!important}
    .befun-toolbar-toggle{display:grid;place-items:center;align-self:stretch;flex:0 0 auto;width:clamp(30px,2.1vw,40px);min-height:32px;margin:0;padding:0;border:0;border-radius:999px;background:transparent;color:#828282;cursor:pointer;touch-action:manipulation}
    .befun-toolbar-toggle:hover{background:#f1f1f2;color:#171717}
    .befun-toolbar-toggle:focus-visible{outline:2px solid #171717;outline-offset:3px}
    .befun-toolbar-toggle svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;transition:transform .2s ease}
    .befun-toolbar-toggle[aria-expanded="false"] svg{transform:rotate(180deg)}
    @media(max-width:767px){.befun-toolbar-dock{display:none}}
    @media(prefers-reduced-motion:reduce){.befun-toolbar-viewport,.befun-toolbar-toggle svg{transition:none!important}}
  `;

  function boot() {
    if (stopped) return;
    const root = window.FXC_SHADOW_ROOT;
    const toolbar = root?.querySelector('[aria-label="Canvas toolbar"]');
    if (!toolbar) { frame = requestAnimationFrame(boot); return; }
    const doc = toolbar.ownerDocument;
    const style = doc.createElement('style'); style.textContent = css; root.appendChild(style);
    const shell = doc.createElement('div'); shell.className = 'befun-toolbar-dock';
    const viewport = doc.createElement('div'); viewport.className = 'befun-toolbar-viewport';
    const toggle = doc.createElement('button'); toggle.className = 'befun-toolbar-toggle'; toggle.type = 'button';
    const icon = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24'); icon.setAttribute('aria-hidden', 'true');
    const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M9 5l7 7-7 7'); icon.appendChild(path); toggle.appendChild(icon);
    const previous = {id: toolbar.id, inert: toolbar.inert, hidden: toolbar.getAttribute('aria-hidden')};
    if (!toolbar.id) toolbar.id = 'befun-canvas-toolbar';
    toggle.setAttribute('aria-controls', toolbar.id);
    toolbar.setAttribute('data-befun-toolbar-content', '');
    toolbar.before(shell); shell.append(viewport, toggle); viewport.appendChild(toolbar);
    let timer = 0;

    function measure() {
      const width = toolbar.getBoundingClientRect().width;
      if (width > 0) {
        const value = `${width}px`;
        if (shell.style.getPropertyValue('--befun-toolbar-width') !== value) shell.style.setProperty('--befun-toolbar-width', value);
      }
    }
    function finishAnimation() { clearTimeout(timer); shell.dataset.animating = 'false'; }
    function setCollapsed(next, animate = true) {
      collapsed = next;
      clearTimeout(timer);
      const moving = animate && !matchMedia('(prefers-reduced-motion: reduce)').matches;
      shell.dataset.animating = String(moving);
      shell.dataset.collapsed = String(collapsed);
      toolbar.inert = collapsed;
      toolbar.setAttribute('aria-hidden', String(collapsed));
      toggle.setAttribute('aria-expanded', String(!collapsed));
      toggle.setAttribute('aria-label', collapsed ? '도구 모음 펼치기' : '도구 모음 접기');
      toggle.title = collapsed ? '도구 모음 펼치기' : '오른쪽으로 접기';
      if (moving) timer = setTimeout(finishAnimation, 260);
    }
    function click(event) { event.stopPropagation(); setCollapsed(!collapsed); }
    function stopGesture(event) { event.stopPropagation(); }
    function keydown(event) {
      if (event.key === 'Escape' && !collapsed) { event.stopPropagation(); setCollapsed(true); toggle.focus(); }
    }
    function transitionend(event) { if (event.target === viewport && event.propertyName === 'width') finishAnimation(); }
    toggle.addEventListener('click', click);
    toggle.addEventListener('pointerdown', stopGesture);
    shell.addEventListener('keydown', keydown);
    viewport.addEventListener('transitionend', transitionend);
    const observer = new ResizeObserver(measure); observer.observe(toolbar);
    window.addEventListener('resize', measure);
    measure(); setCollapsed(collapsed, false);

    dispose = () => {
      clearTimeout(timer); observer.disconnect(); window.removeEventListener('resize', measure);
      toggle.removeEventListener('click', click); toggle.removeEventListener('pointerdown', stopGesture);
      shell.removeEventListener('keydown', keydown); viewport.removeEventListener('transitionend', transitionend);
      toolbar.inert = previous.inert;
      if (previous.hidden === null) toolbar.removeAttribute('aria-hidden'); else toolbar.setAttribute('aria-hidden', previous.hidden);
      if (!previous.id) toolbar.removeAttribute('id');
      toolbar.removeAttribute('data-befun-toolbar-content');
      if (shell.parentNode && toolbar.parentNode === viewport) shell.before(toolbar);
      shell.remove(); style.remove();
    };
  }
  window.addEventListener('pagehide', () => { stopped = true; cancelAnimationFrame(frame); dispose?.(); dispose = null; });
  window.addEventListener('pageshow', event => { if (event.persisted) { stopped = false; boot(); } });
  boot();
})();
