#!/usr/bin/env python3
"""Copy screenshot loot tables (items, values, chances, case prices) onto the catalog."""

from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
SRC_CASES = ROOT / "src/lib/cases-data.json"
SRC_DROPS = ROOT / "src/lib/drops-data.json"
SRV_CASES = ROOT / "server/data/cases-data.json"
SRV_DROPS = ROOT / "server/data/drops-data.json"
ITEMS = ROOT / "src/lib/items-data.json"
CDN_ITEMS = ROOT / "public/cdn/items"

T = 100_000

# unofficial screenshot fillers that are not Rolimons limiteds
EXTRAS = [
    (7000000001, ":]", 15, (255, 214, 90)),
    (7000000002, "Rainbow Flame Aura - Top", 25, (255, 90, 200)),
    (7000000003, "Color Changing Tophat - Red to Black", 50, (220, 70, 70)),
    (7000000004, "Color Changing Tophat - Blue to Black", 50, (70, 120, 220)),
    (7000000005, "Shadowed Head", 50, (70, 70, 80)),
    (7000000006, "Laughing Fun", 100, (255, 180, 40)),
    (7000000007, "Oversized Deal With It Shades", 50, (30, 30, 30)),
    (7000000008, "Beautiful Hair for Beautiful People", 95, (90, 60, 40)),
    (7000000009, "Yellow Toony Antlers", 79, (255, 210, 50)),
    (7000000010, "Fearsome Phones", 500, (180, 40, 40)),
    (7000000011, "A Frosty Friend", 125, (180, 230, 255)),
    (7000000012, "Bone Collector's Crown", 300, (230, 230, 220)),
    (7000000013, "Banana Wizard", 300, (255, 220, 40)),
    (7000000014, "Ocherous Helm of the Setting Sun", 330, (210, 120, 40)),
    (7000000015, "Electromagnetic Goggles", 350, (80, 180, 255)),
    (7000000016, "Yellow Dragon Plush Cap", 150, (255, 200, 40)),
    (7000000017, "Zombie Pumpkin", 200, (80, 160, 50)),
]

# slug -> (case_price or 0 to keep, [(name, value, chance_pct), ...])
# empty item list = update price only
TABLES: dict[str, tuple[int, list[tuple[str, int, float]]]] = {
    "antler-case": (34545, []),
    "risky-valk": (19621, [
        ("Valkyrie Helm", 229730, 50.0),
        (":]", 15, 50.0),
    ]),
    "purple-power": (3287, [
        ("Beautiful Hair for Beautiful Space People", 8777, 15.0),
        ("Purple Starface", 8141, 10.0),
        ("Fancy Purple Hat", 3187, 10.0),
        ("Purple Steampunk Robin Hood", 1275, 20.0),
        ("Purple Crazy Glasses", 935, 30.0),
        ("Rainbow Flame Aura - Top", 25, 5.0),
        (":]", 15, 10.0),
    ]),
    "crazy-case": (45, [
        ("Explosive Egg of Kaboom!", 735, 5.0),
        ("Gucci GG Marmont Bag", 733, 5.0),
        ("Boxing Gloves - KSI", 579, 10.0),
        ("Gucci Spiked Basketball Bag", 556, 10.0),
        ("Electromagnetic Goggles", 350, 20.0),
        ("Ocherous Helm of the Setting Sun", 330, 20.0),
        ("Banana Wizard", 300, 15.0),
        ("Queen of Hearts", 300, 15.0),
    ]),
    "pink-case": (13953, [
        ("Pink Sparkle Time Fedora", 2057684, 0.05),
        ("WC Ultimates: Pink Diamond Distraction", 154794, 1.0),
        ("Neon Pink Crazy Crown", 139714, 2.0),
        ("Pink Galaxy Gaze", 58732, 7.95),
        ("Glorious Pink Party Queen", 31352, 2.0),
        ("Neon Pink Top Hat", 22205, 1.0),
        ("Ultimate Pink Victory", 21854, 10.0),
        ("Pink Mermaid Princess", 21808, 10.0),
        ("Pinky The Cyclops", 16067, 12.0),
        ("Neon Pink Shaggy", 5934, 18.0),
        ("Pink Winter Cap", 5485, 18.0),
        ("So Super Excited - Pink", 5423, 18.0),
    ]),
    "gold-shades": (5376, [
        ("Gold Emperor of the Night", 45387, 3.0),
        ("Blackvalk Shades", 35573, 5.0),
        ("Rubber Duckie", 7701, 10.0),
        ("Exploding Lab Table", 4033, 12.0),
        ("Gucci Diamond-Framed Sunglasses", 709, 40.0),
        ("Gucci Guitar Case", 695, 30.0),
    ]),
    "fall-case": (48506, [
        ("The Void Star", 765207, 0.5),
        ("Azurewrath, Lord of the Void", 216788, 0.5),
        ("Emperor of the Federation", 175330, 5.0),
        ("Voidwrath", 158231, 4.0),
        ("Silver Punk Face", 151166, 1.0),
        ("Antenna Antlers", 145650, 1.0),
    ]),
    "star-case": (43446, [
        ("Black Iron King of the Night", 437499, 2.0),
        ("Yellow Glowing Eyes", 338341, 1.0),
        ("Bluesteel Domino Crown", 335743, 0.5),
        ("Poisoned Horns of the Toxic Wasteland", 327178, 0.25),
        ("): Purple Indy", 316498, 0.25),
        ("Countess of the Federation", 296718, 1.0),
    ]),
    "low-cost-king": (75, [
        ("Laughing Fun", 100, 20.0),
        ("Beautiful Hair for Beautiful People", 95, 20.0),
        ("Yellow Toony Antlers", 79, 20.0),
        ("Shadowed Head", 50, 20.0),
        (":]", 15, 20.0),
    ]),
    "budget-case": (47, [
        ("Casual Sunglasses Pocket", 1003, 1.0),
        ("Color Changing Tophat - Red to Black", 50, 25.0),
        ("Color Changing Tophat - Blue to Black", 50, 14.0),
        ("Rainbow Flame Aura - Top", 25, 30.0),
        (":]", 15, 30.0),
    ]),
    "ice-case": (57954, []),
    "the-equalizer": (44, [
        ("Laughing Fun", 100, 10.0),
        ("Color Changing Tophat - Red to Black", 50, 20.0),
        ("Color Changing Tophat - Blue to Black", 50, 10.0),
        ("Oversized Deal With It Shades", 50, 10.0),
        ("Rainbow Flame Aura - Top", 25, 20.0),
        (":]", 15, 30.0),
    ]),
    "toxic-case": (0, [
        ("Poisoned Horns of the Toxic Wasteland", 327178, 1.0),
        ("Green Bubble Trouble", 31798, 9.0),
        ("Green Wistful Wink", 15375, 5.0),
        ("Lime Green Shaggy", 14991, 5.0),
        ("Greenbot", 3019, 10.0),
        ("Putrid Green Head in A Jar", 2920, 15.0),
        ("Color Changing Tophat - Red to Black", 50, 20.0),
        ("Rainbow Flame Aura - Top", 25, 15.0),
        (":]", 15, 20.0),
    ]),
    "dominus-domination": (24269, [
        ("Dominus Empyreus", 7419144, 0.01),
        ("Dominus Rex", 1538205, 0.2),
        ("Dominus Messor", 1264458, 0.3),
        ("Dominus Vespertilio", 597165, 0.4),
        ("Dominus Praefectus", 369917, 0.5),
        ("Dominus Formidulosus", 84413, 1.0),
    ]),
    "the-kungfu-case": (3075, [
        ("Orange Ninja Headband of All Earth's Fire", 68220, 1.0),
        ("Ninja Master: Dojo of Doom", 17424, 1.0),
        ("Orange Shaggy", 12387, 3.0),
        ("Orange Goggles", 7833, 5.0),
        ("Orange Starface", 6691, 10.0),
        ("Ninja Bandolier", 2444, 15.0),
        ("White Ninja Headband of the Unimpeachable Soul", 1228, 10.0),
        ("Shadowed Head", 50, 20.0),
        ("Rainbow Flame Aura - Top", 25, 15.0),
        (":]", 15, 20.0),
    ]),
    "high-stakes-case": (16518, []),
    "top-hat-case": (3497, [
        ("Collision Top Hat", 40699, 5.0),
        ("Green Banded Top Hat", 11352, 5.0),
        ("Scare Mayor Top Hat", 2705, 20.0),
        ("Color Changing Tophat - Red to Black", 50, 35.0),
        ("Color Changing Tophat - Blue to Black", 50, 35.0),
    ]),
    "wild-case": (2979, [
        ("Jungle Commando", 7533, 5.0),
        ("Green Trance", 6962, 5.0),
        ("Putrid Green Head in A Jar", 2920, 20.0),
        ("Torque the Green Orc", 2893, 20.0),
        ("Green Ultimate Dragon Face", 1641, 50.0),
    ]),
    "demonic-case": (20031, []),
    "green-case": (24856, [
        ("Red Glowing Eyes", 520913, 0.25),
        ("Green Glowing Eyes", 349991, 0.25),
        ("Yellow Glowing Eyes", 338341, 0.25),
        ("Eyes of Crimsonwrath", 274060, 0.25),
        ("Eyes of Azurewrath", 226729, 1.0),
        ("Eyes of Emeraldwrath", 176170, 1.0),
        ("Green Sidewinder", 151918, 2.5),
        ("Green Galaxy Gaze", 106910, 2.5),
        ("Brighteyes' Bloxy Cola Hat", 102799, 1.0),
        ("Green Ice Crown", 68035, 5.0),
        ("Green Bubble Trouble", 31798, 5.0),
        ("Green Laurel Wreath", 27306, 5.0),
        ("Green Drool Angry Zombie", 19887, 1.0),
        ("Green Wistful Wink", 15375, 1.0),
        ("Lime Green Shaggy", 14991, 1.0),
        ("Green Banded Top Hat", 11352, 1.0),
        ("Green-eyed Awesome Face", 10647, 1.0),
        ("Green Super Happy Face", 10485, 1.0),
        (":]", 15, 70.0),
    ]),
    "spin-2-win": (125, [
        ("Fearsome Phones", 500, 10.0),
        ("Yellow Dragon Plush Cap", 150, 20.0),
        ("A Frosty Friend", 125, 10.0),
        ("Laughing Fun", 100, 10.0),
        ("Rainbow Flame Aura - Top", 25, 30.0),
        (":]", 15, 20.0),
    ]),
    "rozone-case": (4638, []),
    "vengeance-case": (615, [
        ("Friday the 13th Top Hat", 3568, 10.0),
        ("GucciGhost Bag", 593, 10.0),
        ("Electromagnetic Goggles", 350, 10.0),
        ("Queen of Hearts", 330, 10.0),
        ("Bone Collector's Crown", 300, 10.0),
        ("Banana Wizard", 300, 10.0),
        ("Color Changing Tophat - Red to Black", 50, 10.0),
        ("Color Changing Tophat - Blue to Black", 50, 10.0),
        ("Rainbow Flame Aura - Top", 25, 10.0),
        (":]", 15, 10.0),
    ]),
    "vampire-case": (16542, [
        ("Vampire Sunglasses", 69799, 5.0),
        ("Playful Vampire", 57814, 15.0),
        ("Glorious Vampire Party Queen", 29333, 5.0),
        ("I'm Secretly A Vampire, The Hat", 21697, 5.0),
        ("Wanderer Vampire Slayer", 3858, 5.0),
        ("Accursed Vampire Bat Hand", 2431, 5.0),
        ("Color Changing Tophat - Red to Black", 50, 20.0),
        ("Rainbow Flame Aura - Top", 25, 20.0),
        (":]", 15, 20.0),
    ]),
    "executed-case": (13703, []),
    "crazy-hair-case": (4109, [
        ("Stickmasterluke's Peanut Butter Sparkle Time", 53465, 5.0),
        ("Beautiful Hair for Beautiful Space People", 8777, 5.0),
        ("Lost Boy of Summer Hair", 2975, 10.0),
        ("Xtreme Monochrome Hair", 2765, 10.0),
        ("Beautiful Hair for Beautiful People", 95, 30.0),
        ("Shadowed Head", 50, 40.0),
    ]),
    "headphone-case": (3676, [
        ("Platinum Pirate Headphones", 12965, 5.0),
        ("Roblox Headphones", 4298, 15.0),
        ("ROBLOX Hexagon Headphones", 3295, 20.0),
        ("Redcliff Headphones", 3287, 20.0),
        ("Star Player Headphones", 1327, 40.0),
    ]),
    "valk-case": (67804, [
        ("Blackvalk", 3258507, 0.5),
        ("Emerald Valkyrie", 1768372, 0.5),
        ("Ice Valkyrie", 251011, 4.0),
        ("Valkyrie Helm", 229730, 5.0),
        ("Blackvalk Shades", 35573, 20.0),
        ("Valkyrie 3000", 11656, 30.0),
    ]),
    "music-case": (36916, [
        ("Clockwork's Headphones", 521690, 1.0),
        ("Yum!", 345801, 1.0),
        ("Retro 80s Headphones", 94609, 5.0),
        ("Viridian Headphones", 55888, 25.0),
        ("Recycled Cardboard Headphones", 50646, 5.0),
        ("Death Metal Headphones", 32621, 5.0),
    ]),
    "creepy-case": (1653, [
        ("Miss Scarlet", 38899, 1.0),
        ("Orange Starface", 6691, 9.0),
        ("Powerface: Extreme Fire", 2253, 10.0),
        ("Green Ultimate Dragon Face", 1641, 10.0),
        ("Powerface: Wretched Wind", 1030, 10.0),
        ("Color Changing Tophat - Red to Black", 50, 20.0),
        ("Rainbow Flame Aura - Top", 25, 20.0),
        (":]", 15, 20.0),
    ]),
    "rags-2-riches": (783, [
        ("Dominus Formidulosus", 84413, 0.05),
        ("Gold Emperor of the Night", 45387, 0.1),
        ("Gucci Headband", 711, 49.8),
        ("Gucci Geometric Bag", 537, 50.05),
    ]),
    "like-clock-work": (15549, [
        ("Clockwork's Shades", 0, 5.0),
        ("Clockwork's Headphones", 521690, 5.0),
        ('"Like Clockwork" Top Hat', 0, 20.0),
        ("DIY Clockwork", 0, 20.0),
        ("Paper Hat", 95, 50.0),
    ]),
    "the-grind": (1067, [
        ("Red Grind Skateboard", 4620, 1.0),
        ("Ruby Archfey Visage", 3371, 5.0),
        ("DJ Remix's Goldphones", 3354, 4.0),
        ("Agonizingly Ugly Egg of Screensplat", 765, 40.0),
        ("Gucci Geometric Bag", 630, 50.0),
    ]),
    "mrblox-case": (2056, []),
    "steampunk-case": (2984, [
        ("The Maker Fedora", 200000, 0.5),
        ("Crimsonwrath, Lord of the Magma", 50537, 1.0),
        ("Metal Cthulhu Minion", 6723, 5.0),
        ("Gearloose Goggles", 5648, 5.0),
        ("Labor Day 2009 Gear Goggles", 3141, 5.0),
        ("Metal Feathers of Fate", 2059, 5.0),
    ]),
    "creator-case": (0, [
        ("Bay Area Maker Top Hat 2014", 244478, 1.0),
        ("Dark Knight Helmet", 50000, 1.0),
        ("Silver Cyborg Face Gear", 10844, 5.0),
        ("Gearloose Goggles", 5648, 15.0),
        ("Sharp Looking Hat - the Gear", 2575, 18.0),
        ("Noob Attack: Gearworks Grapple", 1109, 25.0),
        (":]", 15, 35.0),
    ]),
    "spooky-flip": (952, [
        ("Bat Tie", 1099, 50.0),
        ("Gucci Geometric Bag", 630, 50.0),
    ]),
    "the-fancy-case": (1564, [
        ("Purple Crystal Circlet", 5757, 5.0),
        ("Diamond Crystal Circlet", 4378, 7.0),
        ("Blue Mardi Gras Mask", 3004, 8.0),
        ("Gucci Bloom Perfume", 854, 25.0),
        ("Specular Egg of Red, No Blue", 760, 20.0),
        ("Gucci Geometric Bag", 630, 35.0),
    ]),
    "bling-case": (20293, [
        ("Bling $$ Necklace", 939382, 0.5),
        ("The Golden Robloxian", 653698, 0.5),
        ("Bluesteel Bling $$ Necklace", 341171, 1.0),
        ("): Gold Ollie", 260090, 0.5),
        ("GoldLika: Boss", 175468, 0.5),
        ("Bling Boy's Raiment", 100398, 1.0),
    ]),
    "blackout-boogaloo": (4131, [
        ("Black Iron Horns of Pwnage", 48595, 5.0),
        ("Black Paintball Mask", 5087, 10.0),
        ("Black Lightning", 3230, 10.0),
        ("Black Iron Commando", 3088, 15.0),
        ("Color Changing Tophat - Red to Black", 50, 30.0),
        ("Color Changing Tophat - Blue to Black", 50, 30.0),
    ]),
    "risky-case": (78192, []),
    "face-case": (6037, [
        ("Super Super Happy Face", 94077, 5.0),
        ("Green Starface", 3123, 15.0),
        ("Powerface: Wretched Wind", 1030, 20.0),
        ("Serious Scar Face", 400, 25.0),
        ("Laughing Fun", 100, 5.0),
        (":]", 15, 30.0),
    ]),
    "evil-case": (3349, [
        ("Dominus Praefectus", 369917, 0.01),
        ("Sad Clown", 30583, 4.99),
        ("Purple Alien", 8087, 5.0),
        ("Overseer Collar", 5023, 10.0),
        ("Ornate Creature Horns", 1082, 10.0),
        ("Casual Sunglasses Pocket", 1003, 10.0),
        ("Gucci Horsebit 1955 Shoulder Bag", 655, 15.0),
        ("Gucci Geometric Bag", 630, 15.0),
        ("GucciGhost Bag", 593, 15.0),
        ("Gucci Spiked Basketball Bag", 556, 15.0),
    ]),
    "through-the-flames": (1627, [
        ("Sinister S.", 25378, 0.7),
        ("Sinister P.", 6132, 5.0),
        ("Dr. Spooks Magic Top Hat", 3016, 8.0),
        ("Sinister Branches", 1973, 15.0),
        ("Bat Tie", 1099, 35.0),
        ("Zombie Pumpkin", 200, 36.3),
    ]),
    "derek-case": (37812, [
        ("Fiery Horns of the Netherworld", 324023, 5.0),
        ("Frozen Horns of the Frigid Planes", 275438, 2.0),
        ("Duke of the Fallen Federation", 190215, 1.0),
        ("Red Balloon", 139965, 1.0),
        ("Red Ice Crown", 98991, 1.0),
        ("Agonizingly Red Bucket of Cheer", 96709, 1.0),
        ("Red RAWR", 69204, 1.0),
        ("Red Fang", 48962, 1.0),
        ("Black Iron Horns of Pwnage", 48595, 1.0),
        ("Red Crown of Ozymandias", 45833, 1.0),
        ("Redspybot", 41022, 1.0),
        ("Crimsonwrath: The Red Wrath", 30153, 1.0),
    ]),
    "circlet-case": (1515, [
        ("Purple Crystal Circlet", 5757, 5.0),
        ("Diamond Crystal Circlet", 4378, 5.0),
        ("HotThoth's Voodoo Doll", 2009, 12.0),
        ("Gucci Bloom Perfume", 854, 38.0),
        ("Specular Egg of Red, No Blue", 760, 40.0),
    ]),
    "forever-blue-case": (2074, [
        ("Arctic Commando", 146325, 0.1),
        ("Blue Sniper's Visor", 9215, 4.9),
        ("Bluesteel Bathysphere", 1982, 15.0),
        ("Blue Pocket Pal", 1616, 20.0),
        ("Torque the Blue Orc", 1453, 20.0),
        ("Bluesteel Egg of Genius", 1118, 20.0),
        ("Specular Egg of Red, No Blue", 760, 20.0),
    ]),
    "dark-horns": (23137, []),
    "wacky-case": (2425, [
        ("Rainbow Hatbot", 10977, 10.0),
        ("Halloween Santa Hat", 2989, 15.0),
        ("Target Hat", 2441, 15.0),
        ("Vans Checkerboard Bucket Hat", 1009, 20.0),
        ("Gucci Wide Brim Felt Hat", 749, 10.0),
        ("Color Changing Tophat - Red to Black", 50, 30.0),
    ]),
    "switch-it-up": (190, [
        ("Gucci Geometric Bag", 630, 10.0),
        ("GucciGhost Bag", 593, 10.0),
        ("Laughing Fun", 100, 10.0),
        ("Beautiful Hair for Beautiful People", 95, 10.0),
        ("Color Changing Tophat - Red to Black", 50, 30.0),
        ("Color Changing Tophat - Blue to Black", 50, 30.0),
    ]),
    "the-gucci-sampler": (864, [
        ("Gucci Dionysus Bag with Bee", 16935, 1.0),
        ("Gucci Diamond-Framed Sunglasses", 709, 15.0),
        ("Gucci Horsebit 1955 Shoulder Bag", 655, 20.0),
        ("Gucci Geometric Bag", 630, 20.0),
        ("GucciGhost Bag", 593, 20.0),
        ("Gucci Spiked Basketball Bag", 556, 24.0),
    ]),
}

ALIASES = {
    "accursed vampire hand": "accursed vampire bat hand",
    "clockwork top hat": '"like clockwork" top hat',
    "green sidewinder": "green sidewinder",
    "crimsonwrath: the wrath": "crimsonwrath: the red wrath",
    "agonizingly red buck cheer": "agonizingly red bucket of cheer",
    "dominus formidulo": "dominus formidulosus",
    "wanwood antler": "wanwood antlers",
    "gucci handbag 1955": "gucci horsebit 1955 shoulder bag",
    "gucci ghost bag": "guccighost bag",
    "gucci spiked backpack": "gucci spiked basketball bag",
    "bling boy's raincoat": "bling boy's raiment",
    "the queen of hearts": "queen of hearts",
    "eyes of emeraldwr": "eyes of emeraldwrath",
    "green laurel wrea": "green laurel wreath",
    "so super excited p": "so super excited pink",
    "so super excited - p": "so super excited - pink",
    "paper bags": "paper hat",
    "emperor of the federation": "emperor",
    "black iron horns of pwnage": "black iron horns",
    "serious scar face": "red serious scar face",
    "green super happy face": "green super happy joy",
    "blue sniper's visor": "blue snipers visor",
}


def write_extra_icon(iid: int, name: str, rgb: tuple[int, int, int]) -> None:
    CDN_ITEMS.mkdir(parents=True, exist_ok=True)
    path = CDN_ITEMS / f"{iid}.webp"
    im = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((18, 18, 238, 238), fill=(*rgb, 255), outline=(255, 255, 255, 180), width=6)
    label = name[:2] if name != ":]" else ":]"
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 64)
    except Exception:
        font = ImageFont.load_default()
    bbox = d.textbbox((0, 0), label, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((256 - tw) / 2, (256 - th) / 2 - 8), label, fill=(255, 255, 255, 255), font=font)
    im.save(path, "WEBP", quality=90)


def norm(s: str) -> str:
    s = s.lower().strip().replace("’", "'")
    s = re.sub(r"^[\):]+\s*", "", s)
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def load_pool():
    catalog = json.loads(ITEMS.read_text())
    have = {p.stem for p in CDN_ITEMS.glob("*.webp")}
    by_name: dict[str, dict] = {}
    by_norm: dict[str, dict] = {}

    def add(rec: dict, overwrite=False):
        if rec["name"].strip() in {"??", "?", ""}:
            return
        if overwrite or rec["name"] not in by_name:
            by_name[rec["name"]] = rec
        key = norm(rec["name"])
        if key:
            by_norm.setdefault(key, rec)

    for iid, name, value, rgb in EXTRAS:
        write_extra_icon(iid, name, rgb)
        add({"name": name, "id": iid, "value": value}, overwrite=True)
        have.add(str(iid))

    for it in catalog:
        if str(it["id"]) not in have:
            continue
        add({"name": it["name"].strip(), "id": int(it["id"]), "value": int(it["value"])})

    drops = json.loads(SRC_DROPS.read_text())
    for arr in drops.values():
        for it in arr:
            if str(it["id"]) not in have:
                continue
            add({"name": it["name"].strip(), "id": int(it["id"]), "value": int(it["value"])})
    return by_name, by_norm


def resolve(name: str, by_name, by_norm) -> dict | None:
    if name in by_name:
        return by_name[name]
    raw = norm(name)
    alias_map = {norm(k): v for k, v in ALIASES.items()}
    n = norm(alias_map.get(raw, name))
    if not n:
        return by_name.get(name)
    if n in by_norm:
        return by_norm[n]
    hits = [v for k, v in by_norm.items() if k and (n == k or (len(n) >= 8 and (n in k or k in n)))]
    uniq = {x["id"]: x for x in hits}
    if len(uniq) == 1:
        return next(iter(uniq.values()))
    tokens = set(n.split())
    scored = []
    for k, v in by_norm.items():
        kt = set(k.split())
        if tokens and kt and (tokens <= kt or kt <= tokens):
            scored.append(v)
    uniq = {x["id"]: x for x in scored}
    if len(uniq) == 1:
        return next(iter(uniq.values()))
    return None


def fmt_chance(tickets: int):
    c = tickets / 1000
    rounded = round(c + 1e-12, 2)
    if abs(rounded - round(rounded)) < 1e-9:
        return int(round(rounded))
    return float(f"{rounded:.2f}")


def color_rank(pos: int) -> str:
    return ["RAINBOW", "GOLD", "RED", "PURPLE", "GREEN", "GRAY"][min(pos, 5)]


def tickets_from_chances(chances: list[float]) -> list[int]:
    raw = [max(0.0, c) for c in chances]
    s = sum(raw)
    if s <= 0:
        even = T // len(raw)
        t = [even] * len(raw)
        t[-1] += T - sum(t)
        return t
    t = [max(1, int(round(c / s * T))) for c in raw]
    t[-1] += T - sum(t)
    if t[-1] < 1:
        donor = max(range(len(t) - 1), key=lambda i: t[i])
        t[donor] += t[-1] - 1
        t[-1] = 1
    return t


def recolor(table: list[dict]) -> list[dict]:
    ranked = sorted(range(len(table)), key=lambda i: (-table[i]["value"], i))
    for pos, idx in enumerate(ranked):
        table[idx]["color"] = color_rank(pos)
    return table


def to_table(items: list[dict], chances: list[float]) -> list[dict]:
    tix = tickets_from_chances(chances)
    out = []
    cur = 0
    for it, n in zip(items, tix):
        out.append({
            **it,
            "chance": fmt_chance(n),
            "color": "GRAY",
            "minTicket": cur,
            "maxTicket": cur + n - 1,
        })
        cur += n
    if out:
        out[-1]["maxTicket"] = T - 1
        out[-1]["chance"] = fmt_chance(out[-1]["maxTicket"] - out[-1]["minTicket"] + 1)
    return recolor(out)


def main() -> None:
    by_name, by_norm = load_pool()
    cases = json.loads(SRC_CASES.read_text())
    drops = json.loads(SRC_DROPS.read_text())
    missing: list[tuple[str, str]] = []
    applied = []

    for slug, (price, items) in TABLES.items():
        if price and price > 0:
            for c in cases:
                if c["slug"] == slug:
                    c["price"] = int(price)
                    break
        if not items:
            applied.append(f"{slug} price-only")
            continue

        built = []
        chances = []
        used_ids = set()
        for name, value, chance in items:
            rec = resolve(name, by_name, by_norm)
            if rec is None:
                missing.append((slug, name))
                continue
            if rec["id"] in used_ids:
                continue
            used_ids.add(rec["id"])
            val = int(value) if value and value > 0 else int(rec["value"])
            built.append({"name": rec["name"], "id": rec["id"], "value": val})
            chances.append(float(chance) if chance and chance > 0 else 1.0)

        leftover = 100.0 - sum(chances)
        if leftover >= 5 and slug in drops:
            fillers = [it for it in drops[slug] if it["id"] not in used_ids]
            take = fillers[:6]
            if take:
                each = leftover / len(take)
                for it in take:
                    built.append({"name": it["name"], "id": it["id"], "value": int(it["value"])})
                    chances.append(each)
                    used_ids.add(it["id"])

        if len(built) < 2:
            print(f"skip {slug}: only {len(built)} resolved")
            continue
        drops[slug] = to_table(built, chances)
        applied.append(slug)

    for slug, arr in drops.items():
        if slug in {"bronze-case", "silver-case", "gold-case", "platinum-case", "diamond-case"}:
            continue
        if arr:
            drops[slug] = recolor(arr)

    cases.sort(key=lambda c: (-c["price"], c["slug"]))
    for path in (SRC_CASES, SRV_CASES):
        path.write_text(json.dumps(cases, indent=2, ensure_ascii=False) + "\n")
    for path in (SRC_DROPS, SRV_DROPS):
        path.write_text(json.dumps(drops, indent=2, ensure_ascii=False) + "\n")

    print(f"applied {len(applied)} screenshot updates")
    for row in applied:
        print(" ", row)
    if missing:
        print("UNRESOLVED NAMES:")
        for row in missing:
            print(" ", row)


if __name__ == "__main__":
    main()
