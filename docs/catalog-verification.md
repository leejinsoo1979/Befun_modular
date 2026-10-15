# Collection page correction

The first collection page used captured product photos inside an independently written React layout. It did not reproduce the source collection layout: five oversized lifestyle category cards, an oversized heading, a left-aligned rating, an extra toolbar, sample-category fallbacks and a 12-product download limit differed from the reference.

The corrected page follows [the public bestseller collection](https://flexcube.ch/en/collections/alle-bestseller). It uses the source collection thumbnails, their native order and category slugs, the original rating SVG, white background and measured responsive dimensions. Befun branding, Korean copy and KRW display remain local adaptations. The collection page remains a React implementation; Shopify's theme, account, analytics and checkout are not embedded.

At a 1512 × 740 CSS-pixel viewport, these browser measurements match the reference within one pixel:

| Element | Source and corrected local page |
| --- | --- |
| Header | 76 px high, below the 48 px announcement |
| Breadcrumb | x 48, y 164, height 20 |
| Heading | x 48, y 212, height 50.922 |
| Rating container | x 762, y 224.656, width 702 |
| First category card | x 48, y 306.922, 160.281 × 171.281 |
| First product card | x 48, y 535.203, width 339.672 |

All 11 source collections were captured through their public `products.json?limit=250` endpoints. They contain 85 unique products, including 13 bestsellers. No response reached the 250-item limit. Each collection retains its own ordered product IDs instead of substituting generated sample furniture. Every referenced image is local. `catalog-reference.json` records collection membership, new asset URLs and SHA-256 hashes. The existing CHF base/discount values remain unchanged before KRW formatting; standard new products use the same source 25% automatic discount, while Sale products retain their explicit compare-at and sale prices.

Browser verification covered all collection routes and counts, image loading, category selection, reload, back navigation, an old category URL, product-detail reload, the sticky header, and 390 × 844 mobile rail selection with no page overflow. No page errors occurred. See [desktop screenshot](qa/catalog/desktop.jpg), [mobile screenshot](qa/catalog/mobile.jpg), [original reference](qa/catalog/reference.png), [previous local layout](qa/catalog/before.png), and [measured results](qa/catalog/verification.json).

The changes are locally verified. A GitHub push or production deployment is a separate action.
