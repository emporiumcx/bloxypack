"use client";

import { useEffect, useState } from "react";
import { Bux } from "@/components/bux";
import { BuxGlyph, Icons } from "@/components/icons";
import { UserAvatar } from "@/components/user-avatar";
import { useStore } from "@/components/providers";
import { formatBux } from "@/lib/format";
import { LEADERBOARD, WEEKLY_RACE_POOL } from "@/lib/catalog";

const PACKS = [
  { slug: "oil-baron", className: "-left-20 top-64 w-200 -rotate-12 sm:left-[-2%]", anim: "animate-float", delay: "0.35s" },
  { slug: "optimus", className: "-right-24 top-48 w-220 rotate-10 sm:right-[-2%]", anim: "animate-float2", delay: "0.15s" },
  { slug: "bank-vault", className: "top-280 left-[2%] hidden w-170 rotate-8 lg:block", anim: "animate-float", delay: "0.7s" },
  { slug: "prestige", className: "top-300 right-[4%] hidden w-160 -rotate-8 lg:block", anim: "animate-float2", delay: "0.5s" },
  { slug: "crimson-wrath", className: "top-520 -left-8 hidden w-150 rotate-14 md:block", anim: "animate-float", delay: "1s" },
  { slug: "beast-case", className: "top-540 -right-4 hidden w-170 -rotate-6 md:block", anim: "animate-float2", delay: "0.85s" },
];

const PLACE = {
  1: {
    label: "1st Place",
    glow: "shadow-[0_0_80px_rgba(242,195,56,0.28)]",
    bar: "from-gold-btn/80 to-gold-btn/10",
    pill: "bg-gold-btn text-grey-28",
    icon: "text-gold-btn",
  },
  2: {
    label: "2nd Place",
    glow: "shadow-[0_0_48px_rgba(176,179,214,0.18)]",
    bar: "from-silver/70 to-silver/10",
    pill: "bg-silver text-grey-28",
    icon: "text-silver",
  },
  3: {
    label: "3rd Place",
    glow: "shadow-[0_0_48px_rgba(244,180,148,0.2)]",
    bar: "from-bronze/80 to-bronze/10",
    pill: "bg-bronze text-grey-28",
    icon: "text-bronze",
  },
} as const;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function nextWeekEnd() {
  const now = new Date();
  const day = now.getUTCDay();
  const add = day === 0 ? 7 : 7 - day;
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + add, 0, 0, 0);
}

function ordinal(n: number) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  if (v % 10 === 1) return `${n}st`;
  if (v % 10 === 2) return `${n}nd`;
  if (v % 10 === 3) return `${n}rd`;
  return `${n}th`;
}

function useRaceClock() {
  const [remain, setRemain] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setRemain(Math.max(0, Math.floor((nextWeekEnd() - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  const n = remain ?? 0;
  return {
    ready: remain != null,
    d: Math.floor(n / 86400),
    h: Math.floor((n % 86400) / 3600),
    m: Math.floor((n % 3600) / 60),
    s: n % 60,
  };
}

function RaceClock({ size = "md" }: { size?: "md" | "lg" }) {
  const { ready, d, h, m, s } = useRaceClock();
  const units = [
    { value: d, label: "Days" },
    { value: h, label: "Hours" },
    { value: m, label: "Minutes" },
    { value: s, label: "Seconds" },
  ];
  return (
    <div className="flex items-start gap-8">
      {units.map((u) => (
        <div key={u.label} className="flex flex-col items-center gap-6">
          <div className={`flex items-center justify-center rounded-10 bg-grey-39 text-white tabular-nums ${size === "lg" ? "h-56 w-64" : "h-48 w-52"}`}>
            <span className="tactic-title-sm">{ready ? pad(u.value) : "—"}</span>
          </div>
          <span className="text-11 text-grey-142">{u.label}</span>
        </div>
      ))}
    </div>
  );
}

function PodiumCard({
  place,
  user,
  wagered,
  prize,
}: {
  place: 1 | 2 | 3;
  user: string;
  wagered: number;
  prize: number;
}) {
  const t = PLACE[place];
  return (
    <div className={`relative flex h-full flex-col overflow-hidden rounded-16 border border-white/8 bg-grey-34/85 backdrop-blur-md ${t.glow} ${place === 1 ? "min-h-320" : "min-h-280"}`}>
      <div className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${t.bar}`} />
      <div className="flex items-center justify-center gap-8 px-16 pt-20">
        <Icons.trophy
          className={`shrink-0 ${place === 1 ? "text-gold-hi" : t.icon}`}
          style={{
            width: 20,
            height: 20,
            filter: place === 1 ? "drop-shadow(0 1px 2px rgba(0,0,0,0.65)) drop-shadow(0 0 8px rgba(255,226,138,0.7))" : undefined,
          }}
        />
        <p className={`ui-label text-13 ${place === 1 ? "text-gold-hi" : t.icon}`}>{t.label}</p>
      </div>
      <div className="flex flex-1 flex-col items-center gap-12 px-20 pt-20 pb-16">
        <UserAvatar seed={user} size={place === 1 ? 72 : 64} rounded="8" />
        <p className="max-w-full truncate text-16 text-white">{user}</p>
        <p className="flex items-center gap-6 text-13 text-grey-142">
          Opened
          <span className="inline-flex items-center gap-4 text-white">
            <BuxGlyph style={{ width: 14, height: 14 }} />
            {formatBux(wagered)}
          </span>
        </p>
      </div>
      <div className="flex flex-col items-center gap-10 border-t border-white/6 px-20 py-16">
        <p className="ui-label text-11 text-grey-142">Prize</p>
        <div className={`flex h-36 items-center rounded-full px-14 ${t.pill}`}>
          <BuxGlyph className="mr-6" style={{ width: 16, height: 16 }} />
          <span className="ui-num text-14 font-black">{formatBux(prize)}</span>
        </div>
      </div>
    </div>
  );
}

const RACE_PARTICLES = [
  { left: "8%", top: "12%", w: 3, dur: "11s", delay: "0s", px: "28px", py: "-120px" },
  { left: "22%", top: "28%", w: 2, dur: "14s", delay: "1.2s", px: "-18px", py: "-90px" },
  { left: "41%", top: "8%", w: 4, dur: "10s", delay: "0.4s", px: "12px", py: "-140px" },
  { left: "58%", top: "18%", w: 2, dur: "13s", delay: "2.1s", px: "22px", py: "-100px" },
  { left: "74%", top: "6%", w: 3, dur: "12s", delay: "0.8s", px: "-16px", py: "-110px" },
  { left: "88%", top: "22%", w: 2, dur: "15s", delay: "1.6s", px: "10px", py: "-80px" },
  { left: "12%", top: "46%", w: 3, dur: "16s", delay: "2.8s", px: "-24px", py: "-70px" },
  { left: "33%", top: "38%", w: 2, dur: "11s", delay: "0.3s", px: "18px", py: "-95px" },
  { left: "49%", top: "32%", w: 4, dur: "9s", delay: "1.9s", px: "-8px", py: "-125px" },
  { left: "67%", top: "44%", w: 2, dur: "14s", delay: "0.6s", px: "26px", py: "-85px" },
  { left: "81%", top: "36%", w: 3, dur: "12s", delay: "2.4s", px: "-12px", py: "-105px" },
  { left: "5%", top: "62%", w: 2, dur: "17s", delay: "1.1s", px: "14px", py: "-60px" },
  { left: "27%", top: "58%", w: 3, dur: "13s", delay: "3.2s", px: "-20px", py: "-75px" },
  { left: "54%", top: "54%", w: 2, dur: "15s", delay: "0.9s", px: "16px", py: "-88px" },
  { left: "71%", top: "66%", w: 3, dur: "11s", delay: "2s", px: "-10px", py: "-70px" },
  { left: "93%", top: "50%", w: 2, dur: "16s", delay: "1.4s", px: "8px", py: "-92px" },
  { left: "16%", top: "78%", w: 2, dur: "14s", delay: "2.6s", px: "20px", py: "-55px" },
  { left: "62%", top: "74%", w: 3, dur: "12s", delay: "0.2s", px: "-14px", py: "-64px" },
] as const;

export default function LeaderboardPage() {
  const { user } = useStore();
  const first = LEADERBOARD[0];
  const second = LEADERBOARD[1];
  const third = LEADERBOARD[2];
  const rest = LEADERBOARD.slice(3);

  return (
    <div className="relative w-full">
      <div className="race-grid" />
      <div className="pointer-events-none absolute inset-x-[-80px] top-0 h-[860px] overflow-hidden">
        {RACE_PARTICLES.map((p, i) => (
          <span
            key={i}
            className="race-particle"
            style={{
              left: p.left,
              top: p.top,
              width: p.w,
              height: p.w,
              animationDuration: p.dur,
              animationDelay: p.delay,
              ["--px" as string]: p.px,
              ["--py" as string]: p.py,
            }}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-[-80px] top-0 h-[720px] overflow-visible">
        {PACKS.map((p) => (
          <img
            key={p.slug}
            alt=""
            src={`/cdn/packs/${p.slug}.webp`}
            className={`absolute object-contain drop-shadow-[0_24px_40px_rgba(0,0,0,0.55)] ${p.className} ${p.anim}`}
            style={{ animationDelay: p.delay }}
          />
        ))}
      </div>

      <div className="relative z-1 mx-auto flex w-full max-w-screen-bt flex-col items-center gap-40 pt-12 pb-40">
        <div className="flex w-full flex-col items-center gap-16">
          <h1 className="ui-label text-28 text-white md:text-36">Weekly Race</h1>
          <div className="flex items-center gap-8 rounded-full bg-grey-39 px-16 py-8">
            <Bux value={WEEKLY_RACE_POOL} tone="gold" />
          </div>
        </div>

        <div className="@md/page:grid-cols-3 @md/page:items-end grid w-full grid-cols-1 gap-16">
          <div className="@md/page:col-start-2 @md/page:row-start-1 @md/page:-mt-24">
            <PodiumCard place={1} user={first.user} wagered={first.wagered} prize={first.prize} />
          </div>
          <div className="@md/page:col-start-1 @md/page:row-start-1">
            <PodiumCard place={2} user={second.user} wagered={second.wagered} prize={second.prize} />
          </div>
          <div className="@md/page:col-start-3 @md/page:row-start-1">
            <PodiumCard place={3} user={third.user} wagered={third.wagered} prize={third.prize} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-12">
          <p className="text-14 text-grey-142">Leaderboard ends in</p>
          <RaceClock size="lg" />
        </div>

        <div className="w-full overflow-x-auto">
          <div className="grid min-w-[520px] grid-cols-1 gap-8">
            <div className="grid grid-cols-[64px_1fr_140px_120px] items-center px-20 text-12 text-grey-142">
              <p>#</p>
              <p>Player</p>
              <p>Opened</p>
              <p className="text-right">Prize</p>
            </div>
            {rest.map((row) => (
              <div
                key={row.place}
                className="grid grid-cols-[64px_1fr_140px_120px] items-center rounded-16 bg-grey-39 px-20 py-12"
              >
                <p className="text-14 text-white">{ordinal(row.place)}</p>
                <div className="flex min-w-0 items-center gap-10">
                  <UserAvatar seed={row.user} size={36} rounded="8" />
                  <p className="truncate text-14 text-white">{row.user}</p>
                </div>
                <div className="flex items-center gap-6">
                  <BuxGlyph style={{ width: 14, height: 14 }} />
                  <p className="ui-num text-14 text-white">{formatBux(row.wagered)}</p>
                </div>
                <div className="flex justify-end">
                  <div className="flex items-center gap-6">
                    <BuxGlyph style={{ width: 16, height: 16 }} />
                    <p className="ui-num text-14 text-success">{formatBux(row.prize)}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="grid grid-cols-[64px_1fr_140px_120px] items-center rounded-12 border border-dashed border-white/8 bg-grey-39/50 px-20 py-10">
              <p className="text-14 text-grey-142">—</p>
              <div className="flex min-w-0 items-center gap-10">
                {user ? (
                  <>
                    <UserAvatar avatar={user.avatar} seed={user.username} size={36} rounded="8" level={user.level} rank={user.rank} />
                    <p className="truncate text-14 text-white">{user.username}</p>
                  </>
                ) : (
                  <p className="text-14 text-grey-142">Sign in to track your rank</p>
                )}
              </div>
              <p className="ui-num text-14 text-grey-142">{formatBux(user?.stats.bet ?? 0)}</p>
              <p className="text-right text-14 text-grey-142">—</p>
            </div>
          </div>
        </div>

        <div className="flex w-full max-w-640 flex-col gap-8 text-center text-12 text-grey-112">
          <p>Bonus-balance wagers count toward the race at the bonus percent. A +100% bonus wager is counted at half.</p>
          <p>Rankings update every 5 minutes. All prizes are credited as site balance.</p>
        </div>
      </div>
    </div>
  );
}
