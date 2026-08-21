#!/usr/bin/env python3
"""Compose Bloxy packs from canonical item renders + empty themed shells.

Canonical items live at public/cdn/canonical/{id}.png and are never regenerated
per pack. Packs only change shell/theme/layout around those fixed assets.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from scipy import ndimage
from PIL import Image, ImageFilter, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
ASSETS = Path.home() / ".cursor/projects/Users-muawiayh-Desktop-bloxpack/assets"
CANON = ROOT / "public/cdn/canonical"
SHELLS_DIR = ROOT / "public/cdn/pack-shells"
PACKS = ROOT / "public/cdn/packs"
RECIPES = ROOT / "src/lib/pack-recipes.json"
CANON_MAP = ROOT / "src/lib/canonical-items.json"
MANIFEST = ROOT / "src/lib/pack-manifest.json"
CASES = ROOT / "src/lib/cases-data.json"
DROPS = ROOT / "src/lib/drops-data.json"

SHELL_HUES = {
    "crimson": 8,
    "orange": 20,
    "bank-vault": 43,
    "oil-baron": 88,
    "green": 130,
    "optimus": 184,
    "ice": 198,
    "cobalt": 232,
    "purple": 270,
    "pink": 320,
}


def flood_mask(is_bg: np.ndarray) -> np.ndarray:
    labeled, _n = ndimage.label(is_bg)
    edge = np.unique(np.concatenate([labeled[0], labeled[-1], labeled[:, 0], labeled[:, -1]]))
    edge = edge[edge != 0]
    if edge.size == 0:
        return np.zeros(is_bg.shape, dtype=bool)
    return np.isin(labeled, edge)


def key_screen(im: Image.Image) -> Image.Image:
    arr = np.array(im.convert("RGBA"))
    r = arr[:, :, 0].astype(np.int16)
    g = arr[:, :, 1].astype(np.int16)
    b = arr[:, :, 2].astype(np.int16)
    mag = (r > 170) & (b > 170) & (g < 90) & (np.abs(r - b) < 55)
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    chroma = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
    corners = [(0, 0), (0, arr.shape[1] - 1), (arr.shape[0] - 1, 0), (arr.shape[0] - 1, arr.shape[1] - 1)]
    corner_mag = any(bool(mag[y, x]) for y, x in corners)
    corner_blk = any(lum[y, x] <= 22 and chroma[y, x] <= 16 for y, x in corners)
    bg = mag if corner_mag else ((lum <= 18) & (chroma <= 14) if corner_blk else mag)
    visited = flood_mask(bg)
    arr[:, :, 3] = np.where(visited, 0, arr[:, :, 3])
    for c in range(3):
        arr[:, :, c] = np.where(visited, 0, arr[:, :, c])
    return Image.fromarray(arr, "RGBA")


def bbox(im: Image.Image, min_a: int = 12) -> tuple[int, int, int, int]:
    a = np.array(im.split()[-1])
    ys, xs = np.where(a > min_a)
    if len(xs) == 0:
        return (0, 0, im.width, im.height)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def fill_enclosed_holes(im: Image.Image) -> Image.Image:
    arr = np.array(im.convert("RGBA"))
    keep = arr[:, :, 3] > 12
    try:
        from scipy import ndimage

        closed = ndimage.binary_closing(keep, iterations=4)
        filled = ndimage.binary_fill_holes(closed)
        ring = ndimage.binary_dilation(filled & ~keep, iterations=2) & keep
    except Exception:
        return im
    hole = filled & ~keep
    if not hole.any():
        return im
    if ring.any():
        fill_rgb = np.median(arr[ring][:, :3], axis=0).astype(np.uint8)
    else:
        fill_rgb = np.array([32, 20, 12], dtype=np.uint8)
    arr[hole, 0] = fill_rgb[0]
    arr[hole, 1] = fill_rgb[1]
    arr[hole, 2] = fill_rgb[2]
    arr[hole, 3] = 255
    return Image.fromarray(arr, "RGBA")


def recolor_magenta_spill(im: Image.Image) -> Image.Image:
    arr = np.array(im.convert("RGBA"))
    r = arr[:, :, 0].astype(np.int16)
    g = arr[:, :, 1].astype(np.int16)
    b = arr[:, :, 2].astype(np.int16)
    a = arr[:, :, 3]
    mag = (r > 170) & (b > 170) & (g < 90) & (np.abs(r - b) < 55) & (a > 12)
    if not mag.any():
        return im
    keep = (a > 12) & ~mag
    if keep.any():
        fill_rgb = (np.median(arr[keep][:, :3], axis=0) * 0.35).astype(np.uint8)
    else:
        fill_rgb = np.array([48, 32, 18], dtype=np.uint8)
    arr[mag, 0] = fill_rgb[0]
    arr[mag, 1] = fill_rgb[1]
    arr[mag, 2] = fill_rgb[2]
    return Image.fromarray(arr, "RGBA")


def crop_item(im: Image.Image) -> Image.Image:
    x0, y0, x1, y1 = bbox(im)
    return im.crop((x0, y0, x1, y1))


def fit_width(im: Image.Image, width: int) -> Image.Image:
    h = max(1, int(im.height * (width / im.width)))
    return im.resize((width, h), Image.Resampling.LANCZOS)


def pose(im: Image.Image, *, flip: bool = False, angle: float = 0) -> Image.Image:
    out = im.transpose(Image.Transpose.FLIP_LEFT_RIGHT) if flip else im
    if abs(angle) > 0.2:
        out = out.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    return out


def paste_center(base: Image.Image, sprite: Image.Image, cx: int, cy: int) -> None:
    x = int(cx - sprite.width / 2)
    y = int(cy - sprite.height / 2)
    base.alpha_composite(sprite, (x, y))


def save_rgba(im: Image.Image, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest.with_suffix(".png"), "PNG")
    im.save(dest.with_suffix(".webp"), "WEBP", quality=88, method=4)


def hue_distance(a: float, b: float) -> float:
    d = abs(a - b) % 360
    return min(d, 360 - d)


def nearest_shell(hue: float) -> str:
    return min(SHELL_HUES, key=lambda name: hue_distance(hue, SHELL_HUES[name]))


def hue_shift(im: Image.Image, degrees: float) -> Image.Image:
    if abs(degrees) < 1.5:
        return im
    arr = np.array(im.convert("RGBA"))
    rgb = Image.fromarray(arr[:, :, :3], "RGB").convert("HSV")
    hsv = np.array(rgb)
    hsv[:, :, 0] = (hsv[:, :, 0].astype(np.int16) + int(degrees / 360 * 255)) % 256
    out = np.array(Image.fromarray(hsv, "HSV").convert("RGB"))
    return Image.fromarray(np.dstack([out, arr[:, :, 3]]), "RGBA")


def tint_shell(im: Image.Image, shell_hue: float, target_hue: float) -> Image.Image:
    delta = ((target_hue - shell_hue + 180) % 360) - 180
    return hue_shift(im, delta * 0.82)


def import_canonical_from_asset(item_id: str) -> Image.Image:
    src = ASSETS / f"canonical-{item_id}.png"
    keyed = crop_item(recolor_magenta_spill(fill_enclosed_holes(key_screen(Image.open(src)))))
    save_rgba(keyed, CANON / item_id)
    return keyed


def import_canonical_from_thumb(item_id: str) -> Image.Image:
    src = ROOT / "public/cdn/items" / f"{item_id}.webp"
    im = Image.open(src).convert("RGBA")
    keyed = crop_item(recolor_magenta_spill(fill_enclosed_holes(key_screen(im))))
    scale = 720 / max(keyed.width, 1)
    keyed = keyed.resize((max(1, int(keyed.width * scale)), max(1, int(keyed.height * scale))), Image.Resampling.LANCZOS)
    save_rgba(keyed, CANON / item_id)
    return keyed


def load_item(item_id: str) -> Image.Image:
    ready = CANON / f"{item_id}.png"
    if ready.exists():
        return Image.open(ready).convert("RGBA")
    asset = ASSETS / f"canonical-{item_id}.png"
    if asset.exists():
        return import_canonical_from_asset(item_id)
    return import_canonical_from_thumb(item_id)


def load_shell(name: str) -> Image.Image:
    cached = SHELLS_DIR / f"{name}.png"
    if cached.exists():
        return Image.open(cached).convert("RGBA")
    src = ASSETS / f"shell-{name}.png"
    keyed = key_screen(Image.open(src))
    save_rgba(keyed, SHELLS_DIR / name)
    return keyed


def clip_to_pouch(layer: Image.Image, shell: Image.Image, grow: int = 10) -> Image.Image:
    mask = np.array(shell.split()[-1]) > 12
    if grow > 0:
        mask = ndimage.binary_dilation(mask, iterations=grow)
    arr = np.array(layer)
    arr[:, :, 3] = np.where(mask, arr[:, :, 3], 0)
    return Image.fromarray(arr, "RGBA")


def compose(shell: Image.Image, items: list[Image.Image], hue: int) -> Image.Image:
    canvas = shell.copy()
    px0, py0, px1, py1 = bbox(shell)
    pw, ph = px1 - px0, py1 - py0
    glow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    color = tuple(int(c) for c in Image.new("HSV", (1, 1), (int(hue / 360 * 255), 220, 240)).convert("RGB").getpixel((0, 0)))
    gx, gy = px0 + pw // 2, py0 + int(ph * 0.60)
    draw.ellipse((gx - int(pw * 0.36), gy - int(ph * 0.20), gx + int(pw * 0.36), gy + int(ph * 0.22)), fill=(*color, 80))
    canvas.alpha_composite(glow.filter(ImageFilter.GaussianBlur(36)))

    items_layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    if items:
        hero = pose(fit_width(items[0], int(pw * 0.40)), angle=-5)
        paste_center(items_layer, hero, px0 + pw // 2, py0 + int(ph * 0.57))
    if len(items) > 1:
        left = pose(fit_width(items[1], int(pw * 0.28)), angle=12)
        paste_center(items_layer, left, px0 + int(pw * 0.30), py0 + int(ph * 0.70))
    if len(items) > 2:
        right = pose(fit_width(items[2], int(pw * 0.28)), flip=True, angle=-11)
        paste_center(items_layer, right, px0 + int(pw * 0.71), py0 + int(ph * 0.69))
    canvas.alpha_composite(clip_to_pouch(items_layer, shell, grow=8))
    return canvas


def build_recipes() -> dict:
    cases = json.loads(CASES.read_text())
    drops = json.loads(DROPS.read_text())
    recipes = json.loads(RECIPES.read_text()) if RECIPES.exists() else {}
    for case in cases:
        slug = case["slug"]
        hue = int(case.get("hue", 200))
        tops = sorted(drops.get(slug, []), key=lambda x: -x.get("value", 0))[:3]
        if slug not in recipes:
            if not tops:
                continue
            recipes[slug] = {"items": [t["id"] for t in tops]}
        recipes[slug]["hue"] = hue
        recipes[slug]["shell"] = nearest_shell(hue)
    RECIPES.write_text(json.dumps(recipes, indent=2) + "\n")
    return recipes


def main() -> None:
    recipes = build_recipes()
    names = json.loads((ROOT / "src/lib/items-data.json").read_text()) if (ROOT / "src/lib/items-data.json").exists() else {}
    id_to_name = {}
    if isinstance(names, list):
        for row in names:
            if isinstance(row, dict) and "id" in row:
                id_to_name[str(row["id"])] = row.get("name", str(row["id"]))
    elif isinstance(names, dict):
        id_to_name = {str(k): (v.get("name") if isinstance(v, dict) else str(v)) for k, v in names.items()}

    drops = json.loads(DROPS.read_text())
    for case_drops in drops.values():
        for d in case_drops:
            id_to_name.setdefault(str(d["id"]), d.get("name", str(d["id"])))

    cache: dict[str, Image.Image] = {}
    canon_meta = json.loads(CANON_MAP.read_text()) if CANON_MAP.exists() else {}
    shell_cache: dict[str, Image.Image] = {}

    for slug, recipe in recipes.items():
        items = []
        for item_id in recipe["items"]:
            key = str(item_id)
            if key not in cache:
                cache[key] = load_item(key)
                canon_meta[key] = {"name": id_to_name.get(key, key), "src": f"/cdn/canonical/{key}.webp"}
                print("canonical", key, cache[key].size, flush=True)
            items.append(cache[key])
        shell_name = recipe.get("shell") or nearest_shell(recipe["hue"])
        if shell_name not in shell_cache:
            shell_cache[shell_name] = load_shell(shell_name)
            print("shell", shell_name, flush=True)
        tint = tint_shell(shell_cache[shell_name], SHELL_HUES.get(shell_name, recipe["hue"]), recipe["hue"])
        pack = compose(tint, items, recipe["hue"])
        save_rgba(pack, PACKS / slug)
        print("pack", slug, flush=True)

    CANON_MAP.write_text(json.dumps(canon_meta, indent=2) + "\n")
    MANIFEST.write_text(json.dumps(list(recipes.keys()), indent=2) + "\n")
    print("done", len(recipes), "packs", len(cache), "items")


if __name__ == "__main__":
    main()
