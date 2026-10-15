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
