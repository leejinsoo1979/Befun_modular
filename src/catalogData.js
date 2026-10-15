import collections from './data/catalog-collections.json' with {type:'json'};

export const catalogCollections = collections;
const aliases = {'chests-of-drawers':'kommoden', shelves:'regale', tables:'tische', pedestals:'container', 'reception-desks':'empfangstheken', wardrobes:'garderoben', 'corner-sideboard':'ecksideboard'};

export function collectionFor(value = 'All') {
 const slug = String(value).split('/').filter(Boolean).at(-1);
 return collections.find(item => item.key === value || item.title === value || item.slug === (aliases[slug] || slug)) || collections[0];
}

export function collectionPath(value) {
 return `/en/collections/${collectionFor(value).slug}`;
}

export function collectionProducts(data, value) {
 const collection = collectionFor(value);
 const ids = data.collections?.find(item => item.slug === collection.slug)?.productIds || [];
 const byId = new Map(data.products.map(item => [item.id, item]));
 return ids.map(id => byId.get(id)).filter(Boolean);
}
