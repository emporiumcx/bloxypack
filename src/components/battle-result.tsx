"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BattleSeat } from "@/components/battle-seat";
import { Bux } from "@/components/bux";
import { GreenButton, GreyButton } from "@/components/green-button";
import { Icons } from "@/components/icons";
import type { BattleGame } from "@/lib/backend";
import { botAvatar, botName } from "@/lib/avatars";

export const SLOT_COLORS = ["#3dd68c", "#ff5b7f", "#ff8a3d", "#7b61ff", "#4da3ff", "#2ee6c7"];

export function battleSfx(src: string, volume = 1) {
  const audio = new Audio(src);
  audio.volume = volume;
  void audio.play().catch(() => {});
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
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
  const weights = totals.map((v) => Math.max(1, Math.round(Math.max(0, v) * 1000)));
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const slices = weights.map((w) => ({
    deg: (w / sum) * 360,
  }));
  let acc = 0;
  const mids = slices.map((s) => {
    const mid = acc + s.deg / 2;
    acc += s.deg;
    return mid;
  });
  const target = -(mids[winnerSlot] ?? 0);
  const spins = 4 * 360;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const [rot, setRot] = useState(spins);
  const [phase, setPhase] = useState<"spinning" | "landed">("spinning");
  const [face, setFace] = useState(winnerSlot);
  const pot = totals.reduce((s, v) => s + v, 0);

  useEffect(() => {
    if (sound) battleSfx("/sounds/battles/battle_jackpot_spin_start.mp3", 0.35);
    const start = performance.now();
    const duration = 3200;
    let raf = 0;
    let lastTick = 0;
    const step = (now: number) => {
      const u = Math.min(1, (now - start) / duration);
      const angle = spins + (target - spins) * easeOutCubic(u);
      setRot(angle);
      const abs = ((-angle % 360) + 360) % 360;
      let cursor = 0;
      let next = 0;
      for (let i = 0; i < slices.length; i++) {
        cursor += slices[i]!.deg;
        if (abs < cursor) {
          next = i;
          break;
        }
      }
      setFace(next);
      if (sound && now - lastTick > 85) {
        lastTick = now;
        battleSfx("/sounds/battles/battle_jackpot_tick.mp3", 0.1);
      }
      if (u < 1) raf = requestAnimationFrame(step);
      else {
        setPhase("landed");
        setFace(winnerSlot);
        if (sound) battleSfx("/sounds/battles/battle_jackpot_winner.mp3", 0.4);
        window.setTimeout(() => doneRef.current(), 1400);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [sound, winnerSlot, spins, target]);

  const stops = slices
    .map((s, i) => {
      const start = slices.slice(0, i).reduce((n, x) => n + x.deg, 0);
      const color = SLOT_COLORS[i % SLOT_COLORS.length];
      return `${color} ${start}deg ${start + s.deg}deg`;
    })
    .join(", ");
  const bet = (game.bets || []).find((b) => b.slot === face);
  const name = bet?.bot ? botName(face) : bet?.user?.username || `P${face + 1}`;

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#070b14]/92">
      <div className="relative size-[min(420px,70vw)] max-h-[420px]">
        <div className="absolute left-1/2 top-8 z-20 h-0 w-0 -translate-x-1/2 border-x-8 border-t-[14px] border-x-transparent border-t-white" />
        <div
          className="absolute inset-[8%] rounded-full"
          style={{
            transform: `rotate(${rot}deg)`,
            background: `conic-gradient(from -90deg, ${stops})`,
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 42px), #000 calc(100% - 41px))",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 42px), #000 calc(100% - 41px))",
            filter: "drop-shadow(0 0 24px rgba(82,181,255,0.18))",
          }}
        />
        <div className="absolute inset-[26%] flex flex-col items-center justify-center rounded-full bg-[#0b1220] ring-1 ring-white/10">
          <BattleSeat
            name={name}
            filled
            size={phase === "landed" ? 72 : 56}
            src={bet?.bot ? botAvatar(face) : bet?.user?.avatar}
            level={bet?.user?.level || 1}
            interactive={false}
          />
          <p className="mt-8 text-[11px] font-black tracking-[0.22em] text-[#7eb6ff]">JACKPOT</p>
          <Bux value={pot} tone="gold" className="mt-4" />
        </div>
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
    if (sound && winners.some((b) => funding > 0 && (b.amount || 0) < (game.amount || 0) - 1)) {
      window.setTimeout(() => battleSfx("/sounds/battles/battle_win_borrow_hit.mp3", 0.7), 400);
    }
  }, [sound, winners, funding, game.amount]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden rounded-12 bg-[#0b1220]/95 px-16 py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(82,181,255,0.18),transparent_55%)]" />
      <p className="relative mb-20 text-[42px] font-black tracking-[0.18em] text-[#f2c338]">WINNERS</p>
      <div className="relative flex flex-wrap items-end justify-center gap-32">
        {winners.map((bet) => {
          const name = bet.bot ? botName(bet.slot) : bet.user?.username || "Winner";
          const net = (bet.payout || 0) / 1000;
          const borrowed = funding > 0 && (bet.amount || 0) < (game.amount || 0) - 1;
          return (
            <div key={bet.slot} className="flex flex-col items-center">
              <BattleSeat name={name} filled size={72} src={bet.bot ? botAvatar(bet.slot) : bet.user?.avatar} level={bet.user?.level || 1} />
              <div className="mt-8 flex items-center gap-6">
                <p className="text-14 font-semibold uppercase text-white">{name}</p>
                {borrowed ? (
                  <span className="rounded-4 bg-red px-6 py-2 text-[9px] font-bold uppercase text-white">Borrowed</span>
                ) : null}
              </div>
              <div className="mt-10 flex items-center gap-6 text-[#f2c338]">
                <span className="text-18 font-bold text-white">+</span>
                <CountUp value={net} sound={sound} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="relative mt-28 flex flex-wrap items-center justify-center gap-8">
        <GreenButton onClick={onRecreate} disabled={busy} loading={busy}>
          Recreate for
          <Bux value={recreateCost} size="sm" className="ml-8" />
        </GreenButton>
        <GreyButton onClick={onWatchAgain} disabled={busy} icon={<Icons.replay className="text-16" />}>
          Replay
        </GreyButton>
      </div>
    </div>
  );
}
