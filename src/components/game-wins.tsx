"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DropPanel, useDrop } from "@/components/dropdown";
import { BuxGlyph, Icons } from "@/components/icons";

type WinRow = {
  user: string;
  bet: number;
  multi: number;
  payout: number;
  daysAgo: number;
};

const TOWER_WINS: WinRow[] = [
  { user: "Vasky", bet: 5424, multi: 2.02, payout: 10983, daysAgo: 0 },
  { user: "monarch", bet: 6329, multi: 1.23, payout: 7784.67, daysAgo: 2 },
  { user: "R4ITH", bet: 500, multi: 11.03, payout: 5515, daysAgo: 4 },
  { user: "voids", bet: 1000, multi: 3.72, payout: 3720, daysAgo: 8 },
  { user: "Alpha_mil0", bet: 250, multi: 12.92, payout: 3230, daysAgo: 1 },
  { user: "Joris67", bet: 1537, multi: 1.94, payout: 2982, daysAgo: 12 },
  { user: "kairo", bet: 80, multi: 37.28, payout: 2982.4, daysAgo: 18 },
  { user: "nemi", bet: 420, multi: 4.96, payout: 2083.2, daysAgo: 40 },
];

const TIMES = [
  { id: "24h", label: "Last 24h", days: 1 },
  { id: "7d", label: "Last 7D", days: 7 },
  { id: "30d", label: "Last 30D", days: 30 },
  { id: "all", label: "All-time", days: Infinity },
] as const;

const RANK = [
  { fill: "url(#rank-gold)", stroke: "#59371F", color: "#ffe0b0", shadow: "#c26514", stop: "#FF8214" },
  { fill: "url(#rank-silver)", stroke: "#475357", color: "#a0bfc9", shadow: "#567b86", stop: "#A0BFC9" },
  { fill: "url(#rank-bronze)", stroke: "#59371F", color: "#ffc3b0", shadow: "#8b4525", stop: "#C83F15" },
] as const;

function splitAmount(n: number) {
  const [w, f] = n.toFixed(2).split(".");
  return { whole: Number(w).toLocaleString("en-US"), frac: f };
}

function Amount({ value, win = false }: { value: number; win?: boolean }) {
  const { whole, frac } = splitAmount(value);
  return (
    <span className={`inline-flex items-center whitespace-nowrap text-13 ${win ? "text-success" : "text-grey-190"}`}>
      <BuxGlyph className="mr-3" style={{ width: 14, height: 14 }} />
      <span>
        {whole}
        <span className={win ? "text-success" : "text-grey-142"}>.{frac}</span>
      </span>
    </span>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const meta = RANK[rank - 1];
  if (!meta) {
    return <span className="font-tactic text-12 font-black text-grey-112">{rank}</span>;
  }
  const id = `rank-${rank}`;
  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 26 25" className="absolute inset-0 h-24 w-24">
        <path
          fill={`url(#${id})`}
          stroke={meta.stroke}
          d="M10.555 1.168a3.5 3.5 0 0 1 4.115 0l8.613 6.258a3.5 3.5 0 0 1 1.271 3.913l-3.29 10.125a3.5 3.5 0 0 1-3.328 2.418H7.29a3.5 3.5 0 0 1-3.329-2.418L.671 11.339a3.5 3.5 0 0 1 1.272-3.913z"
        />
        <defs>
          <linearGradient id={id} x1="12.613" x2="12.613" y1="9.056" y2="27.056" gradientUnits="userSpaceOnUse">
            <stop stopColor={meta.stop} stopOpacity="0.08" />
            <stop offset="1" stopColor={meta.stop} stopOpacity="0.32" />
          </linearGradient>
        </defs>
      </svg>
      <span
        className="relative font-tactic text-12 font-black"
        style={{ color: meta.color, textShadow: `0 0.58px 0 ${meta.shadow}` }}
      >
        {rank}
      </span>
    </div>
  );
}

export function GameWins({ game = "Tower" }: { game?: string }) {
  const [mode, setMode] = useState<"highest" | "luckiest">("highest");
  const [time, setTime] = useState<(typeof TIMES)[number]["id"]>("all");
  const { open, leaving, shown, close, toggle } = useDrop();
  const ref = useRef<HTMLDivElement>(null);
  const current = TIMES.find((t) => t.id === time) ?? TIMES[3];

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, leaving]);

  const rows = useMemo(() => {
    const windowed = TOWER_WINS.filter((r) => r.daysAgo < current.days);
    const sorted = [...windowed].sort((a, b) => (mode === "luckiest" ? b.multi - a.multi : b.payout - a.payout));
    return sorted.slice(0, 8);
  }, [mode, current.days]);

  return (
    <div className="mt-16 w-full md:mt-24">
      <div className="no-scrollbar flex w-full max-w-full flex-col items-start gap-8 overflow-x-auto md:flex-row md:items-center">
        <div className="flex items-center justify-start gap-10">
          <div className="inline-flex h-40 w-40 shrink-0 items-center justify-center rounded-6 bg-gold-btn/15 text-gold-btn">
            <Icons.crown className="text-16" />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <span className="font-tactic text-start text-14 font-black uppercase leading-[1.14] text-white">Wins</span>
            <span className="text-start text-12 leading-[1.17] text-grey-142">
              The biggest and luckiest {game} wins on BloxyPack
            </span>
          </div>
        </div>
        <div className="flex w-full items-center gap-8 md:ml-auto md:w-auto">
          <div className="inline-flex gap-4 rounded-8 border border-grey-58 bg-grey-39 p-4">
            {(
              [
                ["highest", "Highest wins"],
                ["luckiest", "Luckiest wins"],
              ] as const
            ).map(([id, label]) => {
              const on = mode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={`flex h-26 items-center rounded-6 px-10 text-12 font-medium transition-colors ${
                    on
                      ? "border border-green-2 bg-gradient-to-b from-green to-green-2 text-white"
                      : "border border-transparent text-grey-190 hover:bg-white/10"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div ref={ref} className="relative">
            <button
              type="button"
              aria-expanded={open && !leaving}
              onClick={toggle}
              className="flex h-32 min-w-0 cursor-pointer items-center justify-between gap-12 rounded-6 border border-grey-58 bg-grey-1 px-12 text-12 text-white"
            >
              <span className="flex min-w-0 items-center gap-8">
                <Icons.clock className="text-14 text-grey-112" />
                <span className="shrink-0 text-grey-142">Time</span>
                <span>{current.label}</span>
              </span>
              <Icons.chevron className={`text-14 text-grey-112 transition-transform duration-200 ${open && !leaving ? "rotate-180" : ""}`} />
            </button>
            <DropPanel shown={shown} leaving={leaving} className="absolute right-0 top-36 min-w-full overflow-hidden">
              {TIMES.map((t, i) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTime(t.id);
                    close();
                  }}
                  style={leaving ? undefined : { animation: "open-y 0.28s cubic-bezier(0.22, 1, 0.36, 1) both", animationDelay: `${i * 28}ms` }}
                  className={`flex h-32 w-full items-center rounded-6 px-10 text-left text-12 ${
                    time === t.id ? "bg-green text-white" : "text-white hover:bg-grey-39"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </DropPanel>
          </div>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-6 bg-grey-1 p-8 md:mt-16 md:p-16">
        <table className="w-full table-fixed">
          <thead>
            <tr>
              {["Rank", "Player", "Bet amount", "Multiplier", "Payout"].map((h, i) => (
                <th
                  key={h}
                  style={{ width: i === 0 ? 40 : i === 1 ? 200 : 100 }}
                  className="px-16 pb-12 text-left text-12 font-semibold whitespace-nowrap text-grey-112"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const stripe = i % 2 === 0;
              const cell = `h-40 px-16 py-6 ${stripe ? "bg-grey-39" : ""}`;
              return (
                <tr key={`${row.user}-${row.payout}-${i}`} className="cursor-default">
                  <td className={`${cell} ${stripe ? "rounded-tl-6 rounded-bl-6" : ""}`} style={{ width: 40 }}>
                    <RankBadge rank={i + 1} />
                  </td>
                  <td className={cell} style={{ width: 200 }}>
                    <span className="text-13 text-grey-142">{row.user}</span>
                  </td>
                  <td className={cell} style={{ width: 100 }}>
                    <Amount value={row.bet} />
                  </td>
                  <td className={cell} style={{ width: 100 }}>
                    <div className="inline-flex items-center whitespace-nowrap rounded-6 bg-success/10 px-6 py-4 text-12 font-medium text-success">
                      {row.multi.toFixed(2)}x
                    </div>
                  </td>
                  <td className={`${cell} ${stripe ? "rounded-tr-6 rounded-br-6" : ""}`} style={{ width: 100 }}>
                    <Amount value={row.payout} win />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
