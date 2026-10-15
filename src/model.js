import {calculatePrice} from './pricing.js';
export const WIDTHS = [40,77,115,152,190,227,265,302];
export const HEIGHTS = [43,63,81,101,119,139,157,177,195];
export const COLORS = [
 {name:'Black',hex:'#000000'},{name:'Gray',hex:'#797a7f'},{name:'Light Grey',hex:'#c5c4c0'},
 {name:'White',hex:'#ffffff'},{name:'Petrol',hex:'#356071'},{name:'Mint',hex:'#84aeac'},
 {name:'Olive Green',hex:'#6f6d4e'},{name:'Taupe',hex:'#937a76'},{name:'Red',hex:'#7f0000'},{name:'Glass',hex:'#cbdfe1'}
];
export const FRAMES = [{name:'Chrome',hex:'#c2c7c8',metalness:1,roughness:.16},{name:'Black',hex:'#262726',metalness:.78,roughness:.3},{name:'Copper',hex:'#af7656',metalness:.94,roughness:.24}];
export const FUNCTIONS = ['Open element','Open with back panel','Open with side panel','Open with back/side panel','Flap down','Flap upwards','Drawer','Double drawer','Double door','Double glass doors'];
export const DEFAULT_CONFIG = {version:1,width:227,height:81,depth:40,style:'Unilateral',color:'#000000',frame:'Chrome',legs:'Legs',handle:'Hole',cells:{},defaultType:'Open with back/side panel'};
export const LAYOUT_WIDTHS={40:[38],77:[75],115:[75,38],152:[75,75],190:[75,75,38],227:[75,75,75],265:[75,75,75,38],302:[75,75,75,75]};
export const LAYOUT_HEIGHTS={43:[38],63:[38,20],81:[38,38],101:[38,38,20],119:[38,38,38],139:[38,38,38,20],157:[38,38,38,38],177:[38,38,38,38,20],195:[38,38,38,38,38]};
export function dimensions(config) {
 const columnWidths=config.columnWidths||LAYOUT_WIDTHS[config.width],rowHeights=config.rowHeights||LAYOUT_HEIGHTS[config.height];
 const columns=columnWidths.length,rows=rowHeights.length;
 return {columns,rows,columnWidths,rowHeights,width:(config.width-2)/100,height:(config.height-5)/100,depth:config.depth/100};
}
export function cellAt(config,col,row) { return {...{type:config.defaultType,color:config.color,backColor:config.color,frontColor:config.color},...config.cells[`${col}:${row}`]}; }
export function estimatePrice(config) { return calculatePrice(config); }
export function applyFunction(config,type,selected=null){
 if(selected) return {...config,cells:{...config.cells,[selected]:{...config.cells[selected],type}}};
 return {...config,defaultType:type,cells:Object.fromEntries(Object.entries(config.cells).map(([k,v])=>[k,{...v,type}]))};
}
export function applyColor(config,color,target='All',selected=null){
 const props=target==='Back'?{backColor:color}:target==='Front'?{frontColor:color}:{color,backColor:color,frontColor:color};
 if(selected&&(target==='Individual'||target==='Front'||target==='Back'))return {...config,cells:{...config.cells,[selected]:{...cellAt(config,...selected.split(':').map(Number)),...props}}};
 const {columns,rows}=dimensions(config); const cells={...config.cells};
 for(let c=0;c<columns;c++)for(let r=0;r<rows;r++)cells[`${c}:${r}`]={...cellAt(config,c,r),...props};
 return {...config,...(target==='All'?{color}:{}),cells};
}
export function validateConfig(value) {
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('This file does not contain a furniture configuration.');
 const c={...DEFAULT_CONFIG,...value};
 if(!WIDTHS.includes(c.width)||!HEIGHTS.includes(c.height)||![20,40].includes(c.depth))throw new Error('The furniture dimensions are outside the supported range.');
 if(!['Unilateral','Double','Corner'].includes(c.style))throw new Error('Unknown furniture structure.');
 if(!FRAMES.some(f=>f.name===c.frame)||!/^#[0-9a-f]{6}$/i.test(c.color))throw new Error('Invalid frame or panel colour.');
 if(!FUNCTIONS.includes(c.defaultType)||!['Legs','Castors'].includes(c.legs)||!['Hole','Handle','Handle Key'].includes(c.handle))throw new Error('Unknown furniture component.');
 if(!c.cells||typeof c.cells!=='object'||Array.isArray(c.cells)||Object.keys(c.cells).length>96)throw new Error('Invalid modules.');
 for(const field of ['columnWidths','rowHeights'])if(c[field]!==undefined&&(!Array.isArray(c[field])||c[field].length<1||c[field].length>12||c[field].some(n=>!Number.isFinite(n)||n<=0||n>200)))throw new Error('Invalid module layout.');
 const cells={}; for(const [key,cell] of Object.entries(c.cells)){
  if(!/^\d{1,2}:\d{1,2}$/.test(key)||!cell||typeof cell!=='object')throw new Error('Invalid module data.');
  const clean={}; if(cell.type!==undefined){if(!FUNCTIONS.includes(cell.type))throw new Error('Unknown module function.');clean.type=cell.type;}
  for(const prop of ['color','backColor','frontColor'])if(cell[prop]!==undefined){if(!/^#[0-9a-f]{6}$/i.test(cell[prop]))throw new Error('Invalid module colour.');clean[prop]=cell[prop];}
  cells[key]=clean;
 }
 return {version:1,width:c.width,height:c.height,depth:c.depth,style:c.style,color:c.color,frame:c.frame,legs:c.legs,handle:c.handle,defaultType:c.defaultType,cells,...(c.columnWidths?{columnWidths:c.columnWidths}:{}),...(c.rowHeights?{rowHeights:c.rowHeights}:{}),...(Number.isFinite(c.referencePrice)&&c.referencePrice>0?{referencePrice:c.referencePrice}:{})};
}
export function configFromTemplate(template) {
 const text=(template.name?.en||template.title||template.name||'').toLowerCase();
 const source=template.configuration;
 const color=source?.panelColor||template.colors?.[0]||COLORS.find(c=>text.includes(c.name.toLowerCase()))?.hex||'#ffffff';
 const w=Number(template.width)||152,h=Number(template.height)||81;
 const cells={};
 if(source?.cabinet)source.cabinet.forEach((col,c)=>col.forEach((cell,r)=>{
  const type=cell.drawer!==null&&cell.drawer!==undefined?(cell.drawer>=3?'Double drawer':'Drawer'):cell.glassDoubleDoors?'Double glass doors':cell.metalDoubleDoors!==null&&cell.metalDoubleDoors!==undefined?'Double door':cell.flap!==null&&cell.flap!==undefined?'Flap down':cell.box?.[4]?.visible?(cell.box?.[0]?.visible||cell.box?.[1]?.visible?'Open with back/side panel':'Open with back panel'):'Open element';
  cells[`${c}:${r}`]={type,color:cell.box?.[2]?.color||color,backColor:cell.box?.[4]?.color||color,frontColor:cell.frontColor||color};
 }));
 return validateConfig({...DEFAULT_CONFIG,width:WIDTHS.reduce((a,b)=>Math.abs(b-w)<Math.abs(a-w)?b:a),height:HEIGHTS.reduce((a,b)=>Math.abs(b-h)<Math.abs(a-h)?b:a),color:/^#[0-9a-f]{6}$/i.test(color)?color:'#ffffff',frame:source?.frameColor==='#252425'?'Black':source?.frameColor==='#f1bb9f'||text.includes('rose gold')?'Copper':'Chrome',defaultType:'Open with back/side panel',cells,referencePrice:template.price,columnWidths:source?.cabinet?.map(col=>col[0].width),rowHeights:source?.cabinet?.[0]?.map(cell=>cell.height),style:(template.category||'').includes('corner')?'Corner':'Unilateral'});
}
export function downloadFile(name,data,type='application/json'){
 const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function loadStored(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
