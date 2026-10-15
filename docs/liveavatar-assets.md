# Liveavatar original assets and integration measurements

The source pixel measurements below are unchanged. The current runtime adds a nominal 8 mm heel-seating drop while preserving the crown reference: female still `(1.67 + .008) / 1522`, female video `(1.67 + .008) / 671`, male `(1.83 + .008) / 585` metres per pixel, with `.008` subtracted from body placement. The whole avatar is then calibrated to the source furniture's nominal display dimensions rather than assuming world units equal physical metres. See `avatar-scale-calibration.md` for the measured conversion and current browser evidence.

The user supplied `/Users/jinsoolee/Downloads/liveavatar.zip`. The complete package is preserved in `vendor/liveavatar/`. README.md, APPLY-PROMPT.txt, StudioPerson.tsx and StudioPersonMotion.tsx were inspected before adaptation. Every one of the eleven `manifest.json` entries passed byte-count and SHA-256 verification on 2026-10-15. Source media were copied byte for byte; no original PNG or MP4 was re-encoded or edited.

| Runtime media | Bytes | SHA-256 |
| --- | ---: | --- |
| `ivory-linen-motion-packed.mp4` | 1,515,360 | `bba95de702eed1f0c54a2084e08bfd4b82adc141d02b43d067cde29b9594f6dc` |
| `ivory-linen-woman.png` | 1,441,608 | `879e6ab85c1499a23c24c0f44f4b5b9195481c6ba1b4f3ffe9b4d0988a573f63` |
| `male-motion-packed.mp4` | 1,275,923 | `7fe10e09fcbed4a13f5982b1e9f4cdd02ffad74ab13343104ffb0f522cd6088c` |
| `male-still.png` | 110,706 | `aaff5bbf43e5e601db52f30ff69bae20a702c5ba8cfe4eaac6dfbd4328108c8d` |

`public/liveavatar/male-foot-anchors.json` is also an exact byte copy of `vendor/liveavatar/src/components/three/display/male-foot-anchors.json` (SHA-256 `00996f4178a942e422ae385abe1fae59935bbc1e9f2fe43d4f21cc6b44f51e1a`). Its 361 anchors run at 24 fps and range from 588 to 598 pixels.

## Codec and packing

- `male-motion-packed.mp4`: H.264, yuv420p, 992 × 608, 24 fps, 361 frames, 15.041667 s. Each half is 496 × 608.
- `ivory-linen-motion-packed.mp4`: H.264, yuv420p, 896 × 672, 30000/1001 fps, 441 frames, 14.714700 s. Each half is 448 × 672.
- Each single frame contains RGB in the left half and a grayscale alpha mask in the right half. Use one video decoder/VideoTexture for both color and alpha, also for the silhouette shadow. Sampling must clamp inside the selected half with a half-texel inset so linear filtering does not leak the color/mask boundary.
- Both media have ordinary mobile-compatible H.264/yuv420p encoding. Actual autoplay remains subject to the browser; muted, defaultMuted and playsInline are required, with still fallback on rejection/error and reduced motion.

## Still and foot measurements

The images and unpacked first frames were inspected visually against a neutral background. Pixel boxes below use inclusive end coordinates.

- Female PNG: 1024 × 1536, alpha > 8 visible bbox x314..716, y3..1525. The original reference uses 167 cm over 1522 pixel height: `167 / 1522 / 100` m per pixel. Its image-plane center is x = `(512 - 515) * scale`, y = `(1525 - 768) * scale` above scene floor. The left toes end at y1507, the right toes at y1525. The source deforms the lower left ankle down by 18 px using `leftFoot = 1 - smoothstep(x, 550, 610)` and `ankle = smoothstep(y, 1440, 1507)`; retain this geometry correction while preserving all source image bytes.
- Female video: first frame alpha > 128 reaches y0..671, with left-foot sole near y663 and right-foot sole at y671. Use `1.67 / 671` m/px so the visible head-to-sole height is 167 cm, excluding transparent margins. Plane dimensions are `448 * scale` by `672 * scale`, with its center `(671 - 336) * scale` above floor. To keep both feet grounded, the still correction maps to video x240.625..266.875, ankle y630..659.3125, displacement 7.875 px (about 1.96 cm). The supplied original video component lacks this correction, so porting it literally leaves the left toes a little above the floor.
- Male PNG: 496 × 608, alpha > 8 visible bbox x160..333, y3..591. The first video frame matches that box; alpha > 128 is x161..332, y5..590.
- The supplied original male scale uses `(183 + 5) / (590 - 5)` cm/px then subtracts a legacy 5 cm drop. This intentionally places the sole 5 cm below zero. The new request requires floor contact, so remove the drop and use `183 / (590 - 5) / 100` m/px for a 1.83 m opaque-head-to-sole video reference height. Plane center y is `(footAnchor - 304) * scale + sceneFloor` and changes per frame. The PNG sole fringe ends at y591 and is grounded there; its opaque head at y5 is consequently 1.833128 m above floor, a 3.13 mm difference from the video reference.

## Shadow and upright behavior in the supplied source

- Contact shadows are procedural 64 × 64 RGBA radial alpha textures: `round(72 * max(0, 1-r)^2)` at each foot. The 15 × 11 cm planes sit 0.03 cm above floor. Multiply all sizes and floor offsets by 0.01 for meter-based scenes.
- Motion shadows sample the same packed alpha as the visible frame using a MeshDepthMaterial, alpha test 0.5 and double-sided rendering. The source enlarges the projected silhouette 1.10 times around ground height. Scene floor/wall must receive shadows and the casting light and shadow camera must cover the avatar.
- Upright billboard orientation uses yaw only: camera position is converted to root local coordinates, then `rotation.y = atan2(localCamera.x, localCamera.z)`. Do not use full camera quaternion or `lookAt` with elevated camera position; those tilt the person.
- Integration must retain the host scene's native vertical axis, scene unit, floor height, furniture, existing camera controls and background. The reference code is cm/Y-up; adapting these formulas is necessary if the host is m/Z-up.

## Verge3D video color correction

The preserved Verge3D 4.1.1 `map_fragment` contains an sRGB input conversion behind `DECODE_VIDEO_TEXTURE`, but the engine does not generate that define. PNG textures receive hardware sRGB conversion; video textures use RGBA8 and need the shader conversion. Without it, the final output conversion brightens already-sRGB video again, washing out hair and skin. The avatar extension enables that existing define on the visible video material only. Packed alpha and depth-mask sampling stay unmodified. No global exposure, furniture material, light or original media change is needed.

Browser and automated verification are recorded separately in `liveavatar-verification.md`.
