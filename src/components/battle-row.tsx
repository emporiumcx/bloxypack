import Link from "next/link";
import { BattleModeBadges } from "./battle-modes";
import { BattleSeat, BattleVs } from "./battle-seat";
import { Bux } from "./bux";
import { Icons } from "./icons";
import { ItemBg } from "./item-bg";
import { botAvatar } from "@/lib/avatars";
import { caseImage, getCase, type Battle } from "@/lib/catalog";

export function seatGroups(b: Battle) {
  const filled = Array.from({ length: b.slots }, (_, i) => {
    const p = b.players[i] ?? null;
    return p ? { ...p, slot: p.slot ?? i } : null;
  });
  const nums = b.teams.match(/\d+/g)?.map(Number);
  if (nums && nums.length >= 2 && nums.reduce((a, n) => a + n, 0) === b.slots) {
    const groups: (typeof filled)[] = [];
    let i = 0;
    for (const n of nums) {
      groups.push(filled.slice(i, i + n));
      i += n;
    }
    return groups;
  }
  return filled.map((p) => [p]);
}

export function BattleRow({ battle: b }: { battle: Battle; compact?: boolean }) {
  const ended = b.status === "ended";
  const groups = seatGroups(b);
  const openSlots = b.players.length < b.slots;
  const action = ended ? "Replay" : openSlots ? "Join Battle" : "Watch Battle";
  const href = `/battles/${b.id}`;
  const opened = b.status === "ended" ? b.cases.length : Math.min(b.opened ?? 0, b.cases.length);
  const joinCost = (b.funding || 0) > 0 ? b.cost * (1 - Math.min(80, b.funding || 0) / 100) : b.cost;

  return (
    <Link
      href={href}
      className="flex w-full cursor-pointer flex-col gap-8 rounded-8 bg-grey-39 p-8 shadow-[0_-2px_0_var(--color-grey-58)] md:flex-row md:gap-16"
    >
      <div className="flex w-full flex-col items-center gap-12 md:w-240">
        <div className="flex w-full items-center justify-between gap-8 px-8 py-4">
          <BattleModeBadges battle={b} />
        </div>
        <div className="flex w-full items-center justify-center gap-4">
          {groups.map((g, gi) => (
            <div key={gi} className="contents">
              {gi > 0 ? <BattleVs /> : null}
              {g.map((p, pi) => (
                <BattleSeat
                  key={pi}
                  name={p?.name}
                  filled={Boolean(p)}
                  size={28}
                  empty="x"
                  interactive={false}
                  src={p?.bot ? botAvatar(p.slot ?? pi) : p?.avatar}
                  level={p?.level}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="relative min-w-0 flex-1">
        <div className="absolute top-6 right-6 z-20 rounded-6 bg-grey-28 px-4 py-2 text-11 text-grey-142">
          {opened}/{b.cases.length || 0}
        </div>
        <div className="no-scrollbar w-full overflow-x-auto rounded-6 bg-grey-28 p-6">
          <div className="flex gap-8">
            {b.cases.map((slug, ci) => {
              const c = getCase(slug);
              const done = ci < opened;
              return (
                <div
                  key={`${slug}-${ci}`}
                  className={`box-border flex size-64 shrink-0 items-center justify-center rounded-6 bg-grey-39 p-8 ${done ? "opacity-50" : ""}`}
                >
                  {c ? (
                    <>
                      <ItemBg className="inset-4 opacity-30" />
                      <img alt="" src={caseImage(c)} className="relative h-48 w-48 object-contain" />
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="hidden w-full flex-col items-center justify-center gap-4 md:flex md:w-160">
        <Bux value={joinCost} />
        <span className="text-12 text-grey-142">{(b.funding || 0) > 0 ? "Join Cost" : "Battle Cost"}</span>
      </div>

      <div className="flex w-full flex-row-reverse items-center justify-between gap-8 md:w-160 md:flex-col md:justify-center">
        <div className="flex flex-col items-center md:hidden">
          <Bux value={joinCost} size="sm" />
          <span className="text-11 text-grey-142">Battle Cost</span>
        </div>
        <div className="flex items-center gap-6 text-12 text-grey-142">
          <span>Unboxed:</span>
          <Bux value={b.unboxed || 0} size="xs" />
        </div>
        <span
          className={`inline-flex h-32 items-center justify-center rounded-6 px-12 text-12 font-medium text-white md:h-36 md:w-full ${
            action === "Join Battle" ? "bg-gradient-to-b from-green to-green-2" : "bg-grey-47"
          }`}
        >
          {ended ? <Icons.replay className="mr-6 text-14" /> : null}
          {action}
        </span>
      </div>
    </Link>
  );
}
