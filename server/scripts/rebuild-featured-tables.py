#!/usr/bin/env python3
"""Rebuild zip-case loot tables so the pictured front items are #1/#2."""

from __future__ import annotations

import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC_CASES = ROOT / "src/lib/cases-data.json"
SRC_DROPS = ROOT / "src/lib/drops-data.json"
SRV_CASES = ROOT / "server/data/cases-data.json"
SRV_DROPS = ROOT / "server/data/drops-data.json"

T = 100_000
RTP = 0.9
REWARD_SLUGS = {"bronze-case", "silver-case", "gold-case", "platinum-case", "diamond-case"}
DROP_SLUGS = {"bryzy-case", "sorhex-case", "wagmi", "casanoah", "lucid-case"}
STOPWORDS = {
    "case", "the", "and", "for", "with", "from", "this", "that",
    "super", "time", "classic", "roblox", "ultimate", "ultimates",
    "pull", "flip", "random", "cost", "low", "high", "stakes",
    "item", "of", "a", "to", "in", "on", "it", "up", "2",
    "like", "work", "end", "sky", "bit", "all", "new",
}
GENERIC = {
    "black", "white", "red", "blue", "gold", "golden", "dark", "iron",
    "shades", "helmet", "helm", "hat", "cap", "face", "smile", "head",
    "award", "music", "video", "silver", "sparkle", "crazy", "neon",
    "happy", "battle", "flying", "potion", "queen", "crown", "lord",
    "mask", "hood", "pwnage", "ultimate", "necklace", "intern", "stylin",
    "orange", "yellow", "green", "purple", "pink", "classic",
}

# slug -> (mode, pictured top item names, extra theme keywords)
# pictured names must be #1/#2. mode: volatile | fifty | pull1 | random70 | split10
FEATURED: dict[str, tuple[str, list[str], list[str]]] = {
    "fedora-case": ("volatile", ["The Classic ROBLOX Fedora", "Azure Pinstripe Fedora"], ["fedora"]),
    "50-50": ("fifty", ["Super Super Happy Face"], ["happy", "face", "smile"]),
    "valk-case": ("volatile", ["Valkyrie Helm", "Ice Valkyrie"], ["valk"]),
    "risky-valk": ("fifty", ["Ice Valkyrie"], ["valk"]),
    "golden-case": ("volatile", ["Golden Antlers", "The Golden Robloxian"], ["gold", "golden"]),
    "crazy-hair-case": ("volatile", ["Rainbow Shaggy", "Beautiful Hair for Beautiful Space People"], ["shaggy", "hair"]),
    "music-case": ("volatile", ["Retro 80s Headphones", "Clockwork's Headphones"], ["headphones", "dj"]),
    "through-the-flames": ("volatile", ["Eerie Pumpkin Head", "Fiery Horns of the Netherworld"], ["fire", "flame", "pumpkin"]),
    "star-case": ("volatile", ["The Void Star", "Dominus Astra"], ["star", "void"]),
    "haunted-case": ("volatile", ["Ghosdeeri", "Masked Hood of the All Hallows Warlock"], ["ghost", "halloween", "warlock"]),
    "forever-blue-case": ("volatile", ["Frozen Horns of the Frigid Planes", "The Ice Crown"], ["ice", "frozen", "azure"]),
    "demonic-case": ("volatile", ["Dominus Astra", "Dominus Vespertilio"], ["dominus", "void"]),
    "toxic-case": ("volatile", ["Poisoned Horns of the Toxic Wasteland", "Radioactive Beast Mode"], ["toxic", "poison"]),
    "flashback-case": ("volatile", ["Blackvalk", "Tixvalk"], ["tix", "valk"]),
    "ice-case": ("split10", ["Frozen Horns of the Frigid Planes", "Ice Valkyrie"], ["ice", "frozen"]),
    "whiteout-case": ("volatile", ["Dice Crown", "JJ5x5's White Top Hat"], ["snow", "frost", "ice", "dice"]),
    "touch-the-sky": ("volatile", ["Supa Dupa Fly Cap", "Pink Winter Cap"], ["fly", "dupa", "wings", "sky"]),
    "dark-horns": ("volatile", ["Fiery Horns of the Netherworld", "8-Bit Dark Horns of Pwnage"], ["horn"]),
    "face-case": ("volatile", ["Super Super Happy Face", "Yum!"], ["face", "smile"]),
    "the-deep-end": ("volatile", ["Zombie Doge", "Al Capwn"], ["doge", "shark", "sea", "ocean"]),
    "wacky-case": ("volatile", ["Omega Rainbow Top Hat", "Rainbow Fedora"], ["rainbow", "omega"]),
    "headphone-case": ("volatile", ["Clockwork's Headphones", "Retro 80s Headphones"], ["headphones", "clockwork"]),
    "high-stakes-case": ("volatile", ["WC Ultimates: Pink Diamond Distraction", "CW Ultimate: Rose Quartz Rebellion"], ["diamond", "heart", "ultimates"]),
    "dominus-domination": ("volatile", ["Dominus Infernus", "Dominus Messor"], ["dominus"]),
    "fall-case": ("volatile", ["Wanwood Antlers", "Arborist's Verdant Egg of Leafyness"], ["wanwood", "leaf", "autumn"]),
    "bucket-flip": ("volatile", ["Agonizingly Red Bucket of Cheer", "Black Iron Bucket of Ultimate Pwnage"], ["bucket"]),
    "the-equalizer": ("fifty", ["Sinister Fedora"], ["fedora"]),
    "creepy-case": ("volatile", ["Playful Vampire", "I'm Secretly A Vampire, The Hat"], ["vampire"]),
    "like-clock-work": ("volatile", ["Clockwork's Shades", "Clockwork's Headphones"], ["clockwork"]),
    "creator-case": ("volatile", ["Copper Steampunk Top Hat", "Steampunk Aetherspectacles"], ["steampunk", "telamon"]),
    "antler-case": ("volatile", ["Golden Antlers", "Adurite Antlers"], ["antler"]),
    "horn-case": ("volatile", ["8-Bit Dark Horns of Pwnage", "Horns of Frozenfaic"], ["horn"]),
    "steampunk-case": ("volatile", ["Steampunkoneer", "Steampunk Bobbie"], ["steampunk"]),
    "01-pull": ("pull1", ["Dominus Astra", "The Void Star"], ["dominus", "star"]),
    "captain-doge-case": ("volatile", ["Zombie Doge", "Captain Doge"], ["doge", "pirate", "captain"]),
    "risky-case": ("volatile", ["Dominus Praefectus", "Blackvalk"], ["dominus", "valk"]),
    "gold-shades": ("volatile", ["Sparkle Time Valkyrie", "Blackvalk Shades"], ["valk", "shades", "gold"]),
    "happy-case": ("volatile", ["Super Super Happy Face", "Clown Face"], ["happy", "clown", "smile"]),
    "rose-case": ("volatile", ["The Crown of Roses", "CW Ultimate: Rose Quartz Rebellion"], ["rose", "flower"]),
    "purple-power": ("volatile", ["Purple Sparkle Time Fedora", "Knight of the Violet Abyss"], ["purple", "violet"]),
    "commando-case": ("volatile", ["Dark Assassin", "Black Iron Commando"], ["commando", "assassin"]),
    "green-case": ("volatile", ["Eyes of Emeraldwrath", "Viridian Domino Crown"], ["green", "viridian", "emerald"]),
    "circlet-case": ("volatile", ["Red Domino Crown", "Sapphire Crystal Circlet"], ["circlet", "crown"]),
    "the-kungfu-case": ("volatile", ["Crimson Katana of the Unsetting Sun", "Blue Katana of One Thousand Tears"], ["katana", "halo"]),
    "vengeance-case": ("volatile", ["Crimsonwrath: The Red Wrath", "Eyes of Crimsonwrath"], ["crimson", "blood"]),
    "blackout-boogaloo": ("volatile", ["Silverthorn Antlers", "Black Iron Antlers"], ["antler", "silverthorn"]),
    "spin-2-win": ("volatile", ["Dice Crown", "Rainbow Fedora"], ["dice", "spin"]),
    "wild-case": ("volatile", ["Yum!", "American Cowboy"], ["cowboy", "sheriff", "western", "bandit"]),
    "rozone-case": ("volatile", ["Viridian Domino Crown", "Agonizingly Green Bucket of Cheer"], ["viridian", "green"]),
    "winter-case": ("volatile", ["The Ice Skull of Nevermoor", "ColdLika: Snowman"], ["ice", "snow", "winter"]),
    "pink-case": ("volatile", ["Pink Sparkle Time Fedora", "Fuchsia Fantastique"], ["pink", "fuchsia"]),
    "zeus-case": ("volatile", ["Zeus's Lightning Bolt Staff", "Masked Hood of the Lightning Striker"], ["zeus", "lightning"]),
    "mrblox-case": ("volatile", ["The Classic ROBLOX Fedora", "Telamon Hair"], ["roblox", "fedora", "telamon"]),
    "candy-case": ("volatile", ["Yum!", "Retro Candy"], ["candy", "chocolate", "cake", "sweet"]),
    "the-fancy-case": ("volatile", ["JJ5x5's White Top Hat", "Brighteyes' Top Hat"], ["top hat", "fancy"]),
    "madness": ("volatile", ["The Void Star", "Neon Pink Crazy Crown"], ["void", "crazy"]),
    "crazy-case": ("volatile", ["Clown Face", "Neon Purple Crazy Crown"], ["crazy", "clown"]),
    "8-bit-case": ("volatile", ["8-Bit HP Bar", "8-Bit Dark Horns of Pwnage"], ["8-bit"]),
    "top-hat-case": ("volatile", ["Brighteyes' Top Hat", "JJ5x5's White Top Hat"], ["top hat"]),
    "halloween-case": ("volatile", ["Eerie Pumpkin Head", "Dark Skeleton Crown"], ["pumpkin", "halloween", "skeleton"]),
    "bling-case": ("volatile", ["Bling $$ Necklace", "Bling"], ["bling", "gold"]),
    "derek-case": ("volatile", ["Telamon Hair", "Shaggy"], ["shaggy", "telamon", "hair"]),
    "sinister-case": ("volatile", ["Sinister Fedora", "A Dark Presence"], ["sinister"]),
    "vampire-case": ("volatile", ["Playful Vampire", "Accursed Vampire Bat Hand"], ["vampire", "bat"]),
    "executed-case": ("volatile", ["Prison Life Warden", "Redcliff Crossbow"], ["prison", "warden", "redcliff", "police"]),
    "evil-case": ("volatile", ["Eyes of Crimsonwrath", "Dark Assassin"], ["evil", "crimson", "assassin"]),
    "switch-it-up": ("fifty", ["Red Illusion Fedora"], ["fedora", "shades"]),
    "egg-hunter": ("volatile", ["Arborist's Verdant Egg of Leafyness", "Chrome Egg of Speeding Bullet"], ["egg"]),
    "puzz-case": ("volatile", ["Thinking Cap", "Bluesteel Egg of Genius"], ["genius", "brain", "think", "puzzle"]),
    "spooky-flip": ("fifty", ["Playful Vampire"], ["vampire", "skull", "pumpkin"]),
    "70-random": ("random70", ["Wanwood Antlers", "Brighteyes' Top Hat"], ["antler", "hat"]),
    "craft-it-case": ("volatile", ["DIY Dominus Empyreus", "Cardboard Dino"], ["diy", "cardboard", "paper"]),
    "tie-case": ("volatile", ["Epic Face Tie", "Art Tie"], ["tie"]),
    "diy-case": ("volatile", ["DIY Dominus Empyreus", "Paper Hat"], ["diy", "paper", "cardboard"]),
    "budget-case": ("volatile", ["Sleek Sunglasses", "Classicx89's Stylin' Intern Shades"], ["shades", "sunglasses"]),
    "low-cost-king": ("volatile", ["The Red King", "Golden Crown of Warlords"], ["king", "crown"]),
    "the-grind": ("grind", ["Emerald Valk Shades", "Rainbow Band Fedora"], ["fedora", "hat"]),
    "the-gucci-sampler": ("volatile", ["Gucci Dionysus Bag with Bee", "Gucci Spiked Basketball Bag"], ["gucci"]),
    "rags-2-riches": ("volatile", ["The Classic ROBLOX Fedora", "Bloxy Cola"], ["fedora", "cola"]),
    "budget-flip": ("fifty", ["Faux Viridian Fedora"], ["fedora", "cola"]),
}


def load_pool() -> tuple[dict[str, dict], dict[str, dict]]:
    catalog = json.loads((ROOT / "src/lib/items-data.json").read_text())
    have = {p.stem for p in (ROOT / "public/cdn/items").glob("*.webp")}
    by_name: dict[str, dict] = {}
    by_lower: dict[str, dict] = {}

    def add(name: str, iid: int, value: int) -> None:
        rec = {"name": name.strip(), "id": iid, "value": int(value)}
        by_name[rec["name"]] = rec
        by_lower[rec["name"].lower()] = rec

    for it in catalog:
        if str(it["id"]) not in have:
            continue
        add(it["name"], it["id"], it["value"])

    # Keep unofficial extras already pictured in the zip cases (not all are limiteds).
    old_drops = json.loads(SRC_DROPS.read_text())
    for arr in old_drops.values():
        for it in arr:
            if str(it["id"]) not in have:
                continue
            key = it["name"].strip().lower()
            if key in by_lower:
                continue
            add(it["name"], it["id"], it["value"])
    return by_name, by_lower


def fmt_chance(tickets: int):
    c = tickets / 1000
    rounded = round(c + 1e-12, 2)
    if abs(rounded - round(rounded)) < 1e-9:
        return int(round(rounded))
    return float(f"{rounded:.2f}")


def apply_tickets(items: list[dict], tickets: list[int]) -> list[dict]:
    t = 0
    out = []
    for it, n in zip(items, tickets):
        rec = {
            "name": it["name"],
            "id": it["id"],
            "value": it["value"],
            "chance": fmt_chance(n),
            "color": color_for(it["value"], items[0]["value"] if items else it["value"]),
            "minTicket": t,
            "maxTicket": t + n - 1,
        }
        t += n
        out.append(rec)
    if out:
        out[-1]["maxTicket"] = T - 1
    return out


def color_for(value: int, top: int) -> str:
    r = value / max(top, 1)
    if r >= 0.45:
        return "YELLOW"
    if r >= 0.12:
        return "PURPLE"
    if r >= 0.03:
        return "BLUE"
    return "GRAY"


def ev_of(values, tickets) -> float:
    return sum(v * t for v, t in zip(values, tickets)) / T


def fit_tickets(values: list[int], start: list[int], target_ev: float) -> list[int]:
    n = len(values)
    order = sorted(range(n), key=lambda i: (values[i], i))
    t = [1] * n
    leftover = T - n
    t[order[0]] += leftover
    tgt = min(max(target_ev, min(values) + 1e-6), max(values) - 1e-6)
    if start and len(start) == n:
        shaped = [max(1, int(x)) for x in start]
        s = sum(shaped)
        shaped = [max(1, int(round(x * T / s))) for x in shaped]
        shaped[-1] += T - sum(shaped)
        if shaped[-1] < 1:
            donor = max(range(n - 1), key=lambda j: shaped[j])
            shaped[donor] += shaped[-1] - 1
            shaped[-1] = 1
        if abs(ev_of(values, shaped) - tgt) <= abs(ev_of(values, t) - tgt):
            t = shaped

    def nudge(err: float) -> bool:
        srcs = reversed(order) if err > 0 else order
        dsts = order if err > 0 else reversed(order)
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

    for _ in range(n * 10):
        err = ev_of(values, t) - tgt
        if abs(err) < 0.08:
            break
        if not nudge(err):
            break
    t[order[0]] += T - sum(t)
    if t[order[0]] < 1:
        donor = max(range(n), key=lambda j: t[j] if j != order[0] else -1)
        t[donor] += t[order[0]] - 1
        t[order[0]] = 1
    return t


def nice_price(ev: float) -> int:
    price = ev / RTP
    if price < 50:
        step = 1
    elif price < 200:
        step = 5
    elif price < 1000:
        step = 10
    elif price < 5000:
        step = 25
    elif price < 20000:
        step = 50
    elif price < 100000:
        step = 100
    elif price < 500000:
        step = 500
    else:
        step = 1000
    return max(step, int(math.ceil(price / step - 1e-12) * step))


def resolve(name: str, by_name: dict, by_lower: dict) -> dict | None:
    if name in by_name:
        return by_name[name]
    return by_lower.get(name.lower().strip())


def closest(items: list[dict], target: float, used: set[int], lo: float, hi: float) -> dict | None:
    opts = [x for x in items if x["id"] not in used and lo <= x["value"] <= hi]
    if not opts:
        return None
    return min(opts, key=lambda x: abs(x["value"] - target))


def clone_item(it: dict, value: int | None = None) -> dict:
    rec = {"name": it["name"], "id": it["id"], "value": int(it["value"])}
    if value is not None:
        rec["value"] = max(1, int(value))
    return rec


def theme_keys(slug: str, extra: list[str]) -> list[str]:
    keys: list[str] = []
    seen: set[str] = set()

    def add(k: str, force: bool = False) -> None:
        k = k.lower().strip()
        if not k or len(k) < 3 or k in seen:
            return
        if not force and (k in STOPWORDS or k in GENERIC):
            return
        seen.add(k)
        keys.append(k)

    for k in extra:
        add(k, force=True)
    for w in slug.replace("_", "-").split("-"):
        if len(w) >= 4:
            add(w)
    return keys


def themed(all_items: list[dict], keywords: list[str]) -> list[dict]:
    if not keywords:
        return []
    pats = []
    for k in keywords:
        esc = re.escape(k)
        if len(k) <= 3:
            pats.append(re.compile(rf"(?:^|[^a-z0-9]){esc}(?:[^a-z0-9]|$)", re.I))
        else:
            pats.append(re.compile(rf"(?:^|[^a-z0-9]){esc}", re.I))
    out = []
    for it in all_items:
        if it["name"].strip() in {"??", "?"}:
            continue
        if any(p.search(it["name"]) for p in pats):
            out.append(it)
    return out


def retune_ladder(top_val: int, n: int) -> list[int]:
    vals: list[int] = []
    v = float(top_val)
    for i in range(n):
        v *= 0.5 if i == 0 else 0.56
        vals.append(max(1, int(round(v))))
    for i in range(1, n):
        cap = max(1, vals[i - 1] - max(1, vals[i - 1] // 10))
        vals[i] = min(vals[i], cap)
        vals[i] = max(1, vals[i])
    return vals


def spread_pick(pool: list[dict], n: int, used: set[int]) -> list[dict]:
    avail = [x for x in pool if x["id"] not in used and x["name"].strip() not in {"??", "?"}]
    avail.sort(key=lambda x: (-x["value"], x["name"]))
    if not avail:
        return []
    if len(avail) <= n:
        for x in avail:
            used.add(x["id"])
        return avail
    picked: list[dict] = []
    for i in range(n):
        idx = int(round(i * (len(avail) - 1) / max(n - 1, 1)))
        chosen = None
        for delta in range(len(avail)):
            for k in (idx + delta, idx - delta):
                if 0 <= k < len(avail) and avail[k]["id"] not in used:
                    chosen = avail[k]
                    break
            if chosen:
                break
        if chosen is None:
            break
        picked.append(chosen)
        used.add(chosen["id"])
    return picked


def pick_fillers(theme: list[dict], all_items: list[dict], top_val: int, used: set[int], n: int) -> list[dict]:
    """Themed items first. Case values are retuned to a ladder under the showcase item."""
    src = spread_pick(theme, n, used)
    if not src:
        src = spread_pick(all_items, min(n, 8), used)
    src.sort(key=lambda x: (-x["value"], x["name"]))
    ladder = retune_ladder(top_val, len(src))
    return [clone_item(it, ladder[i]) for i, it in enumerate(src)]


def weights_for(mode: str, n: int) -> list[int]:
    if mode == "fifty":
        return [47000, 53000][:n]
    if mode == "pull1":
        w = [1000, 2500, 5000, 9000, 15000, 25000]
        w = (w + [0] * n)[: n - 1]
        w.append(T - sum(w))
        return w
    if mode == "random70":
        w = [1500, 3500, 6000, 8000, 10000]
        w = (w + [0] * n)[: n - 1]
        w.append(T - sum(w))  # ~70% junk if n=7
        return w
    if mode == "split10":
        # 10 / 10 / 80 split across remaining
        rest = T - 20000
        extra = n - 2
        chunk = rest // max(extra, 1)
        w = [10000, 10000] + [chunk] * extra
        w[-1] += T - sum(w)
        return w
    if mode == "grind":
        w = [2500, 6000, 12000, 18000, 22000, 22000]
        w = (w + [0] * n)[: n - 1]
        w.append(T - sum(w))
        return w
    # volatile
    w = [900, 1800, 3500, 5500, 8000, 11000, 14000, 18000, 22000]
    w = (w + [0] * n)[: n - 1]
    w.append(T - sum(w))
    return w


def build_case(slug: str, cfg, all_items, by_name, by_lower) -> tuple[list[dict], list[str], int]:
    mode, tops, extra_keys = cfg
    missing = []
    used: set[int] = set()
    pictured = []
    for name in tops:
        it = resolve(name, by_name, by_lower)
        if it is None:
            missing.append(name)
            continue
        if it["id"] in used:
            continue
        pictured.append(clone_item(it))
        used.add(it["id"])
    if not pictured:
        raise RuntimeError(f"no pictured items resolved: {tops}")

    keys = theme_keys(slug, extra_keys)
    theme = themed(all_items, keys)
    top_val = pictured[0]["value"]
    # crate-art item stays #1 with its real catalog price
    if len(pictured) > 1 and pictured[1]["value"] >= top_val:
        pictured[1]["value"] = max(1, int(top_val * 0.55))

    if mode == "fifty":
        high = pictured[0]
        low = pictured[1] if len(pictured) > 1 else None
        if low is None or low["value"] > high["value"] * 0.45:
            low = closest(theme, max(1, high["value"] * 0.08), used, 1, high["value"] * 0.4) or closest(
                theme, max(1, high["value"] * 0.08), used, 1, high["value"] * 0.85
            ) or closest(all_items, max(20, high["value"] * 0.04), used, 1, high["value"] * 0.2)
        picked = [high, low]
        tickets = [47000, 53000]
        ev = ev_of([x["value"] for x in picked], tickets)
        price = nice_price(ev)
        tickets = fit_tickets([x["value"] for x in picked], tickets, RTP * price)
        # keep it looking like a 50/50
        if tickets[0] < 40000:
            tickets[0] = 45000
            tickets[1] = 55000
            price = nice_price(ev_of([x["value"] for x in picked], tickets))
        table = apply_tickets(picked, tickets)
        return table, missing, price

    fillers = pick_fillers(theme, all_items, top_val, used, 10 - len(pictured))
    picked = pictured + fillers
    n = len(picked)
    w = weights_for(mode, n)
    values = [x["value"] for x in picked]

    # lock featured odds on the pictured slots
    pictured_n = len(pictured)
    tickets = list(w)
    if sum(tickets) != T:
        tickets[-1] += T - sum(tickets)

    if mode == "pull1":
        tickets[0] = 1000
    elif mode == "split10":
        tickets[0] = 10000
        if pictured_n > 1:
            tickets[1] = 10000
    elif mode == "random70":
        tickets[-1] = 70000
    elif mode == "grind":
        tickets[0] = max(tickets[0], 2500)
        if pictured_n > 1:
            tickets[1] = max(tickets[1], 5000)

    # pictured #2 should stay a real featured drop, not a 0.001% leftover
    if pictured_n > 1:
        tickets[1] = max(tickets[1], 1800)
    tickets[0] = max(tickets[0], 700)
    s = sum(tickets)
    if s != T:
        tickets[-1] += T - s
        if tickets[-1] < 1:
            steal = 1 - tickets[-1]
            donor = max(range(n - 1), key=lambda i: tickets[i] if i >= pictured_n else -1)
            tickets[donor] = max(1, tickets[donor] - steal)
            tickets[-1] = 1
            tickets[-1] += T - sum(tickets)

    ev = ev_of(values, tickets)
    price = max(10, nice_price(ev))
    # nudge only filler tickets to hit 10% HE
    locked = tickets[:pictured_n]
    rest_start = tickets[pictured_n:]
    if rest_start:
        rest_target = RTP * price - ev_of(values[:pictured_n], locked)
        rest_vals = values[pictured_n:]
        # scale rest tickets to remaining T
        rest_t = T - sum(locked)
        scaled = [max(1, int(round(x * rest_t / max(sum(rest_start), 1)))) for x in rest_start]
        scaled[-1] += rest_t - sum(scaled)
        if rest_target > 0:
            scaled = fit_tickets(rest_vals, scaled, rest_target * T / rest_t if rest_t else rest_vals[-1])
            # fit_tickets uses T globally; instead just keep scaled
            scaled = [max(1, int(round(x * rest_t / max(sum(scaled), 1)))) for x in scaled]
            scaled[-1] += rest_t - sum(scaled)
        tickets = locked + scaled
    tickets[-1] += T - sum(tickets)
    if tickets[-1] < 1:
        tickets[-1] = 1
        tickets[pictured_n] = max(1, tickets[pictured_n] + (T - sum(tickets)))

    ev = ev_of(values, tickets)
    price = max(10, nice_price(ev))
    table = apply_tickets(picked, tickets)
    return table, missing, price


def risk_for(mode: str, table: list[dict], price: int) -> str:
    if mode in {"fifty", "pull1", "random70", "split10"}:
        return "high"
    if mode == "grind":
        return "medium"
    top = table[0]["value"] / max(price, 1)
    return "high" if top >= 8 else "medium"


def main() -> None:
    by_name, by_lower = load_pool()
    all_items = sorted(by_name.values(), key=lambda x: -x["value"])
    print(f"pool {len(all_items)} items with images")
    cases = [c for c in json.loads(SRC_CASES.read_text()) if c["slug"] not in DROP_SLUGS]
    old_drops = json.loads(SRC_DROPS.read_text())
    reward_drops = {k: v for k, v in old_drops.items() if k in REWARD_SLUGS}

    missing_all = []
    new_drops = dict(reward_drops)
    unmatched = []
    for c in cases:
        slug = c["slug"]
        if slug not in FEATURED:
            unmatched.append(slug)
            continue
        table, missing, price = build_case(slug, FEATURED[slug], all_items, by_name, by_lower)
        missing_all.extend((slug, m) for m in missing)
        mode = FEATURED[slug][0]
        c["price"] = price
        c["risk"] = risk_for(mode, table, price)
        # recolor vs case price
        for it in table:
            r = it["value"] / max(price, 1)
            it["color"] = "YELLOW" if r >= 5 else "PURPLE" if r >= 1.4 else "BLUE" if r >= 0.4 else "GRAY"
        new_drops[slug] = table

    if unmatched:
        raise SystemExit(f"no featured mapping for: {unmatched}")

    cases.sort(key=lambda c: (-c["price"], c["slug"]))
    for path in (SRC_CASES, SRV_CASES):
        path.write_text(json.dumps(cases, indent=2, ensure_ascii=False) + "\n")
    for path in (SRC_DROPS, SRV_DROPS):
        path.write_text(json.dumps(new_drops, indent=2, ensure_ascii=False) + "\n")

    keep_imgs = set()
    for c in cases:
        if c.get("image"):
            keep_imgs.add(Path(c["image"]).name)
        if c.get("imageId") is not None:
            keep_imgs.add(f"{c['imageId']}.webp")
    for p in (ROOT / "public/cdn/cases").glob("*.webp"):
        if p.name not in keep_imgs:
            p.unlink()
            print("removed art", p.name)

    print(f"rebuilt {len(cases)} cases")
    if missing_all:
        print("MISSING NAMES:")
        for row in missing_all:
            print(" ", row)
    print("--- house edge / pictured ---")
    hes = []
    for c in cases:
        arr = new_drops[c["slug"]]
        ev = sum(it["value"] * (it["maxTicket"] - it["minTicket"] + 1) / T for it in arr)
        he = (1 - ev / c["price"]) * 100
        hes.append(he)
        top = arr[0]
        second = arr[1] if len(arr) > 1 else top
        print(
            f"{c['slug']:22} ${c['price']:<8} he={he:5.2f}%  "
            f"#1 {top['chance']:>6}% {top['name']}  |  #2 {second['chance']:>6}% {second['name']}"
        )
    print(f"HE {min(hes):.2f}–{max(hes):.2f} mean {sum(hes)/len(hes):.3f}")


if __name__ == "__main__":
    main()
