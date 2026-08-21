"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BattleRow } from "@/components/battle-row";
import { Dropdown } from "@/components/dropdown";
import { Icons } from "@/components/icons";
import { useStore } from "@/components/providers";
import type { Battle } from "@/lib/catalog";
import { subscribeBattles } from "@/lib/backend";
import { mapBattleGame } from "@/lib/battles-map";
import { battleKind } from "@/components/battle-modes";

const TABS = [
  { id: "active", label: "Active Battles" },
  { id: "weekly", label: "Top Weekly" },
  { id: "mine", label: "My Battles" },
] as const;

const TYPES = [
  { id: "all", label: "Battle Type" },
  { id: "normal", label: "Normal" },
  { id: "jackpot", label: "Jackpot" },
  { id: "group", label: "Group" },
];

const MODES = [
  { id: "all", label: "Battle Mode" },
  { id: "crazy", label: "Crazy" },
  { id: "terminal", label: "Terminal" },
];

const SORTS = [
  { id: "high", label: "Price Descending" },
  { id: "low", label: "Price Ascending" },
  { id: "new", label: "Newest" },
  { id: "old", label: "Oldest" },
];

function sortBattles(list: Battle[], sort: string) {
  return [...list].sort((a, b) => {
    if (sort === "high") return b.cost - a.cost;
    if (sort === "low") return a.cost - b.cost;
    if (sort === "new") return (b.createdAt || 0) - (a.createdAt || 0) || b.id.localeCompare(a.id);
    return (a.createdAt || 0) - (b.createdAt || 0) || a.id.localeCompare(b.id);
  });
}

function applyFilters(list: Battle[], type: string, mode: string) {
  return list.filter((b) => {
    if (type !== "all" && battleKind(b) !== type) return false;
    if (mode === "crazy" && !b.crazy) return false;
    if (mode === "terminal" && !b.terminal) return false;
    return true;
  });
}

function CreateBattleButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-35 shrink-0 items-center justify-center gap-8 rounded-6 bg-gradient-to-b from-green to-green-2 px-13 text-[13.125px] font-medium leading-[15.3125px] whitespace-nowrap text-[#e4fbff] transition-all duration-200 hover:brightness-110 active:brightness-95 ${className}`}
    >
      <Icons.plus className="size-16" />
      Create New Battle
    </button>
  );
}

export default function BattlesPage() {
  const router = useRouter();
  const { user, openModal } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("active");
  const [type, setType] = useState("all");
  const [mode, setMode] = useState("all");
  const [sort, setSort] = useState("high");
  const [live, setLive] = useState<Battle[]>([]);
  const [history, setHistory] = useState<Battle[]>([]);

  useEffect(() => {
    return subscribeBattles((state) => {
      setLive(state.games.filter((g) => g.state !== "cancelled" && g.state !== "canceled" && g.state !== "completed").map(mapBattleGame));
      setHistory((state.history || []).map(mapBattleGame));
    });
  }, []);

  const active = live.filter((b) => b.status === "active");

  const list = useMemo(() => {
    let rows =
      tab === "active"
        ? active
        : tab === "weekly"
          ? history
          : history.concat(live).filter((b) => user && b.players.some((p) => p.name === user.username));
    rows = applyFilters(rows, type, mode);
    return sortBattles(rows, sort);
  }, [tab, type, mode, sort, active, history, live, user]);

  const dailyTop = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const today = history.filter((b) => (b.createdAt || 0) >= start.getTime());
    return sortBattles(today.length ? today : history, "high").slice(0, 6);
  }, [history]);

  const create = () => {
    if (!user) return openModal("login");
    router.push("/battles/create");
  };

  return (
    <div className="w-full max-w-full">
      <div className="inline-flex w-full items-center gap-10">
        <div className="flex items-center justify-start gap-10">
          <div className="flex size-40 shrink-0 items-center justify-center rounded-6 bg-green/15 text-green">
            <Icons.battles className="size-16" />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="tactic-heading-xs text-start text-white">Battles</h1>
            <span className="text-start text-[13.125px] leading-[15.3125px] text-grey-142">Discover live battles and compete!</span>
          </div>
        </div>
        <CreateBattleButton className="ml-auto md:hidden" onClick={create} />
      </div>

      <div className="mt-16 flex w-full flex-col items-end gap-16 md:flex-row md:flex-wrap">
        <div className="inline-flex w-full gap-4 rounded-8 border border-grey-58 bg-grey-39 p-4 md:w-auto">
          {TABS.map((t) => {
            const on = tab === t.id;
            const count = t.id === "active" ? active.length : undefined;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex h-28 flex-1 items-center justify-center whitespace-nowrap rounded-6 px-11 text-[13.125px] font-medium leading-[15.3125px] md:flex-initial ${
                  on ? "bg-gradient-to-b from-green to-green-2 text-white" : "text-white hover:bg-white/5"
                }`}
              >
                {t.label}
                {count != null ? ` (${count})` : ""}
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex w-full flex-wrap items-center gap-10 md:w-auto">
          <Dropdown value={type} options={TYPES} onChange={setType} size="sm" className="w-full md:w-[129px]" />
          <Dropdown value={mode} options={MODES} onChange={setMode} size="sm" className="w-full md:w-[140px]" />
          <Dropdown value={sort} options={SORTS} onChange={setSort} size="sm" className="w-full md:w-[166px]" />
          <CreateBattleButton className="hidden md:inline-flex" onClick={create} />
        </div>
      </div>

      <div className="mt-16 flex min-h-[50vh] w-full flex-col gap-8 md:gap-16">
        {list.length === 0 ? (
          <div className="rounded-8 bg-grey-39 p-24 text-center text-14 text-grey-142">
            {tab === "mine" ? "You haven’t joined any battles yet." : tab === "weekly" ? "No completed battles yet." : "No live battles yet. Create one to get started."}
          </div>
        ) : (
          list.map((b) => <BattleRow key={b.id} battle={b} />)
        )}
      </div>

      {tab === "active" && dailyTop.length > 0 ? (
        <div className="mt-24 flex flex-col gap-12">
          <div className="flex items-center justify-start gap-10">
            <div className="flex size-40 shrink-0 items-center justify-center rounded-6 bg-green/15 text-green">
              <Icons.trophy className="text-16" />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <h2 className="tactic-heading-xs text-start text-white">Daily Top Battles</h2>
              <span className="text-start text-[13.125px] leading-[15.3125px] text-grey-142">Today’s biggest battles to replay</span>
            </div>
          </div>
          <div className="flex flex-col gap-8 md:gap-16">
            {dailyTop.map((b) => (
              <BattleRow key={`top-${b.id}`} battle={b} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
