import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {dimensions,cellAt,FRAMES,downloadFile} from './model';

export default function FurnitureScene({config,selected,onSelect,frontsOpen,frontsHidden,measure,viewCommand,onReady}){
 const host=useRef(null),engine=useRef(null),current=useRef({onSelect,onReady});
 current.current={onSelect,onReady}; const [failure,setFailure]=useState(false);
 useEffect(()=>{
  let renderer; try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});}catch{setFailure(true);return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)); renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.28;
  renderer.setClearColor('#efefed');host.current.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','Interactive 3D furniture. Drag to rotate. Scroll to zoom. Select a module to edit it.');
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.01,100); camera.position.set(3.3,2.1,5.1);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true; controls.dampingFactor=.08;controls.minDistance=1.5;controls.maxDistance=13;controls.maxPolarAngle=Math.PI*.49;controls.target.set(0,.7,0);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff,0xd5d4d0,2));
  const sun=new THREE.DirectionalLight(0xffffff,4.2);sun.position.set(-3,7,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:.1,far:20});sun.shadow.bias=-.0004;sun.shadow.normalBias=.015;sun.shadow.radius=5;scene.add(sun);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#d9d9d6',roughness:1}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;floor.position.y=-.009;scene.add(floor);
  const root=new THREE.Group();scene.add(root);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let start;
  const down=e=>{start={x:e.clientX,y:e.clientY};};
  const up=e=>{if(!start||Math.hypot(start.x-e.clientX,start.y-e.clientY)>6)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(root.children,true).find(h=>h.object.userData.cell);if(hit)current.current.onSelect(hit.object.userData.cell);};
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);
  const resize=()=>{if(!host.current)return;const {width,height}=host.current.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/Math.max(height,1);camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(host.current);resize();
  let raf; const tick=()=>{controls.update();renderer.render(scene,camera);raf=requestAnimationFrame(tick);};tick();
  engine.current={scene,camera,controls,renderer,root};
  current.current.onReady?.({image:()=>renderer.domElement.toDataURL('image/png'),export:()=>new GLTFExporter().parse(root,result=>downloadFile('flexcube-model.gltf',JSON.stringify(result),'model/gltf+json'),e=>console.error(e),{binary:false})});
  return()=>{cancelAnimationFrame(raf);observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);scene.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());});env.dispose();renderer.dispose();renderer.domElement.remove();engine.current=null;};
 },[]);
 useEffect(()=>{
  const e=engine.current;if(!e)return;const {root}=e;
  root.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());});root.clear();
  const d=dimensions(config),cw=d.width/d.columns,ch=d.height/d.rows,foot=config.legs==='Castors'?.075:.045;
  const frame=FRAMES.find(f=>f.name===config.frame),metal=new THREE.MeshStandardMaterial({color:frame.hex,metalness:frame.metalness,roughness:frame.roughness});
  const black=new THREE.MeshStandardMaterial({color:'#222322',roughness:.7});const silver=new THREE.MeshStandardMaterial({color:'#a0a5a6',metalness:1,roughness:.18});
  const tube=(a,b,parent)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),diff=bv.clone().sub(av);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.006,.006,diff.length(),12),metal);mesh.position.copy(av.add(bv).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),diff.normalize());mesh.castShadow=true;parent.add(mesh);};
  const panel=(size,pos,color,parent,key,glass=false)=>{const material=new THREE.MeshStandardMaterial({color,roughness:.39,metalness:.15,...(glass?{transparent:true,opacity:.3,roughness:.1}:{}),side:THREE.DoubleSide});const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);mesh.position.set(...pos);mesh.castShadow=true;mesh.receiveShadow=true;if(key)mesh.userData.cell=key;parent.add(mesh);return mesh;};
  function makeUnit(parent,columns=d.columns,rows=d.rows,width=d.width){
   const widths=columns===d.columns?d.columnWidths.map(w=>w/d.columnWidths.reduce((a,b)=>a+b,0)*width):Array(columns).fill(width/columns);
   const heights=d.rowHeights.map(h=>h/d.rowHeights.reduce((a,b)=>a+b,0)*d.height);
   const xs=[-width/2],ys=[foot];widths.forEach(w=>xs.push(xs.at(-1)+w));heights.forEach(h=>ys.push(ys.at(-1)+h));
   for(let c=0;c<=columns;c++)for(let r=0;r<=rows;r++)for(const z of [-d.depth/2,d.depth/2]){
    const x=xs[c],y=ys[r];
    const joint=new THREE.Mesh(new THREE.SphereGeometry(.011,12,10),metal);joint.position.set(x,y,z);parent.add(joint);
    if(c<columns)tube([x,y,z],[xs[c+1],y,z],parent);if(r<rows)tube([x,y,z],[x,ys[r+1],z],parent);if(z<0)tube([x,y,z],[x,y,-z],parent);
    if(r===0){tube([x,.015,z],[x,y,z],parent);if(config.legs==='Castors'){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.032,.032,.024,18),black);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.025,z);parent.add(wheel);}else{const leg=new THREE.Mesh(new THREE.CylinderGeometry(.014,.015,.012,12),black);leg.position.set(x,.006,z);parent.add(leg);}}
   }
   for(let c=0;c<columns;c++)for(let r=0;r<rows;r++){
    const cellWidth=widths[c],ch=heights[r],key=`${c}:${r}`,cell=cellAt(config,c,r),x=xs[c]+cellWidth/2,y=ys[r]+ch/2;
    const col=cell.color,type=cell.type;
    panel([cellWidth-.017,.005,d.depth-.016],[x,y-ch/2+.005,0],col,parent,key);
    if(r===rows-1)panel([cellWidth-.017,.005,d.depth-.016],[x,y+ch/2-.005,0],col,parent,key);
    if(type!=='Open element'&&type!=='Open with side panel')panel([cellWidth-.017,ch-.018,.005],[x,y,-d.depth/2+.007],cell.backColor,parent,key);
    if(type!=='Open element'&&type!=='Open with back panel'){
     if(c===0)panel([.005,ch-.018,d.depth-.017],[x-cellWidth/2+.007,y,0],col,parent,key);
     panel([.005,ch-.018,d.depth-.017],[x+cellWidth/2-.007,y,0],col,parent,key);
    }
    const openType=type.startsWith('Open');
    if(!openType&&!frontsHidden){
     const front=new THREE.Group();parent.add(front); const glass=type==='Double glass doors';
     const isDouble=type==='Double door'||glass,drawers=type==='Double drawer'?2:1;
     if(type==='Flap down'){front.position.set(x,y-ch/2+.006,d.depth/2+.002);if(frontsOpen)front.rotation.x=-Math.PI*.43;panel([cellWidth-.02,ch-.02,.008],[0,ch/2,0],cell.frontColor,front,key);}
     else if(type==='Flap upwards'){front.position.set(x,y+ch/2-.006,d.depth/2+.002);if(frontsOpen)front.rotation.x=Math.PI*.43;panel([cellWidth-.02,ch-.02,.008],[0,-ch/2,0],cell.frontColor,front,key);}
     else if(isDouble){
      for(let side=0;side<2;side++){const door=new THREE.Group();door.position.set(x+(side?1:-1)*(cellWidth/2-.01),y,d.depth/2);if(frontsOpen)door.rotation.y=(side?-1:1)*Math.PI*.43;const dx=(side?-1:1)*cellWidth/4;panel([cellWidth/2-.016,ch-.02,.008],[dx,0,0],cell.frontColor,door,key,glass);const h=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.015,16),silver);h.rotation.x=Math.PI/2;h.position.set(dx+(side?-.1:.1),0,.012);door.add(h);front.add(door);}
     }else{front.position.set(x,y,frontsOpen?d.depth*.95:d.depth/2);for(let i=0;i<drawers;i++)panel([cellWidth-.02,ch/drawers-.015,.01],[0,(i-(drawers-1)/2)*(ch/drawers),0],cell.frontColor,front,key);if(frontsOpen){panel([cellWidth-.04,.008,d.depth*.7],[0,-ch*.4,-d.depth*.36],col,front,key);panel([.008,ch*.6,d.depth*.7],[-cellWidth/2+.025,-ch*.1,-d.depth*.36],col,front,key);panel([.008,ch*.6,d.depth*.7],[cellWidth/2-.025,-ch*.1,-d.depth*.36],col,front,key);}}
     if(!isDouble)for(let i=0;i<drawers;i++){
      const h=new THREE.Mesh(config.handle==='Handle'?new THREE.TorusGeometry(.018,.004,8,18):new THREE.CylinderGeometry(.012,.012,.008,18),config.handle==='Hole'?black:silver);
      h.position.set(0,type==='Flap down'?ch*.72:type==='Flap upwards'?-ch*.72:(i-(drawers-1)/2)*(ch/drawers)+ch/drawers*.27,.01);if(config.handle!=='Handle')h.rotation.x=Math.PI/2;front.add(h);
     }
    }
    if(selected===key){const border=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(cellWidth-.02,ch-.02,d.depth+.01)),new THREE.LineBasicMaterial({color:'#cc7c4c'}));border.position.set(x,y,0);parent.add(border);}
   }
  }
  makeUnit(root);
  if(config.style==='Double'){const back=new THREE.Group();back.position.z=-d.depth;back.rotation.y=Math.PI;makeUnit(back);root.add(back);}
  if(config.style==='Corner'){const side=new THREE.Group();side.rotation.y=Math.PI/2;side.position.set(-d.width/2-d.depth/2,0,-d.depth/2-.38);makeUnit(side,1,d.rows,.75);root.add(side);}
  if(measure){
   const lineMaterial=new THREE.LineBasicMaterial({color:'#7e817f'});const line=(points)=>{const g=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));root.add(new THREE.Line(g,lineMaterial));};
   line([[-d.width/2,-.002,d.depth/2+.24],[d.width/2,-.002,d.depth/2+.24]]);line([[d.width/2+.2,foot,-d.depth/2],[d.width/2+.2,foot+d.height,-d.depth/2]]);
   for(const x of [-d.width/2,d.width/2])line([[x,0,d.depth/2+.19],[x,0,d.depth/2+.29]]);
  }
  e.controls.target.set(config.style==='Corner'?-.2:0,Math.max(.45,d.height*.48),config.style==='Double'?-d.depth/2:0);
 },[config,selected,frontsOpen,frontsHidden,measure,failure]);
 useEffect(()=>{const e=engine.current;if(!e||!viewCommand)return;const d=dimensions(config);const target=new THREE.Vector3(0,d.height*.52,0),distance=Math.max(d.width,d.height,1.6)*2.25;
 if(viewCommand.action==='zoomIn')e.camera.position.sub(e.controls.target).multiplyScalar(.83).add(e.controls.target);
 else if(viewCommand.action==='zoomOut')e.camera.position.sub(e.controls.target).multiplyScalar(1.2).add(e.controls.target);
 else {e.controls.target.copy(target);e.camera.position.copy(target).add(viewCommand.action==='front'?new THREE.Vector3(0,.03,distance):new THREE.Vector3(distance*.28,distance*.18,distance));}
 e.controls.update();},[viewCommand]);
 return <div className="three-host" ref={host}>{failure?<p className="webgl-failure">3D preview requires WebGL. Please enable hardware acceleration in your browser.</p>:null}</div>;
}
