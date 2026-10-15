import { rateDescription, EXCHANGE_RATE } from '../pricing/currency.js';

// Vue retains ownership of every live amount and native order action.
let timer;
function attach() {
  const root = window.FXC_SHADOW_ROOT;
  if (!root) { timer = setTimeout(attach, 100); return; }
  const style = document.createElement('style');
  style.textContent = `
@media(min-width:1024px){
 #app .befun-price-summary{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;padding:15px 16px;background:#fff;border-bottom:1px solid #ebede9}
 .befun-price-summary .befun-price-amounts{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:5px;min-width:0}
 .befun-price-summary .befun-price-secondary{display:flex;align-items:center;gap:8px;min-height:16px}
 .befun-price-summary .befun-price-original{position:static;font-size:11px;font-weight:400;line-height:1.2;color:#969b95;text-decoration-color:#b2b6ae}
 .befun-price-summary .befun-price-discount{display:inline-flex;align-items:center;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:500;line-height:1.3;color:#535b50!important;background:#f0f2ed;box-shadow:none;white-space:nowrap}
 .befun-price-summary .befun-price-total{position:static;font-size:clamp(20px,1.5vw,26px);font-weight:650;letter-spacing:-.055em;line-height:1.15;color:#171a16!important;font-variant-numeric:tabular-nums;white-space:nowrap}
 .befun-price-summary .befun-price-meta{display:flex;flex-direction:row;align-items:center;gap:7px;margin:0;color:#82887d;line-height:1.3}
 .befun-price-summary .befun-price-meta>span{color:inherit;font-size:10px;font-weight:400;white-space:nowrap}
 .befun-price-summary .befun-price-action{min-width:0}
 .befun-price-summary .befun-price-action>button,.befun-price-summary>button{height:38px!important;padding:0 14px!important;font-size:12px;font-weight:500;letter-spacing:-.025em}
}
.befun-currency-note{display:inline-block;margin:0;font:400 10px/1.3 "DM Sans","Apple SD Gothic Neo",sans-serif;letter-spacing:-.1px;color:#82887d}
.befun-currency-note>summary{display:flex;align-items:center;gap:4px;list-style:none;cursor:pointer;white-space:nowrap;border-radius:3px}
.befun-currency-note>summary::-webkit-details-marker{display:none}
.befun-currency-note>summary::before{content:'·';margin-right:2px;color:#b4b9af}
.befun-currency-note>summary::after{content:'i';display:grid;place-items:center;box-sizing:border-box;width:11px;height:11px;border:1px solid #a7ada0;border-radius:50%;font-size:8px;font-style:normal}
.befun-currency-note>summary:hover{color:#171a16}
.befun-currency-note>summary:focus-visible{outline:2px solid #171a16;outline-offset:3px}
.befun-currency-note[open]>summary{color:#171a16}
.befun-currency-note__body{position:absolute;z-index:40;top:calc(100% - 3px);left:14px;right:14px;padding:12px 14px;border:1px solid #e5e8e0;border-radius:10px;background:#fff;box-shadow:0 6px 24px #1b251414;color:#6b7364;font-size:11px;line-height:1.6}
.befun-currency-note__body strong{display:block;margin-bottom:3px;color:#252c20;font-weight:500}
`;
  root.append(style);
  const update = () => {
    const meta = root.querySelector('.befun-price-meta');
    if (!meta || meta.querySelector('.befun-currency-note')) return;
    const note = document.createElement('details');
    note.className = 'befun-currency-note';
    const trigger = document.createElement('summary');
    trigger.textContent = '환율 안내';
    trigger.setAttribute('aria-label', '원화 환산 기준 안내');
    const body = document.createElement('div');
    body.className = 'befun-currency-note__body';
    const heading = document.createElement('strong');
    heading.textContent = `원화 환산 · ${EXCHANGE_RATE.asOf.replaceAll('-', '.')} 기준`;
    body.append(heading, document.createTextNode(rateDescription));
    note.append(trigger, body);
    meta.append(note);
  };
  const observer = new MutationObserver(update);
  observer.observe(root, { childList: true, subtree: true });
  update();
  window.addEventListener('pagehide', () => { clearTimeout(timer); observer.disconnect(); }, { once: true });
}
if (typeof window !== 'undefined') attach();
