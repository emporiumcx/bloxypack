"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BattleRow } from "@/components/battle-row";
import { ChoiceBar } from "@/components/bet-field";
import { Dropdown } from "@/components/dropdown";
import { GreenButton } from "@/components/green-button";
import { Icons } from "@/components/icons";
import { useStore } from "@/components/providers";
import { subscribeBattles } from "@/lib/backend";
import { mapBattleGame } from "@/lib/battles-map";
import type { Battle } from "@/lib/catalog";

const SORTS = [
  { id: "high", label: "Price High-Low" },
  { id: "low", label: "Price Low-High" },
  { id: "new", label: "Newest" },
  { id: "old", label: "Oldest" },
];

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
        <h1 className="@sm/page:text-20 @md/page:text-24 font-display w-full text-28 uppercase leading-[125%] text-cream">Battles</h1>

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
              className="group/button relative flex h-40 w-40 cursor-pointer items-center justify-center rounded-6 bg-grey-28"
            >
              <Icons.refresh className="text-20 text-grey-142 transition-transform duration-500 group-hover/button:rotate-[360deg]" />
            </button>
          </div>
        </div>

        <ul className="grid w-full grid-cols-1 gap-8">
          {list.length === 0 ? (
            <li className="rounded-12 bg-grey-39 p-24 text-center text-14 text-grey-142">
              No live battles yet. Create one to get started.
            </li>
          ) : null}
          {list.map((b) => (
            <li key={b.id} className="w-full">
              <BattleRow battle={b} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
