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
const sourceScene = JSON.parse(read('public/original-configurator/configurator-scene.json'));

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

// Reconstruct only the source frame ownership/coordinates needed for height
// calibration. Bounds and scales come from the captured glTF, not the adapter.
function sourceFurniture(T, scene, floor, rowCount) {
 const assembly = new T.Group(); assembly.name = 'source-furniture-fixture'; scene.add(assembly);
 floor.position.y = -.047835713217155906;
 let rows = rowCount;
 class SourceCell {static getHeight() {return 2 + 3 + rows * 38;}}
 function modelFromAsset(name) {
  const node = sourceScene.nodes.find(node => node.name === name);
  const primitive = sourceScene.meshes[node.mesh].primitives[0];
  const {min, max} = sourceScene.accessors[primitive.attributes.POSITION];
  const geometry = new T.BoxGeometry(...max.map((value, i) => value - min[i]));
  geometry.translate(...max.map((value, i) => (value + min[i]) / 2));
  const model = new T.Mesh(geometry);
  if (node.scale) model.scale.fromArray(node.scale);
  return model;
 }
 function configure(count) {
  rows = count; assembly.clear();
  const connectors = new Map();
  for (let row = 0; row < rows; row++) {
   const cell = new SourceCell(); cell.frame = new Map();
   for (const level of [row, row + 1]) for (const x of [0, .775]) for (const z of [0, .41]) {
    const key = `${level}:${x}:${z}`;
    if (!connectors.has(key)) {
     const model = modelFromAsset('frame_connector'); model.position.set(x, level * .41, z);
     if (!level) model.add(modelFromAsset('legs'));
     connectors.set(key, {model}); assembly.add(model);
    }
    cell.frame.set(key, connectors.get(key));
   }
   const selection = new T.Mesh(new T.BoxGeometry(100, 100, 100));
   selection.userData.cell = cell; assembly.add(selection);
  }
 }
 configure(rows);
 return {assembly, configure};
}

function harness({variant = 'female', motion = true, visible, reduced = false, rejectPlay = false, furnitureRows = null} = {}) {
 const T = engine(), videos = [], timerCallbacks = new Map(), elements = [];
 const storage = new Map([['furniture-saved-configuration', '{"preserve":"exactly"}'],
  ['befun-viewer-avatar-v1', JSON.stringify({state: {avatar: variant, motion, visible}, version: 0})]]);
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
 const furniture = furnitureRows === null ? null : sourceFurniture(T, scene, floor, furnitureRows);
 const app = {scene, camera, renderCallbacks: [], renderer: {shadowMap: {needsUpdate: false}}};
 const document = {...eventTarget(), hidden: false, createElement(type) {
  assert.equal(type, 'video');
  const video = {...eventTarget(), currentTime: 0, readyState: 4, HAVE_CURRENT_DATA: 2,
   videoWidth: variant === 'male' ? 992 : 896, videoHeight: variant === 'male' ? 608 : 672,
   paused: true, playCount: 0, loadCount: 0, attributes: new Map(),
   setAttribute(key, value) {this.attributes.set(key, value);},
   removeAttribute(key) {this.attributes.delete(key); if (key === 'src') this.src = '';},
   play() {this.playCount++; this.paused = false; return rejectPlay ? Promise.reject(new Error('autoplay blocked')) : Promise.resolve();},
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
 vm.createContext(context);
 vm.runInContext(read('public/liveavatar/avatar-calibration.js').toString(), context);
 vm.runInContext(read('public/liveavatar/liveavatar.js').toString(), context);
 return {T, scene, camera, anchor, floor, wall, light, app, videos, storage, window, document, mediaQuery, furniture,
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

test('female image toe endpoints receive the requested 8 mm seating drop while PNG/video heads remain 1.67 m', async () => {
 const h = harness(); await Promise.resolve();
 try {
  h.tick();
  const still = h.scene.getObjectByName('liveavatar-still');
  for (const [x, y] of [[480, 1507], [675, 1525]])
   closeTo(imagePointWorld(h.T, still, x, y, 1024, 1536).y - h.floor.position.y, -.008,
    'female PNG image toe seating; no anatomical heel pixel is inferred', .001);
  const stillHead = imagePointWorld(h.T, still, 515, 3, 1024, 1536);
  assert.ok(Math.abs(stillHead.y - h.floor.position.y - 1.67) < 1e-6, 'female still height is 1.67 m');
  h.playing(); h.tick(2);
  const motion = h.scene.getObjectByName('liveavatar-video');
  for (const [x, y] of [[210, 663], [295, 671]])
   closeTo(imagePointWorld(h.T, motion, x, y, 448, 672).y - h.floor.position.y, -.008,
    'female video image toe seating retains the existing deformation tolerance', .001);
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

test('male source toe anchors retain an 8 mm seating drop for all 361 frames while the head remains 1.83 m', async () => {
 const h = harness({variant: 'male'}); await new Promise(resolve => setImmediate(resolve));
 try {
  h.tick();
  const still = h.scene.getObjectByName('liveavatar-still');
  const stillSole = imagePointWorld(h.T, still, 248, 591, 496, 608);
  closeTo(stillSole.y - h.floor.position.y, -.008, 'the source PNG endpoint receives the requested seating drop');
  // PNG's faint sole reaches y591; its opaque head is y5. The video's
  // tracked opaque sole is y590, accounting for the accepted 3.14 mm delta
  // after seating. These source endpoints do not identify an anatomical heel.
  const stillHead = imagePointWorld(h.T, still, 248, 5, 496, 608);
  assert.ok(Math.abs(stillHead.y - h.floor.position.y - 1.8331418803418802) < 1e-6);
  h.playing(); const mesh = h.scene.getObjectByName('liveavatar-video');
  for (let frame = 0; frame < feet.feet.length; frame++) {
   h.videos[0].currentTime = (frame + .25) / feet.fps; h.tick(1 + frame / feet.fps);
   const sole = imagePointWorld(h.T, mesh, 248, feet.feet[frame], 496, 608);
   closeTo(sole.y - h.floor.position.y, -.008, `requested source-anchor seating at frame ${frame}`);
  }
  h.videos[0].currentTime = 0; h.tick(20);
  const head = imagePointWorld(h.T, mesh, 248, 5, 496, 608);
  assert.ok(Math.abs(head.y - h.floor.position.y - 1.83) < 1e-6);
 } finally {h.close();}
});

function closeTo(actual, expected, message, tolerance = 1e-7) {
 assert.ok(Math.abs(actual - expected) < tolerance, `${message}: expected ${expected}, received ${actual}`);
}

function sourceHeightFactor(rows, ground) {
 const connector = sourceScene.nodes.find(node => node.name === 'frame_connector');
 const positions = sourceScene.meshes[connector.mesh].primitives[0].attributes.POSITION;
 const topRadius = sourceScene.accessors[positions].max[1] * connector.scale[1];
 return (rows * .41 + topRadius - ground) / ((5 + rows * 38) / 100);
}

function assertAuxiliaryScale(h, active, factor) {
 const root = h.scene.getObjectByName('liveavatar'), scale = new h.T.Vector3();
 const shadows = root.children[0].children.filter(object => object.name === 'liveavatar-wall-shadow');
 const shadow = shadows.find(object => object.geometry === active.geometry);
 assert.ok(shadow?.visible, 'the active source image also drives its wall shadow');
 scale.setFromMatrixScale(shadow.matrixWorld);
 for (const component of scale.toArray()) closeTo(component, factor, 'wall shadow inherits uniform scene calibration');
 assert.equal(shadow.material.uniforms.ground.value, h.floor.position.y);
 assert.equal(shadow.material.uniforms.wallZ.value, h.wall.position.z);
 closeTo(shadow.material.uniforms.shadowGroundLocal.value, -active.position.y, 'wall shadow enlargement remains foot anchored');
 closeTo(shadow.position.y, active.position.y, 'wall shadow follows the same tracked source sole');
 const contacts = root.children[0].children.filter(object => object.name === 'liveavatar-foot-contact');
 assert.equal(contacts.length, 2);
 for (const contact of contacts) {
  scale.setFromMatrixScale(contact.matrixWorld);
  for (const component of scale.toArray()) closeTo(component, factor, 'contact shadow inherits uniform scene calibration');
  closeTo(contact.getWorldPosition(new h.T.Vector3()).y - h.floor.position.y, .003 * factor,
   'contact shadow remains at its scaled floor offset');
 }
}

test('all four gender/media cases seat source endpoints 8 mm while floor/contact shadows remain in place', async () => {
 // The request is a visual seating adjustment. These known source endpoints
 // verify its magnitude; they are not a claim to locate anatomical heels.
 for (const variant of ['female', 'male']) for (const motion of [false, true]) {
  const h = harness({variant, motion, furnitureRows: variant === 'female' ? 4 : 5});
  await new Promise(resolve => setImmediate(resolve));
  try {
   const ground = h.floor.position.y;
   if (motion) h.playing();
   h.tick(1);
   const root = h.scene.getObjectByName('liveavatar'), factor = root.scale.y;
   const mesh = h.scene.getObjectByName(motion ? 'liveavatar-video' : 'liveavatar-still');
   const source = variant === 'male' ? [248, motion ? 590 : 591, 496, 608]
    : motion ? [295, 671, 448, 672] : [675, 1525, 1024, 1536];
   closeTo((imagePointWorld(h.T, mesh, ...source).y - ground) / factor, -.008,
    `${variant} ${motion ? 'video' : 'PNG'} requested nominal seating`);
   assert.equal(h.floor.position.y, ground, 'the native floor itself is not moved to meet the avatar');
   assert.equal(root.position.y, ground, 'the avatar coordinate origin remains at the original floor');
   assert.equal(h.state.heelContactDropMetres, '0.008');
   assertAuxiliaryScale(h, mesh, factor);
  } finally {h.close();}
 }
});

test('runtime applies the source 157 cm calibration to both female PNG/video triangles and their shadows', async () => {
 const h = harness({furnitureRows: 4}); await new Promise(resolve => setImmediate(resolve));
 try {
  const camera = {position: [...h.camera.position.toArray()], rotation: [...h.camera.rotation.toArray()],
   projection: [...h.camera.projectionMatrix.elements]};
  h.tick(1);
  const factor = sourceHeightFactor(4, h.floor.position.y), root = h.scene.getObjectByName('liveavatar');
  assert.equal(h.state.scaleCalibrated, 'true'); assert.equal(h.state.furnitureNominalHeightCm, '157');
  assert.ok(factor > 1.08, 'fixture includes the original internal/nominal mismatch');
  for (const component of root.scale.toArray()) closeTo(component, factor, 'runtime root applies measured conversion');
  closeTo(Number(h.state.worldUnitsPerMetre), factor, 'reported units agree with applied scale');
  closeTo(Number(h.state.referenceWorldHeight) / factor, 1.67, 'reported female physical height');
  const still = h.scene.getObjectByName('liveavatar-still');
  closeTo((imagePointWorld(h.T, still, 515, 3, 1024, 1536).y - h.floor.position.y) / factor, 1.67,
   'PNG actual head triangle has 167 cm nominal height');
  for (const [x, y] of [[480, 1507], [675, 1525]])
   closeTo((imagePointWorld(h.T, still, x, y, 1024, 1536).y - h.floor.position.y) / factor, -.008,
    'female calibrated PNG endpoint seats 8 mm below floor', .001);
  assertAuxiliaryScale(h, still, factor);
  h.playing(); h.tick(2);
  const video = h.scene.getObjectByName('liveavatar-video');
  closeTo((imagePointWorld(h.T, video, 224, 0, 448, 672).y - h.floor.position.y) / factor, 1.67,
   'video actual head triangle has 167 cm nominal height');
  for (const [x, y] of [[210, 663], [295, 671]])
   closeTo((imagePointWorld(h.T, video, x, y, 448, 672).y - h.floor.position.y) / factor, -.008,
    'female calibrated video endpoint seats 8 mm below floor', .001);
  assertAuxiliaryScale(h, video, factor);
  closeTo(Number(h.state.footErrorWorld), Number(h.state.footError) * factor, 'world foot diagnostic includes calibration');
  assert.equal(still.visible, false); assert.equal(video.visible, true);
  h.controls.onMotion(false); h.tick(3);
  assert.equal(h.state.mode, 'still');
  const paused = h.scene.getObjectByName('liveavatar-still');
  closeTo((imagePointWorld(h.T, paused, 515, 3, 1024, 1536).y - h.floor.position.y) / factor, 1.67,
   'returning to the source PNG preserves physical height');
  assertAuxiliaryScale(h, paused, factor);
  assert.deepEqual({position: [...h.camera.position.toArray()], rotation: [...h.camera.rotation.toArray()],
   projection: [...h.camera.projectionMatrix.elements]}, camera, 'avatar calibration does not alter the furniture camera');
 } finally {h.close();}
});

test('runtime calibrates the male to 195 cm furniture and preserves requested seating for all 361 frames', async () => {
 const h = harness({variant: 'male', furnitureRows: 5}); await new Promise(resolve => setImmediate(resolve));
 try {
  h.tick(1);
  const factor = sourceHeightFactor(5, h.floor.position.y), root = h.scene.getObjectByName('liveavatar');
  assert.equal(h.state.scaleCalibrated, 'true'); assert.equal(h.state.furnitureNominalHeightCm, '195');
  closeTo(root.scale.y, factor, 'male runtime calibration');
  const still = h.scene.getObjectByName('liveavatar-still');
  closeTo((imagePointWorld(h.T, still, 248, 591, 496, 608).y - h.floor.position.y) / factor, -.008,
   'male PNG source endpoint seats 8 mm below the calibrated floor');
  closeTo((imagePointWorld(h.T, still, 248, 5, 496, 608).y - h.floor.position.y) / factor, 1.8331418803418802,
   'the source PNG retains its documented 3.14 mm opaque-height fringe');
  assertAuxiliaryScale(h, still, factor);
  h.playing(); const video = h.scene.getObjectByName('liveavatar-video');
  for (let frame = 0; frame < feet.feet.length; frame++) {
   h.videos[0].currentTime = (frame + .25) / feet.fps; h.tick(2 + frame / feet.fps);
   closeTo(imagePointWorld(h.T, video, 248, feet.feet[frame], 496, 608).y - h.floor.position.y, -.008 * factor,
    `calibrated world seating at source frame ${frame}`);
  }
  h.videos[0].currentTime = 0; h.tick(20);
  closeTo((imagePointWorld(h.T, video, 248, 5, 496, 608).y - h.floor.position.y) / factor, 1.83,
   'the calibrated first video frame has 183 cm nominal height');
  assertAuxiliaryScale(h, video, factor);
  closeTo(Number(h.state.footErrorWorld), .008 * factor, 'male source endpoint diagnostic reports the deliberate world inset');
  assert.equal(h.state.heelContactDropMetres, '0.008');
 } finally {h.close();}
});

test('runtime resamples changed source furniture and preserves calibration when gender or media changes', async () => {
 const h = harness({furnitureRows: 4}); await new Promise(resolve => setImmediate(resolve));
 try {
  h.tick(1); const root = h.scene.getObjectByName('liveavatar'), before = root.scale.y;
  h.furniture.configure(5); h.tick(1.1);
  assert.equal(root.scale.y, before, 'sampling is bounded to the configured interval');
  h.tick(1.3);
  const factor = sourceHeightFactor(5, h.floor.position.y);
  closeTo(root.scale.y, factor, 'new furniture dimensions replace the previous scale');
  assert.equal(h.state.furnitureNominalHeightCm, '195');
  h.controls.onVariant('male'); h.playing(); h.tick(1.6);
  const male = h.scene.getObjectByName('liveavatar-video');
  closeTo((imagePointWorld(h.T, male, 248, 5, 496, 608).y - h.floor.position.y) / factor, 1.83,
   'gender change retains current furniture calibration');
  h.videos.at(-1).emit('error'); h.tick(2);
  assert.equal(h.state.mode, 'still'); closeTo(root.scale.y, factor, 'playback failure retains scene calibration');
  assertAuxiliaryScale(h, h.scene.getObjectByName('liveavatar-still'), factor);
 } finally {h.close();}
});

test('runtime reports uncalibrated factor one while source furniture has not become available', () => {
 const h = harness({motion: false});
 try {
  h.tick(); assert.equal(h.state.scaleCalibrated, 'false');
  assert.equal(h.state.worldUnitsPerMetre, '1');
  assert.deepEqual([...h.scene.getObjectByName('liveavatar').scale.toArray()], [1, 1, 1]);
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
  closeTo(sole.y - h.floor.position.y, -.008, 'requested seating follows a changed floor');
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

test('hiding the avatar also hides every shadow, pauses playback and retains furniture and avatar preferences', async () => {
 const h = harness({variant: 'male'}); await Promise.resolve();
 try {
  h.playing(); h.tick();
  const root = h.scene.getObjectByName('liveavatar'), video = h.videos.at(-1);
  const originalCamera = h.camera.position.toArray(), furniture = h.storage.get('furniture-saved-configuration');
  h.controls.onVisibility(false); h.tick(2);
  assert.equal(root.visible, false, 'body, wall shadow and foot-contact meshes share this hidden parent');
  root.traverse(object => {if (object.isMesh) assert.equal(object.visible, false, object.name + ' renderable is hidden');});
  assert.equal(h.anchor.visible, false, 'the original reference figure stays hidden');
  assert.equal(video.paused, true);
  assert.equal(h.state.visible, false);
  assert.deepEqual(JSON.parse(h.storage.get('befun-viewer-avatar-v1')).state, {avatar: 'male', motion: true, visible: false});
  h.document.emit('visibilitychange'); assert.equal(video.paused, true, 'returning to the tab cannot restart a hidden avatar');
  video.emit('playing'); assert.equal(video.paused, true, 'late autoplay events remain paused');
  video.emit('error'); h.tick(3); assert.equal(root.visible, false, 'late fallback cannot reveal the still or shadows');
  h.controls.onVisibility(true); h.tick(4);
  assert.equal(root.visible, true); assert.equal(video.paused, false);
  assert.equal(h.state.variant, 'male'); assert.equal(h.state.motion, true);
  assert.deepEqual(h.camera.position.toArray(), originalCamera);
  assert.equal(h.storage.get('furniture-saved-configuration'), furniture);
 } finally {h.close();}
});

test('hidden state survives a fresh install and page return without playing video', async () => {
 const h = harness({visible: false}); await Promise.resolve();
 try {
  h.tick();
  assert.equal(h.scene.getObjectByName('liveavatar').visible, false);
  assert.equal(h.videos.at(-1).playCount, 0);
  assert.equal(h.state.visible, false);
  h.close(); h.window.emit('pageshow', {persisted: true}); await Promise.resolve(); h.tick(2);
  assert.equal(h.scene.getObjectByName('liveavatar').visible, false);
  assert.equal(h.videos.at(-1).playCount, 0);
  h.controls.onVisibility(true);
  assert.equal(h.scene.getObjectByName('liveavatar').visible, true);
  assert.equal(h.videos.at(-1).playCount, 1);
 } finally {h.close();}
});
