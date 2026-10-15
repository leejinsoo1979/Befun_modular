(function (global) {
  'use strict';

  // Kept inline as well as in avatar-controls.css because the configurator UI
  // lives inside a ShadowRoot, where a document-head stylesheet cannot reach it.
  const styles = `
.liveavatar-controls{position:absolute;z-index:18;right:20px;top:65px;bottom:auto;left:auto;max-width:calc(100% - 40px);padding:7px;border:1px solid rgba(255,255,255,.82);border-radius:24px;background:rgba(255,255,255,.94);box-shadow:0 3px 18px rgba(43,42,37,.10);color:#35352f;font:12px/1.2 "DM Sans",Arial,sans-serif;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);touch-action:manipulation;user-select:none}
.liveavatar-controls *,.liveavatar-controls *::before,.liveavatar-controls *::after{box-sizing:border-box}
.liveavatar-controls__buttons{display:flex;align-items:center;gap:4px}
.liveavatar-controls button{display:inline-flex;align-items:center;justify-content:center;gap:5px;min-width:61px;min-height:36px;margin:0;padding:8px 11px;border:0;border-radius:19px;background:transparent;color:inherit;font:inherit;cursor:pointer;white-space:nowrap;-webkit-tap-highlight-color:transparent}
.liveavatar-controls button:hover{background:#f5f3ef}
.liveavatar-controls button[aria-pressed="true"].liveavatar-controls__variant{background:#ed702b;color:#fff}
.liveavatar-controls button:focus-visible{outline:2px solid #c64c12;outline-offset:2px}
.liveavatar-controls .liveavatar-controls__motion{min-width:96px;margin-left:3px;border-left:1px solid #e9e7e2;border-radius:0 19px 19px 0}
.liveavatar-controls__motion svg{width:12px;height:12px;flex:0 0 12px;fill:currentColor}
.liveavatar-controls__status{display:flex;align-items:center;justify-content:center;gap:5px;min-height:18px;margin:3px 6px 0;color:#77776e;font-size:10px;letter-spacing:.02em}
.liveavatar-controls__status::before{content:'';width:5px;height:5px;border-radius:50%;background:#aaa99f}
.liveavatar-controls[data-mode="video"] .liveavatar-controls__status::before{background:#78966d}
.liveavatar-controls[data-mode="loading"] .liveavatar-controls__status::before{background:#ed702b}
@media(max-width:767px){.liveavatar-controls{right:12px;left:auto;top:62px;bottom:auto;padding:5px;font-size:11px;border-radius:22px}.liveavatar-controls button{min-width:56px;padding:7px 9px}.liveavatar-controls .liveavatar-controls__motion{min-width:89px}.liveavatar-controls__status{margin-top:2px;font-size:9px}}
`;

  function mount(options) {
    const { container, onVariant, onMotion } = options || {};
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

    const buttons = doc.createElement('div');
    buttons.className = 'liveavatar-controls__buttons';
    element.appendChild(buttons);
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
    element.appendChild(status);

    let state = { variant: 'female', motion: true, mode: 'loading', height: 1.67, reason: '' };
    let disposed = false;
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
      const mode = ['loading', 'video', 'still'].includes(state.mode) ? state.mode : 'still';
      female.setAttribute('aria-pressed', String(state.variant === 'female'));
      male.setAttribute('aria-pressed', String(state.variant === 'male'));
      motion.setAttribute('aria-pressed', String(state.motion));
      motion.setAttribute('aria-label', state.motion ? '아바타 움직임 끄기' : '아바타 움직임 켜기');
      motion.title = state.motion ? '정지 이미지 보기' : '아바타 영상 재생';
      motionLabel.textContent = state.motion ? '움직임 켜짐' : '움직임 꺼짐';
      motionPath.setAttribute('d', state.motion ? 'M2 1h3v10H2zM7 1h3v10H7z' : 'M2 1l9 5-9 5z');
      const height = Number.isFinite(state.height) ? state.height : (state.variant === 'male' ? 1.83 : 1.67);
      status.textContent = `${mode === 'video' ? '영상' : mode === 'loading' ? '불러오는 중' : '정지 이미지'} · 키 ${Math.round(height * 100)}cm 기준`;
      status.title = state.reason || '아바타 키는 크기 비교를 위한 참고용입니다.';
      element.dataset.variant = state.variant;
      element.dataset.motion = String(state.motion);
      element.dataset.mode = mode;
      element.dataset.height = String(height);
      element.dataset.reason = state.reason || '';
    }

    setState(state);
    container.appendChild(element);
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
