import templates from './data/configurator-templates.json' with {type:'json'};

export function templateForProduct(product) {
 if (!product || product.category === 'Tables' || /schreibtisch|besprechungstisch|wandtisch/.test(product.handle || '')) return null;
 const template = templates.find(item => item.referenceConfigId === product.configId || item.name.en === product.title || item.id === product.id);
 if (template) return template;
 if (/^[a-f0-9]{40}$/.test(product.configId || '')) return {...product, referenceConfigId: product.configId};
 return null;
}

export function variantForOptions(variants, values) {
 return variants.find(variant => variant.options.every((value, index) => value === values[index])) || null;
}

export function initialVariant(detail) {
 return detail?.variants.find(variant => variant.available) || detail?.variants[0] || null;
}

export function productPrice(variant, product) {
 const price = Number(variant?.price || product.price);
 const compare = Number(variant?.compareAtPrice || 0);
 // Sale items already carry their reduced price; regular products have the store's 25% discount.
 return compare > price ? {gross:compare, net:price, estimated:false} : {gross:price, net:Math.round(price * 75) / 100, estimated:false};
}

const optionLabels = {
 worktop:'상판', frame:'프레임', Size:'크기', Roll:'바퀴', Colour:'색상', Color:'색상', color:'색상', Frame:'프레임',
 Black:'블랙', White:'화이트', Grey:'그레이', 'Dark Grey':'다크 그레이', 'Light Grey':'라이트 그레이',
 'Real wood veneer oak':'천연 오크 무늬목', 'Real wood veneer walnut':'천연 월넛 무늬목',
 'With wheels':'바퀴 있음', 'Without wheels':'바퀴 없음', Chrome:'크롬', 'Rose gold':'로즈 골드',
};
export const optionLabel = value => optionLabels[value] || String(value).replace(/\(left\)/g, '(왼쪽)').replace(/\(right\)/g, '(오른쪽)');

export function productCartConfig(product, variant, template) {
 const size = variant?.options.find(value => /\d+\s*x\s*\d+/i.test(value));
 const dimensions = size?.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)(?:x(\d+(?:\.\d+)?))?cm$/i);
 const numbers = dimensions ? dimensions.slice(1).map(Number) : [];
 return {
  kind:'catalog-product', productId:product.id, handle:product.handle, title:product.title,
  variantId:variant?.id, sku:variant?.sku, options:variant?.options || [],
  width:numbers[0] || template?.width || null, depth:numbers[1] || template?.depth || null,
  height:numbers[2] || template?.height || null,
  ...(template?.referenceConfigId ? {originalId:template.referenceConfigId} : {}),
 };
}
