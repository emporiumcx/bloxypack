export function xpToLevel(xp: number) {
  const level = Math.floor(Math.pow((xp || 0) / 1000 / 100, 1 / 3));
  return level >= 100 ? 100 : Math.max(0, level);
}

export function rankIdFromLevel(level: number) {
  return Math.min(25, Math.max(1, Math.ceil(Math.max(1, level) / 4)));
}

const TIERS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"] as const;
const ROMAN = ["I", "II", "III", "IV", "V"] as const;

export function rankNameFromLevel(level: number) {
  const id = rankIdFromLevel(level);
  const tier = TIERS[Math.min(4, Math.floor((id - 1) / 5))];
  const roman = ROMAN[(id - 1) % 5];
  return `${tier} ${roman}`;
}

export function rankKeyFromLevel(level: number): "bronze" | "silver" | "gold" | "staff" {
  if (level >= 41) return "gold";
  if (level >= 21) return "silver";
  return "bronze";
}

export function xpProgress(xp: number) {
  const level = xpToLevel(xp);
  const cur = 100000 * Math.pow(level, 3);
  const next = 100000 * Math.pow(level + 1, 3);
  if (next <= cur) return 100;
  return Math.min(99, Math.max(0, Math.round(((xp - cur) / (next - cur)) * 100)));
}
