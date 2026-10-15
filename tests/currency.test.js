import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { EXCHANGE_RATE, wonPerFranc, toWon, formatWon, displayPriceSnapshot } from '../src/currency.js';
import { localizeCurrency } from '../scripts/localize-currency.mjs';

const source = await readFile(new URL('../public/original-configurator/configurator.js', import.meta.url), 'utf8');
const localized = localizeCurrency(source);

test('KRW uses both dated ECB quotes and rounds to whole won without relabelling CHF', () => {
  assert.equal(EXCHANGE_RATE.asOf, '2026-10-14');
  assert.equal(wonPerFranc, 1496.54 / 0.933);
  assert.equal(toWon(864), 1385863);
  assert.equal(formatWon(864), '1,385,863원');
  assert.equal(toWon(0), 0);
  assert.equal(toWon(98), 157193);
  assert.throws(() => toWon(NaN), TypeError);
  assert.throws(() => toWon(Infinity), TypeError);
});

test('design exports explicitly distinguish source and display prices', () => {
  const snapshot = displayPriceSnapshot(864);
  assert.equal(snapshot.sourceAmount, 864);
  assert.equal(snapshot.sourceCurrency, 'CHF');
  assert.equal(snapshot.amount, 1385863);
  assert.equal(snapshot.currency, 'KRW');
  assert.equal(snapshot.exchangeRateDate, '2026-10-14');
});

test('the native iframe and React shop ship exactly the same rate module', async () => {
  assert.equal(await readFile(new URL('../public/pricing/currency.js', import.meta.url), 'utf8'), await readFile(new URL('../src/currency.js', import.meta.url), 'utf8'));
});

test('native UI converts output while native CHF calculations and save payload are unchanged', () => {
  for (const statement of [
    'Pt().withoutAssemblyCostN=o',
    'Pt().discountedTotal=(o-o*c.b2bDiscount+l).toFixed(2)',
    'productInfo:{price:Pt().withoutAssemblyCostN,currency:n.currencyCode',
    'return this.marketStore.showCents?e.toFixed(2):e',
  ]) assert.ok(source.includes(statement) && localized.includes(statement), statement);
  assert.equal(localized.includes('lA(r.marketStore.currencySymbol)'), false);
  assert.ok(localized.includes('lA(BefunWonNumber(n.getDiscountedTotal()))'));
  assert.ok(localized.includes('lA(BefunWonNumber((e.withoutAssemblyCostN*e.quantity).toFixed(2)))'));
  assert.throws(() => localizeCurrency(source.replace('lA(e.costB)', 'lA(e.otherCost)')), /currency presentation changed/);
});

test('native PDF outputs converted totals and article prices but keeps discount/tax arithmetic in CHF', async () => {
  const texts = [], tables = [];
  class Report {
    getTextWidth(value) { return String(value).length; }
    text(value) { texts.push(value); }
    textWithLink() {}
    addImage() {}
    addPage() {}
    addFileToVFS() {}
    addFont() {}
    setTextColor() {}
    setDrawColor() {}
    setFillColor() {}
    setFontSize() {}
    setFont() {}
    rect() {}
    line() {}
  }
  class ImageStub {
    width = 400; height = 300;
    set src(value) { queueMicrotask(() => this.onload()); }
  }
  const translation = new Proxy({}, { get: (_, key) => key === 'en' ? 'Label' : translation });
  const context = vm.createContext({
    et: Report, Image: ImageStub, queueMicrotask,
    Qz: table => table,
    qZ: (_report, data) => tables.push(data.body),
    Te: () => ({ taxIncluded: true, hasB2bDiscount: true, showCents: true, showBarcodes: false, showPdfLogoImage: false, showPdfFooter: false, pdfRowsPerPage: 16, brandName: 'Befun' }),
    Ut: { ch: { b2bDiscount: 25, taxRate: 8.1 }, de: { b2bDiscount: 25, taxRate: 19 } },
    ee: () => ({ solutionMode: 0 }), Pi: { corner: 2 },
    ot: translation, console: { log() {} },
    e_: '', $Z: '', A_: '', etUnused: null,
    BefunWonNumber: amount => toWon(amount).toLocaleString('ko-KR'),
    BefunCurrencyRate: { pdfNote: 'KRW reference 2026-10-14 ECB' },
    fixture: { withoutAssemblyCostN: 1152, img: 'data:image/png;base64,test', lang: 'en', date: '15.10.26', width: 227, height: 81, depth: 40, weight: 38, url: 'http://localhost', table: [{ code: 'A', name: 'Panel', count: 2, price: 17, totalValue: 34 }] },
  });
  const start = localized.indexOf('const Z_=async function(e){');
  const end = localized.indexOf('},__=function(e){', start);
  await vm.runInContext(localized.slice(start, end) + '};Z_(fixture)', context);
  assert.ok(texts.includes('Label KRW 1,385,863'));
  assert.ok(texts.includes('KRW 1,847,818'));
  assert.ok(texts.includes('- KRW 461,954'));
  assert.ok(texts.includes('KRW reference 2026-10-14 ECB'));
  assert.deepEqual(Array.from(tables[0][0]).slice(-2), ['27,268', '54,536']);
});
