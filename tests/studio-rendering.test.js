import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const root = new URL('../', import.meta.url);
const read = name => fs.readFileSync(new URL(name, root), 'utf8');
const exports = {};
const engineContext = {exports, module: {exports}, console, performance,
  require: createRequire(import.meta.url), __filename: fileURLToPath(new URL('public/original-configurator/v3d.js', root))};
engineContext.global = engineContext;
vm.runInNewContext(read('public/original-configurator/v3d.js'), engineContext);
const T = exports;

function harness(search = '') {
  const listeners = new Map();
  const scene = new T.Scene(), camera = new T.PerspectiveCamera(45, 2, .1, 100);
  camera.position.set(3, 2, 4);
  const key = new T.DirectionalLight(0xffffff, 1); key.castShadow = true; scene.add(key);
  const material = new T.MeshNodeMaterial(); material.name = 'ral'; material.color.set('#000000');
  const panel = new T.Mesh(new T.BoxGeometry(1, 1, .02), material); scene.add(panel);
  const floor = new T.Mesh(new T.PlaneGeometry(), new T.ShadowMaterial({opacity: .13}));
  floor.name = 'floorShadowPlane'; scene.add(floor);
  let ratio = 1, composerRatio = 1, width = 2000;
  const renderer = {getPixelRatio: () => ratio, setPixelRatio: value => {ratio = value;},
    toneMapping: T.NoToneMapping, toneMappingExposure: 1, outputEncoding: T.sRGBEncoding};
  const app = {scene, camera, renderer, renderCallbacks: [], getWidth: () => width, getHeight: () => 1200,
    postprocessing: {composer: {setPixelRatio: value => {composerRatio = value;}}}, onResize() {}};
  const fetchOriginal = async () => new Response(read('public/original-configurator/configurator-scene.json'));
  const window = {app, devicePixelRatio: 3, fetch: fetchOriginal,
    addEventListener(type, callback) {listeners.set(type, callback);},
    removeEventListener(type, callback) {if (listeners.get(type) === callback) listeners.delete(type);}};
  const before = JSON.stringify(scene.toJSON());
  vm.runInNewContext(read('public/original-configurator/studio-rendering.js'), {
    window, location: {search, href: 'http://127.0.0.1:5173/original-configurator/index.html', origin: 'http://127.0.0.1:5173'},
    URL, URLSearchParams, Response, console, requestAnimationFrame() {return 1;}, cancelAnimationFrame() {},
  });
  return {window, listeners, scene, renderer, before, fetchOriginal, app, panel, key,
    get ratio() {return ratio;}, get composerRatio() {return composerRatio;},
    mobile() {width = 390; listeners.get('resize')();}};
}

function assertExpectedLighting(h) {
  const expected = JSON.parse(h.before);
  expected.object.children.find(object => object.type === 'DirectionalLight').intensity *= .95;
  expected.materials.find(material => material.name === 'ral').envMapIntensity = .3;
  assert.deepEqual(JSON.parse(JSON.stringify(h.scene.toJSON())), expected,
    'only the requested key-light dimming and panel HDR attenuation may change the runtime scene');
}

test('satin panels retain source colors, geometry, non-panel materials and original environment', async () => {
  const h = harness();
  const source = JSON.parse(read('public/original-configurator/configurator-scene.json'));
  const adapted = await (await h.window.fetch('/original-configurator/configurator-scene.json')).json();
  const black = adapted.materials.find(material => material.name === 'schwarz');
  const bsdf = black.extensions.S8S_v3d_materials.nodeGraph.nodes.find(node => node.type === 'BSDF_PRINCIPLED_BL');
  assert.ok(bsdf.inputs[6] > 0 && bsdf.inputs[6] <= .15, 'black panel gets only a restrained metallic response');
  assert.ok(bsdf.inputs[7] <= .08 && bsdf.inputs[9] >= .2 && bsdf.inputs[9] <= .3 && bsdf.inputs[14] === 0,
    'keep the low-intensity metal highlight localized without a broad pale reflection or clear-coat veil');
  for (const name of ['steel', 'grips_steel', 'glass', 'glass_door', 'Verge3D_Environment_World']) {
    assert.deepEqual(adapted.materials.find(material => material.name === name), source.materials.find(material => material.name === name));
  }
  for (let i = 0; i < source.materials.length; i++) {
    const before = source.materials[i], after = adapted.materials[i];
    const originalNodes = before.extensions.S8S_v3d_materials.nodeGraph.nodes;
    const nodes = after.extensions.S8S_v3d_materials.nodeGraph.nodes;
    for (let n = 0; n < nodes.length; n++) {
      if (nodes[n].type !== 'BSDF_PRINCIPLED_BL') continue;
      for (const input of [6, 7, 9, 14]) nodes[n].inputs[input] = originalNodes[n].inputs[input];
    }
  }
  assert.deepEqual(adapted, source, 'only the four finish inputs may change; preserve every color, connection, texture and mesh');
  const other = await (await h.window.fetch('/original-configurator/configurations/example.json')).json();
  assert.deepEqual(other, source, 'configuration requests pass through untouched');
  assertExpectedLighting(h);
  assert.equal(h.renderer.toneMappingExposure, 1);
  assert.equal(h.renderer.toneMapping, T.NoToneMapping);
  assert.equal(h.renderer.outputEncoding, T.sRGBEncoding);
  assert.ok(h.ratio > 1 && h.ratio * h.ratio * 2000 * 1200 <= 4_000_001);
  assert.equal(h.composerRatio, h.ratio);
});

test('resolution remains bounded on mobile and restores cleanly through page lifecycle', () => {
  const h = harness(); h.mobile(); assert.equal(h.ratio, 1.5);
  h.listeners.get('pagehide')(); assert.equal(h.ratio, 1); assert.equal(h.listeners.has('resize'), false);
  h.listeners.get('pageshow')({persisted: true}); assert.equal(h.ratio, 1.5);
  assertExpectedLighting(h);
  const originalMaterial = h.panel.material;
  h.panel.material = originalMaterial.clone();
  h.app.renderCallbacks[0](0, 1);
  assert.equal(h.panel.material.envMapIntensity, .3, 'a cloned panel must not receive a second 70% reduction');
  h.panel.material = originalMaterial;
  h.listeners.get('pagehide')();
  assert.equal(h.panel.material.envMapIntensity, 1);
  assert.equal(h.key.intensity, 1);
  assert.equal(h.app.renderCallbacks.length, 0);
  const original = harness('?render-quality=original');
  assert.equal(original.ratio, 1); assert.equal(original.listeners.size, 0);
});
