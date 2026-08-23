"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BattleSeat } from "@/components/battle-seat";
import { Bux } from "@/components/bux";
import { GreenButton, GreyButton } from "@/components/green-button";
import { Icons } from "@/components/icons";
import type { BattleGame } from "@/lib/backend";
import { botAvatar, botName } from "@/lib/avatars";

const SLOT_COLORS = ["#52b5ff", "#01a540", "#d32ce6", "#e8b923", "#ff5562", "#8847ff"];

export function battleSfx(src: string, volume = 1) {
  const audio = new Audio(src);
  audio.volume = volume;
  void audio.play().catch(() => {});
}

export function JackpotDraw({
  game,
  totals,
  winnerSlot,
  sound,
  onDone,
}: {
  game: BattleGame;
  totals: number[];
  winnerSlot: number;
  sound: boolean;
  onDone: () => void;
}) {
  const seats = game.playerCount;
  const weights = totals.map((v) => Math.max(1, Math.round(v * 1000)));
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const chances = weights.map((w) => (w / sum) * 100);
  const strip: number[] = [];
  while (strip.length < 42) {
    for (let i = 0; i < seats; i++) {
      const copies = Math.max(1, Math.round((weights[i] / sum) * 12));
      for (let n = 0; n < copies; n++) strip.push(i);
    }
  }
  const winIndex = 32;
  const seeded = strip.map((slot, i) => (i === winIndex ? winnerSlot : slot));
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const [phase, setPhase] = useState<"spinning" | "landed">("spinning");
  const reelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sound) battleSfx("/sounds/battles/battle_jackpot_spin_start.mp3", 0.35);
    const tick = window.setInterval(() => {
      if (sound) battleSfx("/sounds/battles/battle_jackpot_tick.mp3", 0.12);
    }, 90);
    const land = window.setTimeout(() => {
      window.clearInterval(tick);
      setPhase("landed");
      if (sound) battleSfx("/sounds/battles/battle_jackpot_winner.mp3", 0.4);
      window.setTimeout(() => doneRef.current(), 900);
    }, 2800);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(land);
    };
  }, [sound]);

  useEffect(() => {
    const el = reelRef.current;
    if (!el) return;
    const slotW = 72;
    const target = winIndex * slotW - el.clientWidth / 2 + slotW / 2;
    el.style.transition = "none";
    el.style.transform = "translateX(40px)";
    requestAnimationFrame(() => {
      el.style.transition = "transform 2.6s cubic-bezier(0.12, 0.7, 0.1, 1)";
      el.style.transform = `translateX(${-target}px)`;
    });
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-12 bg-grey-28/90 px-16">
      <p className="ui-label mb-8 text-14 uppercase tracking-wide text-battle-jackpot">Jackpot draw</p>
      <div className="relative mb-16 h-80 w-full max-w-420 overflow-hidden rounded-8 bg-grey-39">
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-2 -translate-x-1/2 bg-white" />
        <div ref={reelRef} className="flex h-full items-center will-change-transform">
          {seeded.map((slot, i) => {
            const bet = (game.bets || []).find((b) => b.slot === slot);
            return (
              <div
                key={i}
                className="flex h-full w-72 shrink-0 items-center justify-center border-r border-grey-28"
                style={{ background: `${SLOT_COLORS[slot % SLOT_COLORS.length]}22` }}
              >
                <BattleSeat
                  name={bet?.bot ? botName(slot) : bet?.user?.username || `P${slot + 1}`}
                  filled
                  size={40}
                  src={bet?.bot ? botAvatar(slot) : bet?.user?.avatar}
                  level={bet?.user?.level || 1}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex w-full max-w-420 gap-8">
        {Array.from({ length: seats }, (_, i) => {
          const bet = (game.bets || []).find((b) => b.slot === i);
          const won = phase === "landed" && i === winnerSlot;
          return (
            <div
              key={i}
              className={`flex min-w-0 flex-1 flex-col items-center rounded-8 px-6 py-8 ${won ? "bg-battle-jackpot/20 ring-1 ring-battle-jackpot" : "bg-grey-39"}`}
            >
              <span className="truncate text-11 text-white">{bet?.user?.username || (bet?.bot ? botName(i) : "—")}</span>
              <span className="text-12 font-bold" style={{ color: SLOT_COLORS[i % SLOT_COLORS.length] }}>
                {chances[i]?.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CountUp({ value, sound }: { value: number; sound: boolean }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const start = performance.now();
    if (sound) battleSfx("/sounds/battles/battle_win_coin_count.mp3", 0.7);
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      setShown(value * (1 - (1 - t) ** 3));
      if (t < 1) raf = requestAnimationFrame(step);
      else if (sound) battleSfx("/sounds/battles/battle_coin_end.mp3", 0.7);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, sound]);
  return <Bux value={shown} className="text-24" />;
}

export function WinnerOverlay({
  game,
  totals,
  funding,
  recreateCost,
  busy,
  sound,
  onRecreate,
  onWatchAgain,
}: {
  game: BattleGame;
  totals: number[];
  funding: number;
  recreateCost: number;
  busy: boolean;
  sound: boolean;
  onRecreate: () => void;
  onWatchAgain: () => void;
}) {
  const winners = useMemo(() => (game.bets || []).filter((b) => (b.payout || 0) > 0), [game.bets]);
  useEffect(() => {
    if (sound) battleSfx("/sounds/battles/battle_win_appear.mp3", 0.55);
  }, [sound]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-12 bg-grey-28/92 px-16 py-20">
      <p className="ui-label mb-16 text-12 uppercase tracking-[0.2em] text-grey-142">Winner</p>
      <div className="flex flex-wrap items-end justify-center gap-24">
        {winners.map((bet) => {
          const name = bet.bot ? botName(bet.slot) : bet.user?.username || "Winner";
          const gross = totals[bet.slot] ?? (bet.payout || 0) / 1000;
          const net = (bet.payout || 0) / 1000;
          const borrowed = funding > 0 && (bet.amount || 0) < (game.amount || 0) - 1;
          return (
            <div key={bet.slot} className="flex flex-col items-center">
              <BattleSeat name={name} filled size={72} src={bet.bot ? botAvatar(bet.slot) : bet.user?.avatar} level={bet.user?.level || 1} />
              <p className="mt-8 text-14 text-white">{name}</p>
              <div className="relative mt-8 flex flex-col items-center">
                <div className="flex items-center gap-6 text-success">
                  <span className="text-18 font-bold">+</span>
                  <CountUp value={borrowed ? gross : net} sound={sound} />
                </div>
                {borrowed ? (
                  <BorrowStamp net={net} sound={sound} />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-28 flex flex-wrap items-center justify-center gap-8">
        <GreenButton onClick={onRecreate} disabled={busy} loading={busy}>
          Recreate battle
          <Bux value={recreateCost} size="sm" className="ml-8" />
        </GreenButton>
        <GreyButton onClick={onWatchAgain} disabled={busy} icon={<Icons.replay className="text-16" />}>
          Watch again
        </GreyButton>
      </div>
    </div>
  );
}

function BorrowStamp({ net, sound }: { net: number; sound: boolean }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => {
      setShow(true);
      if (sound) battleSfx("/sounds/battles/battle_win_borrow_hit.mp3", 0.7);
    }, 950);
    return () => window.clearTimeout(t);
  }, [sound]);
  if (!show) return null;
  return (
    <div className="mt-10 flex flex-col items-center">
      <div className="h-1 w-80 bg-grey-142/50" />
      <span className="-mt-8 rotate-[-8deg] rounded-4 bg-red px-8 py-2 text-[9px] font-bold uppercase text-white">Borrowed</span>
      <div className="mt-8 flex items-center gap-6 text-success">
        <span className="text-16 font-bold">+</span>
        <Bux value={net} className="text-18" />
      </div>
    </div>
  );
}
