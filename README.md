# Flexcube site recreation

Local workbench for https://flexcube.ch/en.

Repository: https://github.com/leejinsoo1979/Befun_modular

```sh
npm install
npm run dev -- --port 5186
npm run build
npm test
```

Open http://127.0.0.1:5186/en/pages/konfigurator . Use `127.0.0.1` for the source application's normal public UI; its original bundle has a separate localhost/internal-user branch.

## Active configurator

`src/OriginalConfigurator.jsx` embeds a local copy of the original public application. Its reference UI bundle, Verge3D engine, glTF scene, fonts, template images, and configuration responses are under `public/original-configurator/`. Source URLs and SHA-256 hashes are recorded in its `manifest.json`.

The glTF scene contains the original mesh, node materials, HDR environment, lighting and camera. These are rendered through the original Verge3D engine rather than approximated through Three.js.

`local-adapter.js` is a separate local storage/cart adapter. It serves downloaded template responses and stores edits on this device. Original store writes, account/email integration, payment, and checkout are not connected. No original service should receive a write request.

The app loads `configurator.local.js`, generated from the preserved reference bundle by `scripts/prepare-configurator.mjs`. Its camera change removes the startup orbit while retaining the final framing and ready callback. The current local display copy uses the Korean dictionary in `src/locales/configurator.ko.json`. Manual rotation, door animations and source calculations keep their original code. The dev/build scripts regenerate this file automatically.

The separate `camera-controls.js` extension removes the source camera's 77.67° vertical cap. It allows a level 90° front view and full horizontal orbit, with vertical orbit clamped at the horizon (0..90°) so the camera cannot tilt beneath the furniture. The original camera and controls are retained. The avatar continues to use yaw-only orientation. Right-button or middle-button drag pans the camera and target together in screen space. Wheel zoom keeps the point under the mouse cursor fixed, including the original zoom inertia; perspective and orthographic cameras are supported. The first view waits for the furniture and calibrated person to load, then centers the furniture horizontally in a level front view with the person at its side. Space restores the same framing. The reference cabinet fills roughly half the canvas width and the person roughly two thirds of its height; larger designs fit with a margin. Vertical framing includes both full heights. Native framing identifies the furniture, while the visible person meshes are measured separately; floor/wall shadows are excluded. Dimension-slider changes use this same joint framing instead of the source's furniture-only zoom. A follow-up fit accounts for the avatar's updated placement and scale, and manual camera input cancels that pending correction. The dolly ceiling expands when a large design on a narrow viewport requires it. Pending camera inertia is cleared; text fields, native controls, IME composition and modal keyboard input keep their normal Space behavior.

The original UI and scene loaded in the browser; the first petrol template restored at 152 × 81 × 40 cm and CHF 1163 / CHF 872.25. Further save/cart browser verification remains incomplete. An additional attempt to close the source save dialog was blocked by browser security policy; it was not retried.

## Live avatar

The supplied `liveavatar.zip` is preserved under `vendor/liveavatar/`. Its original PNG/MP4 files are copied unchanged into `public/three/reference-studio/person/`. `public/liveavatar/liveavatar.js` adapts the avatar directly to the existing Verge3D scene: woman/man selection, packed-alpha video, PNG fallback, yaw-only orientation, foot grounding, contact/floor/wall shadows, and separate local preferences. Female reference height is 167 cm; male video reference is 183 cm. No additional renderer or dependencies are required.

The extension corrects the host engine's missing video sRGB decode define to preserve original media contrast. See `docs/liveavatar-verification.md` for actual desktop/mobile-viewport checks and the automated test boundaries.

## Korean interface

The active marketing pages, catalog, product details, search, cart, help and embedded configurator use Korean copy. Brand names, RAL color references and familiar technical labels such as 3D/PDF retain their original names. Prices are displayed in KRW using the pinned 2026-10-14 exchange rate; the original CHF calculations and saved configurations are preserved. See `docs/krw-pricing.md` for conversion and rounding details.

`src/locales/names.ko.json` contains display names for all 54 presets and 12 catalog products. Search matches both Korean and original English names. `src/locales/configurator.ko.json` supplies embedded UI translations at build time; captured source assets remain unchanged. `public/original-configurator/styles/korean.css` applies Hangul font fallbacks and word wrapping inside the ShadowRoot.

## Other pages

The marketing site, product list/detail, and informational pages are React reconstructions using public reference content and assets. They are not exact copies of every Shopify route. See `docs/IMPLEMENTATION-STATUS.md` for the distinction.

The earlier independent configurator prototype is unused. `src/Configurator.jsx`, `src/FurnitureScene.jsx` and its CSS are not imported by the active app.
