"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bux } from "./bux";
import { BetValueField, GameHeading, GameLayout } from "@/components/game-chrome";
import { Icons } from "./icons";
import { useStore } from "./providers";
import { UserAvatar } from "./user-avatar";
import { rouletteBet, subscribeRoulette, type RouletteBetRow, type RouletteColor, type RouletteGame } from "@/lib/backend";
import { REEL_LOOPS, ROULETTE_ORDER, ROULETTE_PAYOUT, TILE_SLOT, TILE_W, rouletteColor } from "@/lib/roulette";

const TILES = Array.from({ length: REEL_LOOPS }, () => [...ROULETTE_ORDER]).flat();

const COLOR_MARK: Record<RouletteColor, { src: string; label: string }> = {
  red: { src: "/img/roulette/claw.png", label: "Claw" },
  green: { src: "/img/roulette/lion.png", label: "Lion" },
  black: { src: "/img/roulette/banana.png", label: "Banana" },
};

function tileTone(n: number) {
  const color = rouletteColor(n);
  if (color === "green") return "border-b-green-95 border-t-green-222 bg-green text-grey-28";
  if (color === "red") return "border-b-[#7a1828] border-t-[#ff8a9a] bg-red-dark text-white";
  return "border-b-[#0d1014] border-t-white/20 bg-[#24282f] text-white";
}

function columnTone(color: RouletteColor, active: boolean) {
  if (color === "green") return active ? "border-green bg-green/10" : "border-grey-47 bg-grey-28";
  if (color === "red") return active ? "border-red-dark bg-red-dark/15" : "border-grey-47 bg-grey-28";
  return active ? "border-white/40 bg-grey-39" : "border-grey-47 bg-grey-28";
}

function headerTone(color: RouletteColor) {
  if (color === "green") return "border-b-green-95 border-t-green-222 bg-green text-grey-28";
  if (color === "red") return "border-b-[#7a1828] border-t-[#ff8a9a] bg-red-dark text-white";
  return "border-b-[#0d1014] border-t-white/20 bg-[#24282f] text-white";
}

export function RouletteGame() {
  const { user, openModal, applyUser } = useStore();
  const [game, setGame] = useState<RouletteGame | null>(null);
  const [bets, setBets] = useState<RouletteBetRow[]>([]);
  const [history, setHistory] = useState<{ outcome: number; color: RouletteColor }[]>([]);
  const [bet, setBet] = useState(10);
  const [now, setNow] = useState(Date.now());
  const [offset, setOffset] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [error, setError] = useState("");
  const trackRef = useRef<HTMLDivElement>(null);
  const lastSpin = useRef<string>("");

  useEffect(() => subscribeRoulette((state) => {
    setGame(state.game);
    setBets(state.bets);
    setHistory(state.history);
  }), []);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!game) return;
    if (game.state === "created") {
      lastSpin.current = "";
      setSpinning(false);
      setOffset(0);
      return;
    }
    if ((game.state === "rolling" || game.state === "completed") && game.outcome != null && lastSpin.current !== game._id) {
      lastSpin.current = game._id;
      const width = trackRef.current?.clientWidth || 900;
      const loop = 6;
      const idx = loop * ROULETTE_ORDER.length + ROULETTE_ORDER.indexOf(game.outcome as (typeof ROULETTE_ORDER)[number]);
      const jitter = (Math.random() - 0.5) * 18;
      const target = idx * TILE_SLOT + TILE_W / 2 - width / 2 + jitter;
      setSpinning(true);
      requestAnimationFrame(() => setOffset(target));
    }
  }, [game]);

  const remain = Math.max(0, (game?.endsAt || 0) - now);
  const betting = game?.state === "created";
  const seconds = (remain / 1000).toFixed(1);
  const barPct = betting ? Math.max(0, Math.min(100, (remain / 15000) * 100)) : game?.state === "rolling" ? 100 : 0;

  const grouped = useMemo(() => {
    const map: Record<RouletteColor, RouletteBetRow[]> = { red: [], black: [], green: [] };
    for (const b of bets) map[b.color]?.push(b);
    return map;
  }, [bets]);

  async function place(color: RouletteColor) {
    if (!user) return openModal("login");
    if (user.balance < bet) return openModal("deposit");
    if (!betting) return;
    setError("");
    try {
      const res = await rouletteBet(bet, color);
      if (res.user) applyUser(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bet failed.");
    }
  }

  const status =
    game?.state === "rolling" ? "Spinning" : game?.state === "completed" ? "Round over" : `Rolling in ${seconds}s`;

  return (
    <GameLayout
      fairness="Roulette"
      fairFields={[
        { label: "Server Seed", value: game?.fair?.seedServer, placeholder: "Revealed after the spin" },
        { label: "Server Seed (Hashed)", value: game?.fair?.hash },
        { label: "Public Seed", value: game?.fair?.seedPublic },
      ]}
      howTo={{
        body: (
          <>
            <p>Set your amount, then pick Claw, Lion, or Banana before the timer hits zero.</p>
            <p>Lion pays the most. You can place on more than one side in the same round.</p>
          </>
        ),
      }}
      panel={
        <>
          <GameHeading icon={<Icons.roulette className="text-12" />} title="Roulette" subtitle="Pick a side and ride the wheel" />
          <BetValueField value={bet} onChange={setBet} max={user?.balance ?? 10} disabled={!betting} />
          {error ? <p className="text-13 text-red">{error}</p> : null}
          <p className="text-12 text-grey-142">{status}</p>
        </>
      }
      board={
        <div className="overflow-hidden rounded-12 border border-grey-58 bg-grey-28">
          <div className="flex items-center justify-between gap-12 border-b border-grey-58 px-16 py-12">
            <div className="flex min-w-0 items-center gap-8 overflow-x-auto">
              {history.slice(0, 16).map((h, i) => (
                <div
                  key={`${h.outcome}-${i}`}
                  className={`flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-6 ${tileTone(h.outcome)}`}
                  title={COLOR_MARK[h.color].label}
                >
                  <img alt="" src={COLOR_MARK[h.color].src} className="h-16 w-16 object-contain" />
                </div>
              ))}
            </div>
          </div>

          <div className="relative px-16 pt-16">
            <div className="mb-12 flex items-center justify-between">
              <p className="text-12 text-white">{status}</p>
              <p className="text-12 text-grey-142">{game?.fair?.hash ? `Hash ${game.fair.hash.slice(0, 12)}…` : ""}</p>
            </div>
            <div className="mb-16 h-6 overflow-hidden rounded-full bg-grey-39">
              <div className="h-6 rounded-full bg-green transition-[width] duration-100" style={{ width: `${barPct}%` }} />
            </div>

            <div ref={trackRef} className="relative h-88 overflow-hidden rounded-12 bg-grey-39">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-48 bg-gradient-to-r from-grey-39 to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-48 bg-gradient-to-l from-grey-39 to-transparent" />
              <div className="pointer-events-none absolute top-0 left-1/2 z-20 h-full w-2 -translate-x-1/2 bg-green shadow-[0_0_12px_rgba(82,181,255,0.8)]" />
              <div
                className="absolute inset-y-0 left-0 flex items-center"
                style={{
                  gap: 8,
                  transform: `translate3d(${-offset}px, 0, 0)`,
                  transition: spinning ? "transform 6s cubic-bezier(0.12, 0.7, 0.12, 1)" : "none",
                }}
              >
                {TILES.map((n, i) => {
                  const color = rouletteColor(n);
                  return (
                    <div
                      key={`${n}-${i}`}
                      className={`flex h-72 w-80 shrink-0 items-center justify-center rounded-6 border-b-3 border-t-3 ${tileTone(n)}`}
                    >
                      <img alt="" src={COLOR_MARK[color].src} className="h-40 w-40 object-contain" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-12 p-16 md:grid-cols-3">
            {(["red", "green", "black"] as RouletteColor[]).map((color) => {
              const list = grouped[color];
              const total = list.reduce((s, b) => s + b.amount, 0) / 1000;
              const mine = user ? list.filter((b) => b.user?._id === user.id) : [];
              return (
                <div key={color} className={`overflow-hidden rounded-12 border ${columnTone(color, mine.length > 0)}`}>
                  <button
                    type="button"
                    disabled={!betting}
                    onClick={() => place(color)}
                    className={`flex h-40 w-full items-center justify-between rounded-t-12 px-14 ${headerTone(color)} disabled:opacity-50`}
                  >
                    <span className="flex items-center gap-8">
                      <img alt="" src={COLOR_MARK[color].src} className="h-22 w-22 object-contain" />
                      <span className="ui-btn-label text-13 uppercase">
                        {COLOR_MARK[color].label} {ROULETTE_PAYOUT[color]}x
                      </span>
                    </span>
                    <span className="text-12 opacity-80">{list.length}</span>
                  </button>
                  <div className="flex items-center justify-between px-14 py-10 text-12 text-grey-142">
                    <span>Total</span>
                    <Bux value={total} />
                  </div>
                  <div className="grid max-h-[220px] gap-6 overflow-y-auto px-10 pb-12">
                    {list.length === 0 ? (
                      <p className="px-4 py-8 text-12 text-grey-142">No bets yet</p>
                    ) : (
                      list.map((b) => (
                        <div key={b._id} className="flex items-center gap-8 rounded-6 border border-grey-58 bg-grey-39 px-8 py-6">
                          <UserAvatar avatar={b.user?.avatar} seed={b.user?._id || b.user?.username} size={22} rounded="8" level={b.user?.level} rank={b.user?.rank} />
                          <p className="min-w-0 flex-1 truncate text-12 text-white">{b.user?.username || "Player"}</p>
                          <Bux value={b.amount / 1000} />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      }
    />
  );
}
