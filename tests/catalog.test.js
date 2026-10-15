import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {catalogCollections, collectionFor, collectionPath, collectionProducts} from '../src/catalogData.js';

const data = JSON.parse(readFileSync(new URL('../public/assets/catalog.json', import.meta.url)));

test('collection routes retain native slugs and resolve translated names and earlier URLs', () => {
 for(const item of catalogCollections) {
  for(const input of [item.key, item.title, `/en/collections/${item.slug}`]) {
   assert.equal(collectionFor(input).key, item.key);
   assert.equal(collectionPath(input), `/en/collections/${item.slug}`);
  }
 }
 assert.equal(collectionPath('Chests of drawers'), '/en/collections/kommoden');
 assert.equal(collectionFor('/en/collections/shelves').key, 'Shelves');
 assert.equal(collectionFor('/en/collections/reception-desks').key, 'Reception desks');
 assert.equal(collectionFor('/en/collections/unknown').key, 'All');
});

test('each captured collection uses its own ordered products and all referenced images exist locally', () => {
 const ids = new Set(data.products.map(product => product.id));
 assert.equal(ids.size, data.products.length, 'product details have a unique ID');
 for(const collection of data.collections) {
  const products = collectionProducts(data, collection.key);
  assert.equal(products.length, collection.productIds.length, 'no captured product is silently dropped');
  assert.deepEqual(products.map(item => item.id), collection.productIds, 'preserve source order');
  assert.ok(products.length > 0, 'categories do not substitute unrelated sample furniture');
  assert.ok(existsSync(new URL(`../public${collection.image}`, import.meta.url)));
 }
 for(const product of data.products) {
  assert.ok(existsSync(new URL(`../public${product.image}`, import.meta.url)), product.image);
  assert.ok(Number(product.price) >= Number(product.salePrice));
 }
 const bestsellers = collectionProducts(data, 'All');
 assert.equal(bestsellers.length, 13, 'include the final product previously lost to limit=12');
 assert.equal(bestsellers[0].price, '2437.00');
 assert.equal(bestsellers[0].salePrice, '1827.75', 'retain the native automatic discount before KRW conversion');
 assert.equal(collectionProducts(data, 'Tables').length, 9);
 assert.equal(collectionProducts(data, 'Wardrobes').length, 6);
});
