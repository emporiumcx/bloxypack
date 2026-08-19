import Link from "next/link";
import { caseImage, getCase, type Battle } from "@/lib/catalog";
import { botAvatar } from "@/lib/avatars";
import { BattleSeat, BattleVs } from "./battle-seat";
import { Bux } from "./bux";
import { GreenButton } from "./green-button";
import { Icons } from "./icons";
import { ItemBg } from "./item-bg";

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

export function BattleRow({ battle: b, compact = false }: { battle: Battle; compact?: boolean }) {
  const ended = b.status === "ended";
  const groups = seatGroups(b);
  const action = ended ? "Replay" : b.players.length < b.slots ? "Join" : "Watch";
  const href = `/battles/${b.id}`;
  const mode = /team/i.test(b.teams) ? "team" : "normal";
  const seatCols = b.slots + Math.max(0, groups.length - 1);
  const round = `${Math.min(b.unboxed || 0, b.cases.length)}/${b.cases.length}`;

  return (
    <div className="tr @container relative w-full overflow-hidden rounded-12 bg-grey-39">
      <div className={`relative w-full ${compact ? "px-12 py-10" : "@[850px]:px-20 @md/page:py-8 px-12 py-12"}`}>
        <div className="@[1000px]:gap-16 @[850px]:grid-cols-[auto_1fr_auto] @[540px]:grid-cols-[1fr_auto] grid w-full grid-cols-1 items-center gap-12">
          <div className="@[850px]:w-[220px] grid grid-cols-[auto_1fr] items-center gap-12">
            <div className="grid justify-items-center gap-4">
              <div className="flex h-36 w-36 items-center justify-center rounded-8 bg-grey-28 text-green">
                <Icons.battles style={{ marginLeft: 0, scale: 1.1 }} />
              </div>
              <p className="text-11 font-extrabold uppercase tracking-wide text-grey-142">{mode}</p>
              {(b.jackpot || b.crazy || b.terminal) ? (
                <div className="flex items-center gap-4">
                  {b.jackpot ? (
                    <span title="Jackpot" className="text-[#FE963B]">
                      <Icons.jackpot />
                    </span>
                  ) : null}
                  {b.crazy ? (
                    <span title="Crazy" className="text-pink-231">
                      <Icons.wild />
                    </span>
                  ) : null}
                  {b.terminal ? (
                    <span title="Terminal" className="text-red">
                      <Icons.terminal />
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="grid gap-8">
              <p className="text-12 font-bold text-grey-190">
                {round} <span className="text-grey-142">rounds</span>
              </p>
              <div
                className="grid items-center gap-4"
                style={{ gridTemplateColumns: `repeat(${seatCols}, auto)` }}
              >
                {groups.map((g, gi) => (
                  <div key={gi} className="contents">
                    {gi > 0 ? <BattleVs /> : null}
                    {g.map((p, pi) => (
                      <BattleSeat
                        key={pi}
                        name={p?.name}
                        filled={Boolean(p)}
                        size={compact ? 32 : 40}
                        src={p?.bot ? botAvatar(p.slot ?? pi) : p?.avatar}
                        level={p?.level}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative h-72 w-full overflow-hidden rounded-8 bg-grey-28">
            <div className="absolute left-0 top-0 flex h-full w-max items-center">
              {b.cases.map((slug, ci) => {
                const c = getCase(slug);
                const active = ci === (b.unboxed || 0);
                return (
                  <div
                    key={`${slug}-${ci}`}
                    className={`relative flex h-72 w-72 items-center justify-center ${
                      active ? "rounded-8 ring-1 ring-green" : "opacity-70"
                    }`}
                  >
                    {c ? (
                      <>
                        <ItemBg className="inset-6 opacity-30" />
                        <img
                          alt=""
                          src={caseImage(c)}
                          className="relative h-56 w-56 object-contain"
                        />
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="@[540px]:w-[200px] grid w-full items-center gap-8">
            <div className="flex items-center justify-between gap-10">
              <div className="grid gap-2">
                <p className="text-11 font-extrabold uppercase tracking-wide text-grey-142">
                  {(b.funding || 0) > 0 ? "Join cost" : "Battle cost"}
                </p>
                <Bux value={(b.funding || 0) > 0 ? b.cost * (1 - Math.min(80, b.funding || 0) / 100) : b.cost} />
                {(b.funding || 0) > 0 ? (
                  <p className="text-11 text-grey-142">Borrow {Math.min(80, b.funding || 0)}%</p>
                ) : null}
              </div>
              {compact ? (
                <Link
                  href={href}
                  className="flex h-36 items-center rounded-6 bg-grey-58 px-12 text-12 font-extrabold uppercase tracking-wide text-cream"
                >
                  View Battle
                </Link>
              ) : (
                <GreenButton href={href} size="sm" wide={false} icon={ended ? <Icons.replay /> : undefined}>
                  {action}
                </GreenButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
