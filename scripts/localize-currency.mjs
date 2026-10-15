// Guarded presentation-only patches. Never change the original CHF price store,
// catalogue, API payloads or saved configurations to KRW.
export function localizeCurrency(source) {
  let result = source;
  const replace = (before, after, count = 1) => {
    if (result.split(before).length - 1 !== count) {
      throw new Error(`The original currency presentation changed: ${before}`);
    }
    result = result.split(before).join(after);
  };

  // Group only desktop display fields; preserve pricing and native actions.
  const summaryStart = 'wA("div",YaA,[';
  const summaryAction = 'r.marketStore.onlineShop?(gA(),wA("div",PaA,';
  const summaryFrom = result.indexOf(summaryStart), summaryTo = result.indexOf(summaryAction, summaryFrom);
  if (result.split(summaryStart).length !== 2 || summaryTo < summaryFrom) {
    throw new Error('The original currency presentation changed: price summary');
  }
  const oldSummary = result.slice(summaryFrom + summaryStart.length, summaryTo);
  for (const expression of ['lA(e.costB)', 'lA(n.getDiscountedTotal())']) {
    if (oldSummary.split(expression).length !== 2) {
      throw new Error(`The original currency presentation changed: ${expression}`);
    }
  }
  const newSummary = 'x("div",SaA,[' +
    'x("div",{class:"befun-price-secondary"},[' +
      'r.marketStore.hasB2bDiscount?(gA(),wA("s",TaA,lA(r.marketStore.currencySymbol)+" "+lA(e.costB),1)):ge("",!0),' +
      'r.marketStore.hasB2bDiscount?(gA(),wA("span",UaA,lA(r.marketStore.b2bDiscountText)+" 할인",1)):ge("",!0)]),' +
    'x("span",kaA,lA(r.marketStore.currencySymbol)+" "+lA(n.getDiscountedTotal()),1),' +
    'x("div",RaA,[x("span",GaA,lA(r.marketStore.taxIncluded?n.textByPathArr(["menu","taxes_included_sub"]):n.textByPathArr(["menu","taxes_excluded_sub"])),1)])]),';
  replace(oldSummary, newSummary);
  for (const [name, className] of [['YaA','befun-price-summary'],['SaA','befun-price-amounts'],['kaA','befun-price-total'],['TaA','befun-price-original'],['RaA','befun-price-meta'],['PaA','befun-price-action']]) {
    const prefix = name === 'TaA' || name === 'PaA' ? `${name}={key:${name === 'TaA' ? '0' : '1'},${name === 'PaA' ? 'ref:"buyAnchor",' : ''}class:"` : `${name}={class:"`;
    replace(prefix, prefix + className + ' ');
  }
  replace('UaA={key:0,class:"', 'UaA={key:1,class:"befun-price-discount ');

  replace('lA(r.marketStore.currencySymbol)', '"₩"', 15);
  const renderAmounts = [
    ['e.costB', 1],
    ['n.getDiscountedTotal()', 4],
    ['e.withoutAssemblyCostN.toFixed(2)', 2],
    ['(e.withoutAssemblyCostN*r.marketStore.b2bDiscount).toFixed(2)', 1],
    ['n.discountedTotal', 1],
    ['(e.withoutAssemblyCostN*e.quantity).toFixed(2)', 2],
    ['(e.withoutAssemblyCostN*r.marketStore.b2bDiscount*e.quantity).toFixed(2)', 1],
    ['n.getTaxAmount().toFixed(2)', 1],
    ['(+n.discountedTotal*e.quantity+n.deliveryPrice+(r.marketStore.taxIncluded?0:n.getTaxAmount())).toFixed(2)', 1],
  ];
  for (const [expression, count] of renderAmounts) {
    replace(`lA(${expression})`, `lA(BefunWonNumber(${expression}))`, count);
  }
  replace('return typeof e!="number"?e:this.marketStore.showCents?e.toFixed(2):e', 'return typeof e!="number"?e:BefunWonNumber(e)');

  // Restrict PDF replacements to its own report function. Local variables retain
  // their CHF values for discount and tax calculations; convert at output only.
  const start = result.indexOf('const Z_=async function(e){');
  const end = result.indexOf('},__=function(e){', start);
  if (start < 0 || end < 0) throw new Error('The original PDF report hook changed.');
  let pdf = result.slice(start, end);
  const pdfReplace = (before, after, count = 1) => {
    if (pdf.split(before).length - 1 !== count) throw new Error(`The original PDF currency presentation changed: ${before}`);
    pdf = pdf.split(before).join(after);
  };
  pdfReplace('" "+Te().currencySymbol+" "+(Te().taxIncluded?E:F)', '" KRW "+BefunWonNumber(Te().taxIncluded?E:F)');
  for (const [expression, count] of [['p', 2], ['v', 1], ['Te().taxIncluded?E:F', 1]]) {
    pdfReplace('${Te().currencySymbol} ${' + expression + '}', 'KRW ${BefunWonNumber(' + expression + ')}', count);
  }
  for (const [market, expression] of [['ch','p.toFixed(2)'],['de','R.toFixed(2)'],['ch','C'],['de','I'],['ch','b'],['de','T'],['de','z.toFixed(2)']]) {
    pdfReplace('${Ut.' + market + '.currency.symbol} ${' + expression + '}', 'KRW ${BefunWonNumber(' + expression + ')}');
  }
  for (const [before, expression] of [
    ['y?G.price.toFixed(2):G.price.toString()', 'G.price'],
    ['y?(G.price*G.count).toFixed(2):(G.price*G.count).toString()', 'G.price*G.count'],
    ['G.price.toString()', 'G.price'],
    ['y?G.totalValue.toFixed(2):G.totalValue.toString()', 'G.totalValue'],
  ]) pdfReplace(before, `BefunWonNumber(${expression})`);
  pdfReplace('B.text(e.weight.toFixed(1)+" kg",u+45,177,null,null)', 'B.text(e.weight.toFixed(1)+" kg",u+45,177,null,null),B.setFontSize(8),B.text(BefunCurrencyRate.pdfNote,40,201,null,null)');
  result = result.slice(0, start) + pdf + result.slice(end);
  return 'import {formatWonNumber as BefunWonNumber,EXCHANGE_RATE as BefunExchangeRate,wonPerFranc as BefunWonPerFranc} from "../pricing/currency.js";\nimport "./currency-ui.js";\nconst BefunCurrencyRate={pdfNote:`KRW reference: 1 CHF = ${BefunWonPerFranc.toFixed(2)} KRW (${BefunExchangeRate.asOf}, ECB). Rounded to the nearest won.`};\n' + result;
}
