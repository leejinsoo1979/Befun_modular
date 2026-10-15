# Implementation status

## Avatar nominal-scale and heel-contact correction

The original furniture uses internal row heights of 41 world cm while displaying 38 cm. The earlier avatar-only 167/183 cm tests missed that mismatch. The current native extension measures visible frame geometry and divides its floor-to-top height by the source's displayed height; the avatar, foot contacts and wall projection share that uniform conversion. Reproduced 157/195 cm configurations measured factors 1.0822639833021424 / 1.081617668607366. The user-requested 8 mm downward seating adjustment applies to both genders and PNG/video, with crown reference heights maintained and the floor/contact-shadow planes retained. See `avatar-scale-calibration.md`; earlier avatar scale/zero-toe-error entries below describe the earlier implementation.

## 2026-10-15 revision after visual feedback

The first pass incorrectly substituted a custom React UI and a procedural Three.js model for the original configurator. It used real public catalogue and template data but **did not match the original UI or rendering**. It is retained as an unused prototype in `src/Configurator.jsx` and `src/FurnitureScene.jsx`; those files are not imported by the active app.

The active route now uses `src/OriginalConfigurator.jsx` and an isolated local frame loading the original public UI bundle, Verge3D 4.1.1 runtime, and glTF scene. Models, materials, HDR environment, lighting, controls, layout and configuration calculations therefore come from the source assets. Original runtime SHA-256 values and URLs are recorded in `public/original-configurator/manifest.json`.

The local adapter is separate from the original source. It routes public template GETs to the downloaded responses and handles saves/cart operations in browser storage. Original store accounts, emails, payments, product creation, and checkout are not connected. Outbound service requests are restricted by the frame's CSP and fetch adapter.

The surrounding marketing site remains a React reconstruction using original public images/fonts/videos and content. It is not an exact source mirror of every Shopify page.

## Verification after replacement

- Original UI bundle, Verge3D runtime and scene match their recorded source SHA-256 values.
- 169 local asset files pass hash verification. The 54 captured API JSON responses were losslessly reserialized; manifest records both captured-response and stored-file hashes.
- Browser: original quick-start gallery, actual default scene, petrol template at 152 × 81 × 40 cm, CHF 1163 / CHF 872.25, original chrome/scene materials and front animation observed.
- Nine automated checks pass, including no outbound original-store API writes through the local boundary.
- Full save/cart/mobile/browser flow remains unverified. The browser security policy blocked a subsequent save-dialog-close action; no workaround was attempted.
- Source UI share/PDF/email links use the embedded frame location. The local clipboard adapter normalizes shared URLs, but PDF/email links and pickup/delivery options still require completion and verification.

## Startup motion preference

The startup camera jump and 3.2-second full orbit are disabled in the active generated runtime. `scripts/prepare-configurator.mjs` changes only `Sj` from `Gn(),sa(),jX(),WX(3200,e)` to `Gn(),sa(),e==null||e()`. The downloaded reference bundle, engine, scene, manual orbit controls and door animation code are preserved. An isolated execution check confirmed final framing, ready callback, preloader and history reset; the production build also passed. Subsequent avatar browser checks loaded the stationary initial framing and exercised manual orbit and wheel zoom.

## User-supplied live avatar

The white reference silhouette is replaced by the original supplied photoreal woman/man PNG and packed-alpha MP4, with native Verge3D integration and separate avatar controls. Media bytes are unchanged. Female reference height is 167 cm; male video is 183 cm (grounded PNG approximately 183.31 cm). The video-only washed-out color was corrected by enabling the existing shader's missing sRGB input decode define. Furniture, camera, lighting and background remain in the original scene.

Desktop and actual 390×844 responsive browser checks cover gender switching, real video progress, motion/still switching, orbit, zoom, upright orientation, foot contact and wall/floor shadows. A deliberately unavailable video exercises the browser's automatic PNG fallback. All 17 automated checks pass, including original asset hashes and frame-by-frame male grounding. See `liveavatar-verification.md` for evidence and limits, including the distinction between a Chromium mobile viewport and physical iOS Safari.

## Camera orbit and horizon limit

The source scene caps polar angle at 77.67°, preventing a level 90° front view and producing the reported downward view. `camera-controls.js` now sets the existing controller's polar bounds to 0..π/2 and azimuth bounds to ±Infinity, with turnover disabled, also updating its camera metadata so rebuilding controls retains the range. It does not rewrite camera position, up, target, zoom or renderer. Normal orbit controls retain their numerical pole protection and upright orientation.

Before the requested horizon limit was added, browser drags reached 90° front, 114.67° below and 160.23° around the back. Those below-horizon views are now blocked. Avatar world pitch/roll stayed zero with playing video and foot contact. Tests use the actual Verge3D OrbitControls to verify that 89° and 90° remain reachable while 105/135/179° requests clamp to 90°. Real mouse-event tests check the limit with and without damping and verify that upward rotation remains available. Pan, cursor-anchored zoom, control replacement and page lifecycle checks are retained. Current visual browser verification of the new limit remains unavailable because the browser tool is disconnected.

## Space camera shortcut

Space resets orbit, pan and zoom to a level front view centered horizontally on the current furniture, with the selected person beside it. The initial view uses the same framing once the furniture, visible person media and scale calibration are ready. The generated app exposes native framing, `p4()` fitting, furniture bounds, load readiness and an automatic-framing subscription through `BefunCameraFraming`; no furniture state or history is reset. The camera extension clears native inertia, restores a level +Z front view, and retains the furniture's horizontal center while vertically centering the combined furniture/person height. The approved reference targets roughly 50% canvas width for the cabinet and 70% canvas height for the full person plane, with a 90% safety envelope for larger combined bounds. Visible person meshes and their calibrated scale are measured without including wall/floor shadows. The next billboard yaw is also enclosed. Initial fitting runs once and does not overwrite a view the user has already moved. Same-origin parent forwarding supports keyboard focus outside the iframe. Text entry, native interactive controls, IME composition, modifier shortcuts and modal input are excluded.

Dimension sliders previously called `sa()` and fitted only the furniture, cropping the person when shrinking a design. Automatic normal framing now delegates to the same joint front view once initialized, while native `sa(true)` ruler/export fitting retains its original path. The native delegate is separate to avoid recursive framing. A single follow-up after 250 ms includes the avatar's updated side position and 200 ms scale-calibration cycle; new manual camera input cancels that follow-up. The maximum dolly distance expands only when needed to fit a wide design on a narrow viewport. Actual engine tests cover repeated width/height growth and shrinkage, the reference proportions, portrait framing beyond the source distance ceiling, loading fallback, manual-input cancellation, subscription cleanup, pending inertia, female/male media, startup and iframe origin checks. Browser visual verification remains unavailable because the UI tool has no connected browser.
