#!/usr/bin/env python3
"""Map cases.zip art onto the catalog, retarget 10% house edge, add volatile extras."""

from __future__ import annotations

import json
import math
import re
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ZIP_PATH = Path("/Users/muawiayh/Desktop/cases.zip")
EXTRACT = Path("/tmp/bloxy-cases")
CDN_CASES = ROOT / "public/cdn/cases"
SRC_CASES = ROOT / "src/lib/cases-data.json"
SRC_DROPS = ROOT / "src/lib/drops-data.json"
SRV_CASES = ROOT / "server/data/cases-data.json"
SRV_DROPS = ROOT / "server/data/drops-data.json"

T = 100_000
RTP = 0.9  # 10% house edge

# zip slug -> existing catalog slug (1:1, no duplicates)
ZIP_TO_EXISTING = {
    "01-pull": "one-percent-rap-rush",
    "50-50": "ultimate-5050",
    "70-random": "10-random",
    "8-bit-case": "pixel-rush",
    "antler-case": "antler-alarm",
    "blackout-boogaloo": "monochrome",
    "bling-case": "iced-out",
    "bucket-flip": "bucket-bonanza",
    "budget-case": "budget-fedoras",
    "candy-case": "sugar-rush",
    "captain-doge-case": "pepe-case",
    "casanoah": "in-the-casino",
    "crazy-hair-case": "holy-hair",
    "creator-case": "telamon-case",
    "creepy-case": "bone-breaker",
    "dark-horns": "5percent-horns",
    "demonic-case": "crimsonwraths-curse",
    "dominus-domination": "dominus-bonanza",
    "egg-hunter": "fruit-salad",
    "evil-case": "lab-accident",
    "executed-case": "prison-life",
    "face-case": "frenzy-faces",
    "fall-case": "woodland-wars",
    "fedora-case": "fedora-fiasco",
    "flashback-case": "tix-nostalgia",
    "forever-blue-case": "azure-case",
    "gold-shades": "sparkle-time-supreme",
    "golden-case": "golden-opportunity",
    "green-case": "viridian-case",
    "halloween-case": "zombie-apocalypse",
    "happy-case": "circus-maximus",
    "haunted-case": "after-life",
    "headphone-case": "encore",
    "high-stakes-case": "high-voltage",
    "ice-case": "frostbite",
    "low-cost-king": "lowroller-15",
    "lucid-case": "mystic-bubbles",
    "music-case": "max-volume",
    "pink-case": "pink-case",
    "puzz-case": "200-iq",
    "risky-valk": "valk-volatility",
    "rose-case": "sakura-bloom",
    "sinister-case": "midnight-ride",
    "spin-2-win": "lol-roulette",
    "star-case": "astra-dreams",
    "steampunk-case": "steampunk-case",
    "the-deep-end": "hollow-depths",
    "the-fancy-case": "hollywood-dreams",
    "the-gucci-sampler": "gucci-dream",
    "the-kungfu-case": "katana-flip",
    "through-the-flames": "inferno-royale",
    "tie-case": "tie-trouble",
    "top-hat-case": "10-hat",
    "touch-the-sky": "aether",
    "toxic-case": "toxic-waste",
    "vampire-case": "nosferatus-coffin",
    "vengeance-case": "blood-trail",
    "wacky-case": "chicken-jockey",
    "whiteout-case": "crystal-silence",
    "wild-case": "wild-west-flip",
    "winter-case": "holiday-magic",
    "zeus-case": "odins-legacy",
}

# leftover zip art -> new volatile cases
NEW_CASES = [
    {
        "zip": "budget-flip",
        "slug": "budget-flip",
        "name": "Budget Flip",
        "price": 180,
        "keywords": ["fedora", "cheap", "bucket", "cola", "shaggy"],
        "hue": 95,
        "bar": "#84cc16",
        "mode": "fifty",
    },
    {
        "zip": "rags-2-riches",
        "slug": "rags-2-riches",
        "name": "Rags 2 Riches",
        "price": 250,
        "keywords": ["fedora", "sparkle", "dominus", "valk", "cola", "cardboard"],
        "hue": 42,
        "bar": "#eab308",
        "mode": "extreme",
    },
    {
        "zip": "the-grind",
        "slug": "the-grind",
        "name": "The Grind",
        "price": 650,
        "keywords": ["fedora", "shades", "tie", "hat"],
        "hue": 210,
        "bar": "#64748b",
        "mode": "grind",
    },
    {
        "zip": "diy-case",
        "slug": "diy-case",
        "name": "DIY Case",
        "price": 900,
        "keywords": ["diy", "cardboard", "paper", "craft", "tape"],
        "hue": 28,
        "bar": "#d97706",
        "mode": "volatile",
    },
    {
        "zip": "craft-it-case",
        "slug": "craft-it-case",
        "name": "Craft It Case",
        "price": 1400,
        "keywords": ["diy", "cardboard", "paper", "craft", "wooden"],
        "hue": 32,
        "bar": "#f59e0b",
        "mode": "volatile",
    },
    {
        "zip": "spooky-flip",
        "slug": "spooky-flip",
        "name": "Spooky Flip",
        "price": 2100,
        "keywords": ["vampire", "skull", "zombie", "pumpkin", "bat", "ghost", "coffin"],
        "hue": 28,
        "bar": "#f97316",
        "mode": "fifty",
    },
    {
        "zip": "switch-it-up",
        "slug": "switch-it-up",
        "name": "Switch It Up",
        "price": 3300,
        "keywords": ["fedora", "shades", "valk", "sparkle"],
        "hue": 280,
        "bar": "#a855f7",
        "mode": "fifty",
    },
    {
        "zip": "bryzy-case",
        "slug": "bryzy-case",
        "name": "Bryzy Case",
        "price": 4200,
        "keywords": ["sparkle", "shades", "fedora", "headphones", "bling"],
        "hue": 198,
        "bar": "#38bdf8",
        "mode": "volatile",
    },
    {
        "zip": "derek-case",
        "slug": "derek-case",
        "name": "Derek Case",
        "price": 5100,
        "keywords": ["hair", "face", "shaggy", "smile", "head"],
        "hue": 18,
        "bar": "#fb7185",
        "mode": "volatile",
    },
    {
        "zip": "crazy-case",
        "slug": "crazy-case",
        "name": "Crazy Case",
        "price": 6400,
        "keywords": ["crazy", "clown", "wacky", "rainbow", "bighead", "madness"],
        "hue": 312,
        "bar": "#e879f9",
        "mode": "volatile",
    },
    {
        "zip": "madness",
        "slug": "madness",
        "name": "Madness",
        "price": 7777,
        "keywords": ["void", "madness", "insane", "crazy", "joker", "chaos"],
        "hue": 270,
        "bar": "#7c3aed",
        "mode": "extreme",
    },
    {
        "zip": "mrblox-case",
        "slug": "mrblox-case",
        "name": "MrBlox Case",
        "price": 8800,
        "keywords": ["roblox", "classic", "fedora", "tix", "blox", "telamon"],
        "hue": 205,
        "bar": "#0ea5e9",
        "mode": "volatile",
    },
    {
        "zip": "wagmi",
        "slug": "wagmi",
        "name": "WAGMI",
        "price": 10000,
        "keywords": ["bling", "gold", "sparkle", "cash", "bux", "golden"],
        "hue": 48,
        "bar": "#facc15",
        "mode": "extreme",
    },
    {
        "zip": "rozone-case",
        "slug": "rozone-case",
        "name": "Rozone Case",
        "price": 12500,
        "keywords": ["green", "viridian", "toxic", "neon", "emerald"],
        "hue": 142,
        "bar": "#22c55e",
        "mode": "volatile",
    },
    {
        "zip": "sorhex-case",
        "slug": "sorhex-case",
        "name": "Sorhex Case",
        "price": 14500,
        "keywords": ["sorcus", "fedora", "lightning", "hex", "wizard"],
        "hue": 255,
        "bar": "#8b5cf6",
        "mode": "volatile",
    },
    {
        "zip": "circlet-case",
        "slug": "circlet-case",
        "name": "Circlet Case",
        "price": 16000,
        "keywords": ["circlet", "crown", "halo", "tiara", "domino"],
        "hue": 46,
        "bar": "#fbbf24",
        "mode": "volatile",
    },
    {
        "zip": "commando-case",
        "slug": "commando-case",
        "name": "Commando Case",
        "price": 18500,
        "keywords": ["commando", "assassin", "biograft", "soldier", "tactical"],
        "hue": 150,
        "bar": "#14b8a6",
        "mode": "volatile",
    },
    {
        "zip": "purple-power",
        "slug": "purple-power",
        "name": "Purple Power",
        "price": 22000,
        "keywords": ["purple", "amethyst", "violet", "indigo"],
        "hue": 278,
        "bar": "#a855f7",
        "mode": "volatile",
    },
    {
        "zip": "risky-case",
        "slug": "risky-case",
        "name": "Risky Case",
        "price": 28000,
        "keywords": ["sparkle", "valk", "dominus", "fedora", "king"],
        "hue": 0,
        "bar": "#ef4444",
        "mode": "extreme",
    },
    {
        "zip": "horn-case",
        "slug": "horn-case",
        "name": "Horn Case",
        "price": 35000,
        "keywords": ["horn", "antler", "horns"],
        "hue": 12,
        "bar": "#f43f5e",
        "mode": "volatile",
    },
    {
        "zip": "like-clock-work",
        "slug": "like-clock-work",
        "name": "Like Clockwork",
        "price": 42000,
        "keywords": ["clockwork", "steampunk", "gear", "aether"],
        "hue": 32,
        "bar": "#d97706",
        "mode": "volatile",
    },
    {
        "zip": "valk-case",
        "slug": "valk-case",
        "name": "Valk Case",
        "price": 48000,
        "keywords": ["valk", "valkyrie"],
        "hue": 188,
        "bar": "#22d3ee",
        "mode": "volatile",
    },
    {
        "zip": "the-equalizer",
        "slug": "the-equalizer",
        "name": "The Equalizer",
        "price": 55000,
        "keywords": ["sparkle", "fedora", "valk", "dominus", "gold"],
        "hue": 160,
        "bar": "#34d399",
        "mode": "fifty",
    },
]


def parse_zip_slug(filename: str) -> str | None:
    base = Path(filename).name
    m = re.search(r"_case-(.+)png\.png$", base, re.I)
    if not m:
        return None
    raw = m.group(1)
    m2 = re.match(r"^(.*)([0-9a-f]{8})$", raw, re.I)
    slug = m2.group(1) if m2 else raw
    slug = re.sub(r"-+", "-", slug.strip("-"))
    return slug


def extract_zip() -> dict[str, Path]:
    import zipfile

    EXTRACT.mkdir(parents=True, exist_ok=True)
    out: dict[str, Path] = {}
    with zipfile.ZipFile(ZIP_PATH) as zf:
        for name in zf.namelist():
            if name.startswith("__MACOSX") or not name.lower().endswith(".png"):
                continue
            slug = parse_zip_slug(name)
            if not slug:
                continue
            dest = EXTRACT / f"{slug}.png"
            dest.write_bytes(zf.read(name))
            out[slug] = dest
    return out


def to_webp(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(src).convert("RGBA")
    im.save(dest, "WEBP", quality=88, method=4)


def fmt_chance(tickets: int):
    c = tickets / 1000
    if abs(c - round(c)) < 1e-9:
        return int(round(c))
    return float(f"{c:.4f}".rstrip("0").rstrip("."))


def apply_tickets(items: list[dict], tickets: list[int]) -> list[dict]:
    t = 0
    out = []
    for it, n in zip(items, tickets):
        rec = {
            "name": it["name"],
            "id": it["id"],
            "value": it["value"],
            "chance": fmt_chance(n),
            "color": it.get("color") or "GRAY",
            "minTicket": t,
            "maxTicket": t + n - 1,
        }
        t += n
        out.append(rec)
    if out and out[-1]["maxTicket"] != T - 1:
        out[-1]["maxTicket"] = T - 1
    return out


def ev_of(values: list[int], tickets: list[int]) -> float:
    return sum(v * t for v, t in zip(values, tickets)) / T


def fit_tickets(values: list[int], start: list[int], target_ev: float) -> list[int]:
    """Hit target EV by parking leftover tickets on junk, then walking up the value ladder."""
    n = len(values)
    order = sorted(range(n), key=lambda i: (values[i], i))
    t = [1] * n
    leftover = T - n
    t[order[0]] += leftover
    lo_bound = min(values) + 1e-6
    hi_bound = max(values) - 1e-6
    tgt = min(max(target_ev, lo_bound), hi_bound)

    # If start weights already close, keep their shape by scaling then one adjustment.
    if start and len(start) == n:
        shaped = [max(1, int(x)) for x in start]
        s = sum(shaped)
        if s > 0:
            shaped = [max(1, int(round(x * T / s))) for x in shaped]
            shaped[-1] += T - sum(shaped)
            if shaped[-1] < 1:
                donor = max(range(n - 1), key=lambda j: shaped[j])
                shaped[donor] += shaped[-1] - 1
                shaped[-1] = 1
            if abs(ev_of(values, shaped) - tgt) <= abs(ev_of(values, t) - tgt):
                t = shaped

    def nudge(err: float) -> bool:
        if err > 0:
            srcs = reversed(order)
            dsts = order
        else:
            srcs = order
            dsts = reversed(order)
        for src in srcs:
            if t[src] <= 1:
                continue
            for dst in dsts:
                if err > 0 and values[dst] >= values[src]:
                    continue
                if err < 0 and values[dst] <= values[src]:
                    continue
                step = abs(values[src] - values[dst]) / T
                if step <= 0:
                    continue
                k = int(round(abs(err) / step))
                k = max(1, min(k, t[src] - 1))
                t[src] -= k
                t[dst] += k
                return True
        return False

    for _ in range(n * 8):
        err = ev_of(values, t) - tgt
        if abs(err) < 0.05:
            break
        if not nudge(err):
            break
    t[order[0]] += T - sum(t)
    if t[order[0]] < 1:
        donor = max(range(n), key=lambda j: t[j] if j != order[0] else -1)
        t[donor] += t[order[0]] - 1
        t[order[0]] = 1
    return t


def color_for(value: int, price: int) -> str:
    r = value / max(price, 1)
    if r >= 5:
        return "YELLOW"
    if r >= 1.4:
        return "PURPLE"
    if r >= 0.4:
        return "BLUE"
    return "GRAY"


def risk_for(values: list[int], tickets: list[int], price: int) -> str:
    ev = ev_of(values, tickets)
    var = sum(((v - ev) ** 2) * t for v, t in zip(values, tickets)) / T
    sd = math.sqrt(max(var, 0))
    cv = sd / ev if ev else 0
    top = max(values) / max(price, 1)
    if top >= 8 or cv >= 2.0:
        return "high"
    if top >= 3 or cv >= 1.1:
        return "medium"
    return "low"


def score_item(item: dict, keywords: list[str]) -> int:
    name = item["name"].lower()
    return sum(1 for k in keywords if k in name)


def closest(items: list[dict], target: float, used: set[int], lo: float, hi: float) -> dict | None:
    opts = [x for x in items if x["id"] not in used and lo <= x["value"] <= hi]
    if not opts:
        return None
    return min(opts, key=lambda x: abs(x["value"] - target))


def pick_from_bands(theme: list[dict], all_items: list[dict], price: int, bands: list[tuple[float, float, float]], used: set[int]) -> list[dict]:
    chosen = []
    for lo_m, hi_m, target_m in bands:
        lo, hi, target = lo_m * price, hi_m * price, target_m * price
        it = (
            closest(theme, target, used, lo, hi)
            or closest(all_items, target, used, lo, hi)
            or closest(theme, target, used, lo * 0.45, hi * 1.35)
            or closest(all_items, target, used, lo * 0.45, hi * 1.35)
        )
        if it is None:
            continue
        chosen.append(it)
        used.add(it["id"])
    return chosen


def build_table(all_items: list[dict], cfg: dict) -> list[dict]:
    price = cfg["price"]
    keywords = cfg["keywords"]
    mode = cfg["mode"]
    theme = [x for x in all_items if score_item(x, keywords) > 0]
    theme.sort(key=lambda x: (-score_item(x, keywords), -x["value"]))
    used: set[int] = set()

    if mode == "fifty":
        bands = [(1.4, 2.4, 1.85), (0.02, 0.35, 0.12)]
        picked = pick_from_bands(theme, all_items, price, bands, used)
        if len(picked) < 2:
            raise RuntimeError(f"not enough items for 50/50 {cfg['slug']}")
        weights = [47000, 53000]
    elif mode == "grind":
        bands = [
            (4.0, 10.0, 6.0),
            (1.6, 3.5, 2.2),
            (0.9, 1.6, 1.2),
            (0.5, 0.9, 0.7),
            (0.25, 0.5, 0.35),
            (0.08, 0.25, 0.15),
            (0.005, 0.08, 0.03),
        ]
        picked = pick_from_bands(theme, all_items, price, bands, used)
        weights = [2500, 6000, 12000, 18000, 22000, 22000, 17500]
    elif mode == "extreme":
        bands = [
            (18.0, 55.0, 28.0),
            (5.0, 12.0, 7.5),
            (1.5, 3.5, 2.2),
            (0.4, 1.0, 0.6),
            (0.08, 0.3, 0.15),
            (0.01, 0.08, 0.03),
            (0.0005, 0.02, 0.004),
        ]
        picked = pick_from_bands(theme, all_items, price, bands, used)
        weights = [500, 1200, 3500, 9000, 18000, 28000, 39800]
    else:  # volatile
        bands = [
            (9.0, 24.0, 14.0),
            (3.5, 8.0, 5.0),
            (1.3, 3.0, 1.8),
            (0.5, 1.2, 0.8),
            (0.15, 0.5, 0.28),
            (0.04, 0.15, 0.08),
            (0.001, 0.05, 0.01),
        ]
        picked = pick_from_bands(theme, all_items, price, bands, used)
        weights = [900, 2200, 5500, 10000, 16000, 24000, 41400]

    picked.sort(key=lambda x: -x["value"])
    if len(weights) != len(picked):
        weights = weights[: len(picked)]
        if sum(weights) != T:
            weights[-1] += T - sum(weights)

    values = [x["value"] for x in picked]
    tickets = fit_tickets(values, weights, RTP * price)
    colored = []
    for it in picked:
        rec = dict(it)
        rec["color"] = color_for(it["value"], price)
        colored.append(rec)
    return apply_tickets(colored, tickets)


def retarget_existing(items: list[dict], price: int) -> list[dict]:
    values = [it["value"] for it in items]
    tickets = [it["maxTicket"] - it["minTicket"] + 1 for it in items]
    new_t = fit_tickets(values, tickets, RTP * price)
    colored = []
    for it in items:
        rec = dict(it)
        rec["color"] = it.get("color") or color_for(it["value"], price)
        colored.append(rec)
    return apply_tickets(colored, new_t)


def house_edge(items: list[dict], price: int) -> float:
    ev = sum(it["value"] * (it["maxTicket"] - it["minTicket"] + 1) / T for it in items)
    return 1 - ev / price if price else 0


def main() -> None:
    used = set(ZIP_TO_EXISTING.values())
    if len(used) != len(ZIP_TO_EXISTING):
        raise SystemExit("duplicate mapping targets")

    print("extracting zip...", flush=True)
    zip_files = extract_zip()
    extra_zips = set(zip_files) - set(ZIP_TO_EXISTING)
    expected_extras = {c["zip"] for c in NEW_CASES}
    missing = extra_zips - expected_extras
    leftover = expected_extras - extra_zips
    if missing or leftover:
        raise SystemExit(f"extra mismatch missing={missing} leftover={leftover}")

    cases = json.loads(SRC_CASES.read_text())
    drops = json.loads(SRC_DROPS.read_text())
    extra_slugs = {c["slug"] for c in NEW_CASES}
    kept_ids = {c["imageId"] for c in cases if c["slug"] in extra_slugs}
    cases = [c for c in cases if c["slug"] not in extra_slugs]
    for slug in extra_slugs:
        drops.pop(slug, None)
    by_slug = {c["slug"]: c for c in cases}

    items_by_id: dict[int, dict] = {}
    for arr in drops.values():
        for it in arr:
            items_by_id[it["id"]] = {
                "name": it["name"],
                "id": it["id"],
                "value": it["value"],
            }
    all_items = sorted(items_by_id.values(), key=lambda x: -x["value"])

    print(f"retargeting {len(cases)} existing cases to 10% HE...", flush=True)
    for c in cases:
        slug = c["slug"]
        table = drops[slug]
        drops[slug] = retarget_existing(table, c["price"])
        c["image"] = f"/cdn/cases/{c['imageId']}.webp"

    print(f"converting {len(ZIP_TO_EXISTING)} mapped case images...", flush=True)
    for zip_slug, case_slug in ZIP_TO_EXISTING.items():
        c = by_slug[case_slug]
        to_webp(zip_files[zip_slug], CDN_CASES / f"{c['imageId']}.webp")
        c["image"] = f"/cdn/cases/{c['imageId']}.webp"

    next_id = max([c["imageId"] for c in cases] + list(kept_ids) + [115]) + 1
    reused_ids = sorted(kept_ids)
    print(f"building {len(NEW_CASES)} extra cases...", flush=True)
    new_cases = []
    for cfg in NEW_CASES:
        table = build_table(all_items, cfg)
        image_id = reused_ids.pop(0) if reused_ids else next_id
        if image_id == next_id:
            next_id += 1
        to_webp(zip_files[cfg["zip"]], CDN_CASES / f"{image_id}.webp")
        risk = "medium" if cfg["mode"] == "grind" else "high"
        case = {
            "slug": cfg["slug"],
            "name": cfg["name"],
            "imageId": image_id,
            "image": f"/cdn/cases/{image_id}.webp",
            "price": cfg["price"],
            "bar": cfg["bar"],
            "hue": cfg["hue"],
            "risk": risk,
        }
        new_cases.append(case)
        drops[cfg["slug"]] = table

    cases.extend(new_cases)
    cases.sort(key=lambda c: (-c["price"], c["slug"]))

    for path in (SRC_CASES, SRV_CASES):
        path.write_text(json.dumps(cases, indent=2, ensure_ascii=False) + "\n")
    for path in (SRC_DROPS, SRV_DROPS):
        path.write_text(json.dumps(drops, indent=2, ensure_ascii=False) + "\n")

    hes = []
    print(f"catalog cases: {len(cases)}")
    print(f"mapped zip art: {len(ZIP_TO_EXISTING)}")
    print(f"new volatile cases: {len(new_cases)}")
    print("--- house edge ---")
    bad = []
    for c in cases:
        he = house_edge(drops[c["slug"]], c["price"]) * 100
        hes.append(he)
        if abs(he - 10) > 0.15:
            bad.append((c["slug"], round(he, 3), c["price"]))
    print(f"min {min(hes):.3f}%  max {max(hes):.3f}%  mean {sum(hes)/len(hes):.3f}%")
    if bad:
        print("off-target:")
        for row in bad:
            print(" ", row)
    print("--- new cases ---")
    for c in new_cases:
        table = drops[c["slug"]]
        top = table[0]
        he = house_edge(table, c["price"]) * 100
        print(
            f"{c['slug']:22} ${c['price']:<7} he={he:5.2f}%  n={len(table)}  "
            f"top={top['name']} ({top['value']}) {top['chance']}%"
        )


if __name__ == "__main__":
    main()
