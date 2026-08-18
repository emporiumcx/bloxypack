export const BOT_AVATARS = [
  { name: "Bot Alpha", src: "/img/bots/green.svg", ring: "var(--color-green)" },
  { name: "Bot Bravo", src: "/img/bots/gold.svg", ring: "var(--color-gold)" },
  { name: "Bot Charlie", src: "/img/bots/purple.svg", ring: "var(--color-purple)" },
  { name: "Bot Delta", src: "/img/bots/blue.svg", ring: "var(--color-rank-diamond)" },
  { name: "Bot Echo", src: "/img/bots/red.svg", ring: "var(--color-red)" },
  { name: "Bot Foxtrot", src: "/img/bots/cyan.svg", ring: "rgb(34, 211, 238)" },
] as const;

export function botStyle(slot: number) {
  return BOT_AVATARS[((slot % BOT_AVATARS.length) + BOT_AVATARS.length) % BOT_AVATARS.length]!;
}

export function botName(slot: number) {
  return botStyle(slot).name;
}

export function botAvatar(slot: number) {
  return botStyle(slot).src;
}

export function botRing(slot: number) {
  return botStyle(slot).ring;
}
