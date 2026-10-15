import React,{useEffect,useRef} from 'react';
export default function OriginalConfigurator({initialTemplate,onAddToCart,onSaved,onOpenSaved}){
 const frame=useRef(null),callbacks=useRef({onAddToCart,onSaved,onOpenSaved});callbacks.current={onAddToCart,onSaved,onOpenSaved};
 const id=initialTemplate?.referenceConfigId||initialTemplate?.originalId;
 const params=new URLSearchParams();params.set('render-revision','collapsible-toolbar-1');if(new URLSearchParams(location.search).get('render-quality')==='original')params.set('render-quality','original');if(id)params.set('config',id);const avatarTest=new URLSearchParams(location.search).get('avatar-test');if(avatarTest==='video-error')params.set('avatar-test',avatarTest);
 useEffect(()=>{const handler=event=>{if(event.origin!==location.origin||event.source!==frame.current?.contentWindow||event.data?.source!=='flexcube-original')return;const {type,payload}=event.data;
  if(type==='saved')callbacks.current.onSaved?.(payload);
  if(type==='open-saved')callbacks.current.onOpenSaved?.();
  if(type==='add-to-cart'){
   const c=payload.configuration,summary={version:1,width:c.width,height:c.height,depth:c.depth,frame:({'#fefefe':'Chrome','#252425':'Black','#f1bb9f':'Copper'})[c.data.frameColor]||'Chrome',style:c.data.cabinetMode===2?'Corner':c.data.cabinetMode===1?'Double':'Unilateral',originalId:c.id,originalConfig:c.data,assembly:!!payload.assembly};
   callbacks.current.onAddToCart(summary,{gross:c.price,net:Math.round(c.price*(.75+(payload.assembly ? .15 : 0))*100)/100,estimated:false},c.image_url,payload.quantity);
  }
 };const keydown=event=>{
  if(event.code!=='Space'&&event.key!==' '&&event.key!=='Spacebar')return;
  if(event.isComposing||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.defaultPrevented)return;
  if((event.composedPath?.()||[event.target]).some(node=>node?.isContentEditable||node?.matches?.('input,textarea,select,button,a[href],[role="textbox"],[role="slider"],[role="button"],[role="combobox"]')))return;
  if(document.querySelector('[aria-modal="true"],dialog[open]'))return;
  event.preventDefault();
  if(!event.repeat)frame.current?.contentWindow?.postMessage({type:'befun-camera-home'},location.origin);
 };window.addEventListener('message',handler);window.addEventListener('keydown',keydown);return()=>{window.removeEventListener('message',handler);window.removeEventListener('keydown',keydown);};},[]);
 return <iframe ref={frame} className="original-configurator-frame" title="Befun 3D 가구 만들기" src={'/original-configurator/index.html'+(params.size?'?'+params.toString():'')} sandbox="allow-scripts allow-same-origin allow-downloads allow-popups allow-modals"/>;
}
