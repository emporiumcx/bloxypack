"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bux } from "./bux";
import { ChoiceBar } from "./bet-field";
import { FairnessControl } from "@/components/fairness";
import { Icons } from "./icons";
import { SoundSettings } from "./sound-settings";
import { useStore, useBalanceHold } from "./providers";
import { caseImage, caseVolatility, DROP_RARITY, dropsForCase, itemImage, packGlow, pickDrop, type CaseDrop, type CaseItem, type DropColor } from "@/lib/catalog";
import { VolatilityScale } from "@/components/volatility-scale";
import { isRewardSlug } from "@/lib/rewards";
import { sendGiveawayOpen, sendRewardOpen, type RewardsInfo } from "@/lib/backend";
import { playSfx, preloadSfx, unlockSfx } from "@/lib/sfx";

const RARITY: Record<DropColor, string> = {
  RAINBOW: DROP_RARITY.RAINBOW.hex,
  GOLD: DROP_RARITY.GOLD.hex,
  RED: DROP_RARITY.RED.hex,
  PURPLE: DROP_RARITY.PURPLE.hex,
  GREEN: DROP_RARITY.GREEN.hex,
  GRAY: DROP_RARITY.GRAY.hex,
  YELLOW: DROP_RARITY.YELLOW.hex,
  BLUE: DROP_RARITY.BLUE.hex,
};

const RARITY_LABEL: Record<DropColor, string> = {
  RAINBOW: DROP_RARITY.RAINBOW.label,
  GOLD: DROP_RARITY.GOLD.label,
  RED: DROP_RARITY.RED.label,
  PURPLE: DROP_RARITY.PURPLE.label,
  GREEN: DROP_RARITY.GREEN.label,
  GRAY: DROP_RARITY.GRAY.label,
  YELLOW: DROP_RARITY.YELLOW.label,
  BLUE: DROP_RARITY.BLUE.label,
};

const SLOT = 160;
const STRIP_LEN = 40;
const WIN_INDEX = 34;
const IN_OUT_SINE = "cubic-bezier(0.37, 0, 0.63, 1)";

const QTY = [
  { id: "1", label: "1x" },
  { id: "2", label: "2x" },
  { id: "3", label: "3x" },
  { id: "4", label: "4x" },
  { id: "5", label: "5x" },
];

type SpeedId = "normal" | "fast" | "turbo";

const SPEED: Record<SpeedId, { duration: number; settle: number; divider: number; bolts: number; glow: string }> = {
  normal: { duration: 7000, settle: 700, divider: 1, bolts: 1, glow: "" },
  fast: {
    duration: 3500,
    settle: 500,
    divider: 1.4,
    bolts: 2,
    glow: "drop-shadow-[0_0_5px_rgba(255,255,255,0.85)] drop-shadow-[0_0_10px_rgba(82,181,255,0.9)]",
  },
  turbo: {
    duration: 700,
    settle: 410,
    divider: 1.7,
    bolts: 3,
    glow: "drop-shadow-[0_0_6px_rgba(255,255,255,1)] drop-shadow-[0_0_12px_rgba(82,181,255,1)] drop-shadow-[0_0_18px_rgba(30,125,255,0.85)]",
  },
};

function cubicBezier(p1x: number, p1y: number, p2x: number, p2y: number) {
  return (t: number) => {
    let x = t;
    for (let i = 0; i < 8; i++) {
      const cx = 3 * p1x;
      const bx = 3 * (p2x - p1x) - cx;
      const ax = 1 - cx - bx;
      const xt = ((ax * x + bx) * x + cx) * x;
      const dxt = (3 * ax * x + 2 * bx) * x + cx;
      if (Math.abs(dxt) < 1e-6) break;
      x -= (xt - t) / dxt;
    }
    const cy = 3 * p1y;
    const by = 3 * (p2y - p1y) - cy;
    const ay = 1 - cy - by;
    return ((ay * x + by) * x + cy) * x;
  };
}

const spinEase = cubicBezier(0.08, 0.68, 0.34, 1);

function hitSfx(color: DropColor) {
  if (color === "GOLD" || color === "YELLOW" || color === "RAINBOW") return "hit_gold" as const;
  if (color === "RED") return "hit_red" as const;
  if (color === "PURPLE") return "hit_purple" as const;
  return "hit_basic" as const;
}

function itemSrc(id: number) {
  return itemImage(id);
}

function spinConfig(reels: number, speed: SpeedId) {
  const multi = reels > 1;
  const pace = SPEED[speed];
  return {
    multi,
    itemSize: reels >= 4 ? 90 : reels === 3 ? 108 : reels === 2 ? 124 : 136,
    trackH: reels >= 4 ? 154 : reels === 3 ? 172 : reels === 2 ? 208 : 320,
    spinTo: WIN_INDEX,
    pad: STRIP_LEN - WIN_INDEX,
    duration: pace.duration,
    settle: pace.settle,
    divider: pace.divider,
  };
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

function formatChance(n: number) {
  return String(Number(n.toFixed(2)));
}

function DropCard({ d }: { d: CaseDrop }) {
  const color = RARITY[d.color] ?? RARITY.GRAY;
  return (
    <div className="group relative flex cursor-pointer flex-col overflow-hidden rounded-8 border border-grey-58 bg-grey-34 px-8 py-16">
      <div className="absolute left-8 right-8 top-8 z-1 flex items-center justify-end">
        <span className="text-12 text-grey-142">{formatChance(d.chance)} %</span>
      </div>
      <div className="pointer-events-none absolute -top-120 h-full w-full">
        <div className="h-full w-full rounded-full opacity-30 blur-3xl" style={{ background: color }} />
      </div>
      <div
        className="pointer-events-none absolute -bottom-40 left-1/2 h-400 w-400 -translate-x-1/2 opacity-25"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.55) 1.15px, transparent 1.35px)",
          backgroundSize: "10px 10px",
          WebkitMaskImage: "radial-gradient(ellipse 50% 40% at 50% 20%, #000 0%, transparent 100%)",
          maskImage: "radial-gradient(ellipse 50% 40% at 50% 20%, #000 0%, transparent 100%)",
        }}
      />
      <div className="relative z-1 mt-24 aspect-[4/3] w-full overflow-hidden rounded-8">
        <img
          alt=""
          className="h-full w-full object-contain p-8 transition-transform duration-200 group-hover:-translate-y-2 group-hover:scale-105"
          src={itemSrc(d.id)}
          onError={(e) => {
            e.currentTarget.src = d.image;
          }}
        />
      </div>
      <div className="relative z-1 mt-8 w-full space-y-4">
        <h4 className="truncate text-center text-12 text-grey-142">{RARITY_LABEL[d.color]}</h4>
        <h3 className="truncate text-center text-14 text-white">{d.name}</h3>
      </div>
      <div className="relative z-1 mt-auto flex items-center justify-center pt-8">
        <Bux value={d.value} />
      </div>
      <div className="absolute top-0 left-1/2 h-2 w-1/2 -translate-x-1/2" style={{ background: color }} />
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
  settle,
  divider,
  itemSize,
  spinTo,
  multi,
  trackH,
  caseImg,
  glow,
}: {
  rows: RowState[];
  phase: "idle" | "spinning" | "landed";
  spinKey: number;
  duration: number;
  settle: number;
  divider: number;
  itemSize: number;
  spinTo: number;
  multi: boolean;
  trackH: number;
  caseImg: string;
  glow: string;
}) {
  const reelsRef = useRef<HTMLDivElement>(null);
  const showHits = phase !== "idle";
  const startPx = -(7.5 * SLOT);
  const winPx = -((spinTo + 0.5) * SLOT);

  useEffect(() => {
    const root = reelsRef.current;
    if (!root) return;
    const reels = [...root.querySelectorAll<HTMLElement>(".mm2-reel")];
    const apply = (el: HTMLElement, px: number) => {
      el.style.transform = `translate3d(${px}px, 0px, 0px)`;
    };
    if (phase !== "spinning" || spinKey === 0) {
      const rest = phase === "landed" ? winPx : startPx;
      reels.forEach((reel) => apply(reel, rest));
      return;
    }

    reels.forEach((reel) => apply(reel, startPx));

    const rafs: number[] = [];
    let cancelled = false;

    const runPx = (el: HTMLElement, from: number, to: number, ms: number, ease: (t: number) => number, onUpdate?: (px: number) => void) =>
      new Promise<void>((resolve) => {
        let t0 = 0;
        const step = (now: number) => {
          if (cancelled) return resolve();
          if (!t0) t0 = now;
          const u = Math.min((now - t0) / ms, 1);
          const px = ease(u) * (to - from) + from;
          apply(el, px);
          onUpdate?.(px);
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

    reels.forEach((reel, reelI) => {
      const endPx = winPx + (Math.random() - 0.5) * 20;
      let last = -1;
      const delay = reelI * 200;
      void (async () => {
        if (delay) await new Promise((r) => setTimeout(r, delay));
        if (cancelled) return;
        await runPx(reel, startPx, endPx, duration, spinEase, (px) => {
          const tile = Math.round(Math.abs(px) / SLOT - 0.5);
          if (tile !== last && tile >= 0) {
            mark(reel, "is-selected", tile);
            last = tile;
            playSfx("spin_tick");
          }
        });
        if (cancelled) return;
        mark(reel, "is-selected", null);
        mark(reel, "is-won", spinTo);
        const winner = rows[reelI]?.winner;
        if (winner) playSfx(hitSfx(winner.color));
        const win = reel.querySelector<HTMLElement>(`.mm2-reel-slot:nth-child(${spinTo + 1}) .mm2-reel-item`);
        if (win) {
          const popMs = 500 / divider;
          const pop = win.animate(
            [
              { transform: "scale(1) rotate(0deg)" },
              { transform: "scale(1.5) rotate(-10.5deg)", easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
              { transform: "scale(1) rotate(0deg)", easing: "cubic-bezier(0.215, 0.61, 0.355, 1)" },
            ],
            { duration: popMs * 2, fill: "forwards" },
          );
          pop.onfinish = () => {
            win.animate([{ transform: "scale(1)" }, { transform: "scale(1)", easing: IN_OUT_SINE }], {
              duration: 1500,
              fill: "forwards",
            });
          };
        }
        await runPx(reel, endPx, winPx, settle, (t) => 1 - (1 - t) ** 3);
      })();
    });

    return () => {
      cancelled = true;
      rafs.forEach((id) => cancelAnimationFrame(id));
    };
  }, [spinKey, duration, settle, divider, startPx, winPx, spinTo, phase, rows]);

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
        <span className="mm2-win-marker is-top" />
        <span className="mm2-win-marker is-bottom" />
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
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 blur-[34px]"
                style={{ background: glow }}
              />
              <img alt="" className="relative z-1 h-auto w-full" src={caseImg} />
            </div>
          </div>
        ) : null}

        <div className="mm2-reel-hit-info">
          {rows.map((row, i) => {
            const color = row.winner ? RARITY[row.winner.color] : "transparent";
            const landed = showHits && !!row.winner;
            const pull = false;
            const hitDelay = duration + settle + 80;
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
                      className="mm2-reel-item"
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
            const hitDelay = duration + settle + 80;
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
                    <h5 className={`relative truncate text-grey-142 ${multi ? "text-[10px]" : "text-12"}`}>{RARITY_LABEL[row.winner.color]}</h5>
                    <h4 className={`relative truncate text-white ${multi ? "text-[11px]" : "text-14"}`}>{row.winner.name}</h4>
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

export function CaseOpening({
  item,
  variant = "page",
  canOpen = true,
  giveawayWinId,
  onClose,
  onOpened,
}: {
  item: CaseItem;
  variant?: "page" | "modal";
  canOpen?: boolean;
  giveawayWinId?: string;
  onClose?: () => void;
  onOpened?: (rewards?: RewardsInfo) => void;
}) {
  const { user, openModal, applyUser, unboxBet, addBalance } = useStore();
  const { begin: holdBalance, end: revealBalance } = useBalanceHold();
  const [qty, setQty] = useState("1");
  const [speed, setSpeed] = useState<SpeedId>("fast");
  const [refreshOn, setRefreshOn] = useState(true);
  const [phase, setPhase] = useState<"idle" | "spinning" | "landed">("idle");
  const [spinKey, setSpinKey] = useState(0);
  const drops = useMemo(() => dropsForCase(item.slug), [item.slug]);
  const listed = useMemo(() => {
    if (!drops.length) return [];
    const [front, ...rest] = drops;
    return [front, ...rest.sort((a, b) => b.value - a.value || a.minTicket - b.minTicket)];
  }, [drops]);
  const reward = isRewardSlug(item.slug);
  const freeOpen = reward || Boolean(giveawayWinId);
  const n = freeOpen ? 1 : Number(qty);
  const cfg = spinConfig(n, speed);
  const [rows, setRows] = useState<RowState[]>(() => {
    const start = spinConfig(1, "fast");
    return [{ strip: buildStrip(dropsForCase(item.slug), start.spinTo, start.pad, undefined, false), winIndex: null, winner: null }];
  });
  const cost = item.price * n;
  const duration = cfg.duration;
  const caseImg = caseImage(item);
  const glow = packGlow(item.hue);
  const vol = caseVolatility(item.slug);
  const spinning = phase === "spinning";

  useEffect(() => {
    preloadSfx();
  }, []);

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
    }, duration + cfg.settle + (n - 1) * 200);
    return () => window.clearTimeout(land);
  }, [phase, spinKey, duration, cfg.settle, n, revealBalance]);

  async function open(demo: boolean) {
    if (spinning) return;
    if (!demo && !user) return openModal("login");
    if (!demo && reward && !canOpen && !giveawayWinId) return;
    if (!demo && !freeOpen && user && user.balance < cost) return openModal("deposit");
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
        const res = giveawayWinId
          ? await sendGiveawayOpen(giveawayWinId)
          : reward
            ? await sendRewardOpen(item.slug)
            : await unboxBet(item.slug, n);
        if (!freeOpen) addBalance(-cost);
        applyUser(res.user);
        if (giveawayWinId) {
          onOpened?.();
        } else if (reward) {
          const payload = res as { rewards?: RewardsInfo };
          if (payload.rewards) onOpened?.(payload.rewards);
        }
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
    unlockSfx();
    playSfx("spin_start");
  }

  const body = (
    <div className="@xl/page:gap-32 @bt/page:gap-24 grid w-full grid-cols-1 gap-16">
      <div className="@sm/page:px-0 @sm/page:py-0 relative w-full py-8 sm:py-16">
        <div className="@sm/page:grid-cols-[auto_1fr] grid w-full grid-cols-[1fr_auto_auto] gap-10">
          <div className="flex justify-start">
            {variant === "modal" ? (
              <button
                type="button"
                aria-label="Close"
                disabled={spinning}
                onClick={onClose}
                className="group/button relative flex h-32 items-center justify-center rounded-6 bg-grey-39 opacity-100 transition-all duration-200 hover:bg-grey-47 active:bg-grey-47 disabled:opacity-40"
              >
                <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-10">
                  <Icons.close className="text-16 text-grey-142" />
                  <p className="text-14 text-grey-142">Close</p>
                </div>
              </button>
            ) : (
              <a
                href={reward ? "/rewards" : "/cases"}
                aria-label={reward ? "Back to rewards" : "Back to cases"}
                className="group/button relative flex h-32 items-center justify-center rounded-6 bg-grey-39 opacity-100 transition-all duration-200 hover:bg-grey-47 active:bg-grey-47"
              >
                <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-10">
                  <div className="-ml-2 text-grey-142">
                    <Icons.chevronLeft className="text-22" />
                  </div>
                  <p className="text-14 text-grey-142 transition-all duration-300">{reward ? "Back to rewards" : "Back to All Cases"}</p>
                </div>
              </a>
            )}
          </div>
          <div className="col-span-1 col-start-2 flex w-full justify-end">
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Refresh"
                onClick={() => setRefreshOn((v) => !v)}
                className={`flex h-32 w-32 items-center justify-center rounded-6 ${
                  refreshOn ? "bg-gradient-to-b from-green to-green-2 text-white" : "text-icons-secondary hover:bg-grey-47 hover:text-white"
                }`}
              >
                <Icons.refresh className="text-14" />
              </button>
              <SoundSettings />
            </div>
          </div>
        </div>

        <div className="mt-16 grid w-full grid-cols-1 gap-16">
          <div className="grid w-full grid-cols-1 justify-items-center gap-8">
            <h2 className="ui-label w-full truncate text-center text-18 text-white">{item.name}</h2>
            <VolatilityScale level={vol.level} label={vol.label} />
          </div>
          <CasesSpinner
            rows={rows}
            phase={phase}
            spinKey={spinKey}
            duration={duration}
            settle={cfg.settle}
            divider={cfg.divider}
            itemSize={cfg.itemSize}
            spinTo={cfg.spinTo}
            multi={cfg.multi}
            trackH={cfg.trackH}
            caseImg={caseImg}
            glow={glow}
          />
        </div>

        <div className="mt-16 flex w-full justify-center">
          <div className="flex max-w-full flex-wrap items-center justify-center gap-12">
            {freeOpen ? null : (
              <div className="w-max">
                <ChoiceBar
                  value={qty}
                  onChange={(id) => {
                    if (spinning) return;
                    setQty(id);
                    if (phase === "landed") setPhase("idle");
                  }}
                  options={QTY}
                />
              </div>
            )}
            <div className="flex items-center gap-4">
              {(["normal", "fast", "turbo"] as SpeedId[]).map((id) => {
                const active = speed === id;
                const { bolts, glow } = SPEED[id];
                return (
                  <button
                    key={id}
                    type="button"
                    aria-label={`${id} speed`}
                    disabled={spinning}
                    onClick={() => setSpeed(id)}
                    className={`flex h-32 w-32 items-center justify-center rounded-6 ${
                      active
                        ? `bg-gradient-to-b from-green to-green-2 text-white ${id === "turbo" ? "shadow-[0_0_14px_rgba(82,181,255,0.65)]" : id === "fast" ? "shadow-[0_0_10px_rgba(82,181,255,0.45)]" : ""}`
                        : "text-icons-secondary hover:bg-grey-47 hover:text-white"
                    }`}
                  >
                    <span className={`flex items-center justify-center ${glow}`}>
                      {Array.from({ length: bolts }, (_, i) => (
                        <Icons.bolt key={i} className={`text-14 ${i > 0 ? "-ml-6" : ""}`} />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              aria-label="Open case"
              disabled={spinning || (reward && !canOpen && !giveawayWinId)}
              onClick={() => open(false)}
              className="group/button relative flex h-40 min-w-220 cursor-pointer items-start justify-center rounded-6 bg-gradient-to-b from-green to-green-2 opacity-100 transition-all duration-200 hover:brightness-110 active:brightness-95 disabled:opacity-40"
            >
              <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-16">
                {freeOpen ? (
                  <p className="ui-btn-label text-nowrap text-12 text-grey-190">{canOpen || giveawayWinId ? "Open case" : "Locked"}</p>
                ) : (
                  <div className="grid grid-cols-[auto_auto] items-center gap-4">
                    <p className="ui-btn-label text-nowrap text-12 text-grey-190">Open for</p>
                    <Bux value={cost} tone="onGreen" size="xs" bold />
                  </div>
                )}
              </div>
            </button>
            <button
              type="button"
              aria-label="Demo spin"
              disabled={spinning}
              onClick={() => open(true)}
              className="flex h-40 items-center gap-6 px-8 text-grey-142 transition-colors hover:text-white disabled:opacity-40"
            >
              <Icons.refresh className="text-14" />
              <span className="ui-btn-label text-13">Demo Spin</span>
            </button>
            <FairnessControl game="Cases" userSeeds compact />
          </div>
        </div>
      </div>

      <div className="w-full border-b-1 border-grey-47 transition-colors duration-200" />

      <div className="@sm/page:gap-24 grid w-full grid-cols-1 gap-16">
        <h2 className="ui-label @sm/page:text-16 text-14 text-white">Items Content</h2>
        <div className="@sm/page:grid-cols-3 @sm/page:gap-6 @md/page:grid-cols-4 @bt/page:grid-cols-5 @lg/page:grid-cols-6 @2xl/page:grid-cols-7 grid w-full grid-cols-2 gap-12">
          {listed.map((d) => (
            <DropCard key={d.id} d={d} />
          ))}
        </div>
      </div>
    </div>
  );

  if (variant === "modal") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-10 sm:p-16">
        <button
          type="button"
          aria-label="close overlay"
          className="animate-overlay-in absolute inset-0 bg-black/70 backdrop-blur-[8px]"
          onClick={spinning ? undefined : onClose}
        />
        <div className="animate-modal-in relative z-10 flex max-h-[calc(100vh-32px)] w-[min(1120px,calc(100vw-24px))] flex-col overflow-hidden rounded-12 bg-grey-28 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
          <div className="@container/page scrollbar-y min-h-0 flex-1 overflow-y-auto px-12 py-12 sm:px-20 sm:py-16">{body}</div>
        </div>
      </div>
    );
  }

  return body;
}
