import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {initialVariant, productCartConfig, productPrice, templateForProduct, variantForOptions} from '../src/catalogProduct.js';

const read = name => JSON.parse(readFileSync(new URL(`../public/assets/${name}`, import.meta.url)));
const catalog = read('catalog.json'), details = read('catalog-details.json');

test('all eleven source menus retain their complete product order and real options', () => {
 assert.equal(details.collections.length, 11);
 assert.equal(details.products.length, 85);
 for (const source of details.collections) {
  assert.deepEqual(catalog.collections.find(item => item.slug === source.slug)?.productIds, source.productIds);
 }
 for (const product of catalog.products) {
  const detail = details.products.find(item => item.id === product.id);
  assert.equal(detail?.handle, product.handle);
  assert.ok(detail.variants.length);
  assert.equal(new Set(detail.variants.map(item => item.id)).size, detail.variants.length);
  for (const variant of detail.variants) {
   assert.equal(variant.options.length, detail.options.length);
   variant.options.forEach((value,index) => assert.ok(detail.options[index].values.includes(value)));
   assert.ok(Number(variant.price) > 0);
   assert.equal(variantForOptions(detail.variants, variant.options)?.id, variant.id);
   if (variant.image) assert.ok(existsSync(new URL(`../public${variant.image}`, import.meta.url)));
  }
  for (const image of detail.images) assert.ok(existsSync(new URL(`../public${image.src}`, import.meta.url)), image.src);
 }
});

test('all nine tables use their own variants rather than a cabinet template', () => {
 const tables = details.collections.find(item => item.slug === 'tische').productIds;
 assert.equal(tables.length, 9);
 for (const id of tables) {
  const product = catalog.products.find(item => item.id === id);
  assert.equal(templateForProduct(product), null);
  assert.ok(details.products.find(item => item.id === id).options.some(item => item.name === 'worktop'));
 }
 const home = catalog.products.find(item => item.handle === 'hoehenverstellbarer-schreibtisch-home');
 const detail = details.products.find(item => item.id === home.id);
 assert.equal(detail.variants.length, 32);
 const chosen = variantForOptions(detail.variants, ['White','White','200x80cm']);
 assert.ok(chosen);
 const item = productCartConfig(home, chosen, null);
 assert.equal(item.kind, 'catalog-product');
 assert.equal(item.variantId, chosen.id);
 assert.deepEqual(item.options, ['White','White','200x80cm']);
 assert.equal(item.width, 200);
 assert.equal(item.depth, 80);
 assert.equal(item.height, null, 'do not invent cabinet heights for a desk');
 assert.equal(item.originalId, undefined);
 assert.equal(variantForOptions(detail.variants, ['White','White','900x80cm']), null);
});

test('regular and sale table prices preserve the correct selected variant amount', () => {
 const home = details.products.find(item => item.handle === 'hoehenverstellbarer-schreibtisch-home');
 assert.equal(productPrice(initialVariant(home), {}).net, 621.75);
 const sale = details.products.find(item => item.handle === 'occasion-home-schreibtisch-160x80');
 const variant = initialVariant(sale);
 assert.equal(productPrice(variant, {}).net, Number(variant.price), 'do not apply the SME discount again to an already reduced sale variant');
});
