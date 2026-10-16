# Desk configurator integration

Reference: [Stand desk](https://app.vectary.com/p/7ERImrQukNWwXkiQntrOlA). Added 2026-10-15.

## Fidelity and source

`/en/pages/desk-configurator` runs the original Vectary sharing URL in an iframe. The original model, wood textures, lighting, shadows, camera behavior, native hotspot menus, and width/height animations are executed by Vectary. No approximate desk mesh or generated replacement textures are used.

The original three material choices are labelled Oak / Natural, Wallnut / Natural, and Acacia / Painted. Width and height controls animate the source model; this integration does not invent dimensional values for those states.

The catalog card's poster was taken unchanged from the reference page's `og:image`:

- Source: `https://d15a7j1h1vwzab.cloudfront.net/5d/61/1f/5d611f4fb19d803d6704eb424811d404f72d58fa.jpg`
- Local file: `public/assets/desk/vectary-stand-desk-preview.jpg`
- SHA-256: `6b791af39b361e37e41c3573df40bee4b28c29193d3aa00e3041966cff49ad4b`

## Site connections

- The furniture collection menu includes **3D 데스크 만들기**.
- The Tables collection (`/en/collections/tische`) contains a dedicated **데스크 3D 구성하기** entry.
- Home and Profi standing-desk detail pages expose a clearly labelled common-model preview. Their catalog variants, product imagery, price calculation, and cart selection remain on the detail page.
- Round, corner, wall-mounted, and classic tables are not represented by an unrelated standing-desk model.
- The studio includes a return to the table lineup, native document reset, supported fullscreen, and a direct original-viewer link.

## Integration boundary

This is an original-viewer integration, not independently hosted source geometry. Vectary must keep the shared project available. Parent React components do not inspect or alter cross-origin scene state. Reset remounts the iframe. The loading cover waits for the iframe document `load` event, not a fictitious model-ready callback.

No option synchronization, KRW price synchronization, design persistence, or cart submission is asserted for the Vectary scene. A common-model note is shown on product pages to prevent confusing scene materials with selected catalog variants.

Official references: [Sharing and embedding](https://help.vectary.com/documentation/sharing-exporting-embedding/sharing), [Model API quick start](https://help.vectary.com/api/model-api/quick-start), [Model API availability](https://help.vectary.com/api/model-api). Independent source hosting or a custom option/price connection requires the original project/export and a supported API integration.

## Verification

`npm run build` passed. `node --test tests/catalog.test.js tests/catalog-details.test.js` passed all five tests. Browser evidence is saved under `docs/qa/desk-configurator/`.

Verified in the browser:

- Collection menu → Tables → Desk studio; Home product detail → Desk studio; direct page reload; return to lineup.
- Original Oak, Wallnut, and Acacia material selection; width and height animation; reset to the original scene.
- Fullscreen entered and exited, with the toolbar's pressed state changing accordingly.
- 390 × 844 layout: document height 844, no horizontal overflow, viewer 390 × 642, all toolbar tools available; material selection and height control worked. The height hotspot moved from y=308.5 to y=275.5 in the viewer after the native height action.
- Existing catalog variants and prices still passed their focused tests.

The original camera settings remain unchanged. Automated pointer drag/wheel attempts inside the cross-origin iframe did not establish camera movement, so orbit/zoom is not reported as a passed integration check. The guide directs users to the verified round hotspot controls. AR/camera permission and physical-device touch/AR testing are outside this verification scope.
