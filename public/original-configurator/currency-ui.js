import { rateDescription } from '../pricing/currency.js';

// The native Vue UI owns every price and action. Only add a small explanation to
// the price summary; the source renderer handles converted strings itself.
let timer;
function attach() {
  const root = window.FXC_SHADOW_ROOT;
  if (!root) { timer = setTimeout(attach, 100); return; }
  const style = document.createElement('style');
  style.textContent = '.befun-currency-note{display:block;color:#777;font:400 9px/1.4 "DM Sans","Apple SD Gothic Neo",sans-serif;letter-spacing:-.1px;white-space:normal;margin-top:3px}.befun-currency-note[hidden]{display:none}';
  root.append(style);
  const update = () => {
    const price = [...root.querySelectorAll('span')].find(el => el.querySelector('div') && [...el.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().startsWith('₩')));
    if (!price || price.querySelector('.befun-currency-note')) return;
    const note = document.createElement('small');
    note.className = 'befun-currency-note';
    note.textContent = '원화 환산 · 2026.10.14 기준';
    note.title = rateDescription;
    note.setAttribute('aria-label', `원화 환산 금액. ${rateDescription}`);
    price.append(note);
  };
  const observer = new MutationObserver(update);
  observer.observe(root, { childList: true, subtree: true });
  update();
  window.addEventListener('pagehide', () => { clearTimeout(timer); observer.disconnect(); }, { once: true });
}
if (typeof window !== 'undefined') attach();
