import type { ComponentType } from "react";
import { Icons } from "./icons";
import type { Battle } from "@/lib/catalog";

export type BadgeKind = "jackpot" | "crazy" | "normal" | "group" | "terminal";

const BADGE: Record<BadgeKind, { label: string; className: string; Icon: ComponentType<{ className?: string }> }> = {
  jackpot: { label: "Jackpot", className: "bg-battle-jackpot/15 text-battle-jackpot", Icon: Icons.jackpot },
  crazy: { label: "Crazy", className: "bg-battle-crazy/15 text-battle-crazy", Icon: Icons.wild },
  normal: { label: "Normal", className: "bg-battle-normal/15 text-battle-normal", Icon: Icons.battles },
  group: { label: "Group", className: "bg-battle-group/15 text-battle-group", Icon: Icons.user },
  terminal: { label: "Terminal", className: "bg-battle-terminal/15 text-battle-terminal", Icon: Icons.terminal },
};

export function battleKind(b: Battle): "normal" | "jackpot" | "group" {
  if (/group/i.test(b.teams)) return "group";
  if (b.jackpot) return "jackpot";
  return "normal";
}

export function BattleBadge({ kind }: { kind: BadgeKind }) {
  const item = BADGE[kind];
  return (
    <div className={`inline-flex h-26 items-center gap-6 overflow-hidden rounded-6 px-6 text-11 font-medium ${item.className}`}>
      <span className="flex size-14 shrink-0 items-center justify-center">
        <item.Icon className="text-14" />
      </span>
      <span>{item.label}</span>
    </div>
  );
}

export function BattleModeBadges({ battle }: { battle: Battle }) {
  const kind = battleKind(battle);
  const badges: BadgeKind[] = [];
  if (kind === "jackpot") badges.push("jackpot");
  else if (kind === "group") badges.push("group");
  else badges.push("normal");
  if (battle.crazy) badges.push("crazy");
  if (battle.terminal) badges.push("terminal");
  return (
    <div className="flex items-center justify-start gap-8">
      {badges.map((id) => (
        <BattleBadge key={id} kind={id} />
      ))}
    </div>
  );
}

export function ModeIcon({ kind, className = "size-16" }: { kind: BadgeKind; className?: string }) {
  const item = BADGE[kind];
  const color = item.className.split(" ").find((c) => c.startsWith("text-")) ?? "";
  return (
    <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${color} ${className}`}>
      <item.Icon className="h-full w-full" />
    </span>
  );
}

export const MODE_META = {
  normal: {
    title: "Normal Battle",
    copy: "The player or team with the highest total value wins all drops.",
    color: "battle-normal",
  },
  jackpot: {
    title: "Jackpot Battle",
    copy: "The winner is drawn based on each player’s total value.",
    color: "battle-jackpot",
  },
  group: {
    title: "Group Battle",
    copy: "All players open the same cases. The total winnings are shared equally.",
    color: "battle-group",
  },
} as const;
