import catalog from './data/configurator-catalog.json' with { type: 'json' };

const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
const bySku = new Map(catalog.map(article => [article.sku, article]));
const colorCode = {'#000000':'01','#ffffff':'02','#7f0000':'03','#937a76':'04','#797a7f':'05','#356071':'07','#c5c4c0':'08','#84aeac':'09','#6f6d4e':'075'};
const nominal = value => ({77.5:75,41:38}[value] ?? value);
const standardWidths = {40:[38],77:[75],115:[75,38],152:[75,75],190:[75,75,38],227:[75,75,75],265:[75,75,75,38],302:[75,75,75,75]};
const standardHeights = {43:[38],63:[38,20],81:[38,38],101:[38,38,20],119:[38,38,38],139:[38,38,38,20],157:[38,38,38,38],177:[38,38,38,38,20],195:[38,38,38,38,38]};
const glassColors = new Set(['glass','#cbdfe1','#d8e3e4']);

/** Check a captured public bill of materials without hiding obsolete/missing SKUs. */
export function sumCatalogArticles(bom = {}) {
 const articles = [], missing = [];
 let gross = 0;
 for (const [label, count] of Object.entries(bom)) {
  const sku = label.match(/\(([^()]+)\)$/)?.[1] ?? label;
  const article = bySku.get(sku);
  if (!article || typeof article.price !== 'number') { missing.push(sku); continue; }
  const total = article.price * count;
  gross += total;
  articles.push({sku,name:article.name.en,count,unitPrice:article.price,total:round(total)});
 }
 return {gross:round(gross),estimated:missing.length>0,missing,articles};
}

/** Independent, catalogue-based pricing for the local configuration model.
 * net is the CH SME price including VAT, matching the existing application's API.
 * vatExclusive is supplied separately to avoid confusing this with tax-exclusive net.
 */
export function calculatePrice(config) {
 if (Number.isFinite(config.referencePrice) && config.referencePrice > 0) {
  const gross = round(config.referencePrice);
  return {gross,net:round(gross*.75),vatExclusive:round(gross/1.081),estimated:false,source:'reference',articles:[],reason:'Captured price for the unmodified reference template.'};
 }
 const reasons = new Set(), lines = new Map(), panels = new Map();
 let ral = false;
 const flag = message => reasons.add(message);
 const add = (sku,count=1,override) => {
  if (!count) return;
  const article = bySku.get(sku);
  const unitPrice = override ?? article?.price;
  if (!article || typeof unitPrice !== 'number') { flag(`Missing catalogue article ${sku}.`); return; }
  const key = `${sku}:${unitPrice}`;
  const line = lines.get(key) ?? {sku,name:article.name.en,count:0,unitPrice,total:0};
  line.count += count; line.total = round(line.count*unitPrice); lines.set(key,line);
 };
 const frame = ['Chrome','Black','Copper'].includes(config.frame) ? config.frame : 'Chrome';
 if (frame!==config.frame) flag('Unknown frame finish.');
 const finish = {Chrome:'chrome',Black:'black',Copper:'copper'}[frame];
 const frames = {Chrome:0,Black:1,Copper:2};
 const f = frames[frame];
 const lookup = (name, count=1) => {
  const article=catalog.find(a=>a.name.en.toLowerCase().replace('verticale','vertical')===name.toLowerCase());
  if (article) add(article.sku,count); else flag(`Missing catalogue part: ${name}.`);
 };
 const widths = config.columnWidths?.map(nominal) ?? standardWidths[config.width] ?? [75];
 const heights = config.rowHeights?.map(nominal) ?? standardHeights[config.height] ?? [38];
 if (!config.columnWidths && !standardWidths[config.width]) flag('Nonstandard furniture width.');
 if (!config.rowHeights && !standardHeights[config.height]) flag('Nonstandard furniture height.');
 if (widths.length>12 || heights.length>12 || widths.some(v=>!Number.isFinite(v)||v<=0) || heights.some(v=>!Number.isFinite(v)||v<=0)) {
  return {gross:0,net:0,vatExclusive:0,estimated:true,source:'catalogue',articles:[],reason:'Invalid or oversized module layout.'};
 }
 const columns=widths.length, rows=heights.length;
 const depth=config.depth===20?20:38;
 if (![20,40].includes(config.depth)) flag('Nonstandard furniture depth.');
 const typeAt=(c,r)=>config.cells?.[`${c}:${r}`]?.type ?? config.defaultType ?? 'Open with back/side panel';
 const cellAt=(c,r)=>({color:config.color,backColor:config.color,frontColor:config.color,...config.cells?.[`${c}:${r}`],type:typeAt(c,r)});
 const mechanism=type=>['Flap down','Flap upwards','Drawer','Double drawer','Double door'].includes(type);
 const fullSides=type=>mechanism(type)||type==='Double glass doors'||type==='Open with side panel'||type==='Open with back/side panel';
 const back=type=>mechanism(type)||type==='Double glass doors'||type==='Open with back panel'||type==='Open with back/side panel';
 const size = value => value===75?'750':value===38?'375':value===20||value===19?'193':value===6?'60':null;
 const tube = (direction,value,count) => {
  const mm=size(value);
  if (!mm) {flag(`Unsupported ${value} cm tube.`);return;}
  lookup(`${direction} tube ${mm} ${finish}`,count);
 };
 const panel = (key,width,height,color) => {
  if (panels.has(key)) return;
  panels.set(key,{width,height,color:String(color??'#000000').toLowerCase()});
 };
 const frontHandle = count => {
  const ids={Hole:['1050120002610','1050120002630','1050120006610'],Handle:['1050120005610','1050120005630','1050120005620'],'Handle Key':['1050120001610','1050120006630','1050120007610']};
  if (!ids[config.handle]) flag('Unknown handle type.');
  add((ids[config.handle]??ids.Hole)[f],count);
 };
 const productPanel = (kind,w,h,color,count=1) => {
  let code=colorCode[String(color??'#000000').toLowerCase()];
  if (!code) {code='02';ral=true;flag('Custom colour uses the reference RAL surcharge; availability is unverified.');}
  const dims=[size(w),size(h)].sort((a,b)=>Number(a)-Number(b));
  const suffix={'193:193':'0608','193:375':'0604','193:750':'0605','375:375':'0606','375:750':'0607'}[dims.join(':')];
  if (!suffix) {flag(`Unsupported ${w}×${h} cm ${kind} panel.`);return;}
  add(`1050${kind==='Drawer'?'06':'03'}${code.padEnd(3,'0')}${suffix}`,count);
 };
 // Each junction/bar/panel is counted once even when adjacent modules share it.
 for (const w of widths) tube('Horizontal',w,2*(rows+1));
 tube('Horizontal',depth,(columns+1)*(rows+1));
 for (const h of heights) tube('Vertical',h,2*(columns+1));
 const connector2=['1050020100610','1050020102610','1050020101610'];
 const connector3=['1050020200610','1050020202610','1050020201610'];
 add(connector2[f],4*(rows+1)); add(connector3[f],2*(columns-1)*(rows+1));
 const sets=columns+1;
 add((config.legs==='Castors'?['1050090001610','1050090001630','1050090001620']:['1050140001610','1050140003610','1050140002610'])[f],sets);
 add(['1050150001610','1050150003610','1050150002610'][f],sets);
 add('1050160001610');
 const displayedHeight=2+(config.legs==='Castors'?9:3)+heights.reduce((a,b)=>a+b,0);
 if (config.legs!=='Castors' && displayedHeight>=80) add('1050200001100',Math.max(1,Math.floor(columns/2)));
 for (let c=0;c<columns;c++) for (let r=0;r<rows;r++) {
  const cell=cellAt(c,r),type=cell.type,w=widths[c],h=heights[r];
  panel(`h:${c}:${r}`,w,depth,cell.color); panel(`h:${c}:${r+1}`,w,depth,cell.color);
  if (back(type)) panel(`b:${c}:${r}`,w,h,cell.backColor);
  if (fullSides(type)) {
   panel(`s:${c}:${r}`,depth,h,cell.color); panel(`s:${c+1}:${r}`,depth,h,cell.color);
  }
  if (mechanism(type)) {
   if (depth!==38) flag('Mechanisms require the full-depth module in the reference configurator.');
   if (![38,20].includes(h)||![75,38].includes(w)) flag('Unsupported mechanism module dimensions.');
   // Insert support panels are shared between adjacent mechanisms; the center steel wall is replaced.
   add(h===20?'1050040100607':'1050040100608');
   if (c+1<columns && mechanism(typeAt(c+1,r))) {
    add(h===20?'1050050200604':'1050050200606');
   } else add(h===20?'1050040100607':'1050040100608');
   if (type==='Drawer'||type==='Double drawer') {
    const count=type==='Double drawer'?2:1;
    if (count===2&&h!==38) flag('A double drawer requires a standard-height module.');
    productPanel('Drawer',w,count===2?20:h,cell.frontColor,count);
    add(w===75?(config.softClose?'1050070100609':'1050070100605'):(config.softClose?'1050070100608':'1050070100604'),count);
    frontHandle(count);
   } else if (type==='Double door') {
    if(w!==75||h!==38) flag('Double doors require a standard wide module.');
    const code=colorCode[String(cell.frontColor??config.color).toLowerCase()]??'02';
    if(!colorCode[String(cell.frontColor??config.color).toLowerCase()]){ral=true;flag('Custom door colour is unverified.');}
    add(`105008${code.padEnd(3,'0')}0609`,2); frontHandle(2);
   } else {
    if(h!==38)flag('Flaps require a standard-height module.');
    const code=colorCode[String(cell.frontColor??config.color).toLowerCase()]??'02';
    if(!colorCode[String(cell.frontColor??config.color).toLowerCase()]){ral=true;flag('Custom flap colour is unverified.');}
    add(`105008${code.padEnd(3,'0')}${w===75?'0607':'0608'}`);
    add(type==='Flap upwards'?'1050100003610':w===75?'1050100001610':'1050100002610');
    frontHandle(1);
   }
  } else if (type==='Double glass doors') {
   if(w!==75||h!==38||depth!==38)flag('Glass doors require a standard wide module.');
   add('1050320001616',1,frame==='Chrome'?150:140);
   add(['1050330001610','1050330003610','1050330002610'][f],2);
   add(['1050340001610','1050340003610','1050340002610'][f],2);
   add('1050350001610',2);
  } else if (!['Open element','Open with back panel','Open with side panel','Open with back/side panel'].includes(type)) flag(`Unsupported function: ${type}.`);
 }
 // Remove each shared steel wall replaced by a pair of mechanism supports.
 for(let c=0;c<columns-1;c++)for(let r=0;r<rows;r++)if(mechanism(typeAt(c,r))&&mechanism(typeAt(c+1,r)))panels.delete(`s:${c+1}:${r}`);
 for(const {width,height,color} of panels.values()) {
  if(glassColors.has(color)) {
   const dims=[size(width),size(height)].sort((a,b)=>Number(a)-Number(b));
   const suffix={'193:193':'0608','193:375':'0604','193:750':'0605','375:375':'0606','375:750':'0607'}[dims.join(':')];
   if(suffix)add(`1050210001${suffix.slice(1)}`);else flag('Unsupported glass panel dimensions.');
   add(['1050220001610','1050220003610','1050220002610'][f],4);
   flag('Glass panel clip counts need browser comparison.');
  } else productPanel('Steel',width,height,color);
 }
 let gross=[...lines.values()].reduce((sum,line)=>sum+line.total,0);
 if(config.style!=='Unilateral') {flag('Corner and bilateral structures need a full physical-part graph.');gross*=config.style==='Double'?1.75:1.5;}
 if(ral){const surcharge=round(gross*.3);lines.set('ral',{sku:'ral',name:'Reference RAL surcharge',count:1,unitPrice:surcharge,total:surcharge});gross+=surcharge;}
 const furnitureGross=round(gross),assembly=config.assembly?round(furnitureGross*.15):0;
 return {gross:round(furnitureGross+assembly),net:round(furnitureGross*.75+assembly),vatExclusive:round((furnitureGross+assembly)/1.081),estimated:reasons.size>0,source:'catalogue',articles:[...lines.values()],...(reasons.size?{reason:[...reasons].join(' ')}:{})};
}
