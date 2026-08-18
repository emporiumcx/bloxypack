export const ROULETTE_ORDER = [1, 14, 2, 13, 3, 12, 4, 0, 11, 5, 10, 6, 9, 7, 8] as const;

export type RouletteColor = "red" | "black" | "green";

export const ROULETTE_PAYOUT: Record<RouletteColor, number> = {
  red: 2,
  black: 2,
  green: 14,
};

export function rouletteColor(n: number): RouletteColor {
  if (n === 0) return "green";
  if (n >= 1 && n <= 7) return "red";
  return "black";
}

export const TILE_W = 80;
export const TILE_GAP = 8;
export const TILE_SLOT = TILE_W + TILE_GAP;
export const REEL_LOOPS = 8;
