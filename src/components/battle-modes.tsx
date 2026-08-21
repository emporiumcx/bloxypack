import type { ReactNode } from "react";
import type { Battle } from "@/lib/catalog";

export type BadgeKind = "jackpot" | "crazy" | "normal" | "group" | "terminal";

const BADGE: Record<BadgeKind, { label: string; className: string; icon: ReactNode }> = {
  jackpot: {
    label: "Jackpot",
    className: "bg-battle-jackpot/15 text-battle-jackpot",
    icon: (
      <svg viewBox="0 0 233.18 179.2" className="h-full w-auto fill-current" aria-hidden>
        <path d="M176.45 179.2H58.37c-5.58 0-10.11-4.53-10.11-10.11s4.53-10.11 10.11-10.11h118.08c5.58 0 10.11 4.53 10.11 10.11s-4.53 10.11-10.11 10.11m37.38-95.77-26.65 63.54c-.38.89-1.25 1.48-2.23 1.48H49.86c-.98 0-1.85-.59-2.23-1.48L20.7 82.76c2.59-1.44 4.77-3.53 6.31-6.05l25.54 19.23c1.63 1.23 3.96 0 3.86-2.03l-1.5-31.92c2.28-.21 4.43-.88 6.36-1.91l18.24 34.55c.95 1.78 3.53 1.69 4.34-.16l24.43-55.66c2.79 1.24 5.87 1.92 9.11 1.92s6.33-.69 9.12-1.92l24.43 55.66c.82 1.85 3.4 1.94 4.34.16l17.44-33.04c2.11 1.27 4.5 2.1 7.07 2.35l-1.4 29.98c-.1 2.03 2.23 3.27 3.85 2.03l24.45-18.4c1.78 2.56 4.23 4.62 7.12 5.89Z" />
      </svg>
    ),
  },
  crazy: {
    label: "Crazy",
    className: "bg-battle-crazy/15 text-battle-crazy",
    icon: (
      <svg viewBox="0 0 198.92 198.51" className="h-full w-auto fill-current" aria-hidden>
        <path d="M109.82 31.46C64.68 17.94 17.13 43.56 3.61 88.7c-13.52 45.13 12.11 92.68 57.25 106.2 45.13 13.52 92.68-12.11 106.2-57.24 13.52-45.14-12.11-92.68-57.24-106.2M41.37 89.87l10.25-6.86-6.85-10.25c-1.64-2.46-.98-5.81 1.48-7.46 1.74 0 3.45.84 4.48 2.38l6.86 10.26 10.25-6.86c2.46-1.64 5.81-.97 7.46 1.48 0 1.74-.84 3.45-2.38 4.48l-10.26 6.86 8.51 12.73c1.64 2.45.97 5.81-1.48 7.45-2.46 1.64-5.81.97-7.46-1.48l-8.51-12.73-10.25 6.86c-2.45 1.64-5.81.98-7.45-1.48s-.98-5.81 1.48-7.45" />
      </svg>
    ),
  },
  normal: {
    label: "Normal",
    className: "bg-battle-normal/15 text-battle-normal",
    icon: (
      <svg viewBox="0 0 139.76 146.56" className="h-full w-auto fill-current" aria-hidden>
        <path d="M5.45 61.8c15.37 28.25 31.89 15.41 36.98 10.32.87-.87 2.19-1.07 3.27-.49 4.48 2.42 12.11 1.47 16.08.74 1.25-.23 2.53.38 3.04 1.54 1.32 3.01 5.17 6.04 8.83 8.38 2.1 1.35 1.52 4.6-.92 5.12-12.77 2.74-15.37 11.52-15.87 15.68-.14 1.19.79 2.23 1.99 2.23.85 0 1.59-.55 1.89-1.35 3.94-10.4 23.32-10.56 29.23-11.25 4.69-.55 13.71-3.09 17.73-4.26 1.2-.35 2.03-1.46 2.03-2.71 0-1.1-.64-2.11-1.64-2.57-1.63-.74-4.36-1.84-7.67-2.63C33 100.74 1.32 100.74.16 62.95c.18-2.82 3.95-3.63 5.3-1.15Z" />
      </svg>
    ),
  },
  group: {
    label: "Group",
    className: "bg-battle-group/15 text-battle-group",
    icon: (
      <svg viewBox="0 0 24 24" className="h-full w-auto fill-current" aria-hidden>
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
  },
  terminal: {
    label: "Terminal",
    className: "bg-battle-terminal/15 text-battle-terminal",
    icon: (
      <svg viewBox="0 0 24 24" className="h-full w-auto fill-current" aria-hidden>
        <path d="M12 2a7 7 0 0 0-7 7c0 3.2 2.1 5.9 5 6.7V18h4v-2.3c2.9-.8 5-3.5 5-6.7a7 7 0 0 0-7-7Zm-2.2 8.2-.9-1.4 1.4-.9 1.4 2.1-1.9.2Zm4.4 0-1.9-.2 1.4-2.1 1.4.9-.9 1.4ZM8 20h8v2H8v-2Z" />
      </svg>
    ),
  },
};

export function battleKind(b: Battle): "normal" | "jackpot" | "group" {
  if (/group/i.test(b.teams)) return "group";
  if (b.jackpot) return "jackpot";
  return "normal";
}

export function BattleBadge({ kind }: { kind: BadgeKind }) {
  const item = BADGE[kind];
  return (
    <div className={`inline-flex items-center gap-6 rounded-6 px-6 py-5 text-11 font-medium ${item.className}`}>
      <span className="flex h-15 items-center">{item.icon}</span>
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

export function ModeIcon({ kind, className = "size-20" }: { kind: BadgeKind; className?: string }) {
  const item = BADGE[kind];
  const color = item.className.split(" ").find((c) => c.startsWith("text-")) ?? "";
  return <span className={`inline-flex items-center justify-center ${color} ${className}`}>{item.icon}</span>;
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
