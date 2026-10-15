export const DESK_CONFIGURATOR_PATH = '/en/pages/desk-configurator';
export const DESK_VIEWER_URL = 'https://app.vectary.com/p/7ERImrQukNWwXkiQntrOlA';
export const DESK_POSTER = '/assets/desk/vectary-stand-desk-preview.jpg';

// These products share the standing-desk use case. The Vectary scene is a
// common interactive model; catalog variants and prices stay on the product page.
const standingDeskHandles = new Set([
  'hoehenverstellbarer-schreibtisch-home',
  'hoehenverstellbarer-schreibtisch-profi',
]);

export function hasStandingDeskPreview(product) {
  return standingDeskHandles.has(product?.handle);
}
