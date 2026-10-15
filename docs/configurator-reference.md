# Flexcube configurator reference observations

Checked on 2026-10-15 (Asia/Seoul). This document records public reference behavior/data for an independently implemented local configurator. No executable source bundle, Verge3D model, private service, user account, cart, order, or checkout is copied or modified by this research task.

## Sources and extraction boundary

- Public page: <https://flexcube.ch/en/pages/konfigurator>
- Public Shopify application bundle data: <https://flexcube.ch/cdn/shop/t/5/assets/configurator.js?v=59525409401430670271791791437>
- Public read-only template endpoint, example: <https://configurator-api.flexcube.ch/v1/configurations/302d3e5660ee8a13055efdd680dfa1e3354c3649>
- The page creates an open shadow root in `#app-container`, mounts a Vue application, and loads a Verge3D scene. Shopify header/footer surround this application. This explains why simple page text extraction does not reveal its controls.
- The public bundle was downloaded only to `/tmp/flexcube-research/` for inspection. Only its data constants were transformed into local JSON; no source execution functions or proprietary meshes were retained in this workspace.
- All 54 preset configuration IDs explicitly listed in the public template gallery were fetched with GET. No list of private user configurations was requested.

## Local data files

| File | Contents |
|---|---|
| `src/data/configurator-templates.json` | 54 templates in gallery order, including all 54 successfully fetched module layouts, public BOMs, stored gross CHF prices, dimensions, names in EN/DE/FR, colors, and image references. |
| `src/data/configurator-catalog.json` | 219 named article rows with SKU, item code when available, translated name, price, and weight when available. An unnamed delivery row with price 0 was excluded; configured delivery is CHF 98. |
| `src/data/configurator-options.json` | Market settings, colors, frame finishes, styles, module size units, front enums, handles, leg types, accessories, and nominal display dimension rules. |
| `src/data/configurator-labels.json` | Public UI labels, organized under the original data keys for structure/functions/colors/accessories/overview and toolbar/mobile UI. |

A template record has `id`, `category`, `width`, `depth`, `height` (display centimetres), `img` (`1x`/`2x`), `colors`, `name`, `referenceConfigId`, `price`, `currency`, `configuration`, `articles`, and `referenceImage`. Reference IDs are informational and are not a remote save integration.

The eight gallery categories have 7 Sideboards, 7 Lowboards, 6 Chests of drawers, 7 Shelves, 6 Wardrobes, 7 Corner sideboards, 6 Containers, and 8 Reception desks. This totals 54.

## Saved configuration schema

The top level includes:

```text
configuration = {
  cabinet, doubleCabinet, frameColor,
  panelColor, frontPanelColor, backPanelColor, individualPanelColor,
  frontDepth, backDepth, cornerDepth?,
  legsType, softClose, withOneKey,
  backBarRemoved, frontBarRemoved, cabinetMode, editMode
}
```

`cabinet[column][row]` contains ordinary and corner furniture. Columns are serialized from the rightmost column towards the left; rows run from bottom to top. Cells preserve `position` in metres and their internal `width`, `height`, `depth` in centimetres. Some templates combine 41/77.5 widths and 20/41 heights. Do not reconstruct these templates from a single uniform width and height.

A cell record includes:

```text
{
  position:[x,y,z], type, width,height,depth,
  box:{0:{visible,color}, ... 5:{visible,color}},
  frame:{0:{visible}, ... 11:{visible}},
  frontColor, flap, drawer,
  glassSingleDoor, glassDoubleDoors,
  metalSingleDoor, metalDoubleDoors,
  accessoryInfo, isFlipped, effectiveType?
}
```

The box keys identify **world-axis sides**: 0 left, 1 right, 2 top, 3 bottom, 4 back, 5 front. A shared panel may appear in both neighboring cell descriptions; geometry/BOM creation must deduplicate by its plane and extent. Hidden panels are explicit data and must be respected. `null` front insert values mean absent; numeric **0 is a valid insert enum** and must not be treated as absent.

Cell types: 0 turned, 1 corner, 2 front, 3 back. Front-facing cells open toward +Z, back-facing cells toward -Z, and turned cells toward the X direction. `effectiveType` and `isFlipped` further select the opening face in corner or flipped configurations. Side/bottom panel positions and accessory orientation need this distinction.

`doubleCabinet[column][face][row]` stores paired front/back columns for bilateral furniture. No gallery preset currently uses bilateral mode; its schema is present in public application data but was not behaviorally exercised in this research subtask.

Front enum data (current bundle):

| Property | Values |
|---|---|
| `flap` | 0 downRing, 1 downHandle, 2 upLock, 3 upRing, 4 upHandle |
| `drawer` | 0 singleRing, 1 singleLock, 2 singleHandle, 3 doubleRing, 4 doubleHandle, 5 doubleLock |
| `glassSingleDoor` | 1 right, 2 left; `glassDoubleDoors` is boolean |
| `metalSingleDoor` | 0 leftRing, 1 rightRing, 2 leftLock, 3 rightLock, 4 leftHandle, 5 rightHandle |
| `metalDoubleDoors` | Numeric handle variant; preserve the saved value until rendered behavior is verified. |

Some stored template labels describe a down flap while their historical serialized numeric value maps to an up flap in the current bundle. Preserve saved data, but compare current browser behavior before claiming every historical insert has been reproduced exactly.

`accessoryInfo` contains booleans `shelfTop`, `shelfBottom`, `brochureHolder`, `penTrayTop`, `penTrayBottom`, `fileCabinet`, `hangers`, plus numeric `StackableTraysTop`, `StackableTraysBottom`, and optionally corresponding `...Right` quantities.

## Units and dimensions

Internal assembly dimensions and display dimensions intentionally differ:

| Internal cm | Nominal display cm |
|---:|---:|
| 77.5 | 75 |
| 41 | 38 |
| 20 | 20 |
| 19 | 19 |
| 6 | 6 |

For straight single-sided furniture:

- Display width = 2 + sum of nominal column widths.
- Display height = 2 + base height + sum of nominal row heights; legs base height is 3 cm, castors base height is 9 cm.
- Display depth = 2 + nominal depth; internal depth 41 therefore displays 40 cm.
- Bilateral depth adds nominal front and back depths before the 2 cm correction.
- Corner depth/width sum the relevant perpendicular branch dimensions.

Thus a 3-column, 2-row furniture with standard 77.5×41×41 internal cells and legs displays **227×81×40 cm**. A two-column version displays 152×81×40 cm. Keep these labels separate from internal metre positions used by the mesh.

The public implementation uses 1 cm for its frame-part radius and 2 cm for its panel-size correction. These are scene construction values; the article catalogue identifies physical panels as 193/375/750 mm. Do not infer fabrication-ready dimensions from the WebGL scene parameters.

## Options and interaction scope

- Structure styles: single-sided, double-sided, corner.
- Functions: open; open with back; open with sides; open with back and sides; closed; flap up/down; drawer/double drawer; metal single/double doors; glass single/double doors; advanced panel/bar removal.
- Handles: hole/ring, handle, handle with key. One-key setting and global drawer soft close are separate settings.
- Color application modes: all, back, front, individual selected part.
- Standard panel colors: black `#000000`, white `#ffffff`, taupe `#937a76`, light grey `#c5c4c0`, grey `#797a7f`, mint `#84aeac`, petrol `#356071`, red `#7f0000`, olive green `#6F6D4E`, plus glass.
- Frame finishes: chrome `#fefefe`, black `#252425`, copper `#f1bb9f`.
- RAL colors are exposed separately with a 30% surcharge and a maximum of two distinct RAL colors in a configuration.
- Accessories: clothes rail, brochure holder, flat drawer, pen tray, stackable tray, file cabinet insert. Some support top/bottom/both levels and quantities.
- Toolbar labels include templates, undo, redo, start new, hide/show fronts, open/close fronts, measurements, zoom out, save PDF, export 3D model, article list, weights list.
- Historical application undo state retains up to ten commits.

## Pricing observations and independent implementation guidance

Swiss market: CHF, VAT included, tax rate 8.1%, SME discount 25%, assembly 15%, optional standard delivery CHF 98. These values are public market configuration, not a quote guarantee.

The independent pricing model can use the observed rules:

1. Build a bill of materials from **unique physical parts**, including shared tubes/connectors/panels, selected insert mechanisms, handles, accessories, feet/endcaps, tool kit, and any anti-tipping set.
2. Sum `article.price × count` using the catalogue. The gross furniture sum excludes assembly.
3. If any visible metal panel/front uses a RAL color, add 30% to the entire furniture sum. This is not limited to the colored panel line.
4. Optional assembly is 15% of the RAL-adjusted furniture gross sum.
5. The discounted total is furniture gross × 0.75 + assembly; optional delivery is handled separately.
6. The displayed net value before a discount is gross total ÷ 1.081 for CH.
7. Round currency amounts to two decimals at the displayed total stages.

Current bundle special case: double glass doors cost CHF 140 with black/copper frame, replacing their base CHF 150 price. Black/copper bars, connectors, grips and feet have their own catalogue prices, so one finish multiplier cannot exactly model every configuration.

Feet and endcaps are sold as sets of two: each quantity is `ceil(unique floor leg locations / 2)`. The anti-tipping set is omitted for castors or furniture below 80 cm; otherwise its quantity is at least one and increases with width. The tool kit is one item. Connector type depends on the number of attached **horizontal** bars at that junction (1/2/3/4), with vertical tubes not incrementing this number.

Standard-colour pricing checkpoints from the public saved templates:

| Template | Gross CHF | Example geometry |
|---|---:|---|
| sideboard-1 | 1163.00 | 152×81×40, 2×2, petrol, 2 flaps, chrome |
| sideboard-3 | 1517.00 | 152×81×40, 2×2, white, 4 flaps, chrome |
| lowboard-1 | 845.00 | 152×43×40, 2×1, light grey, 2 flaps |
| container-3 | 583.50 | 40×63×40, 1 column, mixed height, white |
| container-4 | 785.50 | Same named type, black chrome frame |

Catalogue sum matches the stored gross price for **51 of 54** preset BOMs exactly. The three exceptions use legacy door SKUs no longer listed in the current bundle: `garderobe-5` (`1050320500001`, `1050320500002`), `ecksideboard-1` (`1050320800002`), and `ecksideboard-4` (`1050320700002`). Their stored prices remain in the template records. Do not silently report missing legacy line items as zero. Differences imply single-door CHF 75 and double-door CHF 150 in these historical BOMs, but those reconstructed unit prices were not added as confirmed-current catalogue rows.

The root browser investigation observed the initial 3×2 open black/chrome configuration at 227×81×40 cm and CHF 1152 gross. This observation is supplied by the root task and should be checked against the local initial configuration.

## Unverified boundaries

- This research validates publicly available data, not all pointer actions or current 3D appearance. Root browser QA owns visual and interaction verification.
- A template's saved gross price/BOM can predate current application logic; current dynamic edits need independently computed pricing and comparisons.
- Public service ordering, saving, account association, and cart/checkout were not exercised. Local save/share/PDF/cart flows must remain local until a backend is deliberately implemented and authorized.
- A locally rendered mesh and dimensions are not certified engineering geometry, manufacturing drawings, or a production order specification.

## Local pricing implementation and verification

`src/pricing.js` exports `calculatePrice(config)` and `sumCatalogArticles(bom)`. The first consumes the local model shape, generates shared-part BOMs for straight rectangular furniture, and returns `{gross, net, vatExclusive, estimated, source, articles, reason?}`. For compatibility with the local model, `net` means the SME discounted **VAT-included** total; actual VAT-exclusive total is `vatExclusive`.

An unmodified configuration with `referencePrice` uses that captured price and returns `source: "reference"`. The caller must remove `referencePrice` on every material edit; otherwise no pricing engine can know the capture is stale. Straight structures without that field generate SKU quantities for frame members, connectors, panels, supports, front mechanisms, handles, legs/endcaps, kit, and anti-tipping set. They do not use finish multipliers.

The independently generated checks cover the initial open 3×2 CHF 1152, 2×2 flap CHF 1517, lowboard flap CHF 845, mixed-height narrow drawer CHF 583.50, and the same drawer fixture with black frame CHF 785.50. The six Node tests also inspect changed part counts and preserve the 51-exact/3-missing distinction for all 54 captured preset BOMs.

Corner/bilateral layouts, arbitrary custom colors, unsupported mechanism sizes/depths, and glass clip counts return `estimated: true` with a reason. Captured reference prices remain exact historical snapshots even where a local edited model cannot reconstruct all of that template's hidden panels/accessories. The simplified local model currently does not preserve every source template mechanism, accessory, flipped orientation, or hidden panel flag; editing a captured template can therefore require richer model metadata before its regenerated BOM matches that source template fully.
