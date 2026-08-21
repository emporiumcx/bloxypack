#!/usr/bin/env python3
"""Replace local limited images with Diceblox's framed webps.

Sources:
  1. Unique asset IDs from Diceblox upgrader + cases (diceblox-limited-ids.txt)
  2. Remaining IDs from our Rolimons catalog (no duplicates)
"""

from __future__ import annotations

import json
import ssl
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import certifi

SSL = ssl.create_default_context(cafile=certifi.where())
UA = {"User-Agent": "Mozilla/5.0 BloxyPackCatalog/1.0", "Accept": "image/webp,image/*"}
CDN = "https://cdn.diceblox.com/items/{id}.webp"
MIN_BYTES = 400

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / "public/cdn/items"
SRC_ITEMS = ROOT / "src/lib/items-data.json"
ID_FILE = Path(__file__).with_name("diceblox-limited-ids.txt")


def load_ids() -> list[int]:
    seen: set[int] = set()
    ordered: list[int] = []

    def add(raw) -> None:
        try:
            iid = int(raw)
        except (TypeError, ValueError):
            return
        if iid <= 0 or iid in seen:
            return
        seen.add(iid)
        ordered.append(iid)

    if ID_FILE.exists():
        text = ID_FILE.read_text().strip().replace("\n", ",")
        for part in text.split(","):
            add(part.strip())

    catalog = json.loads(SRC_ITEMS.read_text())
    for row in catalog:
        add(row.get("id"))

    return ordered


def fetch_one(iid: int) -> tuple[int, str]:
    dest = DEST / f"{iid}.webp"
    url = CDN.format(id=iid)
    req = urllib.request.Request(url, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=30, context=SSL) as r:
            data = r.read()
    except urllib.error.HTTPError as e:
        return iid, f"http-{e.code}"
    except Exception as e:
        return iid, f"err-{type(e).__name__}"
    if len(data) < MIN_BYTES:
        return iid, "tiny"
    dest.write_bytes(data)
    return iid, "ok"


def main() -> None:
    DEST.mkdir(parents=True, exist_ok=True)
    ids = load_ids()
    print(f"downloading {len(ids)} unique limiteds -> {DEST}", flush=True)
    ok = tiny = miss = err = 0
    workers = 16
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futs = [pool.submit(fetch_one, iid) for iid in ids]
        for i, fut in enumerate(as_completed(futs), 1):
            _, status = fut.result()
            if status == "ok":
                ok += 1
            elif status == "tiny":
                tiny += 1
            elif status.startswith("http-"):
                miss += 1
            else:
                err += 1
            if i % 200 == 0 or i == len(ids):
                print(f"  {i}/{len(ids)} ok={ok} tiny={tiny} miss={miss} err={err}", flush=True)
    print(f"done ok={ok} tiny-skipped={tiny} missing={miss} errors={err} files={len(list(DEST.glob('*.webp')))}")


if __name__ == "__main__":
    main()
