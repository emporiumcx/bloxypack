"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Bux } from "./bux";
import { ChoiceBar } from "./bet-field";
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

const TILE = 148;
const START_INDEX = 4;
const WIN_INDEX = 19;
const STRIP_LEN = 34;
const SPIN_MS = 4300;
const FAST_MS = 1200;

const QTY = [
  { id: "1", label: "1x" },
  { id: "2", label: "2x" },
  { id: "3", label: "3x" },
  { id: "4", label: "4x" },
];

/** Progress curve sampled from live Holy Hair demo spin (~4.3s, 15 tiles). */
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
    const [x1, y1] = EASE[i - 1];
    const [x2, y2] = EASE[i];
    if (u <= x2) {
      const p = (u - x1) / (x2 - x1);
      return y1 + (y2 - y1) * p;
    }
  }
  return 1;
}

function centerX(index: number) {
  return -(index * TILE + TILE / 2);
}

function itemSrc(id: number) {
  return `https://cdn.rostake.com/items_centered/${id}.webp`;
}

function glowBackground(rgb: string) {
  const inner = rgb.slice(4, -1);
  return `radial-gradient(circle, ${rgb} 0%, rgba(${inner}, 0.933) 8.33%, rgba(${inner}, 0.757) 16.67%, rgba(${inner}, 0.537) 25%, rgba(${inner}, 0.33) 33.33%, rgba(${inner}, 0.176) 41.67%, rgba(${inner}, 0.082) 50%, rgba(${inner}, 0.035) 58.33%, rgba(${inner}, 0.01) 66.67%, rgba(${inner}, 0.004) 75%, rgba(${inner}, 0) 83.33%, rgba(${inner}, 0) 91.67%, rgba(${inner}, 0) 100%)`;
}

function shuffleDrops(drops: CaseDrop[]) {
  const copy = [...drops];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildStrip(drops: CaseDrop[], winner?: CaseDrop) {
  const strip: CaseDrop[] = [];
  if (!drops.length) return strip;
  while (strip.length < STRIP_LEN) strip.push(...shuffleDrops(drops));
  strip.length = STRIP_LEN;
  if (winner) strip[WIN_INDEX] = winner;
  return strip;
}

function HexGlow({ color }: { color: string }) {
  return (
    <svg className="h-80 w-80" fill="#16191e7f" viewBox="0 0 108 122" xmlns="http://www.w3.org/2000/svg">
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

function playSfx(src: string, volume = 1) {
  const audio = new Audio(src);
  audio.volume = volume;
  void audio.play().catch(() => {});
  return audio;
}

const RIPPLE_DOTS = (() => {
  const dots: { index: number; inCircle: boolean; delay: number; opacity: number }[] = [];
  const span = 4 * Math.SQRT2;
  for (let t = 0; t < 81; t++) {
    const n = Math.floor(t / 9);
    const s = t % 9;
    const l = Math.sqrt((n - 4) ** 2 + (s - 4) ** 2);
    const inCircle = l <= 4.5;
    const o = 43758.5453 * Math.sin(127.1 * t + 311.7 * n + 74.3 * s);
    dots.push({
      index: t,
      inCircle,
      delay: inCircle ? (l / span) * 600 : 0,
      opacity: inCircle ? 0.2 + (o - Math.floor(o)) * 0.8 : 0,
    });
  }
  return dots;
})();

function RippleBurst({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ borderRadius: "inherit" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(9, 13px)",
          gridTemplateRows: "repeat(9, 13px)",
          gap: 6,
          opacity: 0.7,
        }}
      >
        {RIPPLE_DOTS.map((d) =>
          d.inCircle ? (
            <div
              key={d.index}
              style={{
                width: 13,
                height: 13,
                borderRadius: 30,
                background: color,
                transform: "scale(0)",
                animation: "ripple-breathe 1.5s ease-in-out forwards",
                animationDelay: `${d.delay}ms`,
                animationFillMode: "both",
                opacity: d.opacity,
              }}
            />
          ) : (
            <div key={d.index} style={{ width: 13, height: 13 }} />
          ),
        )}
      </div>
    </div>
  );
}

function SpinnerItem({
  drop,
  i,
  row,
  won,
}: {
  drop: CaseDrop;
  i: number;
  row: number;
  won: boolean;
}) {
  const color = RARITY[drop.color] ?? RARITY.GRAY;
  const showRipple = won && drop.color === "PURPLE";
  return (
    <div
      className="relative flex items-center"
      id={`spinner_${row}_${i}`}
      style={{
        height: TILE,
        width: TILE,
        transition: "opacity 0.25s ease-out, height 0.25s ease-out, width 0.25s ease-out",
      }}
    >
      <p className="absolute text-10 text-grey-112 opacity-0">{i}</p>
      <div className="relative z-10 flex h-full w-full items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: 400,
              height: 400,
              background: glowBackground(color),
              opacity: 0.25,
              transform: `translate(-50%, -50%) scale(${won ? 1 : 0.45})`,
              transition: "opacity 0.45s ease-out, transform 0.45s ease-out",
            }}
          />
          {showRipple ? <RippleBurst color={color} /> : null}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="relative"
              style={{
                opacity: won ? 1 : 0,
                transform: won ? "scale(1) translateY(0px)" : "scale(0.9) translateY(-15px)",
                transition: "0.35s ease-out",
              }}
            >
              <HexGlow color={color} />
            </div>
          </div>
        </div>
        <div
          className={`relative z-10 h-[99px] w-[150px] ${
            won ? "@md/page:translate-y-[-16px] translate-y-[-10px] animate-float" : "translate-y-[-8px]"
          }`}
        >
          <ItemBg className="inset-0 h-full w-full opacity-40" />
          <img
            alt=""
            className={`absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 object-contain opacity-100 ${
              won ? "spin-image-show" : ""
            }`}
            decoding="async"
            fetchPriority={won ? "high" : "low"}
            loading={won ? "eager" : "lazy"}
            src={itemSrc(drop.id)}
            onError={(e) => {
              e.currentTarget.src = drop.image;
            }}
          />
        </div>
      </div>
    </div>
  );
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

function SpinnerTrack({
  drops,
  row,
  phase,
  spinKey,
  duration,
  winIndex,
  goldWin,
}: {
  drops: CaseDrop[];
  row: number;
  phase: "idle" | "spinning" | "landed";
  spinKey: number;
  duration: number;
  winIndex: number | null;
  goldWin: boolean;
}) {
  const reelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const startX = centerX(START_INDEX);
  const endX = centerX(winIndex ?? WIN_INDEX);
  const x = phase === "landed" ? endX : startX;
  const showCoin = goldWin && phase === "landed";
  const showGoldPng = phase === "idle";

  useLayoutEffect(() => {
    const el = reelRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${startX}px, -50%, 0px)`;
    if (phase !== "spinning") {
      if (phase === "landed") el.style.transform = `translate3d(${endX}px, -50%, 0px)`;
      return;
    }
    let raf = 0;
    let cancelled = false;
    const t0 = performance.now();
    const tick = (now: number) => {
      if (cancelled) return;
      const u = Math.min(1, (now - t0) / duration);
      const px = startX + (endX - startX) * liveEase(u);
      el.style.transform = `translate3d(${px}px, -50%, 0px)`;
      if (u < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [phase, spinKey, duration, startX, endX]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (showCoin) {
      video.playbackRate = 2.5;
      video.currentTime = 0;
      void video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [showCoin]);

  return (
    <div className="relative h-full w-full min-h-[160px] @sm/page:min-h-[180px]">
      <div className="relative h-full w-full">
        <div
          className="relative flex h-full w-full min-h-[160px] items-center overflow-hidden rounded-tl-12 rounded-bl-12 rounded-tr-12 rounded-br-12 bg-grey-28 @sm/page:min-h-[180px] @lg/page:rounded-tl-12 @lg/page:rounded-bl-12 @lg/page:rounded-tr-12 @lg/page:rounded-br-12"
          style={{ opacity: 1 }}
        >
          <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
            <div className="absolute top-1/2 left-1/2 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2">
              <img
                alt=""
                className={`absolute top-1/2 left-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 object-contain ${
                  showGoldPng ? "opacity-100" : "opacity-0"
                }`}
                src="/img/spin/initial_gold.png"
              />
            </div>
          </div>
          <div key={spinKey} className={`absolute inset-0 z-10 opacity-100 ${phase === "spinning" ? "animate-reset" : ""}`}>
            <div
              ref={reelRef}
              className="absolute flex w-max"
              style={{
                left: "50%",
                top: "50%",
                willChange: "transform",
                backfaceVisibility: "hidden",
                transform: `translate3d(${x}px, -50%, 0px)`,
              }}
            >
              {drops.map((d, i) => (
                <SpinnerItem
                  key={`${row}-${spinKey}-${i}-${d.id}`}
                  drop={d}
                  i={i}
                  row={row}
                  won={phase === "landed" && i === winIndex}
                />
              ))}
            </div>
          </div>
          <div
            className={`bg-gold/5 absolute right-0 bottom-0 left-0 top-0 z-10 transition-opacity ${
              goldWin && phase === "landed" ? "opacity-100 duration-300" : "opacity-0 duration-0"
            }`}
          />
          <div className="absolute -left-1 top-0 z-20 h-full w-1/3 bg-gradient-to-r from-grey-28 to-transparent" />
          <div className="absolute -right-1 top-0 z-20 h-full w-1/3 bg-gradient-to-l from-grey-28 to-transparent" />
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="absolute top-1/2 left-1/2 h-[150%] w-[150%] -translate-x-1/2 -translate-y-1/2">
              <div
                className={`relative z-20 flex h-full w-full scale-125 items-center justify-center ${
                  showCoin ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="flex h-200 w-200 items-center justify-center overflow-hidden">
                  <video ref={videoRef} className="block h-[300px] w-[300px] scale-[86.66%]" playsInline muted>
                    <source src="/img/spin/coin.webm" type="video/webm" />
                  </video>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Icons.caret className="absolute bottom-0 left-1/2 translate-y-1/2 -translate-x-1/2 rotate-180 text-30 text-green" />
        <Icons.caret className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rotate-0 text-30 text-green" />
        <p className="hidden" />
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
  const [rows, setRows] = useState<RowState[]>(() =>
    Array.from({ length: 1 }, () => ({ strip: buildStrip(dropsForCase(item.slug)), winIndex: null, winner: null })),
  );
  const cost = item.price * n;
  const duration = fast ? FAST_MS : SPIN_MS;
  const caseImg = item.imageId ? `/cdn/cases/${item.imageId}.webp` : item.image ?? "";
  const spinning = phase === "spinning";
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  useEffect(() => {
    if (phase === "spinning") return;
    setRows((prev) => {
      const next = prev.map((r) => ({ ...r }));
      while (next.length < n) next.push({ strip: buildStrip(drops), winIndex: null, winner: null });
      return next.slice(0, n);
    });
  }, [n, drops, phase]);

  useEffect(() => {
    if (phase !== "spinning") return;
    const land = window.setTimeout(() => {
      setPhase("landed");
      revealBalance();
      if (!sound) return;
      playSfx("/sounds/case_land_sweet.wav");
      const winners = rowsRef.current.map((r) => r.winner?.color);
      if (winners.includes("YELLOW")) {
        playSfx("/sounds/goldspin.mp3");
      } else if (winners.includes("PURPLE")) {
        const v = 1 + Math.floor(Math.random() * 2);
        playSfx(`/sounds/battle/Land Epic V${v}.wav`);
      }
    }, duration);
    return () => window.clearTimeout(land);
  }, [phase, spinKey, duration, sound, revealBalance]);

  useEffect(() => {
    if (phase !== "spinning" || !sound) return;
    let last = -1;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const u = Math.min(1, (now - t0) / duration);
      const tile = Math.floor(liveEase(u) * 15);
      if (tile !== last) {
        last = tile;
        playSfx("/sounds/tick.mp3");
      }
      if (u < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, spinKey, duration, sound]);

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
          strip: buildStrip(drops, hit ?? undefined),
          winIndex: WIN_INDEX,
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
            strip: buildStrip(drops, hit ?? undefined),
            winIndex: WIN_INDEX,
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
    if (sound) playSfx("/sounds/battle/Spin V1 With Whoosh.wav", 0.7);
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
            <div className="@sm/page:w-auto grid w-full grid-cols-[auto_auto_auto] items-center gap-8">
              <Toggle on={sound} onClick={() => setSound((v) => !v)} icon={<Icons.volume />} />
              <Toggle on={fast} onClick={() => setFast((v) => !v)} icon={<Icons.bolt />} />
              <Toggle on={refreshOn} onClick={() => setRefreshOn((v) => !v)} icon={<Icons.refresh />} />
            </div>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-12">
          <div className="flex w-full justify-center">
            <img alt="" className="@sm/page:-mt-60 -mt-20 h-140 w-140 object-contain" height={140} width={140} src={caseImg} />
          </div>
          <h2 className="w-full truncate overflow-ellipsis text-center text-18 capitalize text-white">{item.name}</h2>
        </div>

        <div className="relative z-10 grid w-full grid-cols-1 items-center">
          {rows.map((row, i) => (
            <SpinnerTrack
              key={i}
              row={i}
              drops={row.strip}
              phase={phase}
              spinKey={spinKey}
              duration={duration}
              winIndex={row.winIndex}
              goldWin={phase === "landed" && row.winner?.color === "YELLOW"}
            />
          ))}
        </div>

        {phase === "landed" && rows[0]?.winner ? (
          <div className="mt-12 flex w-full flex-col items-center gap-4">
            <p className="text-14 text-white">{rows.length === 1 ? rows[0].winner.name : `${rows.length} items`}</p>
            <Bux value={rows.reduce((sum, r) => sum + (r.winner?.value ?? 0), 0)} />
          </div>
        ) : null}

        <div className="flex w-full justify-center">
          <div className="@lg/page:grid-cols-[auto_1fr] grid max-w-full grid-cols-1 gap-12">
            <ChoiceBar value={qty} onChange={setQty} options={QTY} />
            <div className="@sm/page:grid-cols-[230px_160px] grid w-full grid-cols-1 gap-12">
              <button
                type="button"
                aria-label="button"
                disabled={spinning}
                onClick={() => open(false)}
                className="btn-gold group/button relative flex h-40 cursor-pointer items-center justify-center rounded-6 opacity-100 transition-all duration-200 disabled:opacity-40"
              >
                <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-16">
                  <div className="grid grid-cols-[auto_auto] items-center gap-4">
                    <p className="text-nowrap text-14 text-grey-28">
                      Open {n} case{n > 1 ? "s" : ""} for
                    </p>
                    <Bux value={cost} tone="onGreen" />
                  </div>
                </div>
              </button>
              <button
                type="button"
                aria-label="button"
                disabled={spinning}
                onClick={() => open(true)}
                className="group/button relative flex h-40 cursor-pointer items-start justify-center rounded-6 bg-grey-28 opacity-100 transition-all duration-200 disabled:opacity-40"
              >
                <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-16">
                  <p className="text-14 text-grey-142 transition-all duration-300">Demo Spin</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full border-b-1 border-grey-47 transition-colors duration-200" />

      <div className="@sm/page:gap-24 grid w-full grid-cols-1 gap-16">
        <h2 className="@sm/page:text-20 text-16 text-white">Possible drops</h2>
        <div className="@sm/page:grid-cols-3 @sm/page:gap-6 @md/page:grid-cols-4 @bt/page:grid-cols-5 @lg/page:grid-cols-6 @2xl/page:grid-cols-7 grid w-full grid-cols-2 gap-12">
          {drops.map((d) => (
            <DropCard key={d.id} d={d} />
          ))}
        </div>
      </div>
    </div>
  );
}
