import type { CaseItem } from "./catalog";

export type BonusCase = CaseItem & { kind: "bonus"; tier: number; xp: number };
export type DailyCase = CaseItem & { kind: "daily"; level: number };
export type RankCase = CaseItem & { kind: "rank"; rank: number; level: number };

export const BONUS_CASES: BonusCase[] = [
  { kind: "bonus", tier: 1, xp: 10_000, slug: "bonus-1", name: "Tier 1 Bonus Case", price: 0, risk: "low", bar: "#90ef30", hue: 90, image: "/img/home/bonus-case.webp" },
  { kind: "bonus", tier: 2, xp: 25_000, slug: "bonus-2", name: "Tier 2 Bonus Case", price: 0, risk: "low", bar: "#7ef25a", hue: 110, image: "/img/home/bonus-case.webp" },
  { kind: "bonus", tier: 3, xp: 50_000, slug: "bonus-3", name: "Tier 3 Bonus Case", price: 0, risk: "low", bar: "#53fc18", hue: 130, image: "/img/home/bonus-case.webp" },
  { kind: "bonus", tier: 4, xp: 100_000, slug: "bonus-4", name: "Tier 4 Bonus Case", price: 0, risk: "medium", bar: "#8aa6ff", hue: 220, image: "/img/home/bonus-case.webp" },
  { kind: "bonus", tier: 5, xp: 250_000, slug: "bonus-5", name: "Tier 5 Bonus Case", price: 0, risk: "medium", bar: "#62c0ea", hue: 200, image: "/img/home/bonus-case.webp" },
  { kind: "bonus", tier: 6, xp: 500_000, slug: "bonus-6", name: "Tier 6 Bonus Case", price: 0, risk: "medium", bar: "#9e5cff", hue: 270, image: "/img/home/bonus-case.webp" },
  { kind: "bonus", tier: 7, xp: 750_000, slug: "bonus-7", name: "Tier 7 Bonus Case", price: 0, risk: "high", bar: "#f2c338", hue: 45, image: "/img/home/bonus-case.webp" },
  { kind: "bonus", tier: 8, xp: 1_000_000, slug: "bonus-8", name: "Tier 8 Bonus Case", price: 0, risk: "high", bar: "#ff9a3c", hue: 30, image: "/img/home/bonus-case.webp" },
  { kind: "bonus", tier: 9, xp: 1_250_000, slug: "bonus-9", name: "Tier 9 Bonus Case", price: 0, risk: "high", bar: "#ff5562", hue: 10, image: "/img/home/bonus-case.webp" },
  { kind: "bonus", tier: 10, xp: 1_500_000, slug: "bonus-10", name: "Tier 10 Bonus Case", price: 0, risk: "high", bar: "#60bcff", hue: 200, image: "/img/home/bonus-case.webp" },
  { kind: "bonus", tier: 15, xp: 3_000_000, slug: "bonus-15", name: "Tier 15 Bonus Case", price: 0, risk: "high", bar: "#e8b23e", hue: 40, image: "/img/home/bonus-case.webp" },
  { kind: "bonus", tier: 20, xp: 5_000_000, slug: "bonus-20", name: "Tier 20 Bonus Case", price: 0, risk: "high", bar: "#ff6ec7", hue: 320, image: "/img/home/bonus-case.webp" },
];

export const DAILY_CASES: DailyCase[] = [
  { kind: "daily", level: 10, slug: "daily-1", name: "Daily Case I", price: 0, risk: "low", bar: "#90ef30", hue: 90, image: "/img/home/daily-case.webp" },
  { kind: "daily", level: 20, slug: "daily-2", name: "Daily Case II", price: 0, risk: "low", bar: "#7ef25a", hue: 110, image: "/img/home/daily-case.webp" },
  { kind: "daily", level: 30, slug: "daily-3", name: "Daily Case III", price: 0, risk: "low", bar: "#53fc18", hue: 130, image: "/img/home/daily-case.webp" },
  { kind: "daily", level: 40, slug: "daily-4", name: "Daily Case IV", price: 0, risk: "medium", bar: "#8aa6ff", hue: 220, image: "/img/home/daily-case.webp" },
  { kind: "daily", level: 50, slug: "daily-5", name: "Daily Case V", price: 0, risk: "medium", bar: "#62c0ea", hue: 200, image: "/img/home/daily-case.webp" },
  { kind: "daily", level: 60, slug: "daily-6", name: "Daily Case VI", price: 0, risk: "medium", bar: "#9e5cff", hue: 270, image: "/img/home/daily-case.webp" },
  { kind: "daily", level: 70, slug: "daily-7", name: "Daily Case VII", price: 0, risk: "high", bar: "#f2c338", hue: 45, image: "/img/home/daily-case.webp" },
  { kind: "daily", level: 80, slug: "daily-8", name: "Daily Case VIII", price: 0, risk: "high", bar: "#ff9a3c", hue: 30, image: "/img/home/daily-case.webp" },
  { kind: "daily", level: 90, slug: "daily-9", name: "Daily Case IX", price: 0, risk: "high", bar: "#ff5562", hue: 10, image: "/img/home/daily-case.webp" },
  { kind: "daily", level: 100, slug: "daily-10", name: "Daily Case X", price: 0, risk: "high", bar: "#60bcff", hue: 200, image: "/img/home/daily-case.webp" },
];

export const RANK_CASES: RankCase[] = [
  { kind: "rank", rank: 4, level: 13, slug: "bronze-case", name: "Bronze Case", price: 0, risk: "low", bar: "#cd7f32", hue: 30, image: "/img/rewards/1.webp" },
  { kind: "rank", rank: 7, level: 25, slug: "silver-case", name: "Silver Case", price: 0, risk: "low", bar: "#c0c0c0", hue: 220, image: "/img/rewards/2.webp" },
  { kind: "rank", rank: 12, level: 45, slug: "gold-case", name: "Gold Case", price: 0, risk: "medium", bar: "#f1c947", hue: 45, image: "/img/rewards/3.webp" },
  { kind: "rank", rank: 17, level: 65, slug: "platinum-case", name: "Platinum Case", price: 0, risk: "medium", bar: "#acc3f0", hue: 210, image: "/img/rewards/4.webp" },
  { kind: "rank", rank: 22, level: 85, slug: "diamond-case", name: "Diamond Case", price: 0, risk: "high", bar: "#60bcff", hue: 200, image: "/img/rewards/5.webp" },
];

export const ALL_REWARD_CASES: CaseItem[] = [...BONUS_CASES, ...DAILY_CASES, ...RANK_CASES];

export function getRewardCase(slug: string) {
  return ALL_REWARD_CASES.find((c) => c.slug === slug) ?? null;
}

export function isRewardSlug(slug: string) {
  return Boolean(getRewardCase(slug));
}

export function bonusTierForXp(xp: number) {
  let current: BonusCase | null = null;
  let next: BonusCase = BONUS_CASES[0];
  for (const c of BONUS_CASES) {
    if (xp >= c.xp) current = c;
    else {
      next = c;
      break;
    }
  }
  return { current, next };
}

export function bonusProgress(xp: number) {
  const { current, next } = bonusTierForXp(xp);
  const from = current?.xp ?? 0;
  const to = next.xp;
  if (xp >= BONUS_CASES[BONUS_CASES.length - 1].xp) return 100;
  if (to <= from) return 0;
  return Math.min(99, Math.max(0, Math.round(((xp - from) / (to - from)) * 100)));
}
