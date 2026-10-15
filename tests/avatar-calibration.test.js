import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const project = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, project), 'utf8');
const exports = {};
const engineContext = {exports, module: {exports}, require: createRequire(import.meta.url),
 __filename: fileURLToPath(new URL('public/original-configurator/v3d.js', project)), console};
engineContext.global = engineContext;
vm.runInNewContext(read('public/original-configurator/v3d.js'), engineContext);
const T = exports;
assert.equal(T.REVISION, '4.1.1');
const window = {};
vm.runInNewContext(read('public/liveavatar/avatar-calibration.js'), {window});
const create = window.LiveAvatarCalibration.create;
const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-7,
 `${message}: expected ${expected}, received ${actual}`);

// An independent source-style assembly: row coordinates advance by internal
// height/100, shared frame parts are held by every neighbouring cell, and each
// bottom connector owns its leg. Only getHeight uses the nominal 41 -> 38 map.
function fixture(rowCount = 4) {
 const scene = new T.Scene(), assembly = new T.Group(), floorParent = new T.Group();
 scene.add(assembly, floorParent);
 const floor = new T.Mesh(new T.PlaneGeometry(100, 10));
 floor.position.y = -.047835713217155906;
 floorParent.add(floor);
 const camera = new T.PerspectiveCamera(35, 1.5, .01, 100);
 camera.position.set(3, 4, 5); scene.add(camera);
 const unrelated = new T.Mesh(new T.BoxGeometry(1000, 1000, 1000));
 unrelated.name = 'liveavatar-wall-shadow'; scene.add(unrelated);
 let nominalOverride, rows = [], parts, cells, selection;
 class SourceCell {
  static getHeight() {
   if (nominalOverride !== undefined) return nominalOverride;
   return 2 + 3 + rows.reduce((total, height) => total + new Map([[6, 6], [20, 20], [41, 38]]).get(height), 0);
  }
 }
 function configure(heights) {
  rows = [...heights]; parts = new Map(); cells = []; selection = [];
  assembly.clear();
  const points = [0];
  for (const height of rows) points.push(points.at(-1) + height / 100);
  function part(key, make) {
   if (!parts.has(key)) {const model = make(); parts.set(key, {model}); assembly.add(model);}
   return parts.get(key);
  }
  function connector(x, level, z) {
   return part(`connector:${x},${level},${z}`, () => {
    const model = new T.Mesh(new T.BoxGeometry(.02, .02, .02));
    model.position.set(x, points[level], z);
    if (!level) {
     const leg = new T.Mesh(new T.BoxGeometry(.02, .04, .02));
     leg.name = 'source-leg-child'; leg.position.y = -.02; model.add(leg);
    }
    return model;
   });
  }
  function bar(axis, x, y, z, length) {
   return part(`bar:${axis},${x},${y},${z}`, () => {
    const dimensions = [.02, .02, .02]; dimensions[axis] = length;
    const model = new T.Mesh(new T.BoxGeometry(...dimensions));
    model.position.set(x, y, z); model.position.setComponent(axis, model.position.getComponent(axis) + length / 2);
    return model;
   });
  }
  for (let row = 0; row < rows.length; row++) {
   const cell = new SourceCell(); cell.frame = new Map();
   let id = 0;
   for (const level of [row, row + 1]) for (const x of [0, .775]) for (const z of [0, .41])
    cell.frame.set(id++, connector(x, level, z));
   for (const x of [0, .775]) for (const z of [0, .41])
    cell.frame.set(id++, bar(1, x, points[row], z, rows[row] / 100));
   for (const level of [row, row + 1]) {
    for (const x of [0, .775]) cell.frame.set(id++, bar(2, x, points[level], 0, .41));
    for (const z of [0, .41]) cell.frame.set(id++, bar(0, 0, points[level], z, .775));
   }
   cells.push(cell);
   const overlay = new T.Mesh(new T.BoxGeometry(200, 200, 200));
   overlay.userData.cell = cell; assembly.add(overlay); selection.push(overlay);
   // Multiple scene objects may point at the same cell; discovery must dedupe.
   const other = new T.Object3D(); other.userData.cell = cell; assembly.add(other);
  }
 }
 configure(Array(rowCount).fill(41));
 const app = {scene, camera};
 return {scene, assembly, floor, floorParent, camera, unrelated, app,
  get parts() {return parts;}, get cells() {return cells;}, get selection() {return selection;},
  configure, overrideHeight(value) {nominalOverride = value;},
  calibrator: create(app, T, floor)};
}

test('157/195 cm source labels calibrate against their actual 0.41-unit row meshes', () => {
 for (const [rows, nominal] of [[4, 157], [5, 195]]) {
  const h = fixture(rows), measured = h.calibrator.measure();
  assert.equal(measured.ready, true); assert.equal(measured.nominalHeightCm, nominal);
  const expectedWorld = rows * .41 + .01 - h.floor.position.y;
  close(measured.worldHeight, expectedWorld, `${rows} rows world span`);
  close(measured.factor, expectedWorld / (nominal / 100), 'source units per nominal metre');
  // The calibrated male/female is checked in the same coordinate system as
  // the cabinet, rather than equating 1 renderer unit with 1 physical metre.
  for (const height of [1.67, 1.83])
   close(height * measured.factor / measured.worldHeight, height / (nominal / 100), 'avatar/cabinet height ratio');
  assert.equal(measured.cellCount, rows);
  assert.equal(measured.frameCount, 12 * rows + 8, 'shared frame models counted once');
 }
});

test('selection overlays, avatars and shadows cannot inflate frame bounds; connector leg children are included', () => {
 const h = fixture();
 const measured = h.calibrator.measure();
 close(measured.frameBottomY, -.04, 'leg child lower endpoint');
 close(measured.frameTopY, 1.65, 'top connector endpoint');
 close(measured.frontZ, .42, 'front connector extent');
 close(measured.backZ, -.01, 'back connector extent');
 h.selection[0].scale.set(100, 100, 100); h.unrelated.position.y = 10000;
 const avatarRoot = new T.Group(); avatarRoot.name = 'liveavatar';
 avatarRoot.add(new T.Mesh(new T.PlaneGeometry(1, 1.83))); h.scene.add(avatarRoot);
 avatarRoot.scale.setScalar(measured.factor * 100);
 const after = h.calibrator.measure();
 close(after.factor, measured.factor, 'unrelated geometry has no contribution');
 avatarRoot.scale.setScalar(after.factor);
 close(h.calibrator.measure().factor, after.factor, 'avatar calibration cannot feed back into its own measurement');
 assert.equal(after.frameCount, measured.frameCount);
});

test('reconfiguration and source nominal changes are sampled afresh without a stale cached scale', () => {
 const h = fixture(4), before = h.calibrator.measure();
 h.configure([41, 41, 41, 41, 41]);
 const five = h.calibrator.measure();
 assert.equal(five.nominalHeightCm, 195); assert.equal(five.cellCount, 5);
 assert.notEqual(five.factor, before.factor);
 h.configure([20, 41, 6]);
 const mixed = h.calibrator.measure();
 assert.equal(mixed.nominalHeightCm, 69);
 close(mixed.worldHeight, .67 + .01 - h.floor.position.y, 'mixed internal heights');
 close(mixed.factor, mixed.worldHeight / .69, 'mixed nominal calibration');
});

test('world transforms and ground height are honoured without changing models or the camera', () => {
 const h = fixture(), before = h.calibrator.measure();
 h.assembly.position.y = 2.5; h.floorParent.position.y = 2.5;
 const positions = [...h.parts.values()].map(part => part.model.position.toArray());
 const camera = {position: h.camera.position.toArray(), rotation: h.camera.rotation.toArray(), zoom: h.camera.zoom};
 const measured = h.calibrator.measure();
 close(measured.groundY, h.floor.position.y + 2.5, 'world ground');
 close(measured.factor, before.factor, 'translation does not change calibration');
 assert.deepEqual([...h.parts.values()].map(part => part.model.position.toArray()), positions);
 assert.deepEqual({position: h.camera.position.toArray(), rotation: h.camera.rotation.toArray(), zoom: h.camera.zoom}, camera);
 h.floor.position.y -= .1;
 close(h.calibrator.measure().worldHeight, measured.worldHeight + .1, 'ground changes are remeasured');
});

test('invalid source nominal heights return an explicit uncalibrated factor instead of a guessed scale', () => {
 const h = fixture();
 for (const value of [0, -157, NaN, Infinity, '157', null]) {
  h.overrideHeight(value);
  const measured = h.calibrator.measure();
  assert.equal(measured.ready, false); assert.equal(measured.factor, 1);
  assert.equal(measured.reason, 'invalid-nominal-height');
  assert.ok(measured.worldHeight > 0, 'valid geometric evidence remains available');
 }
 h.overrideHeight(157);
 assert.equal(h.calibrator.measure().ready, true, 'can recover after a transient invalid dimension');
});

test('hidden frame descendants and empty/invalid assemblies cannot produce a successful calibration', () => {
 const h = fixture();
 const connector = [...h.parts.values()].find(part => part.model.children.length).model;
 const helper = new T.Mesh(new T.BoxGeometry(100, 100, 100)); helper.visible = false; connector.add(helper);
 close(h.calibrator.measure().frameBottomY, -.04, 'hidden child helper ignored');
 h.assembly.visible = false;
 const hidden = h.calibrator.measure();
 assert.equal(hidden.ready, false); assert.equal(hidden.reason, 'no-visible-frame');
 h.assembly.visible = true; h.floor.position.y = 99;
 const groundAbove = h.calibrator.measure();
 assert.equal(groundAbove.ready, false); assert.equal(groundAbove.reason, 'invalid-world-height');
 h.assembly.clear();
 const empty = h.calibrator.measure();
 assert.equal(empty.reason, 'no-cells'); assert.equal(empty.ready, false); assert.equal(empty.factor, 1);
});

test('dispose is idempotent and performs no further scene sampling', () => {
 const h = fixture();
 h.calibrator.dispose(); h.calibrator.dispose();
 h.scene.traverse = () => {throw new Error('disposed sampler touched the source scene');};
 const measured = h.calibrator.measure();
 assert.equal(measured.ready, false); assert.equal(measured.factor, 1);
 assert.equal(measured.reason, 'disposed');
});
