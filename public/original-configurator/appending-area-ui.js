/* Desktop expansion previews share the configurator's native add-cell action. */
(() => {
  'use strict';
  const presentations = new WeakMap();

  function mount(area, {mobile}) {
    if (mobile) return;
    const T = window.v3d;
    const originalMaterial = area.showMaterial;
    const material = new T.MeshBasicMaterial({
      color: 0x64717d, transparent: true, opacity: .24,
      depthWrite: false, side: T.DoubleSide,
    });
    const outline = new T.LineSegments(
      new T.EdgesGeometry(area.model.geometry),
      new T.LineBasicMaterial({color: 0x515e6a, transparent: true, opacity: .65, depthWrite: false}),
    );
    outline.name = 'befun-appending-outline';
    outline.visible = false;
    outline.raycast = () => {};
    area.model.add(outline);
    area.showMaterial = material;
    const presentation = {originalMaterial, material, outline, removers: []};
    presentations.set(area, presentation);
    area.onButtonClick = event => {
      event.stopPropagation();
      area.whenClick();
    };
    area.createButton();
    const button = area.button;
    button.setAttribute('role', 'button');
    button.setAttribute('tabindex', '0');
    button.setAttribute('aria-label', '이 위치에 모듈 추가');
    button.title = '모듈 추가';

    const listen = (type, handler) => {
      button.addEventListener(type, handler);
      presentation.removers.push(() => button.removeEventListener(type, handler));
    };
    // Keep the preview active when the pointer moves from its mesh onto its +.
    listen('pointerenter', () => area.setActiveState());
    listen('pointerleave', () => area.setInactiveState());
    listen('blur', () => area.setInactiveState());
    for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'dblclick']) {
      listen(type, event => event.stopPropagation());
    }
    listen('click', event => event.stopPropagation());
    listen('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) area.whenClick();
    });
  }

  function setActive(area, active) {
    const presentation = presentations.get(area);
    if (!presentation) return;
    presentation.outline.visible = active;
    area.button.style.visibility = active ? 'visible' : 'hidden';
  }

  function keepActive(area) {
    return presentations.has(area) && area.button?.matches(':hover, :focus-visible');
  }

  function unmount(area) {
    const presentation = presentations.get(area);
    if (!presentation) return;
    presentations.delete(area);
    for (const remove of presentation.removers) remove();
    area.removeButton();
    area.model.remove(presentation.outline);
    presentation.outline.geometry.dispose();
    presentation.outline.material.dispose();
    presentation.material.dispose();
    area.showMaterial = presentation.originalMaterial;
  }

  window.BefunAppendingAreaUI = {mount, setActive, keepActive, unmount};
})();
