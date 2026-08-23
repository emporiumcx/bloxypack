import { caseImage, getCase, type Battle } from "./catalog";
import type { BattleGame } from "./backend";
import { botAvatar, botName } from "./avatars";

export function battleTeamSizes(game: Pick<BattleGame, "mode" | "playerCount" | "options">) {
  const n = game.playerCount;
  if (game.mode !== "team") return [n];
  const tag = String(game.options?.teams || "")
    .toLowerCase()
    .replace(/vs/g, "v");
  if (tag === "2v2v2") return [2, 2, 2];
  if (tag === "3v3") return [3, 3];
  if (n === 6) return [2, 2, 2];
  if (n === 4) return [2, 2];
  return [Math.floor(n / 2), Math.ceil(n / 2)];
}

export function battleTeamsLabel(game: Pick<BattleGame, "mode" | "playerCount" | "options">) {
  if (game.mode === "group") return `${game.playerCount}P Group`;
  if (game.mode === "team") {
    const sizes = battleTeamSizes(game);
    return `${sizes.join("v")} Team`;
  }
  return Array.from({ length: game.playerCount }, () => "1").join("v");
}

export function battleFormatTag(game: Pick<BattleGame, "mode" | "playerCount" | "options">) {
  if (game.mode === "group") return `${game.playerCount}P`;
  if (game.mode === "team") {
    const sizes = battleTeamSizes(game);
    return sizes.map((n) => `${n}`).join("vs");
  }
  if (game.playerCount === 2) return "1vs1";
  return `${game.playerCount}-way`;
}

export function mapBattleGame(game: BattleGame): Battle {
  const cases: string[] = [];
  for (const box of game.boxes || []) {
    const slug = box.box?.slug;
    if (!slug) continue;
    for (let i = 0; i < (box.count || 1); i++) cases.push(slug);
  }
  const seats = Array.from({ length: game.playerCount }, (_, slot) => {
    const bet = (game.bets || []).find((b) => b.slot === slot);
    if (!bet) return null;
    return {
      name: bet.bot ? botName(slot) : bet.user?.username || "Player",
      bot: Boolean(bet.bot),
      team: slot,
      slot,
      level: bet.user?.level || 1,
      avatar: bet.bot ? botAvatar(slot) : bet.user?.avatar,
    };
  }).filter(Boolean) as Battle["players"];

  const teams = battleTeamsLabel(game);

  const opened = Math.max(0, ...(game.bets || []).map((b) => b.outcomes?.length || 0), 0);

  return {
    id: game._id,
    cost: (game.amount || 0) / 1000,
    cases: cases.length ? cases : [""],
    players: seats,
    slots: game.playerCount,
    teams,
    status: game.state === "completed" ? "ended" : "active",
    unboxed: (game.bets || []).reduce((sum, bet) => sum + (bet.payout || 0), 0) / 1000,
    opened,
    jackpot: Boolean(game.options?.jackpot),
    crazy: Boolean(game.options?.cursed),
    terminal: Boolean(game.options?.terminal),
    funding: Math.min(80, Math.max(0, game.options?.funding || 0)),
    createdAt: game.createdAt
      ? new Date(game.createdAt).getTime()
      : game.updatedAt
        ? new Date(game.updatedAt).getTime()
        : 0,
  };
}

export function battleCaseImage(slug: string) {
  return caseImage(getCase(slug));
}
