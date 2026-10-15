/* Orbit above the horizon, with screen-space pan and cursor zoom. */
(()=>{
 'use strict';
 let stopped=false,frame=0,dispose=null,initialViewSet=false;
 function cursorZoom(controls){
  const T=window.v3d,element=controls.domElement,camera=controls.object;
  if(!T||!element||!camera)return ()=>{};
  const nativeUpdate=controls.update,raycaster=new T.Raycaster(),cursor=new T.Vector2();
  const plane=new T.Plane(),normal=new T.Vector3(),target=new T.Vector3();
  const before=new T.Vector3(),after=new T.Vector3(),delta=new T.Vector3();
  const position=new T.Vector3(),quaternion=new T.Quaternion();
  let anchored=false;
  const cancel=()=>{anchored=false;};
  function wheel(event){
   if(!controls.enabled||!controls.enableZoom||controls.inTween||!event.deltaY)return;
   const rect=element.getBoundingClientRect();
   if(!rect.width||!rect.height)return;
   cursor.set((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2);
   camera.updateMatrixWorld(true);
   controls.targetObj.getWorldPosition(target);
   camera.getWorldDirection(normal);
   plane.setFromNormalAndCoplanarPoint(normal,target);
   anchored=true;
  }
  function point(out){
   camera.updateMatrixWorld(true);
   raycaster.setFromCamera(cursor,camera);
   return raycaster.ray.intersectPlane(plane,out);
  }
  function translate(object){
   object.getWorldPosition(position).add(delta);
   if(object.parent)object.parent.worldToLocal(position);
   object.position.copy(position);
   object.updateMatrixWorld(true);
  }
  function update(...args){
   if(!anchored||!controls.enabled||controls.inTween)return nativeUpdate.apply(this,args);
   const distance=controls.getDistance(),zoom=camera.zoom;
   quaternion.copy(camera.quaternion);
   const hit=point(before);
   const changed=nativeUpdate.apply(this,args);
   // Only compensate actual dolly/zoom, including the source's damping tail.
   // Orbit, pan and camera fitting must not acquire a new pivot accidentally.
   if(1-Math.abs(quaternion.dot(camera.quaternion))>1e-10){cancel();return changed;}
   if(!hit||Math.abs(controls.getDistance()-distance)<1e-12&&Math.abs(camera.zoom-zoom)<1e-12)return changed;
   if(!point(after))return changed;
   delta.subVectors(before,after);
   translate(camera);translate(controls.targetObj);
   controls.dispatchEvent({type:'change'});
   return true;
  }
  controls.update=update;
  element.addEventListener('wheel',wheel,{capture:true,passive:true});
  for(const type of ['pointerdown','mousedown','touchstart','keydown'])window.addEventListener(type,cancel,true);
  return ()=>{
   if(controls.update===update)controls.update=nativeUpdate;
   element.removeEventListener('wheel',wheel,true);
   for(const type of ['pointerdown','mousedown','touchstart','keydown'])window.removeEventListener(type,cancel,true);
  };
 }
 function boot(){
  if(stopped)return;
  const app=window.app;
  if(!app?.controls||!app.renderCallbacks){frame=requestAnimationFrame(boot);return;}
  let lastControls=null,lastMetrics=-Infinity,removeCursorZoom=()=>{};
  let lastFraming=null,unsubscribeFraming=()=>{},resizeRefitAt=null,lastElapsed=0;
  function fitTogether(T,framing,camera,controls,front,up){
   const bounds=framing.bounds?.();
   if(!bounds||bounds.isEmpty())return;
   // Match the approved reference: furniture centered horizontally, with a
   // full-height side person and breathing room above and below both.
   const center=bounds.getCenter(new T.Vector3());
   const furnitureBounds=bounds.clone();
   app.scene?.updateMatrixWorld(true);
   const avatar=app.scene?.getObjectByName('liveavatar');
   if(avatar?.visible){
    const meshes=[];
    avatar.traverseVisible(object=>{
     if(object.isMesh&&['liveavatar-video','liveavatar-still'].includes(object.name))meshes.push(object);
    });
    // A freshly switched avatar can still be loading its texture. Its still
    // geometry already has the new person's scale and can safely frame it.
    if(!meshes.length){const still=avatar.getObjectByName('liveavatar-still');if(still)meshes.push(still);}
    for(const mesh of meshes){
     const geometry=mesh.geometry;if(!geometry.boundingBox)geometry.computeBoundingBox();
     const box=geometry.boundingBox;if(!box||box.isEmpty())continue;
     const actorBounds=box.clone().applyMatrix4(mesh.matrixWorld),scale=mesh.getWorldScale(new T.Vector3());
     const pivot=(mesh.parent||mesh).getWorldPosition(new T.Vector3());
     // The upright billboard turns toward the recentered camera next frame.
     // Enclose every yaw so neither that turn nor a video frame clips it.
     const radius=(Math.max(Math.abs(box.min.x),Math.abs(box.max.x))+Math.abs(mesh.position.x))*Math.abs(scale.x)
      +(Math.max(Math.abs(box.min.z),Math.abs(box.max.z))+Math.abs(mesh.position.z))*Math.abs(scale.z);
     actorBounds.min.x=pivot.x-radius;actorBounds.max.x=pivot.x+radius;
     actorBounds.min.z=pivot.z-radius;actorBounds.max.z=pivot.z+radius;
     bounds.union(actorBounds);
    }
   }else if(!avatar){
    const reference=app.scene?.getObjectByName('referenceFigurePlane');
    if(reference)bounds.expandByObject(reference);
   }
   center.y=(bounds.min.y+bounds.max.y)/2;
   const right=new T.Vector3().crossVectors(up,front).normalize();
   // The reference cabinet fills about half the canvas width and the full
   // person about two thirds of its height. Larger designs still fit safely.
   const offset=new T.Vector3(),fill=.9,furnitureWidth=.5,sceneHeight=.7;
   let distance=controls.getDistance();
   if(camera.isPerspectiveCamera){
    const tan=Math.tan(camera.fov*Math.PI/360)/camera.zoom;
    distance=Math.max(distance,
     furnitureBounds.max.z-center.z+(furnitureBounds.max.x-furnitureBounds.min.x)/(2*tan*camera.aspect*furnitureWidth),
     bounds.max.z-center.z+(bounds.max.y-bounds.min.y)/(2*tan*sceneHeight));
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
     offset.set(x,y,z).sub(center);
     distance=Math.max(distance,offset.dot(front)+Math.max(Math.abs(offset.dot(right))/(tan*camera.aspect*fill),Math.abs(offset.dot(up))/(tan*fill)));
    }
    distance=Math.max(controls.minDistance,distance);
    // A wide cabinet on a narrow viewport can exceed the source's fixed
    // dolly ceiling. Allow the required fit rather than clipping its person.
    if(distance>controls.maxDistance){
     controls.maxDistance=distance;
     if(camera.controls)camera.controls.orbitMaxDistance=distance;
    }
   }else if(camera.isOrthographicCamera){
    let halfWidth=0,halfHeight=0;
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
     offset.set(x,y,z).sub(center);
     halfWidth=Math.max(halfWidth,Math.abs(offset.dot(right)));halfHeight=Math.max(halfHeight,Math.abs(offset.dot(up)));
    }
    camera.zoom=Math.max(controls.minZoom,Math.min(controls.maxZoom,
     (camera.right-camera.left)*furnitureWidth/Math.max(furnitureBounds.max.x-furnitureBounds.min.x,.001),
     (camera.top-camera.bottom)*sceneHeight/Math.max(bounds.max.y-bounds.min.y,.001),
     (camera.right-camera.left)*fill/Math.max(2*halfWidth,.001),(camera.top-camera.bottom)*fill/Math.max(2*halfHeight,.001)));
    camera.updateProjectionMatrix();
   }
   const position=center.clone().addScaledVector(front,distance),target=center.clone();
   if(camera.parent)camera.parent.worldToLocal(position);
   if(controls.targetObj.parent)controls.targetObj.parent.worldToLocal(target);
   controls.targetObj.position.copy(target);camera.position.copy(position);controls.update();
  }
  function resetFront(){
   const controls=app.controls,camera=app.camera,T=window.v3d,framing=window.BefunCameraFraming;
   if(!controls?.enabled||!camera||!T||!framing)return false;
   resizeRefitAt=null;
   removeCursorZoom();
   const damping=controls.enableDamping,autoRotate=controls.autoRotate,keys=controls.enableKeys;
   try{
    controls.forceMouseUp();controls.inTween=false;
    controls.enableDamping=false;controls.autoRotate=false;controls.enableKeys=false;
    // Drain native orbit/pan/zoom inertia before computing the new view.
    controls.update();controls.update();
    if(framing.frame()===false)return false;
    const target=controls.targetObj.getWorldPosition(new T.Vector3());
    const distance=controls.getDistance();
    // Source furniture fronts face +Z. Project onto the horizontal plane so
    // the reset remains level even if a host uses a different camera up axis.
    const up=camera.up.clone().normalize(),front=new T.Vector3(0,0,1);
    front.addScaledVector(up,-front.dot(up));
    if(front.lengthSq()<1e-10)front.set(0,-1,0).addScaledVector(up,up.y);
    front.normalize();
    const position=target.clone().addScaledVector(front,distance);
    if(camera.parent)camera.parent.worldToLocal(position);
    camera.position.copy(position);camera.zoom=1;camera.updateProjectionMatrix();
    controls.update();framing.fit();controls.update();
    fitTogether(T,framing,camera,controls,front,up);
    controls.dispatchEvent({type:'change'});
    initialViewSet=true;
    return true;
   }finally{
    controls.enableDamping=damping;controls.autoRotate=autoRotate;controls.enableKeys=keys;
    removeCursorZoom=cursorZoom(controls);
   }
  }
  function keydown(event){
   if(event.code!=='Space'&&event.key!==' '&&event.key!=='Spacebar')return;
   if(event.isComposing||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.defaultPrevented)return;
   const path=event.composedPath?.()||[event.target];
   if(path.some(node=>node?.isContentEditable||node?.matches?.('input,textarea,select,button,a[href],[role="textbox"],[role="slider"],[role="button"],[role="combobox"]')))return;
   if(window.FXC_SHADOW_ROOT?.querySelector('[aria-modal="true"],dialog[open]'))return;
   event.preventDefault();
   if(!event.repeat)resetFront();
  }
  function message(event){
   if(event.origin===location.origin&&event.source===parent&&event.data?.type==='befun-camera-home')resetFront();
  }
  window.addEventListener('keydown',keydown);
  window.addEventListener('message',message);
  function manualView(event){
   const element=app.controls?.domElement,path=event.composedPath?.()||[event.target];
   if(element&&path.some(node=>node===element||node?.nodeType&&element.contains?.(node))){initialViewSet=true;resizeRefitAt=null;}
  }
  window.addEventListener('pointerdown',manualView,true);
  window.addEventListener('wheel',manualView,{capture:true,passive:true});
  function update(dt,elapsed){
   const controls=app.controls;if(!controls)return;
   lastElapsed=elapsed;
   const framing=window.BefunCameraFraming;
   if(framing!==lastFraming){
    unsubscribeFraming();lastFraming=framing;
    unsubscribeFraming=framing?.subscribe?.(()=>{
     if(!initialViewSet||framing.ready&&!framing.ready())return false;
     // Dimension sliders call the source's furniture-only framing directly.
     // Replace that fit before it can zoom past the full side person.
     if(!resetFront())return false;
     // Avatar positioning runs each render and scale calibration every .2s.
     // Refit once after both have caught up to the changed cabinet geometry.
     resizeRefitAt=lastElapsed+.25;
     return true;
    })||(()=>{});
   }
   if(controls!==lastControls){
    removeCursorZoom();
    controls.minPolarAngle=0;controls.maxPolarAngle=Math.PI/2;
    controls.enableTurnover=false;
    controls.minAzimuthAngle=-Infinity;controls.maxAzimuthAngle=Infinity;
    // Retain the same range if the source app recreates controls for this camera.
    if(app.camera?.controls)Object.assign(app.camera.controls,{
     orbitMinPolarAngle:0,orbitMaxPolarAngle:Math.PI/2,
     orbitMinAzimuthAngle:-Infinity,orbitMaxAzimuthAngle:Infinity,
     enablePan:true,
    });
    controls.enableRotate=true;controls.enablePan=true;controls.screenSpacePanning=true;
    removeCursorZoom=cursorZoom(controls);lastControls=controls;
   }
   if(resizeRefitAt!==null&&elapsed>=resizeRefitAt&&controls.enabled)resetFront();
   if(!initialViewSet&&window.BefunCameraFraming?.ready?.()){
    const avatar=app.scene?.getObjectByName('liveavatar');
    const status=window.FXC_SHADOW_ROOT?.querySelector('.liveavatar-controls');
    let visiblePerson=false;
    avatar?.traverseVisible(object=>{if(object.isMesh&&['liveavatar-video','liveavatar-still'].includes(object.name))visiblePerson=true;});
    // Wait for the selected media and its scale calibration, rather than
    // framing the temporary 1:1 person before the furniture has loaded.
    if(visiblePerson&&(!status||status.dataset?.scaleCalibrated==='true'))resetFront();
   }
   if(elapsed-lastMetrics>.2){
    lastMetrics=elapsed;
    Object.assign(document.documentElement.dataset,{
     cameraMinPolar:String(controls.minPolarAngle),cameraMaxPolar:String(controls.maxPolarAngle),
     cameraMinAzimuth:String(controls.minAzimuthAngle),cameraMaxAzimuth:String(controls.maxAzimuthAngle),
     cameraPolar:String(controls.getPolarAngle()),cameraAzimuth:String(controls.getAzimuthalAngle()),
     cameraPan:String(controls.enablePan),cameraCursorZoom:String(!!window.v3d),
    });
   }
  }
  update(0,0);app.renderCallbacks.push(update);
  dispose=()=>{unsubscribeFraming();removeCursorZoom();window.removeEventListener('keydown',keydown);window.removeEventListener('message',message);window.removeEventListener('pointerdown',manualView,true);window.removeEventListener('wheel',manualView,true);const i=app.renderCallbacks.indexOf(update);if(i>=0)app.renderCallbacks.splice(i,1);};
 }
 window.addEventListener('pagehide',()=>{stopped=true;cancelAnimationFrame(frame);dispose?.();dispose=null;});
 window.addEventListener('pageshow',event=>{if(event.persisted){stopped=false;boot();}});
 boot();
})();
