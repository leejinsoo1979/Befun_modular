// Apply only to display copy, never to storage keys, source IDs or asset URLs.
export const rebrand = value => typeof value === 'string'
  ? value.replace(/\b(?:flex[\s-]*cube|flec[\s-]*cube)\b/gi, 'Befun')
    .replace(/Befun를/g, 'Befun을').replace(/Befun로/g, 'Befun으로')
    .replace(/Befun가/g, 'Befun이').replace(/Befun는/g, 'Befun은')
  : value;
