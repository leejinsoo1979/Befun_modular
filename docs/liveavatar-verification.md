# Live avatar verification — 2026-10-15

## Scope and implementation

The user-provided package's README and APPLY-PROMPT were read before adaptation. Their integration examples were treated as source material and adapted to the current native Verge3D application. The original media and anchor data remain byte-identical. The old white silhouette is hidden; its position remains the furniture-width anchor for the new avatar. No second WebGL renderer, React Three Fiber, or additional dependencies were introduced.

The host scene uses metres and Y-up. The avatar follows the actual `floorPlane.position.y` (observed −0.047835713217155906 m), rather than assuming floor zero. The original furniture, camera controls, lighting and background remain in the host scene. The avatar faces the camera using yaw only, casts native alpha-cutout floor shadows, has separate small contact shadows under both soles, and projects an alpha wall shadow using the existing directional light. It is held clear of the wall when the billboard rotates.

Female reference height, measured from visible head to sole, is 1.670000 m for both PNG and video. Male first-frame opaque video height is 1.830000 m. His PNG's faint sole reaches one pixel farther down; its grounded opaque-head height is 1.833128 m, within the requested approximate 183 cm. Frame-by-frame male foot anchors keep all 361 video frames at the host floor. Natural head motion does not imply a change in the person's configured scale.

The washed-out appearance came from the preserved Verge3D 4.1.1 engine omitting the `DECODE_VIDEO_TEXTURE` define even though its stock map shader contains that conversion. PNG input is decoded by the GPU; packed video RGB needs the shader decode. Enabling the existing define on visible video materials restores the original RGB contrast without changing media, global exposure, furniture or lights. Alpha masks are not color-decoded. The source video's individual RGB halves remain 448×672 (woman) and 496×608 (man), so enlarging them cannot add source detail.

## Actual browser checks

Performed in the Codex in-app Chromium browser against `http://127.0.0.1:5186/en/pages/konfigurator`, through the real React wrapper, iframe, source Vue UI, native Verge3D renderer and HTML video decoder.

| Check | Observed result |
| --- | --- |
| Desktop 1440×1000 | Woman/man buttons switch the real scene avatar. The original furniture and source control panel remain visible. |
| Video color | Hair/skin contrast restored after the video sRGB fix; compared against the provided PNG and an original video RGB frame. |
| Playback | Video `readyState=4`; woman's playback time advanced from 0.059244 s to 10.090332 s on the 390 px layout. Male playback also advanced through several timestamps. |
| Rotation | Actual canvas drag changed male yaw from +0.297995 rad to −1.033282 rad, with world pitch=0 and roll=0. The person remained upright and both soles stayed on the floor. |
| Zoom | Actual canvas wheel zoom changed rendered size/framing. Avatar playback, floor contact and yaw-only orientation continued. |
| Feet | Browser diagnostics calculated female video sole error 0.311103 mm, female PNG error approximately 0, and male video error 0. This is supplemented by actual mesh tests below. |
| Shadows | Visible wall silhouette and floor/contact shadows were observed in desktop and mobile views; native cast-shadow and wall-shadow flags remained enabled while switching, rotating and playing. |
| Mobile layout | Document and iframe widths both measured 390 px, viewport height 844 px. The source application's mobile controls appeared. Avatar controls stayed inside the viewport (right edge 378 px). Both genders played and the Motion toggle switched to the supplied still. |
| Playback failure | A query-gated local test replaces the video URL with an unavailable media resource. The actual browser media load failed and the original PNG appeared automatically, with feet and wall shadow retained. This is not a simulated `playing` event. |

The responsive browser check does not establish iPhone/iPad Safari hardware behavior. Muted/defaultMuted, autoplay and both inline-playback attributes are present; actual iOS hardware was not available. Browser save/cart/purchase flows are separate from this avatar task and are not established by these checks.

## Automated checks

`npm test`: 17 checks passed. The avatar tests execute the installed extension with the actual captured Verge3D CPU scene graph and geometry classes. Image/video I/O and the UI boundary are stubbed, so these tests complement the real-browser media checks rather than replacing them.

- Original four media files and male foot anchors match the supplied bytes/hashes.
- Actual rendered triangle interpolation places the woman's two soles within 1 mm of a nonzero floor and verifies both female reference heights.
- All 361 male video frames meet the floor; male PNG and video height measurements are explicit.
- Actual material compile hooks, engine shader chunks and enabled preprocessor branches round-trip ten original 8-bit source channel values through sRGB decode/output conversion; depth masks have no video color decode.
- Yaw-only orientation follows camera movement and floor-height changes.
- Video error, autoplay rejection, reduced-motion preference, gender/resource disposal, page cache restoration and separation from furniture storage are exercised.

`npm run build` passed; the generated local configurator retains the startup-orbit removal. Vite reports its existing large-chunk advisory for the surrounding site's main bundle.

## Evidence

- `qa/liveavatar/female-desktop-corrected.jpg`
- `qa/liveavatar/male-desktop-corrected.jpg`
- `qa/liveavatar/male-orbit-corrected.jpg`
- `qa/liveavatar/female-mobile.jpg`
- `qa/liveavatar/male-mobile.jpg`
- `qa/liveavatar/video-error-mobile-fallback.jpg`
- `qa/liveavatar/final-desktop.jpg` (normal route restored, video active, no browser console errors)

Earlier screenshots without `corrected` in the desktop names predate the color fix and are retained as comparison evidence.

## Follow-up: level front view and unrestricted orbit

The source camera's `orbitMaxPolarAngle=1.355597` rad (77.67°) forced a downward view, at least 12.33° above a horizontal front view. Its world up was already Y and its actual roll was zero. Rewriting Euler `rotation.z` would not fix that constraint.

The separate camera extension expands polar angle to 0..π and horizontal angle to ±Infinity, preserving the original camera/target/up/zoom. After a normal reload, the source's existing front framing reaches 90°. Actual browser canvas drags then reached `cameraPolar=2.0013699401653477` (114.67°) and `cameraAzimuth=2.7965622447533227` (160.23°). Video remained readyState 4, avatar world pitch/roll remained zero and female foot error remained 0.311103 mm.

`tests/camera-controls.test.js` adds three real-engine CPU tests for the old clamp, full-range rotation, unchanged framing and lifecycle. The complete automated suite now has 20 checks. Browser evidence: `qa/liveavatar/camera-front-unlocked.jpg`, `camera-below-unlocked.jpg`, and `camera-back-unlocked.jpg`.
