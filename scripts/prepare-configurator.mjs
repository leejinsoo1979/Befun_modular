import { readFile, writeFile } from 'node:fs/promises';
import { rebrand } from '../src/brand.js';
import { localizeCurrency } from './localize-currency.mjs';

// Preserve the downloaded runtime as a reference. Adapt local copy, palette and startup hook:
// sa() already positions the camera at its final view; jX()/WX() add the intro orbit.
const root = new URL('../public/original-configurator/', import.meta.url);
const source = await readFile(new URL('configurator.js', root), 'utf8');
const loaderStyles = await readFile(new URL('../assets/loading.css', root), 'utf8');
const loaderStart = 'function _0A(e,A,t,r,i,n){';
const loaderEnd = 'const q0A=ht(W0A,[["render",_0A]])';
if (source.split(loaderStart).length !== 2 || source.split(loaderEnd).length !== 2) {
  throw new Error('The source loading overlay changed; refusing an ambiguous loader patch.');
}
const loaderMarkup = '<div class="befun-loader__identity" aria-hidden="true"><img class="befun-loader__logo" src="/assets/logo-black.svg?v=supplied-1" alt="" width="128" height="39"><span class="befun-loader__line"></span></div>';
const sourceLoader = source.slice(source.indexOf(loaderStart), source.indexOf(loaderEnd));
const brandedLoader = 'function _0A(e,A){return gA(),wA("div",{id:"preloader",class:"befun-loader befun-loader--overlay",role:"status","aria-label":"불러오는 중"},[A[0]||(A[0]=uh(' + JSON.stringify(loaderMarkup) + ',1))])}';
// Ship the same pinned display rate to the isolated native iframe and React shop.
await writeFile(new URL('../pricing/currency.js', root), await readFile(new URL('../src/currency.js', import.meta.url), 'utf8'));
// Share additional swatches across desktop, mobile and individual-panel palettes.
// Deep green, yellow and orange use the existing custom-color material,
// article/pricing and save/restore paths without inventing a stock component SKU.
const paletteHook = 'e.oliveGreen="#6F6D4E",';
const colorNamesHook = '"main_colors":{';
for (const hook of [paletteHook, colorNamesHook]) {
  if (source.split(hook).length !== 2) {
    throw new Error('The source panel palette changed; refusing an ambiguous swatch patch.');
  }
}
let withGreen = source
  .replace(sourceLoader, brandedLoader)
  .replace(paletteHook, paletteHook + 'e.green="#006241",e.yellow="#F7B500",e.orange="#E25303",')
  .replace(colorNamesHook, colorNamesHook + '"#006241":{"en":"Green","de":"Grün","fr":"Vert"},"#F7B500":{"en":"Yellow","de":"Gelb","fr":"Jaune"},"#E25303":{"en":"Orange","de":"Orange","fr":"Orange"},');
// Retain the native hover, eligibility, add-cell and undo paths. Add only the
// desktop preview presentation, using the existing CSS2D button renderer.
const appendingHooks = [
  ['this.model.userData.areaType=t,Jr?this.createButton()',
    'this.model.userData.areaType=t,window.BefunAppendingAreaUI?.mount(this,{mobile:Jr}),Jr?this.createButton()'],
  ['remove(){super.remove(),Jr?this.removeButton()',
    'remove(){window.BefunAppendingAreaUI?.unmount(this),super.remove(),Jr?this.removeButton()'],
  ['this.active=!0,!0):!1}setInactiveState(){return Jr&&this.button?',
    'this.active=!0,window.BefunAppendingAreaUI?.setActive(this,!0),!0):!1}setInactiveState(){if(window.BefunAppendingAreaUI?.keepActive(this))return!1;return Jr&&this.button?'],
  ['this.active=!1,!0}createBaseButtonTemplate()',
    'this.active=!1,window.BefunAppendingAreaUI?.setActive(this,!1),!0}createBaseButtonTemplate()'],
];
for (const [before, after] of appendingHooks) {
  if (withGreen.split(before).length !== 2) {
    throw new Error('The source expansion preview changed; refusing an ambiguous hotspot patch.');
  }
  withGreen = withGreen.replace(before, after);
}
const before = 'Gn(),sa(),jX(),WX(3200,e)';
const after = 'Gn(),sa(),e==null||e()';
if (source.split(before).length !== 2) {
  throw new Error('The source startup hook changed; refusing to apply an ambiguous camera patch.');
}
const framingHook = 'function sa(e){switch(q.cabinetMode)';
if (source.split(framingHook).length !== 2) {
  throw new Error('The source camera framing hook changed; refusing an ambiguous shortcut patch.');
}
const korean = JSON.parse(await readFile(new URL('../src/locales/configurator.ko.json', import.meta.url), 'utf8'));
// Inject the local theme in the same synchronous stylesheet as the source UI,
// before Vue mounts. Loading a separate override afterwards flashes orange.
const localStyles = loaderStyles + '\n' + await readFile(new URL('styles/korean.css', root), 'utf8');
const styleHook = 't.textContent=a,(window.FXC_SHADOW_ROOT||document.head).appendChild(t)';
if (source.split(styleHook).length !== 2) {
  throw new Error('The source stylesheet bootstrap changed; refusing an ambiguous theme patch.');
}
let translated = 0;
const localized = withGreen.replace(before, after).replace(framingHook,
  'let befunReframe=null;window.BefunCameraFraming=Object.freeze({frame:()=>{if(!q.getLeftmostCell())return false;befunNativeFrame();return true},fit:()=>p4(Jr?YnA:xnA),bounds:()=>{const bounds=new v3d.Box3;for(const model of hu.models)bounds.expandByObject(model);return bounds},ready:()=>!xr().preloader,subscribe:handler=>{befunReframe=handler;return()=>{if(befunReframe===handler)befunReframe=null}}});function sa(e){if(e!==true&&befunReframe?.())return;befunNativeFrame(e)}function befunNativeFrame(e){switch(q.cabinetMode)'
).replace(/(\b(?:en|de|fr|name|pageTitle|pdfFilePrefix):|"(?:en|de|fr|aria-label)":|\blabel:)("(?:[^"\\]|\\.)*")/g, (match, key, literal) => {
  const value = JSON.parse(literal);
  const translate = /^(?:en:|"en":|"aria-label":|label:)$/.test(key) && Object.hasOwn(korean, value);
  const display = rebrand(translate ? korean[value] : value);
  if (display === value) return match;
  translated++;
  return key + JSON.stringify(display);
}).replace(/(back:\{en:)"뒤쪽"(,de:"Zurück")/g, '$1"뒤로"$2')
  .replaceAll('flexcube_model_export_', 'befun_model_export_')
  .replaceAll('Check out this awesome design that I made on Flexcube Configurator', 'Befun에서 만든 나만의 가구 디자인을 확인해 보세요')
  .replaceAll('Flexcube Configurator Design', 'Befun 가구 디자인')
  // Recolor the embedded +/- and help icons without replacing their shapes.
  .replaceAll('%23D86C38', '%23000000')
  // Use the existing PDF text-logo path instead of the embedded source-brand PNG.
  .replace('showPdfLogoImage:!0,showPdfFooter', 'showPdfLogoImage:!1,showPdfFooter')
  .replace('B.text(Te().brandName.toUpperCase(),40,81', 'B.text(Te().brandName,40,81')
  .replace(styleHook, 't.textContent=a+' + JSON.stringify('\n' + localStyles) + ',(window.FXC_SHADOW_ROOT||document.head).appendChild(t)');
// The source has an English locale slot. Localize that slot so data keys,
// geometry, stored CHF values and all source calculations keep their behavior.
await writeFile(new URL('configurator.local.js', root), localizeCurrency(localized));
console.log(`Prepared configurator: Korean copy (${translated} labels), startup camera orbit disabled.`);
