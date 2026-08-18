"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bux } from "./bux";
import { ChoiceBar } from "./bet-field";
import { FairnessControl } from "@/components/fairness";
import { Icons } from "./icons";
import { ItemBg } from "./item-bg";
import { useStore, useBalanceHold } from "./providers";
import { dropsForCase, pickDrop, type CaseDrop, type CaseItem, type DropColor } from "@/lib/catalog";

const RARITY: Record<DropColor, string> = {
  YELLOW: "rgb(228, 174, 57)",
  PURPLE: "rgb(136, 71, 255)",
  BLUE: "rgb(94, 152, 217)",
  GRAY: "rgb(176, 195, 217)",
};

const RARITY_LABEL: Record<DropColor, string> = {
  YELLOW: "Unique",
  PURPLE: "Epic",
  BLUE: "Rare",
  GRAY: "Common",
};

const SLOT = 160;
const STRIP_LEN = 25;
const WIN_INDEX = 21;
const SPIN_MS = 4000;
const FAST_MS = 2000;
const SETTLE_MS = 750;
const RIPPLE_MULT = 2;
const BORDER_RIPPLE_MULT = 2.25;
const OUT_BACK = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const IN_OUT_SINE = "cubic-bezier(0.37, 0, 0.63, 1)";

const QTY = [
  { id: "1", label: "1x" },
  { id: "2", label: "2x" },
  { id: "3", label: "3x" },
  { id: "4", label: "4x" },
];

function itemSrc(id: number) {
  return `https://cdn.rostake.com/items_centered/${id}.webp`;
}

function spinConfig(reels: number, fast: boolean) {
  const multi = reels > 1;
  return {
    multi,
    itemSize: reels >= 4 ? 90 : reels === 3 ? 108 : reels === 2 ? 124 : 136,
    trackH: reels >= 4 ? 154 : reels === 3 ? 172 : reels === 2 ? 208 : 250,
    spinTo: WIN_INDEX,
    pad: STRIP_LEN - WIN_INDEX,
    duration: fast ? FAST_MS : SPIN_MS,
  };
}

function easeOutQuart(t: number) {
  return 1 - (1 - t) ** 4;
}

function shuffleDrops(drops: CaseDrop[]) {
  const copy = [...drops];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildStrip(drops: CaseDrop[], spinTo: number, pad: number, winner?: CaseDrop, randomize = true) {
  const len = spinTo + pad;
  const strip: CaseDrop[] = [];
  if (!drops.length) return strip;
  const pool = randomize ? shuffleDrops(drops) : drops;
  for (let i = 0; i < len; i++) {
    if (i === spinTo && winner) {
      strip.push(winner);
      continue;
    }
    strip.push(pool[i % pool.length]!);
  }
  return strip;
}

function playSfx(src: string, volume = 1) {
  const audio = new Audio(src);
  audio.volume = volume;
  void audio.play().catch(() => {});
  return audio;
}

function Toggle({
  on,
  icon,
  onClick,
}: {
  on: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <div className="group/toggle relative flex cursor-pointer items-start">
      <div className="tr flex h-full w-full items-center justify-center rounded-8">
        <div className="text-18 text-green">{icon}</div>
        <div className="ml-8">
          <div
            className={`relative flex h-20 w-36 items-center justify-center rounded-full transition-colors duration-200 ${
              on ? "bg-green" : "bg-grey-39"
            }`}
          >
            <div
              className={`tr absolute top-2 h-16 w-16 rounded-full ${
                on ? "left-18 bg-grey-34" : "left-2 bg-grey-58"
              }`}
            />
          </div>
        </div>
        <button type="button" aria-label="toggle" className="absolute inset-0" onClick={onClick} />
      </div>
    </div>
  );
}

function CircleRipple({ size }: { size: number }) {
  return (
    <div className="mm2-circle-ripple" style={{ ["--size" as string]: `${size}px` }}>
      <div className="mm2-circle-ripple-big mm2-circle-ripple-layer" />
      <div className="mm2-circle-ripple-middle mm2-circle-ripple-layer" />
      <div className="mm2-circle-ripple-inner mm2-circle-ripple-layer">
        <div className="mm2-circle-ripple-inner-color" />
      </div>
    </div>
  );
}

function rippleCells(cols: number, rows: number, circle: boolean) {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const radius = Math.min(cols, rows) / 2;
  const next: { i: number; disabled: boolean; group: number; dist: number }[] = [];
  for (let t = 0; t < cols * rows; t++) {
    const r = Math.floor(t / cols);
    const c = t % cols;
    const dist = Math.hypot(r - cy, c - cx);
    next.push({
      i: t,
      disabled: circle && dist > radius,
      group: 1 + ((r * 7 + c * 3) % 15),
      dist,
    });
  }
  return next;
}

function HitRipple({
  color,
  active,
  delayMs = 0,
}: {
  color: string;
  active: boolean;
  delayMs?: number;
}) {
  const cells = useMemo(() => rippleCells(9, 9, true), []);
  return (
    <div
      className={`mm2-hit-ripple${active ? " is-active" : ""}`}
      style={{ color, ["--ripple-delay" as string]: `${delayMs}ms` }}
    >
      <div className="mm2-hit-grid">
        {cells.map((cell) => (
          <div
            key={cell.i}
            className={`mm2-hit-square${cell.disabled ? " is-disabled" : ""}`}
            style={{
              ["--group" as string]: cell.group,
              ["--cell-delay" as string]: `${cell.dist * 80}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function BorderRipple({
  color,
  active,
  delayMs = 0,
}: {
  color: string;
  active: boolean;
  delayMs?: number;
}) {
  const cells = useMemo(() => rippleCells(8, 8, false), []);
  return (
    <div
      className={`mm2-reel-ripple${active ? " is-active" : ""}`}
      style={{
        color,
        ["--ripple-delay" as string]: `${delayMs}ms`,
        ["--ripple-cols" as string]: 8,
        ["--ripple-rows" as string]: 8,
        ["--ripple-size" as string]: "36px",
        ["--ripple-gap" as string]: "0px",
      }}
    >
      <div
        className="mm2-hit-grid"
        style={{
          ["--ripple-cols" as string]: 8,
          ["--ripple-rows" as string]: 8,
          ["--ripple-size" as string]: "36px",
          ["--ripple-gap" as string]: "0px",
        }}
      >
        {cells.map((cell) => (
          <div
            key={cell.i}
            className="mm2-hit-square"
            style={{
              ["--group" as string]: cell.group,
              ["--cell-delay" as string]: `${cell.dist * 80}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function DropCard({ d }: { d: CaseDrop }) {
  const color = RARITY[d.color] ?? RARITY.GRAY;
  return (
    <div className="@sm/page:rounded-12 group relative w-full overflow-hidden rounded-8 bg-grey-39 p-16">
      <div className="@sm/page:rounded-12 absolute inset-0 rounded-8 bg-gradient-to-b from-transparent to-grey-39" />
      <div
        className="absolute bottom-0 left-0 h-1/2 w-full opacity-15"
        style={{ background: `linear-gradient(0deg, ${color} 0%, rgba(0, 0, 0, 0) 100%)` }}
      />
      <div className="absolute right-12 top-12 z-10 opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100">
        <p className="relative text-12 text-grey-142">
          {d.minTicket + 1}-{d.maxTicket + 1}
        </p>
      </div>
      <div className="absolute right-12 top-12 z-10 transition-opacity group-hover:opacity-0 group-active:opacity-0">
        <p className="relative text-12 text-grey-142">{d.chance}%</p>
      </div>
      <div className="relative grid w-full grid-cols-1 gap-16">
        <div className="flex h-[108px] w-full justify-center">
          <div className="relative h-108 w-108">
            <div
              className="absolute left-1/4 top-1/4 h-1/2 w-1/2 rounded opacity-80 blur-[40px] transition-all group-hover:scale-110 group-active:scale-110"
              style={{ backgroundColor: color }}
            />
            <ItemBg className="inset-10 h-88 w-88 opacity-55" />
            <img
              alt=""
              className="relative h-[108px] w-full object-contain transition-all group-hover:-translate-y-6 group-hover:scale-110 group-active:-translate-y-6 group-active:scale-110"
              src={itemSrc(d.id)}
              onError={(e) => {
                e.currentTarget.src = d.image;
              }}
            />
          </div>
        </div>
        <div className="grid w-full grid-cols-1 gap-8">
          <p className="truncate overflow-ellipsis text-center text-14 text-grey-190">{d.name}</p>
          <div className="flex w-full justify-center">
            <Bux value={d.value} />
          </div>
        </div>
      </div>
    </div>
  );
}

type RowState = {
  strip: CaseDrop[];
  winIndex: number | null;
  winner: CaseDrop | null;
};

function CasesSpinner({
  rows,
  phase,
  spinKey,
  duration,
  itemSize,
  spinTo,
  multi,
  trackH,
  caseImg,
  casePrice,
}: {
  rows: RowState[];
  phase: "idle" | "spinning" | "landed";
  spinKey: number;
  duration: number;
  itemSize: number;
  spinTo: number;
  multi: boolean;
  trackH: number;
  caseImg: string;
  casePrice: number;
}) {
  const reelsRef = useRef<HTMLDivElement>(null);
  const showHits = phase !== "idle";
  const startPct = -18;
  const axis = "X";

  useEffect(() => {
    const root = reelsRef.current;
    if (!root) return;
    const reels = [...root.querySelectorAll<HTMLElement>(".mm2-reel")];
    const apply = (el: HTMLElement, pct: number) => {
      el.style.transform = axis === "Y" ? `translate3d(0px, ${pct}%, 0px)` : `translate3d(${pct}%, 0px, 0px)`;
    };
    if (phase !== "spinning" || spinKey === 0) {
      const rest = phase === "landed" ? -86 : startPct;
      reels.forEach((reel) => apply(reel, rest));
      return;
    }

    reels.forEach((reel) => apply(reel, startPct));

    const rafs: number[] = [];
    const timers: number[] = [];
    let cancelled = false;

    const runPct = (el: HTMLElement, from: number, to: number, ms: number, onUpdate?: (pct: number) => void) =>
      new Promise<void>((resolve) => {
        let t0 = 0;
        const step = (now: number) => {
          if (cancelled) return resolve();
          if (!t0) t0 = now;
          const u = Math.min((now - t0) / ms, 1);
          const pct = easeOutQuart(u) * (to - from) + from;
          apply(el, pct);
          onUpdate?.(pct);
          if (u < 1) rafs.push(requestAnimationFrame(step));
          else resolve();
        };
        rafs.push(requestAnimationFrame(step));
      });

    const mark = (reel: HTMLElement, cls: "is-selected" | "is-won", index: number | null) => {
      reel.querySelectorAll(".mm2-reel-slot").forEach((slot, i) => {
        slot.classList.toggle(cls, index !== null && i === index);
      });
    };

    reels.forEach((reel) => {
      const endPct = -(84 + 4 * Math.random());
      let last = 0;
      void (async () => {
        await runPct(reel, startPct, endPct, duration, (pct) => {
          const tile = Math.abs(Math.floor(pct / 4));
          if (tile > last) {
            mark(reel, "is-selected", tile - 1);
            last = tile;
          }
        });
        if (cancelled) return;
        mark(reel, "is-selected", null);
        mark(reel, "is-won", spinTo);
        const win = reel.querySelector<HTMLElement>(`.mm2-reel-slot:nth-child(${spinTo + 1}) .mm2-reel-item`);
        if (win) {
          const pop = win.animate([{ transform: "scale(1)" }, { transform: "scale(1.15)", easing: OUT_BACK }], {
            duration: 800,
            fill: "forwards",
          });
          pop.onfinish = () => {
            win.animate([{ transform: "scale(1.15)" }, { transform: "scale(1)", easing: IN_OUT_SINE }], {
              duration: 1500,
              fill: "forwards",
            });
          };
        }
        await runPct(reel, endPct, -86, SETTLE_MS);
      })();
    });

    return () => {
      cancelled = true;
      rafs.forEach((id) => cancelAnimationFrame(id));
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [spinKey, duration, axis, startPct, spinTo, phase]);

  return (
    <div
      className={`mm2-cases-spinner relative ${multi ? "is-multi-reel" : ""} ${phase === "idle" ? "is-pre-spin" : ""} ${phase === "spinning" ? "is-spinning" : ""} ${phase === "landed" ? "is-landed" : ""}`}
      style={{
        ["--itemSize" as string]: `${itemSize}px`,
        ["--slot" as string]: `${SLOT}px`,
        ["--reels" as string]: rows.length,
        ["--trackH" as string]: `${trackH}px`,
      }}
    >
      <div className="mm2-spinner-inner relative">
        <div className="mm2-border-reels">
          {rows.map((row, i) => {
            const color = row.winner ? RARITY[row.winner.color] : "transparent";
            const big = false;
            return (
              <div key={`border-${i}-${spinKey}`} className="mm2-border-reel" style={{ ["--ripple-color" as string]: color }}>
                <BorderRipple color={color} active={big} delayMs={duration + 250} />
              </div>
            );
          })}
        </div>

        {phase === "idle" ? (
          <div className="mm2-prespin-overlay">
            <div className="relative max-w-[250px]">
              <img alt="" className="relative h-auto w-full" src={caseImg} />
            </div>
          </div>
        ) : null}

        <div className="mm2-reel-hit-info">
          {rows.map((row, i) => {
            const color = row.winner ? RARITY[row.winner.color] : "transparent";
            const landed = showHits && !!row.winner;
            const pull = false;
            const hitDelay = duration + 300;
            return (
              <div
                key={`hit-${i}-${spinKey}`}
                className="mm2-reel-hit-info-container"
                style={{
                  ["--color" as string]: color,
                  ["--reels" as string]: rows.length,
                  ["--hit-delay" as string]: `${hitDelay}ms`,
                }}
              >
                <div className={`mm2-item-glow-bg${landed ? " is-on" : ""}`} style={{ color, ["--circle-color" as string]: color }}>
                  <CircleRipple size={itemSize} />
                </div>
                <HitRipple color={color} active={pull} delayMs={duration + 150} />
              </div>
            );
          })}
        </div>

        <div ref={reelsRef} className="mm2-reels">
          {rows.map((row, i) => (
            <div key={`reel-${i}-${spinKey}`} className="mm2-reel-track">
              <div className="mm2-reel">
                {row.strip.map((d, j) => (
                  <div key={`${i}-${j}-${d.id}`} className="mm2-reel-slot">
                    <img
                      alt=""
                      className="mm2-reel-item rounded-lg"
                      src={itemSrc(d.id)}
                      onError={(e) => {
                        e.currentTarget.src = d.image;
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mm2-reel-hit-info mm2-reel-hit-labels">
          {rows.map((row, i) => {
            const color = row.winner ? RARITY[row.winner.color] : "transparent";
            const landed = showHits && !!row.winner;
            const hitDelay = duration + 300;
            return (
              <div
                key={`label-${i}-${spinKey}`}
                className="mm2-reel-hit-info-container"
                style={{ ["--reels" as string]: rows.length }}
              >
                {landed && row.winner ? (
                  <div
                    className={`mm2-item-info relative text-center ${multi ? "px-10" : "pt-20"}`}
                    style={{
                      ["--item-color" as string]: `color-mix(in srgb, ${color}, white 25%)`,
                      ["--info-delay" as string]: `${hitDelay}ms`,
                    }}
                  >
                    <div className="absolute top-1/2 left-1/2 z-0 h-[91%] w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-grey-28 blur-lg" />
                    <h5
                      className={`relative truncate font-semibold uppercase ${multi ? "text-[10px]" : "text-[10px] sm:text-xs"}`}
                      style={{ color: "var(--item-color)" }}
                    >
                      {RARITY_LABEL[row.winner.color]}
                    </h5>
                    <h4
                      className={`relative truncate font-semibold uppercase text-grey-190 ${multi ? "text-[11px]" : "text-xs sm:text-sm"}`}
                    >
                      {row.winner.name}
                    </h4>
                    <div className={`relative flex justify-center ${multi ? "mt-2" : "mt-4"}`}>
                      <Bux value={row.winner.value} size={multi ? "xs" : "sm"} />
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function CaseOpening({ item }: { item: CaseItem }) {
  const { user, openModal, applyUser, unboxBet, addBalance } = useStore();
  const { begin: holdBalance, end: revealBalance } = useBalanceHold();
  const [qty, setQty] = useState("1");
  const [sound, setSound] = useState(true);
  const [fast, setFast] = useState(false);
  const [refreshOn, setRefreshOn] = useState(true);
  const [phase, setPhase] = useState<"idle" | "spinning" | "landed">("idle");
  const [spinKey, setSpinKey] = useState(0);
  const drops = useMemo(() => dropsForCase(item.slug), [item.slug]);
  const n = Number(qty);
  const cfg = spinConfig(n, fast);
  const [rows, setRows] = useState<RowState[]>(() => {
    const start = spinConfig(1, false);
    return [{ strip: buildStrip(dropsForCase(item.slug), start.spinTo, start.pad, undefined, false), winIndex: null, winner: null }];
  });
  const cost = item.price * n;
  const duration = cfg.duration;
  const caseImg = item.imageId ? `/cdn/cases/${item.imageId}.webp` : item.image ?? "";
  const spinning = phase === "spinning";
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  useEffect(() => {
    if (phase === "spinning") return;
    setRows((prev) => {
      const next = prev.map((r) => ({ ...r }));
      while (next.length < n) {
        next.push({ strip: buildStrip(drops, cfg.spinTo, cfg.pad), winIndex: null, winner: null });
      }
      return next.slice(0, n).map((r) =>
        phase === "idle" ? { strip: buildStrip(drops, cfg.spinTo, cfg.pad), winIndex: null, winner: null } : r,
      );
    });
  }, [n, drops, phase, cfg.spinTo, cfg.pad]);

  useEffect(() => {
    if (phase !== "spinning") return;
    const land = window.setTimeout(() => {
      setPhase("landed");
      revealBalance();
    }, duration + SETTLE_MS);
    return () => window.clearTimeout(land);
  }, [phase, spinKey, duration, revealBalance]);

  useEffect(() => {
    if (phase !== "spinning" || !sound) return;
    const timers: number[] = [];
    rowsRef.current.forEach((row, i) => {
      const landAt = duration + i * 40;
      timers.push(
        window.setTimeout(() => {
          playSfx(i === 0 ? "/sounds/cases/battle-land-1.mp3" : "/sounds/cases/battle-land-2.mp3", 1);
        }, Math.max(0, landAt)),
      );
      if (row.winner && row.winner.value >= item.price * RIPPLE_MULT) {
        timers.push(window.setTimeout(() => playSfx("/sounds/cases/pull-1.mp3", 0.2), Math.max(0, landAt + 150)));
      }
      if (row.winner && row.winner.value >= item.price * BORDER_RIPPLE_MULT) {
        timers.push(window.setTimeout(() => playSfx("/sounds/cases/pull-big-1.mp3", 0.3), Math.max(0, landAt + 250)));
      }
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [phase, spinKey, duration, sound, item.price]);

  async function open(demo: boolean) {
    if (spinning) return;
    if (!demo && !user) return openModal("login");
    if (!demo && user && user.balance < cost) return openModal("deposit");
    if (!drops.length) return;

    const next: RowState[] = [];
    if (demo) {
      for (let i = 0; i < n; i++) {
        const hit = pickDrop(drops);
        next.push({
          strip: buildStrip(drops, cfg.spinTo, cfg.pad, hit ?? undefined),
          winIndex: cfg.spinTo,
          winner: hit ?? null,
        });
      }
    } else {
      holdBalance();
      try {
        const res = await unboxBet(item.slug, n);
        addBalance(-cost);
        applyUser(res.user);
        for (const game of res.games) {
          const hit =
            drops.find((d) => d.id === game.item.dropId) ??
            drops.find((d) => game.ticket >= d.minTicket && game.ticket <= d.maxTicket) ??
            pickDrop(drops);
          next.push({
            strip: buildStrip(drops, cfg.spinTo, cfg.pad, hit ?? undefined),
            winIndex: cfg.spinTo,
            winner: hit ?? null,
          });
        }
      } catch (err) {
        revealBalance();
        alert(err instanceof Error ? err.message : "Could not open case.");
        return;
      }
    }
    setRows(next);
    setSpinKey((k) => k + 1);
    setPhase("spinning");
    if (sound) playSfx("/sounds/cases/spin.mp3", 0.9);
  }

  return (
    <div className="@xl/page:gap-32 @bt/page:gap-24 grid w-full grid-cols-1 gap-16">
      <div className="@sm/page:px-0 @sm/page:py-0 relative w-full py-24">
        <div className="@sm/page:grid-cols-[auto_1fr] grid w-full grid-cols-[1fr_auto_auto] gap-10">
          <div className="flex justify-start">
            <Link
              href="/cases"
              aria-label="link"
              className="group/button relative flex h-32 items-center justify-center rounded-6 bg-grey-39 opacity-100 transition-all duration-200 hover:bg-grey-47 active:bg-grey-47"
            >
              <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-10">
                <div className="-ml-2 text-grey-142">
                  <Icons.chevronLeft className="text-22" />
                </div>
                <p className="text-14 text-grey-142 transition-all duration-300">Back to cases</p>
              </div>
            </Link>
          </div>
          <div className="col-span-1 col-start-2 flex w-full justify-end">
            <div className="@sm/page:w-auto grid w-full grid-cols-[auto_auto_auto_auto] items-center gap-8">
              <Toggle on={sound} onClick={() => setSound((v) => !v)} icon={<Icons.volume />} />
              <Toggle on={fast} onClick={() => setFast((v) => !v)} icon={<Icons.bolt />} />
              <Toggle on={refreshOn} onClick={() => setRefreshOn((v) => !v)} icon={<Icons.refresh />} />
              <FairnessControl game="Cases" userSeeds />
            </div>
          </div>
        </div>

        <div className="mt-16 grid w-full grid-cols-1 gap-16">
          <h2 className="w-full truncate overflow-ellipsis text-center text-18 capitalize text-white">{item.name}</h2>
          <CasesSpinner
            rows={rows}
            phase={phase}
            spinKey={spinKey}
            duration={duration}
            itemSize={cfg.itemSize}
            spinTo={cfg.spinTo}
            multi={cfg.multi}
            trackH={cfg.trackH}
            caseImg={caseImg}
            casePrice={item.price}
          />
        </div>

        <div className="mt-16 flex w-full justify-center">
          <div className="@lg/page:grid-cols-[auto_1fr] grid max-w-full grid-cols-1 gap-12">
            <ChoiceBar
              value={qty}
              onChange={(id) => {
                if (spinning) return;
                setQty(id);
                if (phase === "landed") setPhase("idle");
              }}
              options={QTY}
            />
            <div className="@sm/page:grid-cols-[230px_160px] grid w-full grid-cols-1 gap-12">
              <button
                type="button"
                aria-label="button"
                disabled={spinning}
                onClick={() => open(false)}
                className="group/button relative flex h-40 cursor-pointer items-start justify-center rounded-8 border-b-3 border-t-3 border-b-green-95 border-t-green-222 bg-green shadow-[0_2px_0_rgba(0,0,0,0.25)] opacity-100 transition-all duration-200 active:translate-y-px active:border-green disabled:opacity-40"
              >
                <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-16">
                  <div className="grid grid-cols-[auto_auto] items-center gap-4">
                    <p className="ui-btn-label text-nowrap text-12 text-grey-28">
                      Open {n} case{n > 1 ? "s" : ""} for
                    </p>
                    <Bux value={cost} tone="onGreen" size="xs" />
                  </div>
                </div>
              </button>
              <button
                type="button"
                aria-label="button"
                disabled={spinning}
                onClick={() => open(true)}
                className="group/button relative flex h-40 cursor-pointer items-start justify-center rounded-8 border-b-2 border-t-2 border-b-black/40 border-t-white/10 bg-grey-28 opacity-100 transition-all duration-200 disabled:opacity-40"
              >
                <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-16">
                  <p className="ui-btn-label text-13 text-grey-142 transition-all duration-300">Demo Spin</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full border-b-1 border-grey-47 transition-colors duration-200" />

      <div className="@sm/page:gap-24 grid w-full grid-cols-1 gap-16">
        <h2 className="ui-label @sm/page:text-16 text-14 text-white">Possible drops</h2>
        <div className="@sm/page:grid-cols-3 @sm/page:gap-6 @md/page:grid-cols-4 @bt/page:grid-cols-5 @lg/page:grid-cols-6 @2xl/page:grid-cols-7 grid w-full grid-cols-2 gap-12">
          {drops.map((d) => (
            <DropCard key={d.id} d={d} />
          ))}
        </div>
      </div>
    </div>
  );
}
