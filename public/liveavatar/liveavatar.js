/* Adapted from the supplied liveavatar package to the existing Verge3D scene.
 * Source media are byte-identical. Avatar dimensions are nominal metres, Y is up;
 * the native furniture's internal world units are calibrated against its displayed height.
 */
(()=>{
 'use strict';
 const ASSETS='/three/reference-studio/person/',PREFERENCE='befun-viewer-avatar-v1';
 // Seat the photographic heels into the floor by 8 mm; retain the requested crown height.
 const HEEL_CONTACT_DROP=.008;
 const FEMALE_SCALE=(1.67+HEEL_CONTACT_DROP)/1522,FEMALE_VIDEO_SCALE=(1.67+HEEL_CONTACT_DROP)/671,MALE_SCALE=(1.83+HEEL_CONTACT_DROP)/585;
 const maleFeetPromise=fetch('/liveavatar/male-foot-anchors.json').then(r=>r.json());
 let stopped=false,controller=null,startFrame=0;
 const restore=()=>{try{const saved=JSON.parse(localStorage.getItem(PREFERENCE)||'{}');return {variant:(saved.state?.avatar||saved.avatar)==='male'?'male':'female',motion:saved.state?.motion!==false,visible:(saved.state?.visible??saved.visible)!==false};}catch{return {variant:'female',motion:true,visible:true};}};
 function boot(){
  if(stopped)return;
  const app=window.app,anchor=app?.scene?.getObjectByName('referenceFigurePlane'),floor=app?.scene?.getObjectByName('floorPlane');
  if(!app||!anchor||!floor||!window.LiveAvatarControls||!window.LiveAvatarCalibration){startFrame=requestAnimationFrame(boot);return;}
  controller=install(app,anchor,floor);
 }
 function install(app,anchor,floor){
  const T=window.v3d,prefs=restore(),reduced=matchMedia('(prefers-reduced-motion: reduce)'),root=new T.Group(),facing=new T.Group();
  root.name='liveavatar';facing.name='liveavatar-upright';root.add(facing);app.scene.add(root);root.visible=prefs.visible;anchor.visible=false;
  const wall=app.scene.getObjectByName('wallShadowPlane'),light=app.scene.children.find(o=>o.isDirectionalLight&&o.castShadow),cameraPosition=new T.Vector3(),rootPosition=new T.Vector3(),lightPosition=new T.Vector3(),lightTarget=new T.Vector3();
  const controls=window.LiveAvatarControls.mount({container:window.FXC_SHADOW_ROOT.querySelector('#v3d-container'),onVariant:setVariant,onMotion:setMotion,onVisibility:setVisibility});
  const calibration=window.LiveAvatarCalibration.create(app,T,floor);
  let measurement={ready:false,factor:1},lastCalibration=-Infinity;
  let current=null,disposed=false,generation=0,footAnchors=null,lastMetrics=0;
  maleFeetPromise.then(data=>{footAnchors=data;}).catch(()=>{});
  function persist(){try{localStorage.setItem(PREFERENCE,JSON.stringify({state:{avatar:prefs.variant,motion:prefs.motion,visible:prefs.visible},version:0}));}catch{}}
  function report(){controls.setState({variant:prefs.variant,motion:prefs.motion,visible:prefs.visible,mode:current?.mode||'loading',height:prefs.variant==='male'?1.83:1.67,reason:current?.reason||''});}
  function setVariant(variant){if(!['female','male'].includes(variant)||variant===prefs.variant)return;prefs.variant=variant;persist();replace();}
  function setMotion(enabled){prefs.motion=enabled;persist();replace();}
  function setVisibility(visible){
   prefs.visible=!!visible;applyVisibility();persist();
   if(prefs.visible&&!document.hidden)current?.play?.();else current?.video?.pause();
   app.renderer.shadowMap.needsUpdate=true;report();
  }
  function applyVisibility(){
   root.visible=prefs.visible;
   if(!current)return;
   const r=current,active=r.mode==='video'?r.motion:r.still;
   let changed=false;
   const set=(object,key,value)=>{if(object[key]!==value){object[key]=value;changed=true;}};
   // Verge3D also caches individual renderables: hide each body/contact/shadow,
   // rather than relying only on the parent group's visibility.
   for(const contact of r.contacts||[])set(contact,'visible',prefs.visible);
   for(const item of [r.still,r.motion])if(item){
    const visible=prefs.visible&&item===active&&(item!==r.still||!!item.mesh.material.map.image);
    set(item.mesh,'visible',visible);set(item.mesh,'castShadow',visible);
    set(item.shadow,'visible',visible&&!!wall?.visible);
   }
   if(changed)app.renderer.shadowMap.needsUpdate=true;
  }
  function packedShader(material,packed,depth=false){
   // Verge3D 4.1.1 omits this video-texture define. Decode RGB once; keep the mask linear.
   if(packed&&!depth)material.defines.DECODE_VIDEO_TEXTURE=1;
   material.onBeforeCompile=shader=>{
    if(packed){
     shader.uniforms.liveAvatarTexel=current?.texel||{value:new T.Vector2(1/1024,1/1024)};
     shader.fragmentShader=`uniform vec2 liveAvatarTexel;
      vec2 liveAvatarUV(vec2 uv,float offset){vec2 inset=liveAvatarTexel*.5;return clamp(vec2(uv.x*.5+offset,uv.y),vec2(offset,0.)+inset,vec2(offset+.5,1.)-inset);}
      `+shader.fragmentShader;
     shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',depth?
      'diffuseColor.a *= texture2D(map,liveAvatarUV(vUv,.5)).r;':
      T.ShaderChunk.map_fragment.replaceAll('vUv','liveAvatarUV(vUv,0.)')+'\ndiffuseColor.a *= texture2D(map,liveAvatarUV(vUv,.5)).r;');
    }
    // This engine's stock alpha-test forces alpha=1. Preserve soft photographic edges.
    shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>',`if(diffuseColor.a < ${depth?'.35':'.03137255'}) discard;`);
   };
   material.customProgramCacheKey=()=>`liveavatar-${packed?'packed':'rgba'}-${depth?'depth':'visible'}-v2`;
  }
  function makeGeometry(male,video){
   const pxWidth=male?496:video?448:1024,pxHeight=male?608:video?672:1536,scale=male?MALE_SCALE:video?FEMALE_VIDEO_SCALE:FEMALE_SCALE;
   const geometry=new T.PlaneGeometry(pxWidth*scale,pxHeight*scale,male?1:64,male?1:128);
   if(!male){const a=geometry.attributes.position,ratio=video?672/1536:1;
    for(let i=0;i<a.count;i++){
     const px=a.getX(i)/scale+pxWidth/2,py=pxHeight/2-a.getY(i)/scale;
     const left=1-T.MathUtils.smoothstep(px,550*ratio,610*ratio),ankle=T.MathUtils.smoothstep(py,1440*ratio,1507*ratio);
     a.setY(i,a.getY(i)-18*ratio*scale*left*ankle);
    }
    a.needsUpdate=true;geometry.computeBoundingBox();geometry.computeBoundingSphere();
   }
   return {geometry,scale,pxHeight};
  }
  function makeContact(){
   const size=64,pixels=new Uint8Array(size*size*4);
   for(let y=0;y<size;y++)for(let x=0;x<size;x++){const r=Math.hypot((x+.5-size/2)/(size/2),(y+.5-size/2)/(size/2));pixels[(y*size+x)*4+3]=Math.round(86*Math.max(0,1-r)**2);}
   const texture=new T.DataTexture(pixels,size,size,T.RGBAFormat);texture.needsUpdate=true;return texture;
  }
  function makeWallShadow(geometry,texture,packed,resources){
   const uniforms={image:{value:texture},texel:resources.texel,packed:{value:packed?1:0},ground:{value:0},wallZ:{value:-.1},lightDir:{value:new T.Vector3(.39,-.65,-.65)},shadowGroundLocal:{value:0}};
   const material=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,toneMapped:false,
    vertexShader:`uniform float ground;uniform float wallZ;uniform vec3 lightDir;uniform float shadowGroundLocal;varying vec2 avatarUV;varying float worldY;
     void main(){avatarUV=uv;vec3 p=position;p.x*=1.1;p.y=shadowGroundLocal+(p.y-shadowGroundLocal)*1.1;vec4 world=modelMatrix*vec4(p,1.);float distance=(world.z-wallZ)/lightDir.z;world.xyz-=lightDir*distance;world.z=wallZ+.003;worldY=world.y;gl_Position=projectionMatrix*viewMatrix*world;}`,
    fragmentShader:`uniform sampler2D image;uniform vec2 texel;uniform float packed;uniform float ground;varying vec2 avatarUV;varying float worldY;
     void main(){if(worldY<ground+.003)discard;vec2 halfUV=clamp(vec2(avatarUV.x*.5+.5,avatarUV.y),vec2(.5,0.)+texel*.5,vec2(1.)-texel*.5);float alpha=packed>.5?texture2D(image,halfUV).r:texture2D(image,avatarUV).a;if(alpha<.035)discard;gl_FragColor=vec4(vec3(.12),alpha*.19);}`
   });
   const shadow=new T.Mesh(geometry,material);shadow.name='liveavatar-wall-shadow';shadow.raycast=()=>{};shadow.frustumCulled=false;shadow.renderOrder=1;facing.add(shadow);resources.materials.push(material);return shadow;
  }
  function depthMaterial(texture,packed,resources){
   const material=new T.MeshDepthMaterial({map:texture,depthPacking:T.RGBADepthPacking,alphaTest:.03137255,side:T.DoubleSide});packedShader(material,packed,true);resources.materials.push(material);return material;
  }
  function visibleMesh(texture,male,video,resources){
   const {geometry,scale,pxHeight}=makeGeometry(male,video);resources.geometries.push(geometry);
   const material=new T.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.03137255,depthWrite:false,toneMapped:false,side:T.DoubleSide});packedShader(material,video);resources.materials.push(material);
   const mesh=new T.Mesh(geometry,material);mesh.name=video?'liveavatar-video':'liveavatar-still';mesh.castShadow=true;mesh.customDepthMaterial=depthMaterial(texture,video,resources);mesh.raycast=()=>{};mesh.renderOrder=2;mesh.frustumCulled=false;mesh.userData.excludeFromAO=true;
   mesh.position.set(male?0:-3*FEMALE_SCALE,(male?((video?590:591)-304)*scale:video?(671-336)*scale:(1525-768)*scale)-HEEL_CONTACT_DROP,0);
   mesh.userData={...mesh.userData,scale,pxHeight};facing.add(mesh);
   const shadow=makeWallShadow(geometry,texture,video,resources);shadow.position.copy(mesh.position);shadow.visible=false;
   return {mesh,shadow};
  }
  function replace(){
   const token=++generation;release();
   const male=prefs.variant==='male',resources={mode:'loading',reason:'',male,disposed:false,materials:[],geometries:[],textures:[],listeners:[],texel:{value:new T.Vector2(1,1)},video:null,videoTexture:null,still:null,motion:null,playing:false,timeout:0,decoded:0};current=resources;
   const contact=makeContact();resources.textures.push(contact);
   const contacts=(male?[220,283]:[480,675]).map(x=>{
    const scale=male?MALE_SCALE:FEMALE_SCALE,geometry=new T.PlaneGeometry(.15,.11),material=new T.MeshBasicMaterial({map:contact,transparent:true,depthWrite:false,toneMapped:false});
    resources.geometries.push(geometry);resources.materials.push(material);const mesh=new T.Mesh(geometry,material);mesh.name='liveavatar-foot-contact';mesh.rotation.x=-Math.PI/2;mesh.position.set((x-(male?248:515))*scale,.003,0);mesh.renderOrder=2;mesh.raycast=()=>{};facing.add(mesh);return mesh;
   });resources.contacts=contacts;
   const loader=new T.TextureLoader();const stillTexture=loader.load(ASSETS+(male?'male-still.png':'ivory-linen-woman.png'),()=>{
    if(resources.disposed){stillTexture.dispose();return;}if(resources.still)resources.still.mesh.visible=prefs.visible&&resources.mode!=='video';
   },undefined,()=>{if(!resources.disposed){resources.reason='Image could not load';report();}});
   stillTexture.encoding=T.sRGBEncoding;stillTexture.minFilter=T.LinearFilter;stillTexture.magFilter=T.LinearFilter;resources.textures.push(stillTexture);
   resources.still=visibleMesh(stillTexture,male,false,resources);resources.still.mesh.visible=false;
   if(stillTexture.image?.complete)resources.still.mesh.visible=prefs.visible;
   function fallback(reason){if(resources.disposed)return;clearTimeout(resources.timeout);resources.video?.pause();resources.mode='still';resources.reason=reason;resources.playing=false;if(resources.motion){resources.motion.mesh.visible=false;resources.motion.shadow.visible=false;}
    resources.still.mesh.visible=!!stillTexture.image;resources.still.shadow.visible=!!stillTexture.image;applyVisibility();report();app.renderer.shadowMap.needsUpdate=true;
   }
   resources.fallback=fallback;
   if(!prefs.motion||reduced.matches){fallback(reduced.matches?'Reduced motion':'Motion paused');report();return;}
   const video=document.createElement('video');resources.video=video;video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.autoplay=true;video.preload='auto';video.setAttribute('muted','');video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');
   const forceFailure=new URLSearchParams(location.search).get('avatar-test')==='video-error';
   video.src=forceFailure?'/liveavatar/unavailable-test-video.mp4':ASSETS+(male?'male-motion-packed.mp4':'ivory-linen-motion-packed.mp4');
   const videoTexture=new T.VideoTexture(video);videoTexture.encoding=T.sRGBEncoding;videoTexture.minFilter=T.LinearFilter;videoTexture.magFilter=T.LinearFilter;videoTexture.generateMipmaps=false;resources.textures.push(videoTexture);resources.videoTexture=videoTexture;
   resources.motion=visibleMesh(videoTexture,male,true,resources);resources.motion.mesh.visible=false;
   const playing=()=>{if(resources.disposed||token!==generation)return;if(!prefs.visible)video.pause();clearTimeout(resources.timeout);resources.texel.value.set(1/video.videoWidth,1/video.videoHeight);resources.mode='video';resources.reason='';resources.playing=true;resources.still.mesh.visible=false;resources.still.shadow.visible=false;resources.motion.mesh.visible=true;resources.motion.shadow.visible=!!wall?.visible;applyVisibility();report();};
   const failed=()=>fallback('Video unavailable');
   video.addEventListener('playing',playing);video.addEventListener('error',failed);resources.listeners.push(()=>video.removeEventListener('playing',playing),()=>video.removeEventListener('error',failed));
   resources.play=()=>{if(!resources.disposed&&prefs.visible&&prefs.motion&&!document.hidden&&!reduced.matches)video.play().catch(()=>fallback('Autoplay unavailable'));};
   resources.timeout=setTimeout(()=>{if(resources.mode!=='video')fallback('Video loading timeout');},6500);resources.play();applyVisibility();report();
  }
  function release(){
   const r=current;if(!r)return;r.disposed=true;clearTimeout(r.timeout);r.listeners.forEach(fn=>fn());
   if(r.video){r.video.pause();r.video.removeAttribute('src');r.video.load();}
   facing.clear();r.textures.forEach(t=>t.dispose());r.materials.forEach(m=>m.dispose());r.geometries.forEach(g=>g.dispose());current=null;
  }
  function update(dt,elapsed){
   if(disposed||!current)return;const r=current;anchor.visible=false;applyVisibility();
   if(elapsed-lastCalibration>=.2){measurement=calibration.measure();lastCalibration=elapsed;root.scale.setScalar(measurement.factor);}
   const wallZ=wall?.position.z??-.1,clearance=wallZ+.53;root.position.set(anchor.position.x,floor.position.y,clearance);
   app.camera.getWorldPosition(cameraPosition);root.getWorldPosition(rootPosition);const dx=cameraPosition.x-rootPosition.x,dz=cameraPosition.z-rootPosition.z;
   if(dx*dx+dz*dz>1e-8)facing.rotation.set(0,Math.atan2(dx,dz),0);
   if(prefs.visible&&r.mode==='video'&&r.video){
    r.videoTexture.needsUpdate=r.video.readyState>=2;
    if(r.male&&footAnchors){const frame=Math.min(footAnchors.feet.length-1,Math.floor(r.video.currentTime*footAnchors.fps));r.motion.mesh.position.y=(footAnchors.feet[frame]-304)*MALE_SCALE-HEEL_CONTACT_DROP;r.decoded=frame;}
    app.renderer.shadowMap.needsUpdate=true;
   }
   for(const item of [r.still,r.motion])if(item){item.shadow.position.copy(item.mesh.position);item.shadow.visible=item.mesh.visible&&!!wall?.visible;
    const u=item.shadow.material.uniforms;u.ground.value=floor.position.y;u.wallZ.value=wallZ;u.shadowGroundLocal.value=-item.mesh.position.y;
    if(light){light.getWorldPosition(lightPosition);light.target.getWorldPosition(lightTarget);u.lightDir.value.copy(lightTarget).sub(lightPosition).normalize();}
   }
   if(elapsed-lastMetrics>.2||!lastMetrics){lastMetrics=elapsed;const element=controls.element;
    if(element){const active=r.mode==='video'?r.motion:r.still;let footError=0;
     if(active&&r.male){const feet=r.mode==='video'&&footAnchors?footAnchors.feet[r.decoded]:591;footError=Math.abs(active.mesh.position.y+(304-feet)*MALE_SCALE);}else if(active){const motion=r.mode==='video',scale=motion?FEMALE_VIDEO_SCALE:FEMALE_SCALE,ratio=motion?672/1536:1;const soles=motion?[[210,663],[295,671]]:[[480,1507],[675,1525]];footError=Math.max(...soles.map(([x,y])=>Math.abs(active.mesh.position.y+((motion?336:768)-y)*scale-18*ratio*scale*(1-T.MathUtils.smoothstep(x,550*ratio,610*ratio))*T.MathUtils.smoothstep(y,1440*ratio,1507*ratio))));}
     Object.assign(element.dataset,{mode:r.mode,variant:prefs.variant,videoTime:String(r.video?.currentTime||0),videoReady:String(r.video?.readyState||0),ground:String(floor.position.y),footError:String(footError),footErrorWorld:String(footError*root.scale.y),heelContactDropMetres:String(HEEL_CONTACT_DROP),yaw:String(facing.rotation.y),pitch:String(facing.rotation.x),roll:String(facing.rotation.z),wallShadow:String(!!active?.shadow.visible),nativeCastShadow:String(!!active?.mesh.castShadow),source:'liveavatar.zip',reason:r.reason,scaleCalibrated:String(measurement.ready),worldUnitsPerMetre:String(root.scale.y),furnitureNominalHeightCm:String(measurement.nominalHeightCm??''),furnitureWorldHeight:String(measurement.worldHeight??''),furnitureTopY:String(measurement.frameTopY??''),furnitureBottomY:String(measurement.frameBottomY??''),furnitureFrontZ:String(measurement.frontZ??''),frameCount:String(measurement.frameCount??0),referenceWorldHeight:String((prefs.variant==='male'?1.83:1.67)*root.scale.y)});
    }
   }
  }
  const visibility=()=>{if(document.hidden)current?.video?.pause();else current?.play?.();};document.addEventListener('visibilitychange',visibility);
  const motionPreference=()=>replace();reduced.addEventListener('change',motionPreference);
  app.renderCallbacks.push(update);replace();
  return {dispose(){if(disposed)return;disposed=true;generation++;release();calibration.dispose();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',motionPreference);const i=app.renderCallbacks.indexOf(update);if(i>=0)app.renderCallbacks.splice(i,1);controls.dispose();app.scene.remove(root);anchor.visible=true;}};
 }
 window.addEventListener('pagehide',()=>{stopped=true;cancelAnimationFrame(startFrame);controller?.dispose();});
 window.addEventListener('pageshow',event=>{if(event.persisted){stopped=false;controller=null;boot();}});
 boot();
})();
