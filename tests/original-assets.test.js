import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import vm from 'node:vm';
const root=new URL('../public/original-configurator/',import.meta.url);
test('all 169 captured source assets match their recorded local hashes',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',root),'utf8'));
 assert.equal(manifest.assets.length,169);
 for(const item of manifest.assets){const bytes=fs.readFileSync(new URL(item.path,root));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.sha256,item.path);}
 const engine=manifest.assets.find(x=>x.path==='v3d.js');assert.equal(engine.sha256,'511e19c437361e6289466be8e78d97496715ed39478af81b31fd6281f5ea77fd');
 const app=manifest.assets.find(x=>x.path==='configurator.js');assert.equal(app.sha256,'ce742a3f54620baa1b8ffcc097fea23211ba81d3a79ce77443f0c76e2235645c');
 const scene=manifest.assets.find(x=>x.path==='configurator-scene.json');assert.equal(scene.sha256,'77b51cdcecee1f2263b3e0630bd2842060dfb47285271955e806bc434090fdab');
});
test('the actual Verge3D scene retains custom materials and embedded resources',()=>{
 const scene=JSON.parse(fs.readFileSync(new URL('configurator-scene.json',root),'utf8'));
 assert.equal(scene.meshes.length,48);assert.equal(scene.materials.length,27);
 assert.ok(scene.extensionsUsed.some(x=>x.includes('S8S_v3d')));
 for(const image of scene.images)assert.ok(image.uri.startsWith('data:'),'no missing remote texture');
 for(const buffer of scene.buffers)assert.ok(buffer.uri.startsWith('data:'),'no missing geometry buffer');
});
test('the local boundary never forwards original-store writes or analytics',async()=>{
 const calls=[],messages=[],storage=new Map();
 const context={URL,Response,JSON,Map,Promise,setTimeout,location:{href:'http://127.0.0.1:5186/original-configurator/index.html',origin:'http://127.0.0.1:5186'},parent:{postMessage:message=>messages.push(message)},localStorage:{getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value)},document:{addEventListener:()=>{},getElementById:()=>null},navigator:{},HTMLAnchorElement:class{}};
 context.window={fetch:async(...args)=>{calls.push(args);return new Response('{}');},addEventListener:()=>{}};
 vm.runInNewContext(fs.readFileSync(new URL('local-adapter.js',root),'utf8'),context);
 const fetch=context.window.fetch;
 const response=await fetch('https://configurator-api.flexcube.ch/v1/configurations/update',{method:'PUT',body:JSON.stringify({id:'local-test',data:{cabinet:[]},productInfo:{price:1152,width:227,height:81,depth:40}})});
 assert.equal(response.status,200);assert.equal(calls.length,0);assert.equal(messages[0].type,'saved');
 const rejected=await fetch('https://unconnected.example/analytics',{method:'POST',body:'private'});assert.equal(rejected.status,403);assert.equal(calls.length,0);
 await fetch('data:application/json,{}');assert.equal(calls.length,1,'embedded data resources still load');
 const html=fs.readFileSync(new URL('index.html',root),'utf8');assert.ok(html.includes("connect-src 'self' data: blob:"));assert.ok(html.includes("form-action 'none'"));
});
