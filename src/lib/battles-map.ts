import { getCase, type Battle } from "./catalog";
import type { BattleGame } from "./backend";

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
      name: bet.bot ? "Bot" : bet.user?.username || "Player",
      bot: Boolean(bet.bot),
      team: slot,
    };
  }).filter(Boolean) as Battle["players"];

  const teams =
    game.mode === "team"
      ? "2v2 Team"
      : game.mode === "group"
        ? `${game.playerCount}P Group`
        : game.playerCount === 4
          ? "1v1v1v1"
          : game.playerCount === 3
            ? "1v1v1"
            : "1v1";

  return {
    id: game._id,
    cost: (game.amount || 0) / 1000,
    cases: cases.length ? cases : [""],
    players: seats,
    slots: game.playerCount,
    teams,
    status: game.state === "completed" ? "ended" : "active",
    unboxed: (game.bets?.[0]?.outcomes || []).length,
  };
}

export function battleCaseImage(slug: string) {
  const c = getCase(slug);
  if (!c) return "/img/home/cases.webp";
  return c.image ?? `/cdn/cases/${c.imageId}.webp`;
}
