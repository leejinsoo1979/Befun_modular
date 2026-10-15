import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const project = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, project), 'utf8');
const originalMaxPolar = 77.67 * Math.PI / 180;

function eventTarget() {
 const listeners = new Map();
 return {
  addEventListener(type, handler) {
   if (!listeners.has(type)) listeners.set(type, new Set());
   listeners.get(type).add(handler);
  },
  removeEventListener(type, handler) {listeners.get(type)?.delete(handler);},
  emit(type, event = {}) {for (const handler of [...(listeners.get(type) || [])]) handler(event);},
 };
}

function harness({delayed = false} = {}) {
 const window = eventTarget();
 const document = {...eventTarget(), documentElement: {dataset: {}}};
 const canvas = {...eventTarget(), style: {}, ownerDocument: document, clientWidth: 1280, clientHeight: 720};
 const exports = {};
 const engineContext = {exports, module: {exports}, require: createRequire(import.meta.url),
  __filename: fileURLToPath(new URL('public/original-configurator/v3d.js', project)),
  console, performance};
 engineContext.global = engineContext;
 vm.runInNewContext(read('public/original-configurator/v3d.js'), engineContext);
 engineContext.window = window;
 engineContext.document = document;
 const T = exports;
 assert.equal(T.REVISION, '4.1.1', 'exercise the actual captured Verge3D engine');
 const camera = new T.PerspectiveCamera(43, 16 / 9, .01, 100);
 camera.up.set(0, 0, 1);
 camera.position.set(3.7, -2.1, 2.8);
 camera.zoom = 1.24;
 const controls = new T.OrbitControls(camera, canvas);
 controls.targetObj.position.set(.3, -.4, .6);
 controls.minPolarAngle = .1;
 controls.maxPolarAngle = originalMaxPolar;
 controls.minAzimuthAngle = -.4;
 controls.maxAzimuthAngle = .4;
 controls.enableRotate = false;
 controls.enableDamping = false;
 controls.autoRotate = false;
 controls.minDistance = .7;
 controls.maxDistance = 40;
 controls.update();
 camera.controls = {orbitMinPolarAngle: .1, orbitMaxPolarAngle: originalMaxPolar,
  orbitMinAzimuthAngle: -.4, orbitMaxAzimuthAngle: .4,
  orbitMinDistance: .7, orbitMaxDistance: 40, enablePan: true, enableZoom: true};
 const app = {camera, controls, renderCallbacks: []};
 if (!delayed) window.app = app;
 const frames = new Map();
 let nextFrame = 0;
 const context = {window, document, Math,
  requestAnimationFrame(callback) {frames.set(++nextFrame, callback); return nextFrame;},
  cancelAnimationFrame(id) {frames.delete(id);},
 };
 const initial = snapshot(camera, controls);
 vm.runInNewContext(read('public/original-configurator/camera-controls.js'), context);
 return {T, window, document, canvas, camera, controls, app, frames, initial,
  tick(elapsed = 1) {for (const callback of [...app.renderCallbacks]) callback(1 / 60, elapsed);},
  ready() {
   window.app = app;
   const pending = [...frames.values()]; frames.clear();
   for (const callback of pending) callback(0);
  },
  close() {window.emit('pagehide'); controls.dispose();},
 };
}

function snapshot(camera, controls) {
 return {position: Array.from(camera.position.toArray()), quaternion: Array.from(camera.quaternion.toArray()),
  up: Array.from(camera.up.toArray()), zoom: camera.zoom,
  target: Array.from(controls.targetObj.position.toArray()),
  minDistance: controls.minDistance, maxDistance: controls.maxDistance,
  enablePan: controls.enablePan, enableZoom: controls.enableZoom,
  enableDamping: controls.enableDamping, autoRotate: controls.autoRotate};
}

function setOrbit(h, polar, azimuth, radius = 5) {
 const offset = new h.T.Vector3().setFromSphericalCoords(radius, polar, azimuth);
 const upright = new h.T.Quaternion().setFromUnitVectors(new h.T.Vector3(0, 1, 0), h.camera.up);
 offset.applyQuaternion(upright);
 h.camera.position.copy(h.controls.targetObj.position).add(offset);
 h.controls.update();
}

test('the actual orbit controller passes the former 77.67° limit, horizon and underside while preserving source framing', () => {
 const h = harness();
 try {
  assert.equal(h.app.camera, h.camera);
  assert.equal(h.app.controls, h.controls);
  assert.deepEqual(snapshot(h.camera, h.controls), h.initial,
   'installing orbit ranges must not move, rotate, zoom, reframe or replace the source camera');
  assert.equal(h.controls.minPolarAngle, 0);
  assert.equal(h.controls.maxPolarAngle, Math.PI);
  assert.equal(h.controls.minAzimuthAngle, -Infinity);
  assert.equal(h.controls.maxAzimuthAngle, Infinity);
  assert.equal(h.controls.enableRotate, true);
  assert.equal(h.camera.controls.orbitMinPolarAngle, 0);
  assert.equal(h.camera.controls.orbitMaxPolarAngle, Math.PI);
  assert.equal(h.camera.controls.orbitMinAzimuthAngle, -Infinity);
  assert.equal(h.camera.controls.orbitMaxAzimuthAngle, Infinity);
  assert.equal(h.camera.controls.orbitMinDistance, .7);
  assert.equal(h.camera.controls.orbitMaxDistance, 40);

  // Demonstrate the original limit with the same real controller before
  // exercising the adapter's extended range; no mock angle calculation.
  h.controls.maxPolarAngle = originalMaxPolar;
  setOrbit(h, Math.PI / 2, 0);
  assert.ok(Math.abs(h.controls.getPolarAngle() - originalMaxPolar) < 1e-10);
  h.controls.maxPolarAngle = Math.PI;
  const target = h.controls.targetObj.position.clone();
  for (const degrees of [89, 90, 105, 135, 179]) {
   const desired = degrees * Math.PI / 180;
   setOrbit(h, desired, 0);
   assert.ok(Math.abs(h.controls.getPolarAngle() - desired) < 1e-10, `${degrees}° polar orbit`);
   assert.ok(Math.abs(h.camera.position.distanceTo(target) - 5) < 1e-10, 'orbit radius stays fixed');
   assert.ok(h.controls.targetObj.position.distanceTo(target) < 1e-10, 'orbit target stays fixed');
  }
  for (const azimuth of [-170, -95, 95, 170]) {
   setOrbit(h, Math.PI / 2, azimuth * Math.PI / 180);
   assert.ok(Math.abs(h.controls.getAzimuthalAngle() - azimuth * Math.PI / 180) < 1e-10,
    `${azimuth}° horizontal orbit is no longer clamped`);
  }
  assert.deepEqual(Array.from(h.camera.up.toArray()), h.initial.up);
  assert.equal(h.camera.zoom, h.initial.zoom);
  assert.equal(h.controls.autoRotate, false, 'no introductory spinning is re-enabled');
  h.tick(2);
  assert.equal(h.document.documentElement.dataset.cameraMaxPolar, String(Math.PI));
  assert.equal(h.document.documentElement.dataset.cameraMinAzimuth, '-Infinity');
 } finally {h.close();}
});

test('delayed app readiness and replacement controls acquire the full range without changing their camera state', () => {
 const h = harness({delayed: true});
 let replacement;
 try {
  assert.equal(h.app.renderCallbacks.length, 0);
  assert.equal(h.frames.size, 1);
  h.ready();
  assert.equal(h.frames.size, 0);
  assert.equal(h.app.renderCallbacks.length, 1);
  assert.deepEqual(snapshot(h.camera, h.controls), h.initial);
  replacement = new h.T.OrbitControls(h.camera, h.canvas);
  replacement.maxPolarAngle = originalMaxPolar;
  replacement.enableRotate = false;
  const before = snapshot(h.camera, replacement);
  h.app.controls = replacement;
  h.tick(1);
  assert.equal(replacement.maxPolarAngle, Math.PI);
  assert.equal(replacement.enableRotate, true);
  assert.deepEqual(snapshot(h.camera, replacement), before);
 } finally {replacement?.dispose(); h.close();}
});

test('pagehide cancels pending boot and bfcache restoration installs one render callback', () => {
 const pending = harness({delayed: true});
 try {
  assert.equal(pending.frames.size, 1);
  pending.window.emit('pagehide', {persisted: true});
  assert.equal(pending.frames.size, 0);
  pending.window.app = pending.app;
  pending.window.emit('pageshow', {persisted: true});
  assert.equal(pending.app.renderCallbacks.length, 1);
  pending.window.emit('pagehide', {persisted: true});
  assert.equal(pending.app.renderCallbacks.length, 0);
  pending.window.emit('pageshow', {persisted: true});
  assert.equal(pending.app.renderCallbacks.length, 1);
  assert.deepEqual(snapshot(pending.camera, pending.controls), pending.initial);
 } finally {pending.close();}
});
