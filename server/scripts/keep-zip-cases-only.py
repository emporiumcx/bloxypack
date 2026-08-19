#!/usr/bin/env python3
"""Drop Rostake-only cases. Keep the 85 cases from cases.zip."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CDN = ROOT / "public/cdn/cases"
SRC_CASES = ROOT / "src/lib/cases-data.json"
SRC_DROPS = ROOT / "src/lib/drops-data.json"
SRV_CASES = ROOT / "server/data/cases-data.json"
SRV_DROPS = ROOT / "server/data/drops-data.json"

REWARD_SLUGS = {"bronze-case", "silver-case", "gold-case", "platinum-case", "diamond-case"}

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

ZIP_ONLY = [
    "budget-flip",
    "rags-2-riches",
    "the-grind",
    "diy-case",
    "craft-it-case",
    "spooky-flip",
    "switch-it-up",
    "bryzy-case",
    "derek-case",
    "crazy-case",
    "madness",
    "mrblox-case",
    "wagmi",
    "rozone-case",
    "sorhex-case",
    "circlet-case",
    "commando-case",
    "purple-power",
    "risky-case",
    "horn-case",
    "like-clock-work",
    "valk-case",
    "the-equalizer",
]

NAMES = {
    "01-pull": "1% Pull",
    "50-50": "50/50",
    "70-random": "70% Random",
    "8-bit-case": "8-Bit Case",
    "blackout-boogaloo": "Blackout Boogaloo",
    "casanoah": "Casanoah",
    "gold-shades": "Gold Shades",
    "like-clock-work": "Like Clockwork",
    "low-cost-king": "Low Cost King",
    "mrblox-case": "MrBlox Case",
    "purple-power": "Purple Power",
    "puzz-case": "Puzz Case",
    "rags-2-riches": "Rags 2 Riches",
    "risky-valk": "Risky Valk",
    "spin-2-win": "Spin 2 Win",
    "the-deep-end": "The Deep End",
    "the-equalizer": "The Equalizer",
    "the-fancy-case": "The Fancy Case",
    "the-grind": "The Grind",
    "the-gucci-sampler": "The Gucci Sampler",
    "the-kungfu-case": "The Kungfu Case",
    "through-the-flames": "Through The Flames",
    "touch-the-sky": "Touch The Sky",
    "wagmi": "WAGMI",
    "diy-case": "DIY Case",
}


def pretty(slug: str) -> str:
    if slug in NAMES:
        return NAMES[slug]
    return " ".join(w.upper() if w in {"diy"} else w.capitalize() for w in slug.split("-"))


def main() -> None:
    cases = json.loads(SRC_CASES.read_text())
    drops = json.loads(SRC_DROPS.read_text())
    by_slug = {c["slug"]: c for c in cases}

    kept = []
    kept_drops = {k: v for k, v in drops.items() if k in REWARD_SLUGS}
    used_image_ids = []

    for zip_slug, old_slug in ZIP_TO_EXISTING.items():
        src = by_slug[old_slug]
        case = {
            "slug": zip_slug,
            "name": pretty(zip_slug),
            "imageId": src["imageId"],
            "image": src["image"],
            "price": src["price"],
            "bar": src["bar"],
            "hue": src["hue"],
            "risk": src["risk"],
        }
        table = drops[old_slug]
        kept.append(case)
        kept_drops[zip_slug] = table
        used_image_ids.append(src["imageId"])

    for slug in ZIP_ONLY:
        src = by_slug[slug]
        case = {
            "slug": slug,
            "name": pretty(slug),
            "imageId": src["imageId"],
            "image": src["image"],
            "price": src["price"],
            "bar": src["bar"],
            "hue": src["hue"],
            "risk": src["risk"],
        }
        kept.append(case)
        kept_drops[slug] = drops[slug]
        used_image_ids.append(src["imageId"])

    kept.sort(key=lambda c: (-c["price"], c["slug"]))

    # Renumber images 1..N so leftover Rostake art is gone
    tmp_dir = CDN / "_repack"
    if tmp_dir.exists():
        shutil.rmtree(tmp_dir)
    tmp_dir.mkdir()
    for i, case in enumerate(kept, start=1):
        src = CDN / f"{case['imageId']}.webp"
        dest = tmp_dir / f"{i}.webp"
        shutil.copy2(src, dest)
        case["imageId"] = i
        case["image"] = f"/cdn/cases/{i}.webp"

    for old in CDN.glob("*.webp"):
        old.unlink()
    for f in tmp_dir.glob("*.webp"):
        shutil.move(str(f), str(CDN / f.name))
    tmp_dir.rmdir()

    for path in (SRC_CASES, SRV_CASES):
        path.write_text(json.dumps(kept, indent=2, ensure_ascii=False) + "\n")
    for path in (SRC_DROPS, SRV_DROPS):
        path.write_text(json.dumps(kept_drops, indent=2, ensure_ascii=False) + "\n")

    print(f"kept {len(kept)} zip cases")
    print(f"drop slugs {len(kept_drops)} (includes {len(REWARD_SLUGS)} rewards)")
    print(f"webp files {len(list(CDN.glob('*.webp')))}")
    print("slugs:", ", ".join(c["slug"] for c in kept))


if __name__ == "__main__":
    main()
