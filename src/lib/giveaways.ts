export type GiveawayRecurrence = "daily" | "weekly" | "monthly";

export type GiveawayPrize = {
  slug: string;
  image: string;
  name: string;
  kind: string;
};

export type OfficialGiveaway = {
  id: GiveawayRecurrence;
  label: string;
  amount: number;
  depositReq: number;
  prizes: GiveawayPrize[];
};

export const GIVEAWAY_THEME = {
  daily: {
    badge: "bg-[#14d96b]/10 text-[#14d96b]",
    glow: "bg-[#14d96b]",
    fill: "bg-[#14d96b]",
    svg: "fill-[#14d96b]",
    dot: "bg-[#14d96b]",
    bar: "bg-[#14d96b]",
    cta: "from-[#14d96b] to-[#0fb85c]",
  },
  weekly: {
    badge: "bg-[#f81f48]/10 text-[#f81f48]",
    glow: "bg-[#f81f48]",
    fill: "bg-[#f81f48]",
    svg: "fill-[#f81f48]",
    dot: "bg-[#f81f48]",
    bar: "bg-[#f81f48]",
    cta: "from-[#ff4d6d] to-[#f81f48]",
  },
  monthly: {
    badge: "bg-[#ffae3a]/10 text-[#ffae3a]",
    glow: "bg-[#ffae3a]",
    fill: "bg-[#ffae3a]",
    svg: "fill-[#ffae3a]",
    dot: "bg-[#ffae3a]",
    bar: "bg-[#ffae3a]",
    cta: "from-[#ffc85a] to-[#ff9a1a]",
  },
} as const;

const DAILY: OfficialGiveaway = {
  id: "daily",
  label: "Daily",
  amount: 242.3,
  depositReq: 1,
  prizes: [{ slug: "daily-1", image: "/cdn/packs/daily-1.webp", name: "Daily Case I", kind: "Foil Pack" }],
};

const WEEKLY: OfficialGiveaway = {
  id: "weekly",
  label: "Weekly",
  amount: 2871.76,
  depositReq: 10,
  prizes: [{ slug: "prestige", image: "/cdn/packs/prestige.webp", name: "High Society", kind: "Foil Pack" }],
};

const MONTHLY: OfficialGiveaway = {
  id: "monthly",
  label: "Monthly",
  amount: 10392.86,
  depositReq: 25,
  prizes: [{ slug: "oil-baron", image: "/cdn/packs/oil-baron.webp", name: "Black Gold", kind: "Foil Pack" }],
};

export const OFFICIAL_GIVEAWAYS: OfficialGiveaway[] = [MONTHLY, WEEKLY, DAILY];

export const SIDEBAR_GIVEAWAYS: OfficialGiveaway[] = [DAILY, WEEKLY, MONTHLY];

export function padGiveaway(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

export function remainingParts(kind: GiveawayRecurrence) {
  const now = Date.now();
  const d = new Date();
  let end: number;
  if (kind === "daily") {
    end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
  } else if (kind === "weekly") {
    const day = d.getUTCDay();
    const daysToAdd = (8 - day) % 7 || 7;
    end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + daysToAdd);
  } else {
    end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
  }
  const total = Math.max(0, Math.floor((end - now) / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export function formatGiveawayAmount(amount: number) {
  const [whole, frac] = amount.toFixed(2).split(".");
  return { whole: Number(whole).toLocaleString("en-US"), frac };
}
