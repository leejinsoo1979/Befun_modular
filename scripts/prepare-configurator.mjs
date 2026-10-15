import { readFile, writeFile } from 'node:fs/promises';

// Preserve the downloaded runtime as a reference. Adapt only display copy and its startup hook:
// sa() already positions the camera at its final view; jX()/WX() add the intro orbit.
const root = new URL('../public/original-configurator/', import.meta.url);
const source = await readFile(new URL('configurator.js', root), 'utf8');
const before = 'Gn(),sa(),jX(),WX(3200,e)';
const after = 'Gn(),sa(),e==null||e()';
if (source.split(before).length !== 2) {
  throw new Error('The source startup hook changed; refusing to apply an ambiguous camera patch.');
}
const korean = JSON.parse(await readFile(new URL('../src/locales/configurator.ko.json', import.meta.url), 'utf8'));
let translated = 0;
const localized = source.replace(before, after).replace(/(\ben:|"en":)("(?:[^"\\]|\\.)*")/g, (match, key, literal) => {
  const value = JSON.parse(literal);
  if (!Object.hasOwn(korean, value)) return match;
  translated++;
  return key + JSON.stringify(korean[value]);
});
// The source has an English locale slot. Localize that slot so data keys,
// currency, geometry and all source calculations keep their original behavior.
await writeFile(new URL('configurator.local.js', root), localized);
console.log(`Prepared configurator: Korean copy (${translated} labels), startup camera orbit disabled.`);
