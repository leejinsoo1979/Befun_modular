// Display conversion only. Catalogue, configuration and stored prices stay in CHF.
// Update both ECB quotes and the date together; this is a pinned reference rate.
export const EXCHANGE_RATE = Object.freeze({
  sourceCurrency: 'CHF',
  displayCurrency: 'KRW',
  asOf: '2026-10-14',
  provider: 'ECB',
  sourceUrl: 'https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html',
  chfPerEuro: 0.9330,
  krwPerEuro: 1496.54,
});

export const wonPerFranc = EXCHANGE_RATE.krwPerEuro / EXCHANGE_RATE.chfPerEuro;
const number = new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 });

export function toWon(francs) {
  const amount = Number(francs);
  if (!Number.isFinite(amount)) throw new TypeError('A finite CHF amount is required.');
  return Math.round(amount * wonPerFranc);
}

export const formatWonNumber = francs => number.format(toWon(francs));
export const formatWon = francs => `${formatWonNumber(francs)}원`;
export const rateDescription = `1 CHF = ${wonPerFranc.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}원 · ${EXCHANGE_RATE.asOf} ECB 기준`;

export function displayPriceSnapshot(francs) {
  return { amount: toWon(francs), currency: 'KRW', exchangeRate: wonPerFranc, exchangeRateDate: EXCHANGE_RATE.asOf, sourceAmount: Number(francs), sourceCurrency: 'CHF' };
}
