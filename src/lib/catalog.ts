import casesData from "./cases-data.json";
import dropsData from "./drops-data.json";

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

export const REWARD_CASES: CaseItem[] = [
  { slug: "bronze-case", name: "Bronze Case", price: 33, risk: "low", bar: "#cd7f32", hue: 30, image: "/img/rewards/1.webp" },
  { slug: "silver-case", name: "Silver Case", price: 393, risk: "low", bar: "#c0c0c0", hue: 220, image: "/img/rewards/2.webp" },
  { slug: "gold-case", name: "Golden Case", price: 1495, risk: "medium", bar: "#f1c947", hue: 45, image: "/img/rewards/3.webp" },
  { slug: "platinum-case", name: "Platinum Case", price: 3704, risk: "medium", bar: "#acc3f0", hue: 210, image: "/img/rewards/4.webp" },
  { slug: "diamond-case", name: "Diamond Case", price: 2412, risk: "high", bar: "#60bcff", hue: 200, image: "/img/rewards/5.webp" },
];

export function getCase(slug: string) {
  return CASES.find((c) => c.slug === slug) ?? REWARD_CASES.find((c) => c.slug === slug);
}

export type DropColor = "YELLOW" | "PURPLE" | "BLUE" | "GRAY";

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
  jackpot?: boolean;
  crazy?: boolean;
  terminal?: boolean;
  funding?: number;
};

export const BATTLES: Battle[] = [
  {
    id: "neon-6man",
    cost: 188312,
    cases: ["neon-case", "astra-dreams", "midas-touch", "fedora-fiasco"],
    players: [
      { name: "imtrynamaxwin", team: 0 },
      { name: "Bot", bot: true, team: 0 },
      { name: "Bot", bot: true, team: 1 },
      { name: "Bot", bot: true, team: 1 },
      { name: "Bot", bot: true, team: 2 },
      { name: "Bot", bot: true, team: 2 },
    ],
    slots: 6,
    teams: "2v2v2 Team",
    status: "ended",
    unboxed: 73927,
  },
  {
    id: "telamon-team",
    cost: 36244,
    cases: Array(9).fill("telamon-case"),
    players: [{ name: "Joris67", team: 0 }],
    slots: 4,
    teams: "2v2 Team",
    status: "ended",
    unboxed: 1290119,
  },
  {
    id: "valk-duel",
    cost: 92440,
    cases: ["valk-volatility", "inferno-royale"],
    players: [
      { name: "Joris67", team: 0 },
      { name: "monarch", team: 1 },
    ],
    slots: 2,
    teams: "1v1",
    status: "active",
    unboxed: 0,
  },
  {
    id: "budget-4",
    cost: 18420,
    cases: ["cheap-meal", "noob-case", "bone-breaker", "10-random"],
    players: [
      { name: "Alpha_mil0", team: 0 },
      { name: "Bot", bot: true, team: 1 },
      { name: "voids", team: 2 },
    ],
    slots: 4,
    teams: "FFA",
    status: "active",
    unboxed: 0,
  },
  {
    id: "gold-rush",
    cost: 410900,
    cases: ["dominus-bonanza", "golden-opportunity", "mogger"],
    players: [
      { name: "Anonymous", team: 0 },
      { name: "Bot", bot: true, team: 1 },
    ],
    slots: 2,
    teams: "1v1",
    status: "active",
    unboxed: 0,
  },
  {
    id: "mid-duel",
    cost: 48220,
    cases: ["midas-touch", "cheap-meal"],
    players: [{ name: "OMEGA51", team: 0 }],
    slots: 2,
    teams: "1v1",
    status: "active",
    unboxed: 0,
  },
  {
    id: "fedora-ffa",
    cost: 22140,
    cases: ["fedora-fiasco", "10-random", "noob-case"],
    players: [
      { name: "przfnn", team: 0 },
      { name: "Vasky", team: 1 },
    ],
    slots: 4,
    teams: "1v1v1v1",
    status: "active",
    unboxed: 0,
  },
  {
    id: "inferno-ended",
    cost: 110400,
    cases: ["inferno-royale", "valk-volatility", "neon-case"],
    players: [
      { name: "Joris67", team: 0 },
      { name: "monarch", team: 1 },
    ],
    slots: 2,
    teams: "1v1",
    status: "ended",
    unboxed: 88420,
  },
  {
    id: "wild-duel",
    cost: 4132,
    cases: ["e-boy-case"],
    players: [
      { name: "WILD", team: 0 },
      { name: "Bot", bot: true, team: 1 },
    ],
    slots: 2,
    teams: "1v1",
    status: "ended",
    unboxed: 7973,
  },
];

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
