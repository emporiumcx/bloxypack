import casesData from "./cases-data.json";
import dropsData from "./drops-data.json";
import packManifest from "./pack-manifest.json";
import { ALL_REWARD_CASES, getRewardCase } from "./rewards";

const PACK_SLUGS = new Set(packManifest as string[]);

export type CaseItem = {
  slug: string;
  name: string;
  price: number;
  risk: string;
  bar: string;
  hue: number;
  imageId?: number;
  image?: string;
};

export const CASES = casesData as CaseItem[];

export const REWARD_CASES: CaseItem[] = ALL_REWARD_CASES;

export function getCase(slug: string) {
  return CASES.find((c) => c.slug === slug) ?? getRewardCase(slug) ?? undefined;
}

export function caseImage(item: Pick<CaseItem, "image" | "imageId" | "slug"> | undefined | null) {
  if (!item) return "/img/home/cases.webp";
  const slug =
    ("slug" in item && item.slug) ||
    item.image?.match(/\/cdn\/cases\/([^/.]+)\./)?.[1] ||
    "";
  if (slug && PACK_SLUGS.has(slug)) return `/cdn/packs/${slug}.webp`;
  if (item.image) return item.image;
  if (item.imageId != null) return `/cdn/cases/${item.imageId}.webp`;
  return "/img/home/cases.webp";
}

export function itemImage(id: number | string | null | undefined, fallback?: string) {
  if (id == null || id === "") return fallback || "/img/home/cases.webp";
  return `/cdn/items/${id}.webp`;
}

export type DropColor =
  | "RAINBOW"
  | "GOLD"
  | "RED"
  | "PURPLE"
  | "GREEN"
  | "GRAY"
  | "YELLOW"
  | "BLUE";

export const DROP_RARITY: Record<DropColor, { hex: string; label: string }> = {
  RAINBOW: { hex: "#ffd239", label: "Rainbow" },
  GOLD: { hex: "#ffd239", label: "Gold" },
  RED: { hex: "#eb4b4b", label: "Red" },
  PURPLE: { hex: "#8847ff", label: "Purple" },
  GREEN: { hex: "#5e98d9", label: "Blue" },
  GRAY: { hex: "#b0c3d9", label: "Common" },
  YELLOW: { hex: "#ffd239", label: "Gold" },
  BLUE: { hex: "#4b69ff", label: "Rare" },
};

export type CaseDrop = {
  name: string;
  id: number;
  value: number;
  chance: number;
  color: DropColor;
  minTicket: number;
  maxTicket: number;
  image: string;
};

const DROPS = dropsData as Record<
  string,
  Omit<CaseDrop, "image">[]
>;

export function dropsForCase(slug: string): CaseDrop[] {
  return (DROPS[slug] ?? []).map((d) => ({
    ...d,
    image: `/cdn/items/${d.id}.webp`,
  }));
}

export function packGlow(hue: number) {
  return `hsl(${Math.round(hue)} 92% 54%)`;
}

export type Volatility = {
  level: 1 | 2 | 3 | 4 | 5;
  label: "Low" | "Medium" | "High";
};

export function caseVolatility(slug: string): Volatility {
  const drops = DROPS[slug] ?? [];
  if (!drops.length) return { level: 3, label: "Medium" };
  const tot = drops.reduce((sum, d) => sum + d.chance, 0) || 1;
  const mean = drops.reduce((sum, d) => sum + d.value * d.chance, 0) / tot;
  const variance = drops.reduce((sum, d) => sum + (d.value - mean) ** 2 * d.chance, 0) / tot;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
  const level = (cv < 1.3 ? 1 : cv < 1.8 ? 2 : cv < 2.6 ? 3 : cv < 3.8 ? 4 : 5) as Volatility["level"];
  return {
    level,
    label: level <= 2 ? "Low" : level === 3 ? "Medium" : "High",
  };
}

export function pickDrop(drops: CaseDrop[]) {
  if (!drops.length) return null;
  const ticket = Math.floor(Math.random() * 100000);
  return drops.find((d) => ticket >= d.minTicket && ticket <= d.maxTicket) ?? drops[drops.length - 1];
}

export type Battle = {
  id: string;
  cost: number;
  cases: string[];
  players: { name: string; bot?: boolean; team: number; level?: number; avatar?: string; slot?: number }[];
  slots: number;
  teams: string;
  status: "active" | "ended";
  unboxed: number;
  opened?: number;
  jackpot?: boolean;
  crazy?: boolean;
  terminal?: boolean;
  funding?: number;
  createdAt?: number;
};

export const BATTLES: Battle[] = [];

export const LEADERBOARD = [
  { place: 1, user: "Joris67", wagered: 6029035, prize: 450000, item: "Ice Valkyrie" },
  { place: 2, user: "monarch", wagered: 5353630, prize: 250000, item: "Agonizingly Red Bucket of Cheer" },
  { place: 3, user: "Anonymous", wagered: 4873811, prize: 100000, item: "Gold Emperor of the Night" },
  { place: 4, user: "voids", wagered: 2950109, prize: 50000, item: "Sparkle Time Fedora" },
  { place: 5, user: "imtrynamaxwin", wagered: 1882401, prize: 25000, item: "Clockwork Headphones" },
  { place: 6, user: "Alpha_mil0", wagered: 1104400, prize: 15000, item: "Redcliff Elite" },
  { place: 7, user: "OMEGA51", wagered: 880120, prize: 10000, item: "Vampire Collar" },
  { place: 8, user: "przfnn", wagered: 640330, prize: 5000, item: "Laptop Hat" },
  { place: 9, user: "cliqziz", wagered: 512440, prize: 4000, item: "Sparkle Time" },
  { place: 10, user: "Vasky", wagered: 388210, prize: 3000, item: "Vampire Collar" },
];

export const TICKER: { name: string; value: number; id: number; glow: string }[] = [
  { name: "Dominus Empyreus", value: 40000000, id: 21070012, glow: "rgb(255, 210, 57)" },
  { name: "Domino Crown", value: 24000000, id: 1031429, glow: "rgb(255, 210, 57)" },
  { name: "Dominus Astra", value: 20000000, id: 162067148, glow: "rgb(255, 210, 57)" },
  { name: "Dominus Frigidus", value: 19000000, id: 48545806, glow: "rgb(255, 210, 57)" },
  { name: "Dominus Infernus", value: 15000000, id: 31101391, glow: "rgb(235, 75, 75)" },
  { name: "Duke of the Federation", value: 12000000, id: 128158708, glow: "rgb(255, 210, 57)" },
  { name: "Red Sparkle Time Fedora", value: 11500000, id: 72082328, glow: "rgb(235, 75, 75)" },
  { name: "Bling $$ Necklace", value: 10000000, id: 33171947, glow: "rgb(255, 210, 57)" },
  { name: "Lord of the Federation", value: 10000000, id: 88885069, glow: "rgb(255, 210, 57)" },
  { name: "Rainbow Shaggy", value: 10000000, id: 64082730, glow: "rgb(136, 71, 255)" },
  { name: "Midnight Blue Sparkle Time Fedora", value: 9500000, id: 119916949, glow: "rgb(75, 105, 255)" },
  { name: "The Wanwood Crown", value: 8000000, id: 9910070, glow: "rgb(255, 210, 57)" },
  { name: "Purple Sparkle Time Fedora", value: 7500000, id: 63043890, glow: "rgb(136, 71, 255)" },
  { name: "Archduke of the Federation", value: 6800000, id: 293316452, glow: "rgb(255, 210, 57)" },
  { name: "Eccentric Shop Teacher", value: 6500000, id: 26943368, glow: "rgb(94, 152, 217)" },
];

export const LIVE_BETS = [
  { game: "Towers", user: "Vasky", time: "22:22", bet: 2636, multi: 0, payout: 0 },
  { game: "Dice", user: "Joris67", time: "22:21", bet: 500, multi: 1.98, payout: 990 },
  { game: "Mines", user: "monarch", time: "22:19", bet: 1200, multi: 3.4, payout: 4080 },
  { game: "Cases", user: "voids", time: "22:18", bet: 608782, multi: 2.1, payout: 1278442 },
  { game: "Blackjack", user: "Alpha_mil0", time: "22:17", bet: 250, multi: 2, payout: 500 },
];
