/* Local boundary around the unchanged public configurator bundle.
 * Renderer, materials, controls and configuration logic remain the source originals.
 * Store writes are served locally; no requests are sent to the original store API.
 */
(()=>{
 const originalFetch=window.fetch.bind(window),apiOrigin='https://configurator-api.flexcube.ch';
 const storageKey='flexcube:original-configurations';let lastSaved=null,lastVariant=null;const productMap=new Map();
 const read=()=>{try{return JSON.parse(localStorage.getItem(storageKey)||'{}');}catch{return {};}};
 const json=(data,status=200)=>Promise.resolve(new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}}));
 const announce=(type,payload)=>parent.postMessage({source:'flexcube-original',type,payload},location.origin);
 const status=text=>{const el=document.getElementById('local-status');if(el){el.textContent=text;el.style.display='block';setTimeout(()=>{el.style.display='none';},4200);}};
 window.fetch=async(input,options={})=>{
  const url=new URL(typeof input==='string'?input:input.url,location.href),method=(options.method||input?.method||'GET').toUpperCase();
  if(url.protocol==='data:'||url.protocol==='blob:')return originalFetch(input,options);
  const body=()=>{try{return JSON.parse(options.body||'{}');}catch{return {};}};
  if(url.origin===apiOrigin){
   if(method==='GET'&&/^\/v1\/configurations\/[a-zA-Z0-9_-]+$/.test(url.pathname)){
    const id=url.pathname.split('/').pop(),saved=read()[id];if(saved)return json({configuration:saved});
    const result=await originalFetch('/original-configurator/configurations/'+encodeURIComponent(id)+'.json');if(!result.ok)return json({error:'이 브라우저에 저장된 디자인이 없습니다.'},404);return result;
   }
   if(method==='GET'&&url.pathname==='/v1/configurations')return json({configurations:Object.values(read()).map(c=>({...c,user:{name:'내 디자인'}})),total:Object.keys(read()).length});
   if(method==='PUT'&&url.pathname==='/v1/configurations/update'){
    const value=body(),info=value.productInfo||{};
    const configuration={id:value.id,data:value.data,image_url:value.screenshot,price:info.price,currency:info.currency,width:info.width,height:info.height,depth:info.depth,articles:info.articles,ral:info.ral,colors:info.colors,link:location.origin+'/en/pages/konfigurator?config='+value.id,created_at:new Date().toISOString()};
    const configs=read();configs[value.id]=configuration;try{localStorage.setItem(storageKey,JSON.stringify(configs));}catch{return json({error:'브라우저 저장 공간이 부족합니다. 디자인을 파일로 내려받아 주세요.'},507);}
    lastSaved=configuration;announce('saved',configuration);return json({configuration});
   }
   if(method==='POST'&&url.pathname==='/v1/products/create'){
    if(!lastSaved)return json({error:'저장할 디자인이 아직 없습니다.'},400);
    const id='local-'+lastSaved.id,handle='local-configuration-'+lastSaved.id;lastVariant=id;productMap.set(id,lastSaved);
    return json({product:{id:'gid://local/Product/'+id,handle,variant:{id:'gid://local/ProductVariant/'+id}}});
   }
   if(method==='POST'&&url.pathname==='/v1/configurations/user/add'){status('이 브라우저에 저장했어요. 계정 연동과 이메일 발송은 지원하지 않습니다.');return json({error:'체험용 화면에서는 계정 연동과 이메일 발송을 지원하지 않습니다.'},409);}
   return json({error:'체험용 화면에서는 이 기능을 지원하지 않습니다.'},403);
  }
  if(url.origin===location.origin){
   if(method==='GET'&&/^\/products\/local-configuration-.+\.js$/.test(url.pathname))return json({available:true});
   if(method==='POST'&&url.pathname==='/cart/add.js'){
    const data=body();for(const line of data.items||[]){const config=productMap.get(String(line.id))||lastSaved;if(config)announce('add-to-cart',{configuration:config,quantity:line.quantity||1,assembly:line.properties?.['_assembly-service']==='1'});}
    return json({items:data.items||[],sections:{}});
   }
   if(method==='GET'&&url.pathname==='/cart.json')return json({items:[],item_count:0,total_price:0,sections:{}});
   if(!['GET','HEAD'].includes(method))return json({error:'체험용 화면에서만 사용할 수 있는 기능입니다.'},403);
   return originalFetch(input,options);
  }
  // No analytics, account requests, or store writes leave this isolated app.
  return json({error:'체험용 화면에서는 외부 서비스에 연결하지 않습니다.'},403);
 };
 const canonical=value=>typeof value==='string'?value.replace(/https?:\/\/127\.0\.0\.1(?:\/original-configurator\/index\.html\/?)?\/?\?config=([a-zA-Z0-9_-]+)/g,(_,id)=>location.origin+'/en/pages/konfigurator?config='+id):value;
 if(navigator.clipboard?.writeText){const write=navigator.clipboard.writeText.bind(navigator.clipboard);navigator.clipboard.writeText=value=>write(canonical(value));}
 window.theme={pubsub:{PUB_SUB_EVENTS:{cartUpdate:'cart:update'},publish:()=>{}}};
 document.addEventListener('click',event=>{const anchor=event.composedPath().find(n=>n instanceof HTMLAnchorElement);if(!anchor)return;const url=new URL(anchor.href,location.href);if(url.hostname==='account.flexcube.ch'){event.preventDefault();event.stopPropagation();announce('open-saved');}},true);
 window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent)return;if(event.data?.type==='language')window.dispatchEvent(new CustomEvent('configurator-set-language',{detail:{id:event.data.id}}));});
})();
