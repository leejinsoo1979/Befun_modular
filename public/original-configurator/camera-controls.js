/* User-requested full orbit range; keep the source camera, target and framing. */
(()=>{
 'use strict';
 let stopped=false,frame=0,dispose=null;
 function boot(){
  if(stopped)return;
  const app=window.app;
  if(!app?.controls||!app.renderCallbacks){frame=requestAnimationFrame(boot);return;}
  let lastControls=null,lastMetrics=-Infinity;
  function update(dt,elapsed){
   const controls=app.controls;if(!controls)return;
   if(controls!==lastControls){
    controls.minPolarAngle=0;controls.maxPolarAngle=Math.PI;
    controls.minAzimuthAngle=-Infinity;controls.maxAzimuthAngle=Infinity;
    // Retain the same range if the source app recreates controls for this camera.
    if(app.camera?.controls)Object.assign(app.camera.controls,{
     orbitMinPolarAngle:0,orbitMaxPolarAngle:Math.PI,
     orbitMinAzimuthAngle:-Infinity,orbitMaxAzimuthAngle:Infinity,
    });
    controls.enableRotate=true;lastControls=controls;
   }
   if(elapsed-lastMetrics>.2){
    lastMetrics=elapsed;
    Object.assign(document.documentElement.dataset,{
     cameraMinPolar:String(controls.minPolarAngle),cameraMaxPolar:String(controls.maxPolarAngle),
     cameraMinAzimuth:String(controls.minAzimuthAngle),cameraMaxAzimuth:String(controls.maxAzimuthAngle),
     cameraPolar:String(controls.getPolarAngle()),cameraAzimuth:String(controls.getAzimuthalAngle()),
    });
   }
  }
  update(0,0);app.renderCallbacks.push(update);
  dispose=()=>{const i=app.renderCallbacks.indexOf(update);if(i>=0)app.renderCallbacks.splice(i,1);};
 }
 window.addEventListener('pagehide',()=>{stopped=true;cancelAnimationFrame(frame);dispose?.();dispose=null;});
 window.addEventListener('pageshow',event=>{if(event.persisted){stopped=false;boot();}});
 boot();
})();
