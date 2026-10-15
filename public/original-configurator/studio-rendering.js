/* Subtle satin metal panels with the original environment, lights and colors. */
(() => {
  'use strict';
  if (new URLSearchParams(location.search).get('render-quality') === 'original') return;
  const panels = new Set(['schwarz', 'weiss', 'grau', 'hellgrau', 'mint', 'petrol', 'taupe', 'rot', 'ral', 'white', 'white.001', 'drawer']);
  const fetchOriginal = window.fetch.bind(window);
  window.fetch = async (input, options) => {
    const response = await fetchOriginal(input, options);
    const url = new URL(typeof input === 'string' ? input : input.url || String(input), location.href);
    if (!response.ok || url.origin !== location.origin || url.pathname !== '/original-configurator/configurator-scene.json') return response;
    try {
      const scene = await response.clone().json();
      for (const material of scene.materials || []) {
        if (!panels.has(material.name)) continue;
        for (const node of material.extensions?.S8S_v3d_materials?.nodeGraph?.nodes || []) {
          if (node.type !== 'BSDF_PRINCIPLED_BL' || node.inputs.length < 25) continue;
          // Captured Blender Principled input layout. Preserve every RGB input,
          // source color-control connection and vertex-color contact shading.
          node.inputs[6] = .1; // restrained metallic response
          node.inputs[7] = .08; // a restrained specular accent on the painted metal
          node.inputs[9] = .28; // smooth finish: a small highlight rather than a broad matte haze
          node.inputs[14] = 0; // no glossy clear-coat veil
        }
      }
      return new Response(JSON.stringify(scene), {status: response.status, headers: {'Content-Type': 'application/json'}});
    } catch (error) {
      console.warn('Panel finish unavailable; retaining the original scene.', error);
      return response;
    }
  };
  let stopped = false, frame = 0, dispose = null;
  function boot() {
    if (stopped) return;
    const app = window.app;
    if (!app?.renderer || !app.scene?.getObjectByName('floorShadowPlane')) {
      frame = requestAnimationFrame(boot); return;
    }
    const renderer = app.renderer, previousRatio = renderer.getPixelRatio();
    const keyLight = app.scene.children.find(light => light.isDirectionalLight && light.castShadow);
    const previousIntensity = keyLight?.intensity;
    if (keyLight) keyLight.intensity = previousIntensity * .95;
    const environmentBefore = new WeakMap();
    let nextMaterialSync = 0;
    function eachPanelMaterial(callback) {
      app.scene.traverse(object => {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) if (material && panels.has(material.name)) callback(material);
      });
    }
    function syncPanelReflections(dt, elapsed = 0) {
      if (elapsed < nextMaterialSync) return;
      nextMaterialSync = elapsed + .2;
      eachPanelMaterial(material => {
        if (environmentBefore.has(material)) return;
        environmentBefore.set(material, material.envMapIntensity);
        // Attenuate the existing HDR on panels, not their selected paint color.
        // Use an absolute value: new source clones already inherit this setting.
        material.envMapIntensity = .3;
      });
    }
    syncPanelReflections(0, 0);
    app.renderCallbacks.push(syncPanelReflections);
    function resize() {
      const width = app.getWidth(), height = app.getHeight();
      if (!width || !height) return;
      const cap = width < 768 ? 1.5 : 2;
      const ratio = Math.max(1, Math.min(window.devicePixelRatio || 1, cap, Math.sqrt(4_000_000 / (width * height))));
      renderer.setPixelRatio(ratio);
      app.postprocessing?.composer.setPixelRatio(ratio);
      app.onResize();
    }
    resize();
    window.addEventListener('resize', resize);
    dispose = () => {
      window.removeEventListener('resize', resize);
      renderer.setPixelRatio(previousRatio);
      app.postprocessing?.composer.setPixelRatio(previousRatio);
      if (keyLight) keyLight.intensity = previousIntensity;
      const index = app.renderCallbacks.indexOf(syncPanelReflections);
      if (index >= 0) app.renderCallbacks.splice(index, 1);
      eachPanelMaterial(material => {
        if (environmentBefore.has(material)) material.envMapIntensity = environmentBefore.get(material);
      });
    };
  }
  window.addEventListener('pagehide', () => {
    stopped = true; cancelAnimationFrame(frame); dispose?.(); dispose = null;
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) { stopped = false; boot(); }
  });
  boot();
})();
