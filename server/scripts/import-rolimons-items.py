#!/usr/bin/env python3
"""Import the Rolimons limited catalog and download missing item images."""

from __future__ import annotations

import json
import ssl
import time
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

import certifi
from PIL import Image

SSL = ssl.create_default_context(cafile=certifi.where())

ROOT = Path(__file__).resolve().parents[2]
CDN = ROOT / "public/cdn/items"
SRC_ITEMS = ROOT / "src/lib/items-data.json"
SRV_ITEMS = ROOT / "server/data/items-data.json"
API = "https://www.rolimons.com/itemapi/itemdetails"
THUMB = "https://thumbnails.roblox.com/v1/assets"

UA = {"User-Agent": "Mozilla/5.0 BloxyWildCatalog/1.0"}


def get_json(url: str) -> dict:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=45, context=SSL) as r:
        return json.loads(r.read().decode("utf-8"))


def fetch_bytes(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=45, context=SSL) as r:
        return r.read()


def value_of(arr: list) -> int:
    rap = int(arr[2] or 0)
    val = int(arr[3] or -1)
    default = int(arr[4] or 0)
    if val > 0:
        return val
    if default > 0:
        return default
    return max(1, rap)


def build_catalog() -> list[dict]:
    data = get_json(API)
    items = []
    for iid, arr in data["items"].items():
        items.append(
            {
                "id": int(iid),
                "name": (arr[0] or "").strip(),
                "acronym": arr[1] or "",
                "rap": int(arr[2] or 0),
                "value": value_of(arr),
            }
        )
    items.sort(key=lambda x: (-x["value"], x["name"]))
    return items


def download_missing(ids: list[int]) -> tuple[int, int]:
    CDN.mkdir(parents=True, exist_ok=True)
    have = {p.stem for p in CDN.glob("*.webp")}
    need = [i for i in ids if str(i) not in have]
    print(f"have {len(have)} images, need {len(need)}", flush=True)
    ok = 0
    fail = 0
    batch = 80
    for i in range(0, len(need), batch):
        chunk = need[i : i + batch]
        q = urllib.parse.urlencode(
            {
                "assetIds": ",".join(str(x) for x in chunk),
                "size": "420x420",
                "format": "Png",
                "isCircular": "false",
            }
        )
        try:
            payload = get_json(f"{THUMB}?{q}")
        except Exception as e:
            print("thumb batch failed", e, flush=True)
            fail += len(chunk)
            time.sleep(1.5)
            continue
        by_id = {int(d["targetId"]): d for d in payload.get("data", [])}
        for iid in chunk:
            dest = CDN / f"{iid}.webp"
            if dest.exists():
                ok += 1
                continue
            info = by_id.get(iid) or {}
            url = info.get("imageUrl")
            if not url or info.get("state") != "Completed":
                fail += 1
                continue
            try:
                raw = fetch_bytes(url)
                im = Image.open(BytesIO(raw)).convert("RGBA")
                im.save(dest, "WEBP", quality=82, method=4)
                ok += 1
            except Exception:
                fail += 1
        print(f"  {min(i+batch, len(need))}/{len(need)} ok={ok} fail={fail}", flush=True)
        time.sleep(0.25)
    return ok, fail


def main() -> None:
    catalog = build_catalog()
    text = json.dumps(catalog, indent=2, ensure_ascii=False) + "\n"
    SRC_ITEMS.write_text(text)
    SRV_ITEMS.write_text(text)
    print(f"wrote {len(catalog)} items", flush=True)
    ids = [it["id"] for it in catalog]
    ok, fail = download_missing(ids)
    if fail:
        print("retrying missing thumbs...", flush=True)
        time.sleep(2)
        ok2, fail = download_missing(ids)
        ok += ok2
    print(f"images downloaded/kept={ok} still_missing={fail} total_files={len(list(CDN.glob('*.webp')))}")


if __name__ == "__main__":
    main()
