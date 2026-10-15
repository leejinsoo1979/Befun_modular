# Original configurator UI source and local mirror

Reference inspected on 2026-10-15 (Asia/Seoul). This document records the current public application source and the differences from the first independent React implementation. The root task is replacing that implementation with a local mirror of the public application. This subtask changed no application source; it owns this document and `public/original-configurator/styles/` only.

## Public sources

- Storefront host page: <https://flexcube.ch/en/pages/konfigurator>
- Current application bundle: <https://flexcube.ch/cdn/shop/t/5/assets/configurator.js?v=59525409401430670271791791437>
- Current Verge3D runtime: <https://flexcube.ch/cdn/shop/t/5/assets/v3d.js?v=160173461860661030221767690361>
- Current scene preload: <https://flexcube.ch/cdn/shop/t/5/assets/configurator-scene.json?v=62752250576742739911791384326>

The application bundle is 3,436,173 bytes. It is a self-contained Vue application bundled as executable browser JavaScript, with a script-injected CSS string at its beginning. It is not a React component or an external CSS import. The first CSS template literal occupies source character offsets 152–126422. The decoded CSS is 122,267 bytes. `styles/sources.json` records exact source URLs, retrieval time, sizes, and SHA-256 checksums.

## Files prepared by this subtask

| Local file under `public/original-configurator/styles/` | Provenance / purpose |
|---|---|
| `configurator.raw.css` | Exact decoded CSS string injected by the public application bundle. No selectors or declarations changed. A reference copy; do not load it a second time when the original bundle already injects it. |
| `configurator.host.css` | Exact host `<style>` block extracted from the public storefront HTML, including the four original DM Sans font faces, host container and initial loader. Original remote font URLs retained. |
| `configurator.host.local.css` | Same host CSS with only the four font URLs rewritten to sibling local `.woff2` files. No dimensions, colors or font declarations changed. |
| `dm-sans-normal-latin.woff2`, `dm-sans-normal-latin-ext.woff2`, `dm-sans-italic-latin.woff2`, `dm-sans-italic-latin-ext.woff2` | Public original variable font files, weights 100–1000. |
| `iframe-base.css` | Local integration adaptation: reset iframe document body/html margin and padding, retain the original `#f1f1f2` base background. This small reset is not presented as vendor source. |
| `sources.json` | Source manifest with file hashes and explicit `adapted` flags. |

The executable bundle, scene, model and texture ownership remains with root / the 3D asset research task; this subtask did not write their files.

## Exact host mount contract

The original host HTML creates this structure outside the application:

```html
<div id="app-wrapper">
  <div id="apploader">…original initial loader…</div>
  <div id="app-container"></div>
</div>
```

Before importing the application, it creates an open shadow root in `#app-container`, appends `div#app`, and sets:

```js
window.FXC_SHADOW_ROOT = shadowRoot;
window.FXC_MOUNT_TARGET = mountDiv;
window.FXC_SHOPIFY_CONTEXT = {
  marketHandle: 'ch',
  languageIsoCode: 'en',
  customer: null,
};
window.FXC_SCENE_URL = localSceneUrl;
```

The bundle injects its CSS into `(window.FXC_SHADOW_ROOT || document.head)` and mounts Vue into `(window.FXC_MOUNT_TARGET || '#app')`. Its DOM selection helpers also use the shadow root. Preserve this mount contract; loading the CSS in the outer React document does not style the shadow DOM, and copying the CSS onto the previous React class names does not recreate the original layout.

Load the original Verge3D runtime before the application needs `v3d`; then import the local application bundle. Link `styles/configurator.host.local.css` and `styles/iframe-base.css` in the iframe document. The font faces must be available to that document; the application uses DM Sans inside the shadow tree. Homepage Jost is not a substitute.

The exact original `#app-container` declarations are:

```css
#app-container {
  display: block;
  border: none;
  padding: 0;
  margin: 0;
  width: 100vw;
  height: auto;
  background-color: #f1f1f2;
  color: #000000;
  font-family: "DM Sans", sans-serif;
  -webkit-font-smoothing: auto;
  -moz-osx-font-smoothing: auto;
}
```

The public host supplies no radial CSS background for the canvas. The rendered floor, wall, lighting and shadows belong to the scene / engine setup. The application creates its own floor/wall planes and lights after loading Verge3D. Keep the original engine path to reproduce them.

`#app { overflow-y:auto; height:inherit; }` comes from the injected CSS. The application root has `min-height:100dvh`; it is not originally `calc(100dvh - 130px)`. `AppHead` emits meta/title elements, not a visible header box. Shopify navigation is outside the application. When integrating an iframe below the local site navigation, choose the iframe viewport deliberately and compare it to the original page at the same CSS viewport. Subtracting the header both in the iframe height and in the application root would shrink the scene twice.

## Desktop, tablet and mobile layout from source

The source root class list is:

```text
max-md:overflow-hidden 2xl:pr-20 min-h-[100dvh] max-sm:h-[100dvh]
grid md:grid-cols-[1fr_minmax(auto,_37vw)]
lg:grid-cols-[1fr_minmax(auto,_29vw)]
xl:grid-cols-[1fr_minmax(auto,_28vw)]
max-md:flex max-md:flex-col max-md:gap-y-0
```

Tailwind breakpoints in the bundled CSS are `sm=640`, `md=768`, `lg=1024`, `xl=1280`, `2xl=1536` CSS pixels. A separate application helper uses `matchMedia('(min-width: 1024px)')` to select the desktop vs mobile editing interface. These are two distinct mechanisms.

| Viewport width | Source layout |
|---|---|
| Below 768px | Canvas / settings stack vertically. Canvas `43.4dvh`; settings `55.1dvh`. Settings area scrolls independently. Mobile purchase row is fixed at bottom. |
| 768–1023px | Grid still has a right column of `minmax(auto,37vw)`, while the application uses the mobile tab interface. Do not treat this range as ordinary desktop. |
| 1024–1279px | Desktop editing interface; right column `minmax(auto,29vw)`. |
| 1280px and up | Desktop editing interface; right column `minmax(auto,28vw)`. |
| 1536px and up | Root additionally has `padding-right:5rem` (`2xl:pr-20`). |

The left scene wrapper is `h-full grid … z-[16]`. The toolbar and scene occupy the same CSS grid cell. The canvas container is `#v3d-container.relative.top-0.h-full.w-full`. It is not a separate fixed-height canvas with independently placed HTML annotations.

The desktop right content has white scrolling content and `md:border-radius` on its lower corners, `lg:padding-left:.75rem`. Its compact overview and expanded structure/function/color editors are different conditional content. `#settingsMenuContent` is hidden below 1024px. Mobile uses sticky horizontally scrolling tabs plus a grey inner workspace (`rgb(240,240,240)`), not the first implementation's expandable version of the same sidebar.

## Gallery and controls: concrete source values

| Element | Original source value |
|---|---|
| Desktop template gallery | At `lg`: width `60vw`, height `41.5vw`, max-height `90vh`, top `1.5vw`, centered at `left:50%`, radius `.87vw`, padding `1.62vw 1.75vw`. |
| Mobile/tablet template gallery | Bottom sheet, full width, height `88%`, background `rgb(245,242,236)`, top radius `6.15vw` / `md:3.08vw`. |
| Gallery backdrop | `black/55` under 1024px; `rgba(22,20,18,.45)` for desktop. |
| Gallery columns | Two below 768px; three from 768px upward. |
| Desktop gallery heading | `1.31vw`, weight 600, tracking `-.01em`; subtitle `.81vw`. |
| Gallery heading below 768px | `4.87vw`; subtitle `3.08vw`. |
| Standard desktop text-md | `.85vw`; text-sm `.7vw`; text-xl `1.05vw`. |
| Brand orange | `rgb(216,108,56)` = `#d86c38`. |
| Neutral surface | `rgb(241,241,242)` = `#f1f1f2`. |
| Separator | `rgb(224,224,224)` = `#e0e0e0`. |
| Desktop icon toolbar button | `lg:2vw × 2vw`; pre-lg desktop-class button `4vw × 4vw`. |
| Mobile toolbar SVG | Below 768: content `4.5vw` with `1.5vw` padding each side; 768–1023: `2.3vw` with `.8vw` padding each side. These rules are scoped to `ToolbarButtonMobile`, not desktop buttons. |

The template launcher uses two stacked real thumbnail images encoded as data URLs, not the first implementation's grid icon and text pill. Many function/handle icons are original SVG or image assets. Preserve the original rendered DOM and bundle to avoid replacing these shapes with invented line icons.

The source includes customized noUiSlider tracks, pips and value handles. A normal browser `<input type="range">` with a floating hard-coded value label does not recreate this control. The original gallery width slider also uses responsive CSS variables: desktop track `.62vw`, handle `4.5vw × 1.75vw`, font `.87vw`; mobile track `2.56vw`, handle `18.46vw × 7.18vw`, font `3.08vw`.

Vue scoped selectors (`data-v-f0acfd83`, `data-v-fb6ad34d`, `data-v-197a2163`, etc.) are present in both original CSS and generated DOM. Removing these attributes or class strings changes visual behavior even if the semantic text is preserved.

## Differences in the first independent implementation

These findings are a source comparison, not a claim that the original has been visually matched yet.

| First implementation | Original |
|---|---|
| React `Configurator.jsx` with generated `<FurnitureScene>` | Vue application and its Verge3D scene/material/geometry engine. |
| Fixed sidebar `402px` | Responsive right column 37/29/28vw. At 1280px, source desktop column is 358.4px; at 1920px, 537.6px plus root padding. |
| Main height `calc(100dvh - 130px)`, min-height `640px` | Application root min-height `100dvh`; separate host header. |
| Mobile breakpoint `760px` | Layout breaks 640/768/1024/1280/1536, with interface mode switch at 1024. |
| Sidebar expandable sheet with 89px collapsed price panel | Mobile tabs, dedicated general/module editors and fixed purchase/review controls. |
| Template modal width `min(1050px,70vw)`, height `min(800px,85dvh)` | Desktop `60vw × 41.5vw` capped at `90vh`; bottom sheet below 1024. |
| Gallery title `26px`, many fixed px controls | Viewport-based typographic scale, e.g. desktop heading `1.31vw`. |
| Homepage font inheritance / local generic icon substitutions | Explicit DM Sans and original SVG/data-URL controls. |
| Background `#efefed` and manually placed scale silhouette/add buttons | Neutral `#f1f1f2`, original scene figure, original object-bound annotations and controls. |
| Simplified procedural meshes | Original object geometry, material setup, floor/wall and shadow construction. CSS cannot correct this geometry difference. |

The first version's functionality may remain useful as a fallback, but it should not be described as a pixel-identical copy. Source CSS remapping alone would leave the geometry, icons, DOM structure, component states and responsive behavior different.

## Recommended local mirror integration and boundaries

Root is implementing the actual mirror wrapper and adapters. Keep these layers explicit:

1. **Vendor source assets:** public application bundle, Verge3D runtime, scene, extracted CSS, fonts and public model/texture assets. Preserve originals and record any source rewrite rather than silently modifying the reference.
2. **Local host adapter:** iframe reset, local scene URL and shadow-root mount variables. These are local integration code.
3. **Local read adapter:** map public captured template GETs to the 54 local captured configurations. Keep source IDs as lookup keys.
4. **Local write adapter:** root plans to intercept configuration save writes into local browser storage, route cart output into the local parent application, and block real external cart/order/account writes with CSP. This document does not assert those adapters are already implemented or tested.

A source helper activates extra internal tools for a literal `localhost` hostname, a staging hostname or `?user=internal`. Use the ordinary public UI state for parity. Root should neutralize that environment-dependent UI branch in the adapter / documented source patch rather than expose extra internal controls just because the mirror runs locally. No private service or internal tool was exercised in this research.

## Verification still required

Root's browser QA should compare the same CSS viewport and state: fresh initial gallery, closed gallery and default scene, every sidebar tab, selected module, color palette, dimensions/toolbar and a representative preset. Verify desktop at 1280 or 1440px, tablet around 900px, and mobile around 390px. Confirm original assets load locally, source CSS is injected into the shadow root, DM Sans is actually used, and local API/write adapters prevent external state changes.

Acquiring and hashing CSS/fonts is confirmed here. Executing the original app locally, rendering the scene, preserving user data and proving the edited behavior remain root / 3D task verification, not results established by this source inspection.
