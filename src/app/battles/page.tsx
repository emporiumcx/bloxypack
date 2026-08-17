"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BattleSeat, BattleVs } from "@/components/battle-seat";
import { Bux } from "@/components/bux";
import { ChoiceBar } from "@/components/bet-field";
import { Dropdown } from "@/components/dropdown";
import { GreenButton } from "@/components/green-button";
import { Icons } from "@/components/icons";
import { useStore } from "@/components/providers";
import { ItemBg } from "@/components/item-bg";
import { getCase, type Battle } from "@/lib/catalog";
import { subscribeBattles } from "@/lib/backend";
import { mapBattleGame } from "@/lib/battles-map";

const SORTS = [
  { id: "high", label: "Price High-Low" },
  { id: "low", label: "Price Low-High" },
  { id: "new", label: "Newest" },
  { id: "old", label: "Oldest" },
];

function seatGroups(b: Battle) {
  const filled = Array.from({ length: b.slots }, (_, i) => b.players[i] ?? null);
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

export default function BattlesPage() {
  const router = useRouter();
  const { user, openModal } = useStore();
  const [sort, setSort] = useState("high");
  const [activeOnly, setActiveOnly] = useState("all");
  const [live, setLive] = useState<Battle[]>([]);

  useEffect(() => {
    return subscribeBattles((state) => {
      setLive(state.games.map(mapBattleGame));
    });
  }, []);

  const list = useMemo(() => {
    const filtered = live.filter((b) => (activeOnly === "active" ? b.status === "active" : true));
    return filtered.sort((a, b) => {
      if (sort === "high") return b.cost - a.cost;
      if (sort === "low") return a.cost - b.cost;
      if (sort === "new") return b.id.localeCompare(a.id);
      return a.id.localeCompare(b.id);
    });
  }, [sort, activeOnly, live]);

  return (
    <div className="flex w-full justify-center">
    <div className="@xl/page:gap-32 @bt/page:gap-24 grid w-full grid-cols-1 gap-16">
      <h1 className="@sm/page:text-20 @md/page:text-24 w-full text-18 font-bold leading-[125%] text-white">Battles</h1>

      <div className="@md/page:grid-cols-[1fr_auto] grid w-full grid-cols-1 items-center gap-10">
        <div className="@md/page:justify-between @md/page:flex @sm/page:grid-cols-[auto_1fr] grid w-full grid-cols-1 items-center gap-10">
          <ChoiceBar
            value={activeOnly}
            onChange={(id) => setActiveOnly(id === activeOnly ? "all" : id)}
            options={[{ id: "active", label: "Active" }]}
          />
          <Dropdown value={sort} options={SORTS} onChange={setSort} className="md:w-[220px]" />
        </div>

        <div className="grid grid-cols-[1fr_40px] items-center gap-10">
          <GreenButton
            icon={<Icons.plus className="text-18" />}
            onClick={() => {
              if (!user) return openModal("login");
              router.push("/battles/create");
            }}
          >
            Create Battle
          </GreenButton>
          <button
            type="button"
            aria-label="refresh"
            onClick={() => {
              /* live list is socket-driven */
            }}
            className="group/button relative flex h-40 w-40 cursor-pointer items-center justify-center rounded-6 bg-grey-28"
          >
            <Icons.refresh className="text-20 text-grey-142 transition-transform duration-500 group-hover/button:rotate-[360deg]" />
          </button>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-12">
      <div>
      <ul className="grid w-full grid-cols-1 gap-8">
        {list.length === 0 ? (
          <li className="rounded-12 bg-grey-39 p-24 text-center text-14 text-grey-142">
            No live battles yet. Create one to get started.
          </li>
        ) : null}
        {list.map((b) => {
          const ended = b.status === "ended";
          const groups = seatGroups(b);
          const action = ended ? "Replay" : b.players.length < b.slots ? "Join" : "Watch";
          const href = `/battles/${b.id}`;
          const mode = /team/i.test(b.teams) ? "team" : "normal";
          const seatCols = b.slots + Math.max(0, groups.length - 1);
          return (
            <li key={b.id} className="w-full">
              <div className="tr @container relative w-full rounded-12 bg-grey-39 opacity-60 hover:opacity-100 active:opacity-100">
                <div className="@[850px]:px-20 @md/page:py-8 relative w-full px-12 py-12">
                  <div className="@[1000px]:gap-16 @[850px]:grid-cols-[auto_1fr_auto] @[1240px]:gap-26 @[540px]:grid-cols-[1fr_auto] grid w-full grid-cols-1 items-center gap-12">
                    <div className="@[540px]:col-span-2 @[850px]:col-span-1 @[850px]:w-[302px] @[850px]:grid-cols-1 @[850px]:gap-6 @[540px]:grid-cols-[auto_auto] col-span-1 grid animate-show grid-cols-1 items-center justify-center gap-14">
                      <div className="flex w-full justify-center">
                        <p className="w-full text-center text-14 uppercase text-grey-190">{mode}</p>
                      </div>
                      <div className="flex items-center justify-center">
                        <div
                          className="@sm/page:gap-8 grid items-center gap-4"
                          style={{ gridTemplateColumns: `repeat(${seatCols}, auto)` }}
                        >
                          {groups.map((g, gi) => (
                            <div key={gi} className="contents">
                              {gi > 0 ? <BattleVs /> : null}
                              {g.map((p, pi) => (
                                <BattleSeat key={pi} name={p?.name} filled={Boolean(p)} />
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="@sm/page:h-80 @sm/page:rounded-8 relative h-56 w-full rounded-4 bg-grey-28">
                      <div className="@sm/page:rounded-8 grid h-full w-full grid-cols-1 overflow-hidden rounded-4 bg-grey-28">
                        <div className="relative h-full w-full overflow-hidden">
                          <div className="@sm/page:h-[80px] absolute left-0 top-0 flex h-[56px] w-max overflow-hidden">
                            {b.cases.map((slug, ci) => {
                              const c = getCase(slug);
                              return (
                                <button
                                  key={`${slug}-${ci}`}
                                  type="button"
                                  aria-label="open"
                                  className="group/case @sm/page:h-80 @sm/page:w-84 relative flex h-56 w-56 items-center justify-center opacity-100"
                                >
                                  {c ? (
                                    <>
                                      <ItemBg className="inset-4 opacity-35" />
                                      <img
                                        alt=""
                                        src={c.image ?? `/cdn/cases/${c.imageId}.webp`}
                                        className="@sm/page:h-72 @sm/page:w-72 relative h-48 w-48 object-contain"
                                      />
                                    </>
                                  ) : null}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="absolute right-8 top-8 opacity-[1] transition-opacity duration-200">
                        <div className="h-24 rounded-5 bg-grey-39">
                          <div className="relative flex h-full w-full items-center justify-center rounded-5 px-8">
                            <div className="relative flex items-center">
                              <div className="flex items-center justify-center" style={{ width: 16, height: 16 }}>
                                <Icons.cases className="text-white" style={{ marginLeft: -2, scale: 0.8 }} />
                              </div>
                              <p className="ml-4 flex text-12 text-white">
                                {b.cases.length}
                                <span className="text-12 text-grey-142">/{b.cases.length}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="@[540px]:w-[285px] grid w-full grid-cols-1 items-center gap-12 pt-4">
                      <div className="@xs/page:grid-cols-[1fr_auto] grid w-full animate-show grid-cols-1 items-center gap-10">
                        <div className="grid w-full grid-cols-1 gap-4">
                          <GreenButton href={href} size="sm" wide={false} icon={ended ? <Icons.replay /> : undefined}>
                            {action}
                          </GreenButton>
                          {ended ? (
                            <div className="flex w-full justify-center">
                              <div className="@sm/page:px-6 grid grid-cols-[auto_1fr] items-center justify-center gap-4">
                                <p className="text-12 text-grey-142">Unboxed:</p>
                                <Bux value={b.unboxed} />
                              </div>
                            </div>
                          ) : null}
                        </div>
                        <div className="@xs/page:w-120 grid w-full grid-cols-1 items-center gap-12 @[540px]:gap-6 @[1240px]:gap-12">
                          <div className="grid w-full grid-cols-1 gap-4">
                            <Link href={href} className="flex h-32 w-full items-start rounded-8 bg-grey-28">
                              <div className="flex h-full w-full items-center justify-center rounded-8 bg-grey-28 px-10">
                                <div className="flex w-full justify-center">
                                  <Bux value={b.cost} />
                                </div>
                              </div>
                            </Link>
                            <div className="flex h-18 items-center justify-center">
                              <p className="text-12 text-grey-190">Battle cost</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      </div>
      </div>
    </div>
    </div>
  );
}
