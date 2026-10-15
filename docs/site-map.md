# Flexcube public reference audit

Observed on 2026-10-15 (Asia/Seoul) by read-only public HTTP requests. Source: <https://flexcube.ch/en>. This is an implementation-target inventory, not a claim that every target is already implemented. The configurator itself is documented by the separate configurator research task and is excluded here.

## Global navigation and shared UI

The primary desktop navigation contains Shop, SME Services, Inspiration, Configurator, and More. Shop is a hover mega menu with `/en/collections/alle-bestseller` as its landing target. SME Services is a hover mega menu with `/en/pages/b2b-hub` as its landing target. More has `/en#` as its summary target and is a menu, rather than a separate content page. Mega-menu items are lazy loaded in the original theme, so the initial home HTML contains placeholders for some of their contents.

Shared header: 70 × 36 px stacked FLEX/CUBE SVG logo; transparent white logo/navigation over the home hero, black logo on light pages; country/language controls; search; account; cart count. Original account target is an external Shopify account domain. Replication should provide the intended local account experience without routing a clone to the original site's account or checkout.

The original has search and cart drawers, a mobile navigation drawer, sticky header behavior, product quick-view drawers, and a floating live-chat control. These are distinct interactions in addition to page navigation.

## Target routes

| Family | Public route | Reference content / observed status |
| --- | --- | --- |
| Home | `/en` | Full-height video hero; press quote; four expanding benefit panels; feature collage; service video; eight category cards; reviews; community gallery; logos; services; contact CTA. HTTP 200. |
| Shop | `/en/collections/alle-bestseller` | “All bestsellers”; rating badge; category carousel; four-column desktop / two-column mobile product grid. HTTP 200. |
| Shop | `/en/collections/sideboards` | Sideboards; shared collection template plus category editorial text. HTTP 200. |
| Shop | `/en/collections/lowboards` | Lowboards. HTTP 200. |
| Shop | `/en/collections/kommoden` | Chests of drawers. HTTP 200. |
| Shop | `/en/collections/regale` | Shelves. HTTP 200. |
| Shop | `/en/collections/tische` | Tables. HTTP 200. |
| Shop | `/en/collections/container` | Pedestals. HTTP 200. |
| Shop | `/en/collections/empfangstheken` | Reception desks. HTTP 200. |
| Shop | `/en/collections/garderoben` | Wardrobes. HTTP 200. |
| Shop | `/en/collections/ecksideboard` | Corner sideboard. HTTP 200. |
| Shop | `/en/collections/sale` | Sale. HTTP 200. |
| Product detail | `/en/products/:handle` | Gallery; rating; title; regular and SME discount prices; availability; dimensions/color; Add to cart; Configure; feature/detail/FAQ/review sections. Representative route below is HTTP 200. |
| Inspiration | `/en/pages/inspiration` | “Inspiration for modern work and business environments”; category tabs; styled interiors; furniture/product lists; “Your look to recreate”; reference project dialogs. HTTP 200. |
| SME landing | `/en/pages/b2b-hub` | “Office furniture for companies with vision”; planning/references CTAs; six benefits; sectors; planned office references. HTTP 200. |
| Office planning | `/en/pages/bueroplanung` | Free 3D office planning; mixed German/English original content; four-step process; visualization/floor plan/quote; inquiry form. HTTP 200. |
| SME conditions | `/en/pages/kmu-sonderkonditionen` | “Benefit from our special conditions for SMEs”; 25% SME discount; conditions; service benefits; inquiry CTA. HTTP 200. |
| Installments | `/en/pages/leasing` | Financing/office furniture offers; per-month examples; consultation CTA. HTTP 200. |
| Delivery | `/en/pages/lieferung-montage` | Delivery and installation; pickup/delivery/assembly cards; PDF instructions; assembly videos; showroom. HTTP 200. |
| Showrooms | `/en/pages/showrooms` | Switzerland / Germany switches; opening hours; addresses; map links; showroom imagery. HTTP 200. |
| About | `/en/pages/ueberuns` | “ABOUT FLEXCUBE”; brand story; furniture system values; “FROM SME TO SME”. HTTP 200. |
| Contact | `/en/pages/kontakt` | “We look forward to seeing you!”; name/email/phone/topic/message form; contact details; showroom block. HTTP 200. No form was submitted. |
| FAQ | `/en/pages/faq` | Topic groups with question/answer accordions, including system, USM benchmark, configuration, delivery and service. HTTP 200. |
| Promotion | `/en/pages/aktion` | Footer label “Get a CHF 50 Voucher”. Public GET returned HTTP 503 during this audit; body not verified. |
| Blog | `/en/blogs/artikel` | Footer label “Blog”. Public GET returned HTTP 503 during this audit; body not verified. |
| Return policy | `/en/pages/rueckgaberichtlinien-widerruf` | Return Policy & Cancellation. HTTP 200. |
| Privacy | `/en/pages/datenschutz` | Privacy Policy. HTTP 200. |
| Imprint | `/en/pages/impressum` | Footer label “Imprint”. Public GET returned HTTP 503 during this audit; body not verified. |
| Shipping policy | `/en/policies/shipping-policy` | Shipping policy linked from cart. HTTP 200. |
| Search | `/en/search` | Search page, plus shared predictive search drawer. HTTP 200. |
| Cart | `/en/cart` | Cart page plus shared cart drawer. HTTP 200. Read only; no original-store cart mutation. |

Representative verified product: <https://flexcube.ch/en/products/kommode-in-hellgrau-mit-6-schubladen>. Title: “Light grey chest of drawers with 6 drawers”. Dimensions: 227 × 40 × 101 cm. Observed regular price CHF 2,437.00 and displayed SME price CHF 1,827.75. Availability and prices are a captured reference, not live commerce guarantees.

The footer also links to three `flexcube-dev-store-13-11-25.myshopify.com/pages/...` destinations (`modulmoebel`, `schreibtische`, `moebel-konfigurator`). They are existing external links in the original markup, not verified production content targets. Social links: Instagram and Pinterest. Contact actions include `tel:` and live chat.

## Exact brand typography and dimensions

Values below are extracted from the original page's CSS settings and downloaded public `theme.css`. A 16 px root size is used for the pixel conversions.

| Token / element | Exact reference |
| --- | --- |
| Heading family | `Jost, sans-serif` |
| Heading style | Normal; weight `400`; line-height `1`; letter-spacing `-0.03em` |
| Body | Jost, normal, weight `400`, line-height `1.2`, letter-spacing `0` |
| Navigation | Jost; weight `400`; `clamp(1rem, 0.748rem + 0.3174vw, 1.25rem)` |
| Buttons | Jost; weight `400`; `clamp(1rem, 0.8115rem + 0.1587vw, 1.125rem)` |
| Product titles | Jost; base product scale `clamp(1rem, 0.873rem + 0.3175vw, 1.25rem)`; card title uses medium `500` |
| Large section title | Default `clamp(40px, 3.368vw, 64px)`; at viewport ≥ 1024 px `clamp(48px, 4.73vw, 90px)` |
| Medium section title | `clamp(32px, 3.368vw, 64px)` |
| Eyebrow | Weight `400`, uppercase, letter-spacing `0.25em`, small fluid font scale |
| Brand text | `#171717` |
| Main surfaces | `#ffffff` and `#f2f2f2` |
| Accent from home section | `rgb(224 165 128)` / `#e0a580` |
| Page width | `1460px` |
| Page horizontal padding | <1024 px: `20px`; ≥1024 px: `36px`; ≥1280 px: `48px`; ≥1536 px: `max(48px, 50vw - 730px)` |
| Pill button radius | `3.75rem` / `60px` |
| Button border | `2px` |
| Input radius | `0.375rem` / `6px` |
| Card/block radius | `clamp(10px, 1.053vw, 20px)` |
| Icon stroke | `1.5px` |
| Main breakpoint progression | `640`, `768`, `1024`, `1280`, `1536`, `1920` px, depending on component |
| Animation | Primary `.5s cubic-bezier(.3,1,.3,1)`; navigation `.5s cubic-bezier(.6,0,.4,1)`; smooth `.7s cubic-bezier(.7,0,.3,1)` |

The press-quote custom block additionally imports Google Fonts `Newsreader`, with italic and normal styles and a variable 200–800 weight range. The three local Jost files currently saved are normal weights 400, 500 and 700. Original HTML also declares italic Jost 400 and 700; those italic font files were not included in the initial asset batch.

### Home layout reference

1. Hero: `width:100vw; height:98vh`; desktop 16:9 background video and separate 9:16 mobile video. Video covers its area. Overlay: `#171717` at opacity `0.35`. Desktop text is bottom-left, mobile centered. Heading “Flexcube Modular Furniture System”; eyebrow “Recommended by Swiss SMEs”; italic description “Perfect design at fair prices.” at 24 px / 1.6. CTA order: outlined “Discover Bestsellers”, filled white “Configure Furniture Now”. Content bottom spacer: 52 px desktop / 28 px mobile. Hero content box max-width: 672 px at 768 px, 928 px at 1280 px, 1024 px at 1920 px.
2. Press quote: white background; “Precisely engineered, modern, and highly usable in everyday life.” / “HANDELSBLATT, 2026”; “ALSO KNOWN FROM” and publication logos.
3. Benefits: gray background; “A system for generations” / “Why customers love Flexcube 🩶”. Desktop interactive expanding photographic panels, 760 px configured height; four headings “Modular, Not Disposable”, “Beauty and Value That Last”, “Unrivaled Colors”, “Built for Generations”. Text-card width 340 px; panel overlays 0.8 inactive / 0.15 active. Desktop side margins use `min(var(--page-padding),48px)`.
4. Brand/feature collage: “For doers. For creatives. For everyone with high standards.” plus six feature photographs/cards.
5. Video: “Highest Quality. Personal Service.”
6. Product range: “Discover our product range” / “Flexible. Modular. Timeless.”; eight category cards with a different image on hover. Category order on home differs from collection carousel: Sideboards, Shelves, Chests of drawers, Lowboards, Wardrobes, Tables, Reception desks, Pedestals.
7. Reviews: gray section with 72 px top/bottom padding; `50,000+`; “Swiss SMEs trust Flexcube”; 4.9/5; source tabs All reviews / Google / TrustedShop / Trustpilot; horizontally displayed review cards and read-more control.
8. Community: “Real spaces. Real people. Real Flexcube solutions.” / “Flexcube looks from the Community”; gallery with shop-the-look dialogs; logo strip.
9. Service grid: “Why Flexcube” / “Everything from a single source”; nine service icon entries; 100 px top/bottom section padding.
10. Contact CTA: “Questions? We're happy to advise you.” / “Personal, competent and non-binding.” / “Get in Touch”. Then multi-column footer with showroom, contact and policy destinations.

### Collection and product reference

Collection header: title and 4.9 rating/trust badge, followed by a horizontal category carousel. Carousel source classes use five desktop cards and two mobile cards; category cards have 1 px `#e5e5e5` border, 12 px radius, medium `#5c5c5c` labels. Product list uses four desktop columns and two mobile columns. Product cards include product photography, a rating, original price plus the displayed discounted price, eye quick-view button and hover Configure action. The original English collection still labels the hover action “Konfigurieren”.

Product detail is a separate target, not just a collection card opening the configurator. Its first block contains the gallery and a product summary with rating, pricing, dimensions, color, stock and two actions; later sections include feature imagery, product copy, FAQ, reviews and reassurance details.

## Saved local evidence and data

- `public/assets/sources.json`: source page, retrieval timestamp and per-asset original URL, type and byte count for the initial home assets; subsequent product images have URLs and labels.
- `public/assets/catalog.json`: first 12 original bestseller products from the public Shopify product JSON endpoint, with title, base price, exact discounted price parsed from the collection HTML, original URL, local image path and public config ID.
- `public/assets/reference-theme.css`: original public theme stylesheet for exact token/layout inspection; not intended to be blindly loaded into the replica.
- `public/assets/reference-styles.css`: original compiled custom style sheet.
- Original homepage HTML and additional page captures were stored under `/tmp/flexcube-home.html` and `/tmp/flexcube-reference-pages/`; these temporary captures are research aids and are not deployed assets.

## Asset optimization recommendations

No downloaded asset was deleted during this audit. Current batch at the time of measurement: 123 files, 75,459,070 bytes (about 72.0 MiB), including reference CSS, metadata and 12 product images.

| Asset | Captured bytes | Recommendation |
| --- | ---: | --- |
| `hero-desktop.mp4` | 20,122,549 | Retain as fidelity master; encode a web delivery version with the same framing, use local poster, and request only on a suitable viewport. Avoid loading both mobile and desktop sources. |
| `hero-mobile.mp4` | 10,473,248 | Retain as mobile master; encode a smaller device-specific delivery file and honor reduced-motion/data saving preferences with the poster. |
| `service-video.mp4` | 27,697,664 | Largest single download. Below-the-fold: use `preload="none"`, its 194 KB poster, and attach/load video source near viewport or on play. A smaller delivery encode can materially reduce transfer. |
| `hero-desktop.jpg` | 161,277 | Suitable captured 1920-wide poster; responsive AVIF/WebP delivery derivatives may be smaller. Keep the original captured reference. |
| Repeated gallery/logo images | Mostly 10–675 KB | Only ship files actually referenced by implemented routes; generate proper responsive widths rather than serving every image at 1600 px. Keep original reference collection outside the deploy directory if needed later. |
| 3 × Jost WOFF2 | 38,364 total | Already small. Preload only regular 400, which appears above the fold. Load 500/700 as needed. Add exact italic fonts if fidelity requires them. |
| `reference-theme.css` | 301,159 | Research file; do not import the full original theme into replica components. Move outside `public` for a production package if no runtime reference is required. |
| `sources.json`, `catalog.json` | Small JSON | Provenance may remain in repository; only catalog data needed at runtime must be included in the app request path. |

These are recommendations only. Exact encoding settings should be chosen after visual comparison of the hero's furniture edges, metal highlights and slow camera motion, then verified on desktop and mobile.
