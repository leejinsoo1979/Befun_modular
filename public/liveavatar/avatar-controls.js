(function (global) {
  'use strict';

  // Kept inline as well as in avatar-controls.css because the configurator UI
  // lives inside a ShadowRoot, where a document-head stylesheet cannot reach it.
  const styles = `
.liveavatar-controls {
  position: absolute;
  z-index: 30;
  right: 20px;
  left: auto;
  top: 10px;
  bottom: auto;
  max-width: none;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  box-shadow: none;
  color: #35352f;
  font: 12px/1.2 "DM Sans", Arial, sans-serif;
  touch-action: manipulation;
  user-select: none;
}
.liveavatar-controls *, .liveavatar-controls *::before, .liveavatar-controls *::after { box-sizing: border-box; }
.liveavatar-controls__buttons { display: flex; align-items: center; gap: 4px; }
.liveavatar-controls button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-width: 61px;
  min-height: 36px;
  margin: 0;
  padding: 8px 11px;
  border: 0;
  border-radius: 19px;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
}
.liveavatar-controls button:hover { background: #f5f3ef; }
.liveavatar-controls button[aria-pressed="true"].liveavatar-controls__variant { background: #000; color: #fff; }
.liveavatar-controls button:focus-visible { outline: 2px solid #000; outline-offset: 2px; }
.liveavatar-controls[data-docked="true"] { position: relative; inset: auto; flex: 0 0 auto; }
.liveavatar-controls .liveavatar-controls__toggle {
  display: grid;
  place-items: center;
  width: clamp(30px, 2.2vw, 44px);
  height: clamp(30px, 2.2vw, 44px);
  min-width: 0;
  min-height: 0;
  padding: 0;
  border-radius: 50%;
  color: #828282;
}
.liveavatar-controls__toggle svg { width: clamp(19px, 1.3vw, 25px); height: clamp(19px, 1.3vw, 25px); fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.liveavatar-controls__toggle[aria-expanded="true"] { background: #f1f1f2; color: #000; }
.liveavatar-controls__content {
  position: absolute;
  z-index: 31;
  right: 0;
  top: calc(100% + 12px);
  width: max-content;
  max-width: calc(100vw - 24px);
  padding: 12px;
  border: 1px solid #e9e9e9;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 8px 28px #0000001a;
}
.liveavatar-controls__content[hidden] { display: none; }
.liveavatar-controls .liveavatar-controls__visibility { display:flex; justify-content:space-between; width:100%; min-height:36px; margin-bottom:8px; padding:4px 8px 10px; border-bottom:1px solid #eee; border-radius:0; font-weight:500; }
.liveavatar-controls__switch { position:relative; width:30px; height:18px; border-radius:12px; background:#ccc; }
.liveavatar-controls__switch::before { content:''; position:absolute; top:3px; left:3px; width:12px; height:12px; border-radius:50%; background:#fff; }
.liveavatar-controls__visibility[aria-checked="true"] .liveavatar-controls__switch { background:#000; }
.liveavatar-controls__visibility[aria-checked="true"] .liveavatar-controls__switch::before { transform:translateX(12px); }
.liveavatar-controls button:disabled { cursor:default; opacity:.45; }
.liveavatar-controls .liveavatar-controls__motion {
  min-width: 96px;
  margin-left: 3px;
  border-left: 1px solid #e9e7e2;
  border-radius: 0 19px 19px 0;
}
.liveavatar-controls__motion svg { width: 12px; height: 12px; flex: 0 0 12px; fill: currentColor; }
.liveavatar-controls__status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 18px;
  margin: 3px 6px 0;
  color: #77776e;
  font-size: 10px;
  letter-spacing: .02em;
}
.liveavatar-controls__status::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: #aaa99f; }
.liveavatar-controls[data-mode="video"] .liveavatar-controls__status::before { background: #78966d; }
.liveavatar-controls[data-mode="loading"] .liveavatar-controls__status::before { background: #000; }
@media (max-width: 767px) {
  .liveavatar-controls { right: 12px; left: auto; top: 10px; bottom: auto; font-size: 11px; }
  .liveavatar-controls .liveavatar-controls__toggle { width: 36px; height: 36px; padding: 0; }
  .liveavatar-controls[data-docked="true"] .liveavatar-controls__content { top: auto; bottom: calc(100% + 12px); }
  .liveavatar-controls button { min-width: 56px; padding: 7px 9px; }
  .liveavatar-controls .liveavatar-controls__motion { min-width: 89px; }
  .liveavatar-controls__status { margin-top: 2px; font-size: 9px; }
}
`;

  let nextId = 0;

  function mount(options) {
    const { container, onVariant, onMotion, onVisibility } = options || {};
    if (!container || typeof container.appendChild !== 'function') {
      throw new TypeError('LiveAvatarControls.mount requires a container.');
    }
    const doc = container.ownerDocument;
    const element = doc.createElement('div');
    element.className = 'liveavatar-controls';
    element.setAttribute('role', 'group');
    element.setAttribute('aria-label', '아바타 설정');
    const style = doc.createElement('style');
    style.textContent = styles;
    element.appendChild(style);

    const toggle = doc.createElement('button');
    toggle.type = 'button';
    toggle.className = 'liveavatar-controls__toggle';
    toggle.title = '인물 설정';
    toggle.setAttribute('aria-haspopup', 'dialog');
    const toggleIcon = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    toggleIcon.setAttribute('viewBox', '0 0 24 24');
    toggleIcon.setAttribute('aria-hidden', 'true');
    const head = doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
    head.setAttribute('cx', '12'); head.setAttribute('cy', '7'); head.setAttribute('r', '4');
    const body = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    body.setAttribute('d', 'M5 21v-2a7 7 0 0 1 14 0v2');
    toggleIcon.append(head, body);
    toggle.appendChild(toggleIcon);
    element.appendChild(toggle);

    const content = doc.createElement('div');
    content.id = `liveavatar-controls-content-${++nextId}`;
    content.className = 'liveavatar-controls__content';
    content.setAttribute('role', 'dialog');
    content.setAttribute('aria-label', '인물 설정');
    toggle.setAttribute('aria-controls', content.id);
    element.appendChild(content);
    const visibility = doc.createElement('button');
    visibility.type = 'button';
    visibility.className = 'liveavatar-controls__visibility';
    visibility.setAttribute('role', 'switch');
    visibility.setAttribute('aria-label', '인물 표시');
    const visibilityLabel = doc.createElement('span');
    visibilityLabel.textContent = '인물 표시';
    const visibilityTrack = doc.createElement('span');
    visibilityTrack.className = 'liveavatar-controls__switch';
    visibilityTrack.setAttribute('aria-hidden', 'true');
    visibility.append(visibilityLabel, visibilityTrack);
    content.appendChild(visibility);
    const buttons = doc.createElement('div');
    buttons.className = 'liveavatar-controls__buttons';
    content.appendChild(buttons);
    const female = makeButton('여성', 'liveavatar-controls__variant', '여성 아바타 보기');
    const male = makeButton('남성', 'liveavatar-controls__variant', '남성 아바타 보기');
    female.dataset.avatarVariant = 'female';
    male.dataset.avatarVariant = 'male';
    const motion = makeButton('', 'liveavatar-controls__motion', '아바타 움직임 끄기');
    const motionIcon = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    motionIcon.setAttribute('viewBox', '0 0 12 12');
    motionIcon.setAttribute('aria-hidden', 'true');
    const motionPath = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    motionIcon.appendChild(motionPath);
    const motionLabel = doc.createElement('span');
    motion.append(motionIcon, motionLabel);
    const status = doc.createElement('div');
    status.className = 'liveavatar-controls__status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    content.appendChild(status);

    let state = { variant: 'female', motion: true, visible: true, mode: 'loading', height: 1.67, reason: '' };
    let disposed = false;
    let expanded = false;
    const removers = [];

    function makeButton(label, className, accessibleLabel) {
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = className;
      button.textContent = label;
      button.setAttribute('aria-label', accessibleLabel);
      buttons.appendChild(button);
      return button;
    }
    function listen(target, type, handler) {
      target.addEventListener(type, handler);
      removers.push(() => target.removeEventListener(type, handler));
    }
    function choose(variant) {
      if (state.variant === variant) return;
      setState({ variant, height: variant === 'male' ? 1.83 : 1.67, mode: 'loading', reason: '' });
      if (typeof onVariant === 'function') onVariant(variant);
    }
    function setExpanded(next) {
      expanded = next;
      content.hidden = !expanded;
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.setAttribute('aria-label', expanded ? '인물 설정 접기' : '인물 설정 펼치기');
      element.dataset.collapsed = String(!expanded);
      if (expanded) positionPopup();
    }
    function positionPopup() {
      content.style.left = 'auto'; content.style.right = '0';
      const popup = content.getBoundingClientRect();
      if (popup.left < 12) {
        content.style.left = `${12 - element.getBoundingClientRect().left}px`;
        content.style.right = 'auto';
      }
    }
    function placeInToolbar() {
      const root = container.getRootNode();
      const mobile = global.innerWidth < 768;
      // Action IDs stay stable when display labels are translated.
      const desktopToolbar = root.querySelector('[data-ph-capture-attribute-toolbar-action="save"]')?.parentElement;
      const mobileToolbar = [...root.querySelectorAll('[data-ph-capture-attribute-toolbar-action="reset"]')]
        .find(button => button.getClientRects().length)?.parentElement;
      const host = (mobile ? mobileToolbar : desktopToolbar) || container;
      const save = host.querySelector('[data-ph-capture-attribute-toolbar-action="save"]');
      if (element.parentElement !== host) host.insertBefore(element, save || null);
      element.dataset.docked = String(host !== container);
      if (expanded) positionPopup();
    }
    // Vue can create or replace the toolbar after the 3D scene is ready.
    const toolbarObserver = new MutationObserver(placeInToolbar);
    toolbarObserver.observe(container.getRootNode(), {childList: true, subtree: true});
    removers.push(() => toolbarObserver.disconnect());
    listen(global, 'resize', placeInToolbar);
    listen(doc, 'pointerdown', event => {
      if (expanded && !event.composedPath().includes(element)) setExpanded(false);
    });
    listen(element, 'keydown', event => {
      if (event.key === 'Escape' && expanded) { setExpanded(false); toggle.focus(); }
    });
    listen(toggle, 'click', () => setExpanded(!expanded));
    listen(visibility, 'click', () => {
      const visible = !state.visible;
      setState({visible});
      if (typeof onVisibility === 'function') onVisibility(visible);
    });
    listen(female, 'click', () => choose('female'));
    listen(male, 'click', () => choose('male'));
    listen(motion, 'click', () => {
      const nextMotion = !state.motion;
      setState({ motion: nextMotion });
      if (typeof onMotion === 'function') onMotion(nextMotion);
    });
    // Orbit controls listen on the configurator canvas/container. Keep gestures
    // on these buttons from also rotating, zooming or selecting the furniture.
    for (const type of ['pointerdown', 'pointerup', 'pointermove', 'mousedown', 'mouseup', 'touchstart', 'touchmove', 'touchend', 'click', 'dblclick', 'wheel', 'keydown', 'keyup']) {
      listen(element, type, event => event.stopPropagation());
    }

    function setState(next) {
      if (disposed) return;
      state = Object.assign({}, state, next);
      state.variant = state.variant === 'male' ? 'male' : 'female';
      state.motion = Boolean(state.motion);
      state.visible = state.visible !== false;
      visibility.setAttribute('aria-checked', String(state.visible));
      visibility.title = state.visible ? '인물 숨기기' : '인물 다시 보기';
      female.disabled = male.disabled = motion.disabled = !state.visible;
      const mode = ['loading', 'video', 'still'].includes(state.mode) ? state.mode : 'still';
      female.setAttribute('aria-pressed', String(state.variant === 'female'));
      male.setAttribute('aria-pressed', String(state.variant === 'male'));
      motion.setAttribute('aria-pressed', String(state.motion));
      motion.setAttribute('aria-label', state.motion ? '아바타 움직임 끄기' : '아바타 움직임 켜기');
      motion.title = state.motion ? '정지 이미지 보기' : '아바타 영상 재생';
      motionLabel.textContent = state.motion ? '움직임 켜짐' : '움직임 꺼짐';
      motionPath.setAttribute('d', state.motion ? 'M2 1h3v10H2zM7 1h3v10H7z' : 'M2 1l9 5-9 5z');
      const height = Number.isFinite(state.height) ? state.height : (state.variant === 'male' ? 1.83 : 1.67);
      status.textContent = state.visible ? `${mode === 'video' ? '영상' : mode === 'loading' ? '불러오는 중' : '정지 이미지'} · 키 ${Math.round(height * 100)}cm 기준` : '인물 숨김';
      status.title = ({'Reduced motion':'동작 줄이기 설정 적용','Motion paused':'움직임 일시정지','Video unavailable':'영상을 불러올 수 없어 정지 이미지로 표시합니다','Autoplay unavailable':'자동 재생을 지원하지 않아 정지 이미지로 표시합니다','Video loading timeout':'영상 로딩이 지연되어 정지 이미지로 표시합니다'})[state.reason] || state.reason || '아바타 키는 크기 비교를 위한 참고용입니다.';
      element.dataset.variant = state.variant;
      element.dataset.visible = String(state.visible);
      element.dataset.motion = String(state.motion);
      element.dataset.mode = mode;
      element.dataset.height = String(height);
      element.dataset.reason = state.reason || '';
    }

    setExpanded(expanded);
    setState(state);
    placeInToolbar();
    return {
      element,
      setState,
      dispose() {
        if (disposed) return;
        disposed = true;
        for (const remove of removers) remove();
        element.remove();
      },
    };
  }

  global.LiveAvatarControls = { mount };
})(window);
