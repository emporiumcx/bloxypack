import casesData from "./cases-data.json";
import dropsData from "./drops-data.json";
import { ALL_REWARD_CASES, getRewardCase } from "./rewards";

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

export function caseImage(item: Pick<CaseItem, "image" | "imageId"> | undefined | null) {
  if (!item) return "/img/home/cases.webp";
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
  { name: "Redcliff Elite Knight Pauldrons", value: 1, id: 483900585, glow: "rgb(176, 195, 217)" },
  { name: "BotM: September Redcliff Bandana", value: 1, id: 301933531, glow: "rgb(176, 195, 217)" },
  { name: "Redcliff Elite Knight Pauldrons", value: 1, id: 483900585, glow: "rgb(176, 195, 217)" },
  { name: "Redcliff Hero Cape", value: 2, id: 501959589, glow: "rgb(176, 195, 217)" },
  { name: "Redcliff Crossbow", value: 600, id: 178076831, glow: "rgb(228, 174, 57)" },
  { name: "Sir Rustalot", value: 19, id: 48155742, glow: "rgb(176, 195, 217)" },
  { name: "BotM: September Redcliff Bandana", value: 1, id: 301933531, glow: "rgb(176, 195, 217)" },
  { name: "Knights of Redcliff: Bow and Arrow", value: 2747, id: 49929776, glow: "rgb(228, 174, 57)" },
  { name: "Christmas Fedora", value: 1039, id: 139152348, glow: "rgb(94, 152, 217)" },
  { name: "Black Iron Commando", value: 3364, id: 928908332, glow: "rgb(228, 174, 57)" },
  { name: "Roblox Sunglasses", value: 1, id: 18396858069, glow: "rgb(176, 195, 217)" },
  { name: "Leather Jacket - Black", value: 1, id: 7192549218, glow: "rgb(176, 195, 217)" },
  { name: "Laptop Hat", value: 1, id: 8666492376, glow: "rgb(176, 195, 217)" },
  { name: "Goldrow", value: 79, id: 3581868178, glow: "rgb(176, 195, 217)" },
  { name: "Silver Braid Fedora", value: 224, id: 113328346, glow: "rgb(176, 195, 217)" },
  { name: "Orange Shades", value: 2, id: 376527500, glow: "rgb(176, 195, 217)" },
];

export const LIVE_BETS = [
  { game: "Towers", user: "Vasky", time: "22:22", bet: 2636, multi: 0, payout: 0 },
  { game: "Dice", user: "Joris67", time: "22:21", bet: 500, multi: 1.98, payout: 990 },
  { game: "Mines", user: "monarch", time: "22:19", bet: 1200, multi: 3.4, payout: 4080 },
  { game: "Cases", user: "voids", time: "22:18", bet: 608782, multi: 2.1, payout: 1278442 },
  { game: "Blackjack", user: "Alpha_mil0", time: "22:17", bet: 250, multi: 2, payout: 500 },
];
