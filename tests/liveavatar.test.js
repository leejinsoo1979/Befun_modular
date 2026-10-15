import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const project = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, project));
const feet = JSON.parse(read('public/liveavatar/male-foot-anchors.json'));

// Use the captured renderer's actual CPU scene graph and geometry classes.
// Only image/video I/O and the small host UI boundary are substituted here.
function engine() {
 const exports = {};
 const context = {exports, module: {exports}, require: createRequire(import.meta.url),
  __filename: fileURLToPath(new URL('public/original-configurator/v3d.js', project)), console};
 context.global = context;
 vm.runInNewContext(read('public/original-configurator/v3d.js').toString(), context);
 assert.equal(exports.REVISION, '4.1.1');
 return exports;
}

function eventTarget() {
 const events = new Map();
 return {
  addEventListener(type, fn) {if (!events.has(type)) events.set(type, new Set()); events.get(type).add(fn);},
  removeEventListener(type, fn) {events.get(type)?.delete(fn);},
  emit(type, event = {}) {for (const fn of [...(events.get(type) || [])]) fn(event);},
  listenerCount(type) {return events.get(type)?.size || 0;},
 };
}

function harness({variant = 'female', motion = true, reduced = false, rejectPlay = false} = {}) {
 const T = engine(), videos = [], timerCallbacks = new Map(), elements = [];
 const storage = new Map([['furniture-saved-configuration', '{"preserve":"exactly"}'],
  ['befun-viewer-avatar-v1', JSON.stringify({state: {avatar: variant, motion}, version: 0})]]);
 T.TextureLoader = class {
  load(url, loaded) {
   const image = {complete: true, width: url.includes('male-still') ? 496 : 1024,
    height: url.includes('male-still') ? 608 : 1536};
   const texture = new T.Texture(image);
   queueMicrotask(() => loaded?.(texture));
   return texture;
  }
 };
 const scene = new T.Scene(), camera = new T.PerspectiveCamera();
 camera.position.set(-2, 4, 5);
 const anchor = new T.Mesh(new T.PlaneGeometry(.8, 1.95));
 anchor.name = 'referenceFigurePlane'; anchor.position.set(-1.2, 1, -.09); scene.add(anchor);
 const floor = new T.Mesh(new T.PlaneGeometry(100, 10));
 floor.name = 'floorPlane'; floor.position.y = .137; scene.add(floor);
 const wall = new T.Mesh(new T.PlaneGeometry(100, 5)); wall.name = 'wallShadowPlane';
 wall.position.z = -.1; scene.add(wall);
 const light = new T.DirectionalLight(); light.castShadow = true; light.position.set(-3, 5, 5); scene.add(light);
 const app = {scene, camera, renderCallbacks: [], renderer: {shadowMap: {needsUpdate: false}}};
 const document = {...eventTarget(), hidden: false, createElement(type) {
  assert.equal(type, 'video');
  const video = {...eventTarget(), currentTime: 0, readyState: 4, HAVE_CURRENT_DATA: 2,
   videoWidth: variant === 'male' ? 992 : 896, videoHeight: variant === 'male' ? 608 : 672,
   paused: false, loadCount: 0, attributes: new Map(),
   setAttribute(key, value) {this.attributes.set(key, value);},
   removeAttribute(key) {this.attributes.delete(key); if (key === 'src') this.src = '';},
   play() {this.paused = false; return rejectPlay ? Promise.reject(new Error('autoplay blocked')) : Promise.resolve();},
   pause() {this.paused = true;}, load() {this.loadCount++;},
  };
  videos.push(video); return video;
 }};
 const mediaQuery = {...eventTarget(), matches: reduced};
 let callbacks, timerId = 0;
 const window = {...eventTarget(), app, v3d: T, FXC_SHADOW_ROOT: {querySelector: () => ({})},
  LiveAvatarControls: {mount(options) {
   callbacks = options; const element = {dataset: {}}; elements.push(element);
   return {element, setState(state) {Object.assign(element.dataset, state);}, dispose() {element.disposed = true;}};
  }}};
 const context = {window, document, URLSearchParams, location: {search: ''},
  fetch: async () => ({json: async () => feet}),
  localStorage: {getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value)},
  matchMedia: () => mediaQuery,
  setTimeout: fn => {timerCallbacks.set(++timerId, fn); return timerId;},
  clearTimeout: id => timerCallbacks.delete(id), requestAnimationFrame: () => 1, cancelAnimationFrame() {},
 };
 vm.runInNewContext(read('public/liveavatar/liveavatar.js').toString(), context);
 return {T, scene, camera, anchor, floor, wall, light, app, videos, storage, window, document, mediaQuery,
  get controls() {return callbacks;}, get state() {return elements.at(-1).dataset;},
  tick(elapsed = 1) {for (const callback of [...app.renderCallbacks]) callback(1 / 60, elapsed); scene.updateMatrixWorld(true);},
  playing() {const video = videos.at(-1); video.videoWidth = video.src.includes('male-motion') ? 992 : 896;
   video.videoHeight = video.src.includes('male-motion') ? 608 : 672; video.emit('playing');},
  close() {window.emit('pagehide');},
 };
}

// Interpolate the actual rendered triangles at an image coordinate rather than
// reproducing the adapter's deformation formula in the test.
function imagePointWorld(T, mesh, x, y, width, height) {
 const geometry = mesh.geometry, uv = geometry.attributes.uv, positions = geometry.attributes.position;
 const u = x / width, v = 1 - y / height;
 for (let offset = 0; offset < geometry.index.count; offset += 3) {
  const ids = [0, 1, 2].map(i => geometry.index.getX(offset + i));
  const [a, b, c] = ids.map(i => [uv.getX(i), uv.getY(i)]);
  const denominator = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
  const wa = ((b[1] - c[1]) * (u - c[0]) + (c[0] - b[0]) * (v - c[1])) / denominator;
  const wb = ((c[1] - a[1]) * (u - c[0]) + (a[0] - c[0]) * (v - c[1])) / denominator;
  const wc = 1 - wa - wb;
  if (Math.min(wa, wb, wc) < -1e-6) continue;
  const point = new T.Vector3();
  for (const [i, weight] of [[ids[0], wa], [ids[1], wb], [ids[2], wc]])
   point.addScaledVector(new T.Vector3().fromBufferAttribute(positions, i), weight);
  return mesh.localToWorld(point);
 }
 throw new Error(`Image coordinate ${x}, ${y} is outside the mesh`);
}

function activeShaderBranches(source, defines) {
 const enabled = [true], output = [];
 for (const line of source.split('\n')) {
  const condition = line.match(/^\s*#(ifdef|ifndef)\s+(\w+)/);
  if (condition) {
   const defined = Object.hasOwn(defines, condition[2]);
   enabled.push(enabled.at(-1) && (condition[1] === 'ifdef' ? defined : !defined));
  } else if (/^\s*#else\b/.test(line)) {
   const previous = enabled.pop(); enabled.push(enabled.at(-1) && !previous);
  } else if (/^\s*#endif\b/.test(line)) enabled.pop();
  else if (enabled.at(-1)) output.push(line);
 }
 assert.equal(enabled.length, 1, 'shader conditional nesting');
 return output.join('\n');
}

// sRGB conversion is separable by channel. Evaluate the engine's actual GLSL
// expression as a scalar; do not substitute a separately maintained gamma curve.
function scalarColorExpression(expression, sourceName) {
 const scalar = expression.replaceAll(`${sourceName}.rgb`, 'channel');
 const evaluate = new Function('channel', 'vec3', 'pow', 'mix', 'lessThanEqual', `return ${scalar};`);
 return channel => evaluate(channel, value => value, Math.pow,
  (a, b, chooseB) => chooseB ? b : a, (a, b) => a <= b);
}

test('installed avatar media and frame anchors remain byte-identical to the supplied package', () => {
 const manifest = JSON.parse(read('vendor/liveavatar/manifest.json'));
 const media = manifest.filter(entry => entry.path.startsWith('public/'));
 assert.equal(media.length, 4);
 for (const entry of media) {
  const original = read(`vendor/liveavatar/${entry.path}`), installed = read(entry.path);
  assert.equal(installed.length, entry.bytes, entry.path);
  assert.equal(crypto.createHash('sha256').update(installed).digest('hex'), entry.sha256, entry.path);
  assert.deepEqual(installed, original, entry.path);
 }
 assert.deepEqual(read('public/liveavatar/male-foot-anchors.json'),
  read('vendor/liveavatar/src/components/three/display/male-foot-anchors.json'));
});

test('both female feet meet a nonzero scene floor using the actual deformed still/video meshes', async () => {
 const h = harness(); await Promise.resolve();
 try {
  h.tick();
  const still = h.scene.getObjectByName('liveavatar-still');
  for (const [x, y] of [[480, 1507], [675, 1525]])
   assert.ok(Math.abs(imagePointWorld(h.T, still, x, y, 1024, 1536).y - h.floor.position.y) < .001);
  const stillHead = imagePointWorld(h.T, still, 515, 3, 1024, 1536);
  assert.ok(Math.abs(stillHead.y - h.floor.position.y - 1.67) < 1e-6, 'female still height is 1.67 m');
  h.playing(); h.tick(2);
  const motion = h.scene.getObjectByName('liveavatar-video');
  for (const [x, y] of [[210, 663], [295, 671]])
   assert.ok(Math.abs(imagePointWorld(h.T, motion, x, y, 448, 672).y - h.floor.position.y) < .001);
  const videoHead = imagePointWorld(h.T, motion, 224, 0, 448, 672);
  assert.ok(Math.abs(videoHead.y - h.floor.position.y - 1.67) < 1e-6, 'female video height is 1.67 m');
  assert.equal(still.visible, false); assert.equal(motion.visible, true);
 } finally {h.close();}
});

test('video RGB passes through the actual Verge3D sRGB decode branch and round-trips source colors', () => {
 for (const variant of ['female', 'male']) {
  const h = harness({variant});
  try {
   h.playing(); h.tick();
   const mesh = h.scene.getObjectByName('liveavatar-video');
   const shader = {uniforms: {}, vertexShader: h.T.ShaderLib.basic.vertexShader,
    fragmentShader: h.T.ShaderLib.basic.fragmentShader};
   mesh.material.onBeforeCompile(shader);
   const active = activeShaderBranches(shader.fragmentShader, {USE_MAP: 1, ...mesh.material.defines});
   const conversion = active.match(/sampledDiffuseColor\s*=\s*vec4\((.*),\s*sampledDiffuseColor\.w\);/);
   const decode = conversion ? scalarColorExpression(conversion[1], 'sampledDiffuseColor') : channel => channel;
   const encodeExpression = h.T.ShaderChunk.encodings_pars_fragment.match(/return vec4\((.*), value\.a\);/);
   assert.ok(encodeExpression, 'the actual engine output conversion is available');
   const encode = scalarColorExpression(encodeExpression[1], 'value');
   for (const sourceByte of [0, 8, 24, 64, 96, 128, 160, 192, 240, 255])
    assert.equal(Math.round(encode(decode(sourceByte / 255)) * 255), sourceByte,
     `${variant} source channel ${sourceByte} must retain its original brightness`);
   assert.equal(mesh.customDepthMaterial.defines.DECODE_VIDEO_TEXTURE, undefined,
    'the grayscale depth mask is not color-decoded');
   assert.ok(encode(128 / 255) * 255 > 180, 'missing input decoding reproduces the washed-out midtone');
  } finally {h.close();}
 }
});

test('male video soles track all frames at 1.83 m; the grounded PNG opaque head is 1.83313 m', async () => {
 const h = harness({variant: 'male'}); await new Promise(resolve => setImmediate(resolve));
 try {
  h.tick();
  const still = h.scene.getObjectByName('liveavatar-still');
  const stillSole = imagePointWorld(h.T, still, 248, 591, 496, 608);
  assert.ok(Math.abs(stillSole.y - h.floor.position.y) < 1e-6, 'the PNG alpha fringe meets the floor');
  // PNG's faint sole reaches y591; its opaque head is y5. The video's
  // tracked opaque sole is y590, accounting for the accepted 3.13 mm delta.
  const stillHead = imagePointWorld(h.T, still, 248, 5, 496, 608);
  assert.ok(Math.abs(stillHead.y - h.floor.position.y - 1.833128205128205) < 1e-6);
  h.playing(); const mesh = h.scene.getObjectByName('liveavatar-video');
  for (let frame = 0; frame < feet.feet.length; frame++) {
   h.videos[0].currentTime = (frame + .25) / feet.fps; h.tick(1 + frame / feet.fps);
   const sole = imagePointWorld(h.T, mesh, 248, feet.feet[frame], 496, 608);
   assert.ok(Math.abs(sole.y - h.floor.position.y) < 1e-6, `frame ${frame}`);
  }
  h.videos[0].currentTime = 0; h.tick(20);
  const head = imagePointWorld(h.T, mesh, 248, 5, 496, 608);
  assert.ok(Math.abs(head.y - h.floor.position.y - 1.83) < 1e-6);
 } finally {h.close();}
});

test('orbiting and changing floor/anchor positions preserve vertical world orientation and the existing camera', () => {
 const h = harness({motion: false});
 try {
  const camera = h.camera, mesh = h.scene.getObjectByName('liveavatar-still');
  for (const [x, y, z] of [[-5, 8, 6], [4, .5, 1], [8, 15, -1]]) {
   camera.position.set(x, y, z); h.tick();
   const up = new h.T.Vector3(0, 1, 0).transformDirection(mesh.matrixWorld);
   assert.ok(up.distanceTo(new h.T.Vector3(0, 1, 0)) < 1e-10);
   assert.deepEqual(Array.from(camera.position.toArray()), [x, y, z]); assert.equal(h.app.camera, camera);
  }
  h.anchor.position.x -= .7; h.floor.position.y = -.23; h.tick(2);
  assert.equal(h.scene.getObjectByName('liveavatar').position.x, h.anchor.position.x);
  const sole = imagePointWorld(h.T, mesh, 675, 1525, 1024, 1536);
  assert.ok(Math.abs(sole.y - h.floor.position.y) < 1e-6);
  assert.equal(h.anchor.visible, false);
 } finally {h.close();}
});

test('video failure falls back to the original still and variant changes release the old decoder and GPU resources', async () => {
 const h = harness(); await Promise.resolve();
 try {
  h.videos[0].emit('error'); h.tick();
  assert.equal(h.state.mode, 'still'); assert.equal(h.scene.getObjectByName('liveavatar-still').visible, true);
  assert.equal(h.scene.getObjectByName('liveavatar-video').visible, false);
  const objects = new Set(), textures = new Set(), disposed = new Set();
  h.scene.getObjectByName('liveavatar-upright').traverse(object => {
   if (object.geometry) objects.add(object.geometry);
   for (const material of [object.material, object.customDepthMaterial].filter(Boolean)) {
    objects.add(material); if (material.map) textures.add(material.map);
   }
  });
  for (const object of [...objects, ...textures]) object.addEventListener('dispose', () => disposed.add(object));
  const oldVideo = h.videos[0]; h.controls.onVariant('male');
  assert.equal(oldVideo.paused, true); assert.equal(oldVideo.src, ''); assert.equal(oldVideo.loadCount, 1);
  assert.equal(oldVideo.listenerCount('playing'), 0); assert.equal(oldVideo.listenerCount('error'), 0);
  for (const object of [...objects, ...textures]) assert.ok(disposed.has(object), object.type || 'texture');
  oldVideo.emit('playing'); assert.equal(h.state.variant, 'male'); assert.equal(h.state.mode, 'loading');
  assert.equal(h.storage.get('furniture-saved-configuration'), '{"preserve":"exactly"}');
  assert.equal(h.storage.size, 2);
  h.controls.onMotion(false);
  assert.equal(h.state.mode, 'still'); assert.equal(h.scene.getObjectByName('liveavatar-video'), undefined);
 } finally {h.close();}
});

test('reduced motion avoids a video decoder, and autoplay rejection leaves the still visible', async () => {
 const reduced = harness({reduced: true});
 try {reduced.tick(); assert.equal(reduced.videos.length, 0); assert.equal(reduced.state.mode, 'still');
  assert.equal(reduced.scene.getObjectByName('liveavatar-still').visible, true);
 } finally {reduced.close();}
 const blocked = harness({rejectPlay: true}); await Promise.resolve(); await Promise.resolve();
 try {blocked.tick(); assert.equal(blocked.state.mode, 'still');
  assert.equal(blocked.state.reason, 'Autoplay unavailable');
  assert.equal(blocked.scene.getObjectByName('liveavatar-still').visible, true);
 } finally {blocked.close();}
});

test('bfcache restoration reinstalls one avatar and one render callback after disposing the old scene attachment', () => {
 const h = harness({motion: false});
 try {
  assert.equal(h.app.renderCallbacks.length, 1);
  h.window.emit('pagehide', {persisted: true});
  assert.equal(h.app.renderCallbacks.length, 0); assert.equal(h.anchor.visible, true);
  assert.equal(h.scene.getObjectByName('liveavatar'), undefined);
  h.window.emit('pageshow', {persisted: true}); h.tick();
  assert.equal(h.app.renderCallbacks.length, 1); assert.equal(h.anchor.visible, false);
  assert.equal(h.scene.children.filter(object => object.name === 'liveavatar').length, 1);
 } finally {h.close();}
});
