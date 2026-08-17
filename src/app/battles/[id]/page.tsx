"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { BattleSeat } from "@/components/battle-seat";
import { Bux } from "@/components/bux";
import { GreenButton, green3d } from "@/components/green-button";
import { Icons } from "@/components/icons";
import { useStore } from "@/components/providers";
import { findBattle, saveLocalBattle } from "@/lib/battles-local";
import { getCase } from "@/lib/catalog";

export default function BattleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, spend, openModal } = useStore();
  const [tick, setTick] = useState(0);
  const battle = useMemo(() => findBattle(id), [id, tick]);

  if (!battle) {
    return (
      <div className="grid gap-12">
        <Link href="/battles" className="text-14 text-grey-142 hover:text-white">
          ← Back to battles
        </Link>
        <p className="text-16">Battle not found.</p>
      </div>
    );
  }

  const seats = Array.from({ length: battle.slots }, (_, i) => battle.players[i] ?? null);

  return (
    <div className="grid w-full grid-cols-1 gap-16">
      <div className="flex items-center justify-between text-13 text-grey-142">
        <Link href="/battles" className="hover:text-white">
          ← Back to battles
        </Link>
        <div className="flex gap-12">
          <button type="button" className="hover:text-white" onClick={() => navigator.clipboard.writeText(window.location.href)}>
            Share
          </button>
          <button type="button" className="hover:text-white">
            Provably fair
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-12 bg-grey-39 px-12 py-12 md:px-20">
        <div className="grid w-full grid-cols-1 items-center gap-16 md:grid-cols-[auto_1fr_auto]">
          <div>
            <p className="text-12 uppercase text-grey-142">Battle cost</p>
            <Bux value={battle.cost} className="text-18" />
          </div>
          <div className="relative min-h-[80px] overflow-hidden rounded-4 bg-grey-28">
            <div className="flex h-[80px] w-max items-center">
              {battle.cases.map((slug) => {
                const c = getCase(slug);
                return c ? (
                  <span key={slug} className="flex h-80 w-84 items-center justify-center">
                    <img
                      alt=""
                      src={`/cdn/cases/${c.imageId}.webp`}
                      className="h-72 w-72 object-contain transition-transform duration-300 hover:scale-110"
                    />
                  </span>
                ) : null;
              })}
            </div>
          </div>
          <div className="text-right">
            <p className="text-14 text-white">
              {battle.players.length}
              <span className="text-grey-142">/{battle.slots}</span>
            </p>
            <p className="text-12 uppercase text-grey-142">{battle.teams}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 md:grid-cols-3 lg:grid-cols-6">
        {seats.map((p, i) => {
          const won = battle.status === "ended" && i === 0;
          return (
            <div key={i} className="animate-pop rounded-12 bg-grey-39 p-16 text-center" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex justify-center">
                <BattleSeat name={p?.name} filled={Boolean(p)} size={56} />
              </div>
              <p className="mt-10 truncate text-14">{p?.name ?? "Waiting"}</p>
              {battle.status === "ended" && p ? (
                <p className={`mt-8 rounded-6 px-8 py-4 text-12 font-bold ${won ? "bg-green text-grey-28" : "bg-red/20 text-red"}`}>
                  {won ? "WINNER" : "LOST"}
                </p>
              ) : !p ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!user) return openModal("login");
                    if (!spend(battle.cost)) return openModal("deposit");
                    saveLocalBattle({
                      ...battle,
                      players: [...battle.players, { name: user.username, team: battle.players.length }],
                    });
                    setTick((t) => t + 1);
                  }}
                  className={`mt-10 flex h-32 w-full items-center justify-center ${green3d} text-14 text-grey-28`}
                >
                  Join
                </button>
              ) : (
                <p className="mt-8 text-12 text-grey-142">Ready</p>
              )}
            </div>
          );
        })}
      </div>

      {battle.status === "ended" ? (
        <div className="flex justify-center">
          <Link href="/battles" className={`flex h-40 items-center justify-center gap-6 px-20 ${green3d} text-14 text-grey-28`}>
            <Icons.replay className="text-18" />
            Replay
          </Link>
        </div>
      ) : (
        <div className="flex justify-center">
          <GreenButton onClick={() => {}}>Watch live</GreenButton>
        </div>
      )}
    </div>
  );
}
