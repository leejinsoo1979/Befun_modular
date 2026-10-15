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

The separate `camera-controls.js` extension removes the source camera's 77.67° vertical cap. It allows a level 90° front view, full horizontal orbit, and vertical orbit from pole to pole while retaining the original camera, target, zoom and controls. The avatar continues to use yaw-only orientation.

The original UI and scene loaded in the browser; the first petrol template restored at 152 × 81 × 40 cm and CHF 1163 / CHF 872.25. Further save/cart browser verification remains incomplete. An additional attempt to close the source save dialog was blocked by browser security policy; it was not retried.

## Live avatar

The supplied `liveavatar.zip` is preserved under `vendor/liveavatar/`. Its original PNG/MP4 files are copied unchanged into `public/three/reference-studio/person/`. `public/liveavatar/liveavatar.js` adapts the avatar directly to the existing Verge3D scene: woman/man selection, packed-alpha video, PNG fallback, yaw-only orientation, foot grounding, contact/floor/wall shadows, and separate local preferences. Female reference height is 167 cm; male video reference is 183 cm. No additional renderer or dependencies are required.

The extension corrects the host engine's missing video sRGB decode define to preserve original media contrast. See `docs/liveavatar-verification.md` for actual desktop/mobile-viewport checks and the automated test boundaries.

## Other pages

The marketing site, product list/detail, and informational pages are React reconstructions using public reference content and assets. They are not exact copies of every Shopify route. See `docs/IMPLEMENTATION-STATUS.md` for the distinction.

The earlier independent configurator prototype is unused. `src/Configurator.jsx`, `src/FurnitureScene.jsx` and its CSS are not imported by the active app.
