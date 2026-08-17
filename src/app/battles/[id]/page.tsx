"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { BattleSeat } from "@/components/battle-seat";
import { Bux } from "@/components/bux";
import { GreenButton, green3d } from "@/components/green-button";
import { Icons } from "@/components/icons";
import { useStore } from "@/components/providers";
import { subscribeBattles, type BattleGame } from "@/lib/backend";
import { battleCaseImage, mapBattleGame } from "@/lib/battles-map";
import { getCase } from "@/lib/catalog";

export default function BattleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, openModal, applyUser, battlesJoin, battlesBot, battlesGame } = useStore();
  const [game, setGame] = useState<BattleGame | null>(null);

  useEffect(() => {
    battlesGame(id).catch(() => {});
    return subscribeBattles((state) => {
      const found = state.games.find((g) => g._id === id);
      if (found) setGame(found);
    });
  }, [id, battlesGame]);

  const battle = useMemo(() => (game ? mapBattleGame(game) : null), [game]);

  if (!battle || !game) {
    return (
      <div className="grid gap-12">
        <Link href="/battles" className="text-14 text-grey-142 hover:text-white">
          ← Back to battles
        </Link>
        <p className="text-16">Loading battle…</p>
      </div>
    );
  }

  const seats = Array.from({ length: battle.slots }, (_, i) => {
    const bet = (game.bets || []).find((b) => b.slot === i);
    return bet
      ? { name: bet.bot ? "Bot" : bet.user?.username || "Player", bot: Boolean(bet.bot), slot: i, payout: bet.payout, outcomes: bet.outcomes || [] }
      : null;
  });

  const rolling = ["countdown", "pending", "rolling"].includes(game.state);
  const ended = game.state === "completed";

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
          <Link href="/fairness" className="hover:text-white">
            Provably fair
          </Link>
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
              {battle.cases.filter(Boolean).map((slug, i) => (
                <span key={`${slug}-${i}`} className="flex h-80 w-84 items-center justify-center">
                  <img alt="" src={battleCaseImage(slug)} className="h-72 w-72 object-contain transition-transform duration-300 hover:scale-110" />
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-14 text-white">
              {battle.players.length}
              <span className="text-grey-142">/{battle.slots}</span>
            </p>
            <p className="text-12 uppercase text-grey-142">{battle.teams}</p>
            <p className="text-12 uppercase text-grey-142">{game.state}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 md:grid-cols-3 lg:grid-cols-6">
        {seats.map((p, i) => {
          const won = ended && p && (p.payout || 0) > 0;
          return (
            <div key={i} className="animate-pop rounded-12 bg-grey-39 p-16 text-center" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex justify-center">
                <BattleSeat name={p?.name} filled={Boolean(p)} size={56} />
              </div>
              <p className="mt-10 truncate text-14">{p?.name ?? "Waiting"}</p>
              {ended && p ? (
                <p className={`mt-8 rounded-6 px-8 py-4 text-12 font-bold ${won ? "bg-green text-grey-28" : "bg-red/20 text-red"}`}>
                  {won ? "WINNER" : "LOST"}
                </p>
              ) : !p && game.state === "created" ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (!user) return openModal("login");
                    if (user.balance < battle.cost) return openModal("deposit");
                    try {
                      const res = await battlesJoin(game._id, i);
                      if (res.user) applyUser(res.user);
                    } catch (err) {
                      alert(err instanceof Error ? err.message : "Could not join.");
                    }
                  }}
                  className={`mt-10 flex h-32 w-full items-center justify-center shadow-[0_2px_0_rgba(0,0,0,0.25)] ${green3d}`}
                >
                  <span className="ui-btn-label text-12 text-grey-28">Join</span>
                </button>
              ) : rolling ? (
                <p className="mt-8 text-12 text-grey-142">Rolling…</p>
              ) : (
                <p className="mt-8 text-12 text-grey-142">{p ? "Ready" : "Waiting"}</p>
              )}
              {p?.outcomes?.length ? (
                <div className="mt-8 grid gap-4">
                  {p.outcomes.map((ticket, ri) => {
                    const slug = battle.cases[ri];
                    const drop = getCase(slug);
                    return (
                      <p key={ri} className="truncate text-11 text-grey-142">
                        {drop?.name ?? "Round"} · {ticket}
                      </p>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {ended ? (
        <div className="flex justify-center">
          <Link href="/battles" className={`flex h-40 items-center justify-center gap-6 px-20 shadow-[0_2px_0_rgba(0,0,0,0.25)] ${green3d}`}>
            <Icons.replay className="text-18 text-grey-28" />
            <span className="ui-btn-label text-13 text-grey-28">Back to battles</span>
          </Link>
        </div>
      ) : game.state === "created" ? (
        <div className="flex justify-center gap-8">
          <GreenButton
            onClick={async () => {
              if (!user) return openModal("login");
              try {
                await battlesBot(game._id);
              } catch (err) {
                alert(err instanceof Error ? err.message : "Could not add bots.");
              }
            }}
          >
            Fill with bots
          </GreenButton>
        </div>
      ) : (
        <div className="flex justify-center">
          <GreenButton onClick={() => {}}>Watch live</GreenButton>
        </div>
      )}
    </div>
  );
}
