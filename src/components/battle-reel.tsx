"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Bux } from "./bux";
import { ItemBg } from "./item-bg";
import { type CaseDrop, type DropColor } from "@/lib/catalog";

const RARITY: Record<DropColor, string> = {
  YELLOW: "rgb(228, 174, 57)",
  PURPLE: "rgb(136, 71, 255)",
  BLUE: "rgb(94, 152, 217)",
  GRAY: "rgb(176, 195, 217)",
};

const RARITY_LABEL: Record<DropColor, string> = {
  YELLOW: "Legendary",
  PURPLE: "Epic",
  BLUE: "Rare",
  GRAY: "Common",
};

const SLOT = 118;
const START_INDEX = 3;
const WIN_INDEX = 22;
const STRIP_LEN = 30;
export const BATTLE_SPIN_MS = 5400;

/** Same progress curve as case opening (DiceBlox-style ease: fast start, long settle). */
const EASE: [number, number][] = [
  [0, 0],
  [0.0316, 0.0217],
  [0.061, 0.1589],
  [0.0903, 0.2639],
  [0.1196, 0.3637],
  [0.149, 0.446],
  [0.1761, 0.5189],
  [0.2054, 0.586],
  [0.2348, 0.6411],
  [0.2619, 0.6886],
  [0.2912, 0.7297],
  [0.3183, 0.7655],
  [0.3476, 0.7964],
  [0.377, 0.8249],
  [0.4041, 0.848],
  [0.4334, 0.8681],
  [0.4605, 0.8855],
  [0.4898, 0.9004],
  [0.517, 0.9134],
  [0.5463, 0.9246],
  [0.5734, 0.9342],
  [0.6027, 0.9423],
  [0.6298, 0.9493],
  [0.6591, 0.9552],
  [0.6885, 0.96],
  [0.7156, 0.9641],
  [0.7449, 0.9673],
  [0.772, 0.9699],
  [0.8014, 0.9718],
  [0.8284, 0.9732],
  [0.8578, 0.9742],
  [0.8871, 0.9794],
  [0.9142, 0.9944],
  [0.9436, 0.9988],
  [0.9707, 0.9999],
  [1, 1],
];

function liveEase(t: number) {
  const u = Math.min(1, Math.max(0, t));
  for (let i = 1; i < EASE.length; i++) {
    const [x1, y1] = EASE[i - 1]!;
    const [x2, y2] = EASE[i]!;
    if (u <= x2) {
      const p = (u - x1) / (x2 - x1);
      return y1 + (y2 - y1) * p;
    }
  }
  return 1;
}

function centerY(index: number) {
  return -(index * SLOT + SLOT / 2);
}

function itemSrc(id: number) {
  return `https://cdn.rostake.com/items_centered/${id}.webp`;
}

function glowBackground(rgb: string) {
  const inner = rgb.slice(4, -1);
  return `radial-gradient(circle, ${rgb} 0%, rgba(${inner}, 0.933) 8.33%, rgba(${inner}, 0.757) 16.67%, rgba(${inner}, 0.537) 25%, rgba(${inner}, 0.33) 33.33%, rgba(${inner}, 0.176) 41.67%, rgba(${inner}, 0.082) 50%, rgba(${inner}, 0.035) 58.33%, rgba(${inner}, 0.01) 66.67%, rgba(${inner}, 0.004) 75%, rgba(${inner}, 0) 83.33%, rgba(${inner}, 0) 91.67%, rgba(${inner}, 0) 100%)`;
}

function seededShuffle(drops: CaseDrop[], seed: number) {
  const copy = [...drops];
  let s = (seed || 1) >>> 0;
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function buildStrip(drops: CaseDrop[], winner: CaseDrop | null | undefined, seed: number) {
  const strip: CaseDrop[] = [];
  if (!drops.length) return strip;
  const pool = seededShuffle(drops, seed);
  for (let i = 0; i < STRIP_LEN; i++) {
    if (i === WIN_INDEX && winner) strip.push(winner);
    else strip.push(pool[i % pool.length]!);
  }
  return strip;
}

function playSfx(src: string, volume = 1) {
  const audio = new Audio(src);
  audio.volume = volume;
  void audio.play().catch(() => {});
}

function HexGlow({ color }: { color: string }) {
  return (
    <svg className="h-72 w-64" fill="#16191e7f" viewBox="0 0 108 122" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M49.0348 2.82894C52.1025 1.07598 55.8684 1.07599 58.9361 2.82894L102.265 27.5886C105.374 29.3651 107.293 32.6714 107.293 36.2522V85.594C107.293 89.1748 105.374 92.481 102.265 94.2576L58.9361 119.017C55.8684 120.77 52.1025 120.77 49.0348 119.017L5.70542 94.2576C2.59643 92.481 0.677734 89.1748 0.677734 85.594V36.2522C0.677734 32.6714 2.59643 29.3651 5.70543 27.5886L49.0348 2.82894Z"
        opacity="0.3"
        stroke={color}
        strokeWidth="3"
      />
      <path
        d="M49.0925 17.9811C52.1301 16.2725 55.839 16.2725 58.8765 17.9811L89.5136 35.2144C92.6555 36.9818 94.5999 40.3064 94.5999 43.9113V77.932C94.5999 81.5369 92.6555 84.8615 89.5136 86.6289L58.8765 103.862C55.839 105.571 52.1301 105.571 49.0925 103.862L18.4555 86.6289C15.3135 84.8615 13.3691 81.5369 13.3691 77.932V43.9113C13.3691 40.3064 15.3135 36.9818 18.4555 35.2144L49.0925 17.9811Z"
        stroke={color}
        strokeWidth="3"
      />
    </svg>
  );
}

export type BattleReelPhase = "idle" | "spinning" | "landed";

export function BattleReel({
  drops,
  winner,
  phase,
  spinKey,
  duration = BATTLE_SPIN_MS,
  height = 420,
  sound = false,
}: {
  drops: CaseDrop[];
  winner?: CaseDrop | null;
  phase: BattleReelPhase;
  spinKey: number;
  duration?: number;
  height?: number;
  sound?: boolean;
}) {
  const reelRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<CaseDrop[]>([]);
  const dropKey = drops.map((d) => d.id).join(",");
  const winnerId = winner?.id ?? 0;
  const strip = useMemo(() => {
    const prev = stripRef.current;
    if (prev.length === STRIP_LEN && prev[0] && drops.some((d) => d.id === prev[0]!.id)) {
      const next = [...prev];
      if (winner) next[WIN_INDEX] = winner;
      stripRef.current = next;
      return next;
    }
    const built = buildStrip(drops, winner, spinKey * 10007 + winnerId + dropKey.length);
    stripRef.current = built;
    return built;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropKey, winnerId]);
  const color = winner ? RARITY[winner.color] : "transparent";
  const landed = phase === "landed" && !!winner;
  const startY = centerY(START_INDEX);
  const endY = centerY(WIN_INDEX);
  const y = phase === "landed" ? endY : startY;

  useLayoutEffect(() => {
    const el = reelRef.current;
    if (!el) return;
    el.style.transform = `translate3d(0px, ${startY}px, 0px)`;
    if (phase !== "spinning") {
      if (phase === "landed") el.style.transform = `translate3d(0px, ${endY}px, 0px)`;
      return;
    }
    let raf = 0;
    let cancelled = false;
    let lastTile = -1;
    const t0 = performance.now();
    const tick = (now: number) => {
      if (cancelled) return;
      const u = Math.min(1, (now - t0) / duration);
      const py = startY + (endY - startY) * liveEase(u);
      el.style.transform = `translate3d(0px, ${py}px, 0px)`;
      const tile = START_INDEX + Math.round(liveEase(u) * (WIN_INDEX - START_INDEX));
      if (tile !== lastTile) {
        lastTile = tile;
        if (sound) playSfx("/sounds/tick.mp3", 0.32);
        el.querySelectorAll(".mm2-reel-slot").forEach((slot, i) => {
          slot.classList.toggle("is-selected", i === tile);
        });
      }
      if (u < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [phase, spinKey, duration, startY, endY, sound]);

  useEffect(() => {
    if (phase !== "spinning" || !sound) return;
    playSfx("/sounds/battle/Spin V1 With Whoosh.wav", 0.7);
  }, [phase, spinKey, sound]);

  return (
    <div
      className={`mm2-cases-spinner is-vertical relative ${phase === "idle" ? "is-pre-spin" : ""} ${phase === "spinning" ? "is-spinning" : ""} ${phase === "landed" ? "is-landed" : ""}`}
      style={{
        ["--itemSize" as string]: "92px",
        ["--slot" as string]: `${SLOT}px`,
        ["--trackH" as string]: `${height}px`,
        ["--winColor" as string]: color,
      }}
    >
      <div className="mm2-spinner-inner relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1/4 bg-gradient-to-b from-[#161514] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-1/4 bg-gradient-to-t from-[#161514] to-transparent" />
        {landed ? <div className="dbx-win-glow" /> : null}
        <div className="mm2-reels">
          <div className="mm2-reel-track">
            <div
              ref={reelRef}
              className="mm2-reel"
              style={{
                transform: `translate3d(0px, ${y}px, 0px)`,
                willChange: "transform",
                backfaceVisibility: "hidden",
              }}
            >
              {strip.map((d, j) => {
                const won = landed && j === WIN_INDEX;
                const c = RARITY[d.color];
                return (
                  <div
                    key={j}
                    className={`mm2-reel-slot relative${won ? " is-won" : ""}`}
                    style={{ height: SLOT, width: "100%" }}
                  >
                    <div className="relative z-10 flex h-full w-full items-center justify-center">
                      <div
                        className="absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2"
                        style={{
                          background: glowBackground(c),
                          opacity: won ? 0.55 : 0.12,
                          transform: `translate(-50%, -50%) scale(${won ? 1 : 0.45})`,
                          transition: "opacity 0.45s ease-out, transform 0.45s ease-out",
                        }}
                      />
                      {won && d.color === "PURPLE" ? (
                        <div className="absolute inset-0 flex items-center justify-center opacity-70">
                          <HexGlow color={c} />
                        </div>
                      ) : null}
                      <div className={`relative h-[92px] w-[92px] ${won ? "spin-image-show" : ""}`}>
                        <ItemBg className="inset-0 h-full w-full opacity-30" />
                        <img
                          alt=""
                          className="mm2-reel-item absolute inset-0 h-full w-full object-contain"
                          src={itemSrc(d.id)}
                          onError={(e) => {
                            e.currentTarget.src = d.image;
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {landed && winner ? (
          <div className="mm2-battle-landed pointer-events-none absolute inset-x-0 bottom-10 z-10 px-8 text-center">
            <p className="truncate text-11 font-semibold uppercase" style={{ color: `color-mix(in srgb, ${color}, white 25%)` }}>
              {RARITY_LABEL[winner.color]}
            </p>
            <p className="truncate text-12 font-semibold uppercase text-grey-190">{winner.name}</p>
            <div className="mt-4 flex justify-center">
              <Bux value={winner.value} size="xs" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
