#!/usr/bin/env python3
"""Replace the paid case catalog with Diceblox official cases + items.

Keeps reward-case drop tables (bonus / daily / rank).
"""

from __future__ import annotations

import hashlib
import json
import ssl
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import certifi

SSL = ssl.create_default_context(cafile=certifi.where())
UA = {"User-Agent": "Mozilla/5.0 BloxyPackCatalog/1.0", "Accept": "image/webp,image/*"}
MIN_BYTES = 400
WORKERS = 20

ROOT = Path(__file__).resolve().parents[2]
DUMP = ROOT / ".tmp-ocr/diceblox-catalog.json"
SRC_CASES = ROOT / "src/lib/cases-data.json"
SRC_DROPS = ROOT / "src/lib/drops-data.json"
SRC_ITEMS = ROOT / "src/lib/items-data.json"
SRV_CASES = ROOT / "server/data/cases-data.json"
SRV_DROPS = ROOT / "server/data/drops-data.json"
SRV_ITEMS = ROOT / "server/data/items-data.json"
CDN_CASES = ROOT / "public/cdn/cases"
CDN_ITEMS = ROOT / "public/cdn/items"

REWARD_SLUGS = {
    "bronze-case",
    "silver-case",
    "gold-case",
    "platinum-case",
    "diamond-case",
    *[f"bonus-{n}" for n in (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20)],
    *[f"daily-{n}" for n in range(1, 11)],
}

CASE_CDN = "https://cdn.diceblox.com/cases/{slug}.webp"
ITEM_CDN = "https://cdn.diceblox.com/items/{id}.webp"


def fmt_chance(tickets: int):
    c = tickets / 1000
    if abs(c - round(c)) < 1e-9:
        return int(round(c))
    return float(f"{c:.4f}".rstrip("0").rstrip("."))


def color_for(value: int, price: int) -> str:
    r = value / max(price, 1)
    if r >= 10:
        return "GOLD"
    if r >= 5:
        return "YELLOW"
    if r >= 2:
        return "RED"
    if r >= 1:
        return "PURPLE"
    if r >= 0.4:
        return "BLUE"
    if r >= 0.15:
        return "GREEN"
    return "GRAY"


def risk_for(values: list[int], tickets: list[int], price: int) -> str:
    if not values:
        return "low"
    top = max(values) / max(price, 1)
    ev = sum(v * t for v, t in zip(values, tickets)) / 100_000
    var = sum(((v - ev) ** 2) * t for v, t in zip(values, tickets)) / 100_000
    sd = var ** 0.5
    cv = sd / ev if ev else 0
    if top >= 5 or cv >= 1.4:
        return "high"
    return "low"


def hue_for(slug: str) -> int:
    h = hashlib.md5(slug.encode()).hexdigest()
    return int(h[:2], 16) * 360 // 255


def bar_for(risk: str) -> str:
    return "#ef4444" if risk == "high" else "#3b82f6"


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n")


def fetch_one(url: str, dest: Path) -> str:
    req = urllib.request.Request(url, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=30, context=SSL) as r:
            data = r.read()
    except urllib.error.HTTPError as e:
        return f"http-{e.code}"
    except Exception as e:
        return f"err-{type(e).__name__}"
    if len(data) < MIN_BYTES:
        return "tiny"
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    return "ok"


def main() -> None:
    payload = json.loads(DUMP.read_text())
    old_drops = json.loads(SRC_DROPS.read_text())
    reward_drops = {k: v for k, v in old_drops.items() if k in REWARD_SLUGS}

    cases_out = []
    drops_out: dict[str, list] = {}
    used_ids: set[int] = set()

    for c in payload["cases"]:
        slug = c["slug"]
        if slug in REWARD_SLUGS:
            print(f"skip official slug that collides with rewards: {slug}")
            continue
        items = []
        values = []
        tickets = []
        for it in sorted(c["items"], key=lambda x: x["minTicket"]):
            try:
                iid = int(it["assetId"])
            except (TypeError, ValueError):
                continue
            n = int(it["maxTicket"]) - int(it["minTicket"]) + 1
            val = int(it["value"] or 0)
            items.append(
                {
                    "name": it["name"],
                    "id": iid,
                    "value": val,
                    "chance": fmt_chance(n),
                    "color": color_for(val, int(c["price"] or 1)),
                    "minTicket": int(it["minTicket"]),
                    "maxTicket": int(it["maxTicket"]),
                }
            )
            values.append(val)
            tickets.append(n)
            used_ids.add(iid)
        if not items:
            continue
        price = int(round(c["price"] or 0))
        risk = risk_for(values, tickets, price)
        cases_out.append(
            {
                "slug": slug,
                "name": c["name"],
                "image": f"/cdn/cases/{slug}.webp",
                "price": price,
                "bar": bar_for(risk),
                "hue": hue_for(slug),
                "risk": risk,
            }
        )
        drops_out[slug] = items

    drops_out.update(reward_drops)
    cases_out.sort(key=lambda c: (-c["price"], c["name"].lower()))

    items_out = []
    seen: set[int] = set()
    for it in payload["items"]:
        try:
            iid = int(it["id"])
        except (TypeError, ValueError):
            continue
        if iid <= 0 or iid in seen:
            continue
        seen.add(iid)
        used_ids.add(iid)
        items_out.append(
            {
                "id": iid,
                "name": it["name"],
                "acronym": "",
                "rap": int(it["value"] or 0),
                "value": int(it["value"] or 0),
            }
        )
    items_out.sort(key=lambda x: (-x["value"], x["name"].lower()))

    for path in (SRC_CASES, SRV_CASES):
        write_json(path, cases_out)
    for path in (SRC_DROPS, SRV_DROPS):
        write_json(path, drops_out)
    for path in (SRC_ITEMS, SRV_ITEMS):
        write_json(path, items_out)

    high = sum(1 for c in cases_out if c["risk"] == "high")
    print(
        f"wrote {len(cases_out)} cases ({high} high / {len(cases_out) - high} low), "
        f"{len(drops_out)} drop tables, {len(items_out)} items",
        flush=True,
    )

    jobs: list[tuple[str, Path]] = []
    for c in cases_out:
        jobs.append((CASE_CDN.format(slug=c["slug"]), CDN_CASES / f"{c['slug']}.webp"))
    for iid in sorted(used_ids):
        jobs.append((ITEM_CDN.format(id=iid), CDN_ITEMS / f"{iid}.webp"))

    print(f"downloading {len(jobs)} images", flush=True)
    ok = miss = tiny = err = 0
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futs = {pool.submit(fetch_one, url, dest): dest for url, dest in jobs}
        for i, fut in enumerate(as_completed(futs), 1):
            status = fut.result()
            if status == "ok":
                ok += 1
            elif status.startswith("http"):
                miss += 1
            elif status == "tiny":
                tiny += 1
            else:
                err += 1
            if i % 200 == 0 or i == len(jobs):
                print(f"  {i}/{len(jobs)} ok={ok} miss={miss} tiny={tiny} err={err}", flush=True)

    keep = {f"{c['slug']}.webp" for c in cases_out}
    removed = 0
    if CDN_CASES.exists():
        for path in CDN_CASES.glob("*.webp"):
            if path.name not in keep:
                path.unlink()
                removed += 1
    print(f"removed {removed} old case images")


if __name__ == "__main__":
    main()
