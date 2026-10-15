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
  addEventListener(type, handler, options) {
   if (!listeners.has(type)) listeners.set(type, new Set());
   const capture=options === true || !!options?.capture;
   if (![...listeners.get(type)].some(entry => entry.handler===handler&&entry.capture===capture)) listeners.get(type).add({handler,capture});
  },
  removeEventListener(type, handler) {
   for (const entry of listeners.get(type) || []) if (entry.handler === handler) listeners.get(type).delete(entry);
  },
  emit(type, event = {}) {
   for (const {handler} of [...(listeners.get(type) || [])].sort((a,b) => Number(b.capture)-Number(a.capture))) handler(event);
  },
  listenerCount(type) {return listeners.get(type)?.size || 0;},
 };
}

function harness({delayed = false} = {}) {
 const window = eventTarget();
 const document = {...eventTarget(), documentElement: {dataset: {}}};
 const canvas = {...eventTarget(), style: {}, ownerDocument: document, clientWidth: 1280, clientHeight: 720,
  getBoundingClientRect: () => ({left:120,top:60,width:1280,height:720})};
 let now=0;
 const exports = {};
 const engineContext = {exports, module: {exports}, require: createRequire(import.meta.url),
  __filename: fileURLToPath(new URL('public/original-configurator/v3d.js', project)),
  console, performance: {now: () => now}};
 engineContext.global = engineContext;
 vm.runInNewContext(read('public/original-configurator/v3d.js'), engineContext);
 engineContext.window = window;
 engineContext.document = document;
 const T = exports;
 window.v3d=T;
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
 controls.enablePan = false;
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
 const parent={},location={origin:'http://127.0.0.1:5173'};
 const context = {window, document, Math, parent, location,
  requestAnimationFrame(callback) {frames.set(++nextFrame, callback); return nextFrame;},
  cancelAnimationFrame(id) {frames.delete(id);},
 };
 const initial = snapshot(camera, controls);
 vm.runInNewContext(read('public/original-configurator/camera-controls.js'), context);
 return {T, window, document, canvas, camera, controls, app, frames, initial, parent, location,
  tick(elapsed = 1) {for (const callback of [...app.renderCallbacks]) callback(1 / 60, elapsed);},
  step(count=1) {for(let i=0;i<count;i++){now+=1000/60;app.controls.update();}},
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

test('the actual orbit controller reaches a level front view but clamps all lower views while preserving framing', () => {
 const h = harness();
 try {
  assert.equal(h.app.camera, h.camera);
  assert.equal(h.app.controls, h.controls);
  assert.deepEqual(snapshot(h.camera, h.controls), {...h.initial,enablePan:true},
   'installing orbit ranges must not move, rotate, zoom, reframe or replace the source camera');
  assert.equal(h.controls.minPolarAngle, 0);
  assert.equal(h.controls.maxPolarAngle, Math.PI/2);
  assert.equal(h.controls.enableTurnover, false);
  assert.equal(h.controls.minAzimuthAngle, -Infinity);
  assert.equal(h.controls.maxAzimuthAngle, Infinity);
  assert.equal(h.controls.enableRotate, true);
  assert.equal(h.controls.enablePan, true);
  assert.equal(h.controls.screenSpacePanning, true);
  assert.equal(h.camera.controls.enablePan, true);
  assert.equal(h.camera.controls.orbitMinPolarAngle, 0);
  assert.equal(h.camera.controls.orbitMaxPolarAngle, Math.PI/2);
  assert.equal(h.camera.controls.orbitMinAzimuthAngle, -Infinity);
  assert.equal(h.camera.controls.orbitMaxAzimuthAngle, Infinity);
  assert.equal(h.camera.controls.orbitMinDistance, .7);
  assert.equal(h.camera.controls.orbitMaxDistance, 40);

  // Demonstrate the original limit with the same real controller before
  // exercising the adapter's extended range; no mock angle calculation.
  h.controls.maxPolarAngle = originalMaxPolar;
  setOrbit(h, Math.PI / 2, 0);
  assert.ok(Math.abs(h.controls.getPolarAngle() - originalMaxPolar) < 1e-10);
  h.controls.maxPolarAngle = Math.PI/2;
  const target = h.controls.targetObj.position.clone();
  for (const degrees of [89, 90, 105, 135, 179]) {
   const desired = degrees * Math.PI / 180;
   setOrbit(h, desired, 0);
   const expected=Math.min(desired,Math.PI/2);
   assert.ok(Math.abs(h.controls.getPolarAngle() - expected) < 1e-10, `${degrees}° requested polar orbit stops at the horizon`);
   assert.ok(h.camera.position.clone().sub(target).dot(h.camera.up)>=-1e-10,'camera never goes below its viewing target');
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
  assert.equal(h.document.documentElement.dataset.cameraMaxPolar, String(Math.PI/2));
  assert.equal(h.document.documentElement.dataset.cameraMinAzimuth, '-Infinity');
 } finally {h.close();}
});

test('delayed app readiness and replacement controls acquire the horizon limit without changing their camera state', () => {
 const h = harness({delayed: true});
 let replacement;
 try {
  assert.equal(h.app.renderCallbacks.length, 0);
  assert.equal(h.frames.size, 1);
  h.ready();
  assert.equal(h.frames.size, 0);
  assert.equal(h.app.renderCallbacks.length, 1);
  assert.deepEqual(snapshot(h.camera, h.controls), {...h.initial,enablePan:true});
  replacement = new h.T.OrbitControls(h.camera, h.canvas);
  replacement.maxPolarAngle = originalMaxPolar;
  replacement.enableRotate = false;
  const before = snapshot(h.camera, replacement);
  h.app.controls = replacement;
  h.tick(1);
  assert.equal(replacement.maxPolarAngle, Math.PI/2);
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
  assert.deepEqual(snapshot(pending.camera, pending.controls), {...pending.initial,enablePan:true});
 } finally {pending.close();}
});

function mouseEvent(values={}) {
 return {clientX:760,clientY:420,button:0,deltaY:0,preventDefault(){},stopPropagation(){},...values};
}
function anchorAt(h,ndc) {
 h.camera.updateMatrixWorld(true);
 const plane=new h.T.Plane().setFromNormalAndCoplanarPoint(h.camera.getWorldDirection(new h.T.Vector3()),h.controls.targetObj.position);
 const ray=new h.T.Raycaster();ray.setFromCamera(ndc,h.camera);
 return ray.ray.intersectPlane(plane,new h.T.Vector3());
}
function screenPoint(h,world) {
 h.camera.updateMatrixWorld(true);
 return world.clone().project(h.camera);
}

test('vertical mouse drag stops at 90 degrees even with inertia, and can immediately rotate upward again', () => {
 const h=harness();
 try {
  for(const damping of [false,true]) {
   h.controls.enableDamping=damping;
   setOrbit(h,80*Math.PI/180,0);
   h.window.emit('mousedown');
   h.canvas.emit('mousedown',mouseEvent());
   h.document.emit('mousemove',mouseEvent({clientY:-1200}));
   h.document.emit('mouseup',mouseEvent());
   for(let i=0;i<180;i++) {
    h.step();
    assert.ok(h.controls.getPolarAngle()<=Math.PI/2+1e-10,'drag and its inertia cannot cross the horizon');
   }
   assert.ok(Math.abs(h.controls.getPolarAngle()-Math.PI/2)<1e-10,'the exact level view remains reachable');
   h.canvas.emit('mousedown',mouseEvent());
   h.document.emit('mousemove',mouseEvent({clientY:470}));
   h.document.emit('mouseup',mouseEvent());h.step(30);
   assert.ok(h.controls.getPolarAngle()<Math.PI/2-.01,'the camera can leave the limit in the opposite direction');
  }
 } finally {h.close();}
});

test('actual right and middle mouse drags pan camera and target together in the screen plane; left drag still orbits', () => {
 const h=harness();
 try {
  for(const button of [2,1]) {
   const camera=h.camera.position.clone(),target=h.controls.targetObj.position.clone(),rotation=h.camera.quaternion.clone();
   const distance=h.controls.getDistance();
   h.canvas.emit('mousedown',mouseEvent({button}));
   h.document.emit('mousemove',mouseEvent({button,clientX:910,clientY:490}));
   h.step(3);
   h.document.emit('mouseup',mouseEvent({button}));
   const movement=h.camera.position.clone().sub(camera);
   assert.ok(movement.length()>.1,'pan visibly translates the existing camera');
   assert.ok(h.controls.targetObj.position.clone().sub(target).distanceTo(movement)<1e-9);
   assert.ok(Math.abs(h.controls.getDistance()-distance)<1e-9);
   assert.ok(1-Math.abs(rotation.dot(h.camera.quaternion))<1e-10,'panning does not rotate');
   assert.ok(Math.abs(movement.dot(h.camera.getWorldDirection(new h.T.Vector3())))<1e-9);
  }
  const rotation=h.camera.quaternion.clone();
  h.canvas.emit('mousedown',mouseEvent());
  h.document.emit('mousemove',mouseEvent({clientX:900,clientY:470}));h.step(3);
  h.document.emit('mouseup',mouseEvent());
  assert.ok(1-Math.abs(rotation.dot(h.camera.quaternion))>1e-5);
 } finally {h.close();}
});

test('actual wheel zoom keeps the cursor anchor fixed off center, in both directions and throughout native damping', () => {
 const h=harness();
 try {
  for(const damping of [false,true]) {
   h.controls.enableDamping=damping;
   for(const [x,y,deltaY] of [[.62,.36,240],[-.57,-.45,-180],[0,0,120]]) {
    const ndc=new h.T.Vector2(x,y),anchor=anchorAt(h,ndc),distance=h.controls.getDistance();
    h.canvas.emit('wheel',mouseEvent({clientX:120+(x+1)*640,clientY:60+(1-y)*360,deltaY}));
    h.step(100);
    const projected=screenPoint(h,anchor);
    assert.ok(Math.abs(projected.x-x)<1e-8&&Math.abs(projected.y-y)<1e-8,`cursor anchor drifted with damping=${damping}`);
    assert.ok(deltaY>0?h.controls.getDistance()>distance:h.controls.getDistance()<distance,'wheel direction is preserved');
   }
  }
  h.controls.maxDistance=h.controls.getDistance();
  const camera=h.camera.position.clone(),target=h.controls.targetObj.position.clone();
  h.canvas.emit('wheel',mouseEvent({clientX:1100,deltaY:1200}));h.step(150);
  assert.ok(h.camera.position.distanceTo(camera)<1e-9,'a clamped zoom must not move the camera');
  assert.ok(h.controls.targetObj.position.distanceTo(target)<1e-9,'a clamped zoom must not shift the pivot');
  h.controls.enableZoom=false;
  h.canvas.emit('wheel',mouseEvent({deltaY:-500}));h.step(10);
  assert.ok(h.camera.position.distanceTo(camera)<1e-9,'disabled source zoom is respected');
 } finally {h.close();}
});

test('cursor zoom also anchors an orthographic source camera, and replacement/page lifecycle restore wrappers and listeners', () => {
 const h=harness();
 let replacement;
 try {
  const camera=new h.T.OrthographicCamera(-4,4,2.25,-2.25,.01,100);
  camera.position.copy(h.camera.position);camera.up.copy(h.camera.up);
  replacement=new h.T.OrbitControls(camera,h.canvas);
  replacement.targetObj.position.copy(h.controls.targetObj.position);replacement.enableDamping=false;replacement.update();
  const oldUpdate=h.controls.update;
  h.app.controls=replacement;h.app.camera=camera;h.tick(2);
  assert.notEqual(h.controls.update,oldUpdate,'the old source controller is unwrapped');
  h.controls.dispose();h.controls=replacement;h.camera=camera;
  const anchor=anchorAt(h,new h.T.Vector2(.6,-.3)),initialZoom=camera.zoom;
  h.canvas.emit('wheel',mouseEvent({clientX:1144,clientY:528,deltaY:250}));h.step(5);
  const projected=screenPoint(h,anchor);
  assert.ok(Math.abs(projected.x-.6)<1e-8&&Math.abs(projected.y+.3)<1e-8);
  assert.ok(camera.zoom<initialZoom);
  const wrapped=replacement.update;
  h.window.emit('pagehide',{persisted:true});
  assert.notEqual(replacement.update,wrapped);
  assert.equal(h.canvas.listenerCount('wheel'),1,'only the native source listener remains');
  assert.equal(h.window.listenerCount('pointerdown'),0);
  h.window.emit('pageshow',{persisted:true});
  assert.equal(h.canvas.listenerCount('wheel'),2,'exactly one cursor listener is restored');
  assert.equal(h.app.renderCallbacks.length,1);
 } finally {h.close();}
});

function framingFixture(h){
 const T=h.T,scene=new T.Scene(),furniture=new T.Mesh(new T.BoxGeometry(2.27,.81,.4));
 furniture.position.set(.7,.405,.1);scene.add(furniture);h.app.scene=scene;
 h.camera.up.set(0,1,0);
 let frames=0;
 // Exercise the source app's real perspective-fitting routine against actual
 // furniture geometry, rather than a mock size/distance calculation.
 const runtime=read('public/original-configurator/configurator.js');
 const fit=runtime.slice(runtime.indexOf('function p4('),runtime.indexOf('var NrA='));
 vm.runInNewContext(fit+';window.fitFixture=()=>p4({fill:.65,minDist:3.5});',
  {window:h.window,tl:T.Box3,HA:T.Vector3,hu:{models:[furniture]}});
 h.window.BefunCameraFraming={
  frame(){
   frames++;
   const center=new T.Box3().setFromObject(furniture).getCenter(new T.Vector3());
   h.controls.targetObj=new T.Object3D();h.controls.targetObj.position.copy(center);
   h.camera.position.copy(center).add(new T.Vector3(1,1,5));h.controls.update();
   h.window.fitFixture();return true;
  },
  fit:h.window.fitFixture,
  bounds:()=>new T.Box3().setFromObject(furniture),
 };
 return {furniture,frames:()=>frames};
}
function spaceEvent(values={}){
 return {code:'Space',key:' ',preventDefault(){this.prevented=true;},...values};
}

test('Space recenters the current furniture front-on, resets zoom, and drains native orbit/pan/wheel inertia',()=>{
 const h=harness();
 try{
  const fixture=framingFixture(h);
  h.controls.enableDamping=true;
  h.window.BefunCameraFraming.frame();
  h.canvas.emit('mousedown',mouseEvent());
  h.document.emit('mousemove',mouseEvent({clientX:950,clientY:450}));
  h.document.emit('mouseup',mouseEvent());h.step(2);
  h.canvas.emit('mousedown',mouseEvent({button:2}));
  h.document.emit('mousemove',mouseEvent({button:2,clientX:1050,clientY:550}));
  h.document.emit('mouseup',mouseEvent());h.step(2);
  h.canvas.emit('wheel',mouseEvent({clientX:1150,clientY:550,deltaY:-200}));h.step();
  h.camera.zoom=1.7;h.camera.updateProjectionMatrix();
  const before=fixture.furniture.matrix.clone(),event=spaceEvent();
  h.window.emit('keydown',event);
  assert.equal(event.prevented,true,'Space does not scroll the page');
  assert.equal(h.camera.zoom,1);
  const center=new h.T.Box3().setFromObject(fixture.furniture).getCenter(new h.T.Vector3());
  assert.ok(h.controls.targetObj.position.distanceTo(center)<1e-9,'pan offset is reset');
  assert.ok(h.camera.getWorldDirection(new h.T.Vector3()).distanceTo(new h.T.Vector3(0,0,-1))<1e-9);
  assert.ok(Math.abs(h.controls.getPolarAngle()-Math.PI/2)<1e-9);
  assert.ok(fixture.furniture.matrix.equals(before),'furniture is unchanged');
  const position=h.camera.position.clone(),rotation=h.camera.quaternion.clone(),distance=h.controls.getDistance();
  h.step(120);
  assert.ok(h.camera.position.distanceTo(position)<1e-9,'the reset stays still after previous inertia');
  assert.ok(1-Math.abs(h.camera.quaternion.dot(rotation))<1e-10);
  // Resize/move the same design, then verify reset fits its current geometry.
  fixture.furniture.scale.set(3,2,1);fixture.furniture.position.set(2.1,.81,.1);
  fixture.furniture.updateMatrixWorld(true);
  h.window.emit('keydown',spaceEvent());
  const newCenter=new h.T.Box3().setFromObject(fixture.furniture).getCenter(new h.T.Vector3());
  assert.ok(h.controls.targetObj.position.distanceTo(newCenter)<1e-9);
  assert.ok(h.controls.getDistance()>distance,'larger furniture gets a fresh fit');
  const bounds=new h.T.Box3().setFromObject(fixture.furniture);
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
   const point=screenPoint(h,new h.T.Vector3(x,y,z));
   assert.ok(Math.max(Math.abs(point.x),Math.abs(point.y))<=.66,'current furniture remains fully visible');
  }
 }finally{h.close();}
});

test('Space preserves editing, composition and interactive controls, skips repeat, and restores one shortcut after page return',()=>{
 const h=harness();
 try{
  const fixture=framingFixture(h);
  const ignored=[
   {target:{matches:()=>true}},
   {composedPath:()=>[{isContentEditable:true},{}]},
   {composedPath:()=>[{matches:selector=>selector.includes('input')},{}]},
   {isComposing:true},{ctrlKey:true},{metaKey:true},{altKey:true},{shiftKey:true},{defaultPrevented:true},{repeat:true},
  ];
  for(const values of ignored)h.window.emit('keydown',spaceEvent(values));
  assert.equal(fixture.frames(),0);
  h.window.FXC_SHADOW_ROOT={querySelector:()=>({})};
  h.window.emit('keydown',spaceEvent());assert.equal(fixture.frames(),0,'modal keyboard interaction stays local');
  h.window.FXC_SHADOW_ROOT=null;
  h.window.emit('keydown',spaceEvent());assert.equal(fixture.frames(),1);
  h.window.emit('pagehide',{persisted:true});h.window.emit('keydown',spaceEvent());
  assert.equal(fixture.frames(),1,'shortcut is removed when page is hidden');
  h.window.emit('pageshow',{persisted:true});h.window.emit('keydown',spaceEvent());
  assert.equal(fixture.frames(),2,'exactly one shortcut is installed on return');
 }finally{h.close();}
});

test('only the same-origin parent may request a camera reset across the iframe boundary',()=>{
 const h=harness();
 try{
  const fixture=framingFixture(h),data={type:'befun-camera-home'};
  h.window.emit('message',{data,source:h.parent,origin:'https://untrusted.example'});
  h.window.emit('message',{data,source:{},origin:h.location.origin});
  assert.equal(fixture.frames(),0);
  h.window.emit('message',{data,source:h.parent,origin:h.location.origin});
  assert.equal(fixture.frames(),1);
 }finally{h.close();}
});

test('Space centers furniture horizontally with the full person beside it on desktop and portrait viewports',()=>{
 const h=harness();
 try{
  const {furniture}=framingFixture(h),T=h.T;
  const actor=new T.Group(),facing=new T.Group();actor.name='liveavatar';actor.position.set(-1.35,0,.43);actor.scale.setScalar(1.1);
  h.app.scene.add(actor);actor.add(facing);
  const woman=new T.Mesh(new T.PlaneGeometry(.8,1.67)),man=new T.Mesh(new T.PlaneGeometry(1,1.83));
  woman.name='liveavatar-video';woman.position.y=1.67/2;
  man.name='liveavatar-still';man.position.y=1.83/2;man.visible=false;
  facing.add(woman,man);
  const shadow=new T.Mesh(new T.BoxGeometry(1000,1000,1000));shadow.name='liveavatar-wall-shadow';facing.add(shadow);
  const framePosition=furniture.position.clone(),frameScale=furniture.scale.clone(),actorPosition=actor.position.clone(),actorScale=actor.scale.clone();
  for(const aspect of [16/9,390/366])for(const male of [false,true]){
   h.camera.aspect=aspect;h.camera.updateProjectionMatrix();
   woman.visible=!male;man.visible=male;facing.rotation.y=1.4;h.app.scene.updateMatrixWorld(true);
   h.window.emit('keydown',spaceEvent());
   const target=h.controls.targetObj.position;
   const furnitureCenter=new T.Box3().setFromObject(furniture).getCenter(new T.Vector3());
   assert.ok(Math.abs(target.x-furnitureCenter.x)<1e-9&&Math.abs(target.z-furnitureCenter.z)<1e-9,'the furniture stays the horizontal orbit pivot');
   const projectedCenter=screenPoint(h,furnitureCenter);
   assert.ok(Math.abs(projectedCenter.x)<1e-9,'furniture projects to the exact horizontal viewport center');
   assert.ok(screenPoint(h,actor.position).x<0,'the person remains to the side');
   assert.ok(h.controls.getDistance()<30,'the giant wall-shadow helper is excluded');
   // Avatar billboards reorient on the next render callback. Every corner
   // must still fit after that turn, rather than only in its previous pose.
   facing.rotation.y=Math.atan2(h.camera.position.x-actor.position.x,h.camera.position.z-actor.position.z);
   h.app.scene.updateMatrixWorld(true);
   for(const mesh of [furniture,male?man:woman]){
    const vertices=mesh.geometry.attributes.position;
    for(let i=0;i<vertices.count;i++){
     const world=new T.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(mesh.matrixWorld),screen=screenPoint(h,world);
     assert.ok(Math.abs(screen.x)<=.91&&Math.abs(screen.y)<=.79,`full ${male?'male':'female'} and furniture fit at aspect ${aspect}`);
    }
   }
   assert.ok(Math.abs(h.controls.getPolarAngle()-Math.PI/2)<1e-9);
  }
  assert.ok(furniture.position.equals(framePosition)&&furniture.scale.equals(frameScale));
  assert.ok(actor.position.equals(actorPosition)&&actor.scale.equals(actorScale),'reset never resizes or moves the person');
 }finally{h.close();}
});

test('Space includes the new person geometry while its still texture is loading',()=>{
 const h=harness();
 try{
  framingFixture(h);const T=h.T,actor=new T.Group();actor.name='liveavatar';actor.position.x=-1.3;
  const still=new T.Mesh(new T.PlaneGeometry(1,1.83));still.name='liveavatar-still';still.position.y=.915;still.visible=false;
  actor.add(still);h.app.scene.add(actor);
  h.window.emit('keydown',spaceEvent());
  h.app.scene.updateMatrixWorld(true);
  const top=screenPoint(h,new T.Vector3(-1.3,1.83,0)),feet=screenPoint(h,new T.Vector3(-1.3,0,0));
  assert.ok(Math.abs(top.x)<.79&&Math.abs(top.y)<.79&&Math.abs(feet.y)<.79);
 }finally{h.close();}
});

test('the first view waits for furniture, visible person and calibration, then frames both exactly once',()=>{
 const h=harness();
 try{
  const fixture=framingFixture(h),T=h.T,avatar=new T.Group();avatar.name='liveavatar';avatar.position.x=-1.35;
  const person=new T.Mesh(new T.PlaneGeometry(.8,1.67));person.name='liveavatar-video';person.position.y=.835;person.visible=false;
  avatar.add(person);h.app.scene.add(avatar);
  let ready=false;
  h.window.BefunCameraFraming.ready=()=>ready;
  const status={dataset:{scaleCalibrated:'false'}};
  h.window.FXC_SHADOW_ROOT={querySelector:selector=>selector==='.liveavatar-controls'?status:null};
  const original=snapshot(h.camera,h.controls);
  h.tick(1);assert.equal(fixture.frames(),0);
  ready=true;h.tick(2);assert.equal(fixture.frames(),0,'media loading does not produce a partial initial fit');
  person.visible=true;h.tick(3);assert.equal(fixture.frames(),0,'calibration must finish before framing');
  assert.deepEqual(snapshot(h.camera,h.controls),original);
  avatar.scale.setScalar(1.1);status.dataset.scaleCalibrated='true';h.tick(4);
  assert.equal(fixture.frames(),1);
  const furnitureCenter=new T.Box3().setFromObject(fixture.furniture).getCenter(new T.Vector3());
  assert.ok(Math.abs(h.controls.targetObj.position.x-furnitureCenter.x)<1e-9,'the initial view centers furniture horizontally while fitting the full person beside it');
  assert.ok(Math.abs(h.controls.getPolarAngle()-Math.PI/2)<1e-9);
  const position=h.camera.position.clone();
  h.tick(5);h.tick(6);assert.equal(fixture.frames(),1);
  h.window.emit('pagehide',{persisted:true});h.window.emit('pageshow',{persisted:true});h.tick(7);
  assert.equal(fixture.frames(),1,'back/forward restore preserves the current camera');
  assert.ok(h.camera.position.distanceTo(position)<1e-9);
 }finally{h.close();}
});

test('loading completion does not replace a view the user has already moved',()=>{
 const h=harness();
 try{
  const fixture=framingFixture(h),T=h.T,avatar=new T.Group();avatar.name='liveavatar';
  const person=new T.Mesh(new T.PlaneGeometry(.8,1.67));person.name='liveavatar-video';avatar.add(person);h.app.scene.add(avatar);
  let ready=false;h.window.BefunCameraFraming.ready=()=>ready;
  h.window.emit('pointerdown',{composedPath:()=>[h.canvas,h.document,h.window]});
  ready=true;h.tick(2);assert.equal(fixture.frames(),0);
  h.window.emit('keydown',spaceEvent());assert.equal(fixture.frames(),1,'Space still deliberately restores the joint view');
 }finally{h.close();}
});

function sourceFramingBridge(h,fixture){
 const nativeFrame=h.window.BefunCameraFraming.frame;
 const runtime=read('public/original-configurator/configurator.local.js');
 const start=runtime.indexOf('let befunReframe=null;'),end=runtime.indexOf('function yj(',start);
 assert.ok(start>=0&&end>start,'exercise the generated framing bridge and source mode dispatch');
 let preloader=false,nativeCalls=0;
 const dispatch=()=>{nativeCalls++;return nativeFrame();};
 vm.runInNewContext(runtime.slice(start,end)+';window.sourceFrame=sa;',{
  window:h.window,v3d:h.T,hu:{models:[fixture.furniture]},
  q:{getLeftmostCell:()=>fixture.furniture,cabinetMode:'standard'},
  Ot:{standard:'standard',double:'double',withCorner:'corner'},
  xr:()=>({preloader}),Jr:false,YnA:{},xnA:{},p4:()=>h.window.fitFixture(),
  yj:dispatch,bj:dispatch,Fj:dispatch,
 });
 h.tick(1);
 return {nativeCalls:()=>nativeCalls,setLoading(value){preloader=value;}};
}
function sidePerson(h){
 const T=h.T,avatar=new T.Group();avatar.name='liveavatar';avatar.position.set(-1.35,0,.43);avatar.scale.setScalar(1.08);
 const person=new T.Mesh(new T.PlaneGeometry(.8,1.67));person.name='liveavatar-video';person.position.y=.835;
 avatar.add(person);h.app.scene.add(avatar);return {avatar,person};
}
function assertVisible(h,meshes){
 h.app.scene.updateMatrixWorld(true);
 for(const mesh of meshes){
  const vertices=mesh.geometry.attributes.position;
  for(let i=0;i<vertices.count;i++){
   const point=screenPoint(h,new h.T.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(mesh.matrixWorld));
   assert.ok(Math.abs(point.x)<=.91&&Math.abs(point.y)<=.8,`${mesh.name||'furniture'} is fully visible (${point.x}, ${point.y})`);
  }
 }
}

test('dimension-slider framing keeps the full person visible while growing and shrinking, using the approved reference distance',()=>{
 const h=harness();
 try{
  const fixture=framingFixture(h),{furniture}=fixture,{avatar,person}=sidePerson(h),bridge=sourceFramingBridge(h,fixture),T=h.T;
  furniture.scale.set(2.45/2.27,.875/.81,1);furniture.position.y=.875/2;avatar.position.x=-.93;
  h.camera.fov=22.9;h.camera.aspect=1418/803;h.camera.updateProjectionMatrix();
  h.window.emit('keydown',spaceEvent());
  const baseline=h.controls.getDistance();
  const left=screenPoint(h,new T.Vector3(.7-2.45/2,.405,.3)),right=screenPoint(h,new T.Vector3(.7+2.45/2,.405,.3));
  const width=(right.x-left.x)/2;
  const top=screenPoint(h,new T.Vector3(avatar.position.x,1.67*1.08,.43)),feet=screenPoint(h,avatar.position);
  assert.ok(width>.43&&width<=.51,`reference furniture fills about half the canvas width (${width})`);
  assert.ok((top.y-feet.y)/2>.6&&(top.y-feet.y)/2<=.71,'the reference person fills about two thirds of the canvas height');
  h.controls.enableDamping=true;
  let elapsed=2;
  for(const [x,y] of [[.34,.48],[2.8,1],[.7,3.5],[1,1],[.34,.48]]){
   furniture.scale.set(x,y,1);furniture.position.y=.405*y;h.app.scene.updateMatrixWorld(true);
   h.canvas.emit('wheel',mouseEvent({deltaY:-120,clientX:1100}));h.step(2);
   h.window.sourceFrame(false);
   assertVisible(h,[furniture,person]);
   assert.ok(h.controls.getDistance()>=baseline*.85,'a small cabinet cannot pull the camera inside the person-safe reference range');
   // Match the avatar callback relocating the person beside the new left edge.
   const bounds=new T.Box3().setFromObject(furniture);
   avatar.position.x=bounds.min.x-.65;avatar.scale.setScalar(1.085);
   h.tick(elapsed);h.tick(elapsed+.3);h.step(120);
   assertVisible(h,[furniture,person]);
   const center=bounds.getCenter(new T.Vector3());
   assert.ok(Math.abs(screenPoint(h,center).x)<1e-9,'the resized furniture stays centered horizontally');
   const camera=h.camera.position.clone(),calls=bridge.nativeCalls();
   h.tick(elapsed+1);h.tick(elapsed+2);
   assert.equal(bridge.nativeCalls(),calls,'the resize correction finishes rather than reframing continuously');
   assert.ok(h.camera.position.distanceTo(camera)<1e-9,'pending zoom inertia cannot move the corrected view');
   elapsed+=3;
  }
  h.camera.aspect=390/366;h.camera.updateProjectionMatrix();h.controls.maxDistance=20;
  furniture.scale.set(3.35,1,1);furniture.position.y=.405;
  const wideBounds=new T.Box3().setFromObject(furniture);avatar.position.x=wideBounds.min.x-.65;
  h.window.sourceFrame(false);assertVisible(h,[furniture,person]);
  assert.ok(h.controls.maxDistance>20,'a wide design on a narrow viewport can fit beyond the source dolly ceiling');
  assert.equal(h.camera.controls.orbitMaxDistance,h.controls.maxDistance,'replacement controls retain the expanded fit range');
  const beforeExport=bridge.nativeCalls();
  h.window.sourceFrame(true);
  assert.equal(bridge.nativeCalls(),beforeExport+1,'PDF/export framing keeps its native path');
 }finally{h.close();}
});

test('automatic resize fitting falls back during loading, cancels a delayed correction on manual input and unsubscribes on pagehide',()=>{
 const h=harness();
 try{
  const fixture=framingFixture(h),{avatar}=sidePerson(h),bridge=sourceFramingBridge(h,fixture);
  const initialCalls=bridge.nativeCalls();
  bridge.setLoading(true);h.window.sourceFrame(false);
  assert.equal(bridge.nativeCalls(),initialCalls+1,'loading still uses the source framing');
  bridge.setLoading(false);h.window.emit('keydown',spaceEvent());
  fixture.furniture.scale.x=1.7;h.window.sourceFrame();
  avatar.position.x-=.3;
  h.window.emit('pointerdown',{composedPath:()=>[h.canvas]});
  const calls=bridge.nativeCalls(),before=h.camera.position.clone();
  h.tick(3);assert.equal(bridge.nativeCalls(),calls,'a new manual camera action cancels the scheduled follow-up');
  assert.ok(h.camera.position.distanceTo(before)<1e-9);
  h.window.emit('pagehide',{persisted:true});h.window.sourceFrame();
  assert.equal(bridge.nativeCalls(),calls+1,'pagehide removes the resize subscription');
  h.window.emit('pageshow',{persisted:true});h.window.sourceFrame();
  assert.equal(bridge.nativeCalls(),calls+2,'one resize subscription is restored after returning');
 }finally{h.close();}
});
