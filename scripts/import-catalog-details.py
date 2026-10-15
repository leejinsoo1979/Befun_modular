"""Import the public collection product options and galleries; never call store write APIs."""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import re
import time
from html.parser import HTMLParser
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]


def read_url(url):
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={"User-Agent": "Befun catalog import"}), timeout=45) as response:
                return response.read()
        except Exception:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)


class Text(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in ("p", "li", "br", "div", "h2", "h3", "h4"):
            self.parts.append("\n")

    def handle_data(self, data):
        self.parts.append(data)


def main():
    collections = json.loads((ROOT / "src/data/catalog-collections.json").read_text())
    catalog = json.loads((ROOT / "public/assets/catalog.json").read_text())
    local = {p["id"]: p for p in catalog["products"]}

    def get_collection(collection):
        url = f'https://flexcube.ch/en/collections/{collection["slug"]}/products.json?limit=250'
        products = json.loads(read_url(url))["products"]
        return {"slug": collection["slug"], "source": url, "productIds": [p["id"] for p in products]}, products

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        responses = list(pool.map(get_collection, collections))
    source_products = {p["id"]: p for _, products in responses for p in products}
    for collection, _ in responses:
        ids = next(c["productIds"] for c in catalog["collections"] if c["slug"] == collection["slug"])
        if ids != collection["productIds"]:
            raise RuntimeError(f'Collection differs from local catalog: {collection["slug"]}')
    if set(local) != set(source_products):
        raise RuntimeError("Local product IDs do not match the source collections")

    gallery = ROOT / "public/assets/products"
    gallery.mkdir(parents=True, exist_ok=True)
    images = {}
    for p in source_products.values():
        for item in p["images"]:
            images[item["src"]] = item
        for variant in p["variants"]:
            if variant.get("featured_image"):
                item = variant["featured_image"]
                images[item["src"]] = item

    def download(src):
        base = src.split("?")[0]
        suffix = Path(base).suffix.lower()
        if suffix not in (".jpg", ".jpeg", ".png", ".webp", ".avif"):
            suffix = ".jpg"
        name = hashlib.sha256(base.encode()).hexdigest()[:24] + suffix
        dest = gallery / name
        if not dest.exists():
            dest.write_bytes(read_url(src + ("&" if "?" in src else "?") + "width=1200"))
        return src, "/assets/products/" + name

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
        paths = dict(pool.map(download, images))

    products = []
    for p in source_products.values():
        text = Text()
        text.feed(p.get("body_html") or "")
        description = "\n".join(re.sub(r"\s+", " ", line).strip() for line in "".join(text.parts).splitlines() if line.strip())
        variants = []
        for variant in p["variants"]:
            image = variant.get("featured_image")
            variants.append({
                "id": variant["id"], "title": variant["title"],
                "options": [variant[f"option{i}"] for i in range(1, len(p["options"]) + 1)],
                "price": variant["price"], "compareAtPrice": variant["compare_at_price"],
                "available": variant["available"], "sku": variant["sku"],
                "image": paths[image["src"]] if image else None,
            })
        products.append({
            "id": p["id"], "handle": p["handle"], "description": description,
            "options": p["options"], "variants": variants,
            "images": [{"id": i["id"], "src": paths[i["src"]], "alt": i.get("alt") or p["title"]} for i in p["images"]],
        })
    result = {"source": "https://flexcube.ch/en/collections/tische", "retrievedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "collections": [c for c, _ in responses], "products": products}
    (ROOT / "public/assets/catalog-details.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(f'Imported {len(responses)} collections, {len(products)} products, {sum(len(p["variants"]) for p in products)} variants, {len(paths)} images.')


if __name__ == "__main__":
    main()
