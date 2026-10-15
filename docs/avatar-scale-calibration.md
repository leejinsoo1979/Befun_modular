# Avatar size relative to the source furniture

## Correction after the user's 157 / 195 cm comparisons

The original integration treated one internal scene unit as one physical metre. Its earlier avatar-height tests verified only the avatar itself and did not establish a correct comparison with the furniture's displayed dimensions. Those earlier size claims were incomplete.

The captured source positions a standard row at 0.41 world units while displaying it as 38 cm. Its frame/leg geometry and displayed base dimensions also differ. Keeping the original furniture requires measuring the current assembly rather than applying a fixed global multiplier.

`avatar-calibration.js` reads the original selectable mesh's existing `userData.cell` reference. It collects visible frame models from each cell's frame map, includes connector leg children, deduplicates shared parts, and excludes selection overlays, avatars and shadows. The source class's `getHeight()` supplies the same nominal height used by its UI. The world conversion is:

```
worldUnitsPerNominalMetre =
  (actualFrameBounds.max.y - existingFloorWorldY) /
  (sourceNominalHeightCm / 100)
```

The avatar root uses that uniform scale, so its proportions, foot contacts and wall projection share the same conversion. Measurements refresh every 0.2 seconds when the configuration changes. Furniture geometry, renderer, camera, target and background are not rescaled or replaced.

## Actual native-scene measurements

Reproduced through the original UI sliders in the browser at 77 cm width and 40 cm depth:

| Source display height | Frame top Y | Existing floor Y | World height above floor | World units per nominal metre |
| ---: | ---: | ---: | ---: | ---: |
| 157 cm (4 rows) | 1.6513187405672076 | −0.047835713217155906 | 1.6991544537843635 | 1.0822639833021424 |
| 195 cm (5 rows) | 2.0613187405672075 | −0.047835713217155906 | 2.1091544537843636 | 1.081617668607366 |

Thus the old uncalibrated 1.67 / 1.83 world-height references were approximately **154.3 / 169.2 cm** against these displayed furniture heights. After calibration, the female crown reference is **167 cm** and male first-frame video reference is **183 cm**. The PNG's one-pixel sole fringe makes the male static opaque-head reference approximately **183.314 cm**. Video pose changes can naturally move the head from its first neutral-frame reference.

## Requested heel seating adjustment

The user then requested a small downward adjustment so the photographed heels look seated on the floor. Both genders and both media modes use a nominal **8 mm** seating drop. The body scale includes that 8 mm before placement is lowered, retaining the 167 / 183 cm crown references. Contact-shadow planes stay at the original floor + 3 mm (in nominal units); the existing floor itself does not move. The wall silhouette follows the body and remains clipped at the floor.

Current scale/placement formulas use `(referenceHeight + 0.008) / sourcePixelHeight` and subtract `0.008` from the local body placement. The measured source toe endpoint is intentionally 8 mm below the floor baseline, multiplied by the current calibration factor. This is a visual seating adjustment of a photographic billboard; it is not an anatomical 3D heel-coordinate measurement. Diagnostic `footError` includes this intentional toe inset; `heelContactDropMetres` records the requested 0.008 value explicitly. Original PNG and MP4 bytes remain unchanged.

## Verification

- Actual browser controls reproduced the user's 77 × 157 × 40 and 77 × 195 × 40 configurations, switched woman/man and video/still, and confirmed calibration, upright orientation and native shadows.
- `tests/avatar-calibration.test.js` uses the actual captured Verge3D CPU engine, checks source nominal/world differences, excludes oversized selection overlays, handles duplicate frame parts and leg children, and verifies reconfiguration and invalid data.
- Runtime tests use original glTF connector/leg bounds and execute the actual avatar extension. They verify applied root scale, female PNG/video 167 cm, male first-frame video 183 cm, all 361 male toe anchors at the requested seating offset, contact-shadow floor placement, camera preservation and configuration/media transitions.
- Browser metrics and screenshot evidence are under `qa/liveavatar/`. The four current seating views are `female-167-vs-157-heel-contact.jpg`, `male-183-vs-195-heel-contact.jpg`, `female-still-heel-contact.jpg`, and `male-still-heel-contact.jpg`.

The earlier `*-calibrated.jpg` files precede the final 8 mm seating adjustment. They are retained as comparison evidence.
