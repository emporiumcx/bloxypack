"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Bux } from "@/components/bux";
import { GreenButton } from "@/components/green-button";
import { Icons } from "@/components/icons";
import { useStore } from "@/components/providers";
import { RewardCaseModal } from "@/components/reward-case-modal";
import { getRewardsData, sendRakebackClaim, type RewardsInfo } from "@/lib/backend";
import { caseImage, getCase } from "@/lib/catalog";
import { BONUS_CASES, DAILY_CASES, bonusProgress, bonusTierForXp } from "@/lib/rewards";

const HEADER_CASES = ["halloween-case", "haunted-case", "golden-case"] as const;

const RAKEBACK = [
  { name: "Daily Rakeback", kind: "daily" as const, img: "/img/rewards/rakeback/daily.png" },
  { name: "Weekly Rakeback", kind: "weekly" as const, img: "/img/rewards/rakeback/weekly.png" },
  { name: "Monthly Rakeback", kind: "monthly" as const, img: "/img/rewards/rakeback/monthly.png" },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatRemain(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return `${pad(days)}:${pad(hours)}:${pad(mins)}:${pad(secs)}`;
}

function remainingMs(kind: "daily" | "weekly" | "monthly") {
  const now = Date.now();
  const d = new Date();
  if (kind === "daily") {
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1) - now;
  }
  if (kind === "weekly") {
    const day = d.getUTCDay();
    const daysToAdd = (8 - day) % 7 || 7;
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + daysToAdd) - now;
  }
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) - now;
}

function RakebackTimer({ kind }: { kind: "daily" | "weekly" | "monthly" }) {
  const [label, setLabel] = useState("00:00:00:00");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const tick = () => setLabel(formatRemain(remainingMs(kind)));
    tick();
    setReady(true);
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [kind]);

  return (
    <span className={`min-w-[8.7ch] max-w-[8.7ch] text-14 text-gray-500 ${ready ? "" : "invisible"}`}>
      {label}
    </span>
  );
}

function CaseCard({
  name,
  img,
  hue,
  locked,
  lockLabel,
  action,
  badge,
  onOpen,
}: {
  name: string;
  img: string;
  hue?: number;
  locked: boolean;
  lockLabel: ReactNode;
  action: string;
  badge?: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative w-full overflow-hidden rounded-12 border-2 border-[#3F454D] bg-grey-39 text-left transition-transform duration-300 ease-out hover:scale-[1.01]"
    >
      <div className="relative grid w-full grid-cols-1 gap-12 p-16">
        <div className="relative flex w-full justify-center transition-all duration-300">
          <img
            alt=""
            className={`h-[110px] w-[110px] object-contain transition-all duration-300 ${locked ? "opacity-25 blur-[4px]" : ""}`}
            src={img}
            style={hue ? { filter: `hue-rotate(${hue}deg)` } : undefined}
          />
          {locked ? <Icons.lock className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-32 text-grey-190" /> : null}
        </div>
        <div className="grid w-full grid-cols-1 gap-4">
          <p className="text-center text-14 text-grey-190">{lockLabel}</p>
          <h4 className="text-center text-16 text-white">{name}</h4>
        </div>
        <div className="flex w-full justify-center">
          <div className="relative flex h-40 items-center justify-center rounded-6 bg-grey-28 px-10 transition-all duration-200 group-hover:bg-grey-34">
            <p className={`text-14 ${locked ? "text-grey-142" : "text-white"}`}>{action}</p>
          </div>
        </div>
      </div>
      {badge ? (
        <div className="absolute top-10 right-10 rounded-6 bg-grey-39">
          <div className="flex h-32 items-center rounded-6 bg-grey-58 px-10">
            <p className="text-16 text-grey-190">{badge}</p>
          </div>
        </div>
      ) : null}
    </button>
  );
}

export default function RewardsPage() {
  const { user, openModal, applyUser } = useStore();
  const [info, setInfo] = useState<RewardsInfo | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState("");
  const [viewing, setViewing] = useState<{ slug: string; canOpen: boolean } | null>(null);

  useEffect(() => {
    if (!user) {
      setInfo(null);
      return;
    }
    getRewardsData()
      .then((res) => {
        setInfo(res.rewards);
        if (res.user) applyUser(res.user);
      })
      .catch(() => setInfo(null));
  }, [user?.id]);

  const bonusXp = info?.bonusXp ?? user?.bonusXp ?? 0;
  const rakeback = (info?.rakeback ?? 0) / 1000;
  const level = user?.level ?? 1;
  const { current, next } = useMemo(() => bonusTierForXp(bonusXp), [bonusXp]);
  const fill = bonusProgress(bonusXp);
  const featured = current ?? BONUS_CASES[0];
  const canOpenFeatured = Boolean(current);

  async function claimRakeback() {
    if (!user) return openModal("login");
    setClaiming(true);
    setClaimError("");
    try {
      const res = await sendRakebackClaim();
      applyUser(res.user);
      setInfo((prev) => (prev ? { ...prev, rakeback: 0 } : prev));
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : "Could not claim rakeback.");
    }
    setClaiming(false);
  }

  return (
    <div className="@md/page:gap-32 @md/page:py-10 grid w-full grid-cols-1 gap-24">
      <div className="relative border-b-1 border-grey-47">
        <div className="grid w-full grid-cols-[1fr_auto] items-center gap-16">
          <div className="grid w-full grid-cols-[auto_1fr] items-center gap-12">
            <img alt="" className="animate-floaty -mt-16 w-24" src="/img/rewards/gift.svg" />
            <h2 className="@sm/page:text-24 text-18 text-white">Rewards</h2>
          </div>
          <div className="relative hidden h-[120px] w-[280px] overflow-hidden sm:block">
            <div className="absolute -bottom-28 right-0 flex h-[148px] w-[280px] items-end justify-center">
              {HEADER_CASES.map((slug, i) => {
                const item = getCase(slug);
                const front = i === 1;
                return (
                  <Link
                    key={slug}
                    href={`/cases/${slug}`}
                    className={`relative transition-transform duration-200 hover:-translate-y-6 hover:scale-105 ${
                      front ? "z-20 -mx-28 w-[148px]" : "z-10 w-[124px]"
                    } ${i === 0 ? "rotate-[-8deg]" : i === 2 ? "rotate-[8deg]" : ""}`}
                  >
                    <img alt={item?.name ?? slug} className="w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)]" src={caseImage(item)} />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-16">
        <h3 className="text-16 text-white">Rakeback</h3>
        {claimError ? <p className="text-13 text-[#FF5562]">{claimError}</p> : null}
        <div className="@md/page:grid-cols-3 grid w-full grid-cols-1 gap-12">
          {RAKEBACK.map((r) => {
            const claimable = r.kind === "daily" && rakeback > 0;
            return (
              <div key={r.name} className="group relative w-full overflow-hidden rounded-12 border-2 border-[#3F454D] bg-grey-39 transition-transform duration-300 ease-out">
                <div className="relative flex w-full items-center gap-16 p-8">
                  <div className="relative flex h-[92px] w-[92px] shrink-0 items-center justify-center">
                    <img alt="" className={`h-full w-full object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)] transition-all duration-300 ${claimable ? "" : "grayscale"}`} src={r.img} />
                  </div>
                  <div className="flex flex-1 flex-col gap-8">
                    <h4 className="text-balance text-14 text-white">{r.name}</h4>
                    {claimable ? <Bux value={rakeback} size="sm" /> : null}
                    <div className="flex w-full">
                      {claimable ? (
                        <GreenButton size="sm" disabled={claiming} onClick={claimRakeback}>
                          {claiming ? "..." : "Claim"}
                        </GreenButton>
                      ) : (
                        <button className="relative flex h-40 items-center justify-center rounded-6 bg-grey-28 px-16" type="button">
                          <RakebackTimer kind={r.kind} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-16">
        <h3 className="text-16 text-white">Bonus Cases</h3>
        <button
          type="button"
          onClick={() => setViewing({ slug: featured.slug, canOpen: canOpenFeatured })}
          className="panel-outline relative grid w-full grid-cols-1 gap-16 overflow-hidden rounded-12 bg-grey-39 p-16 text-left sm:grid-cols-[auto_1fr]"
        >
          <div className="relative flex items-center justify-center">
            <img
              alt=""
              src={featured.image}
              className={`h-[160px] w-[160px] object-contain ${canOpenFeatured ? "" : "opacity-60"}`}
              style={{ filter: `hue-rotate(${featured.hue}deg)` }}
            />
          </div>
          <div className="grid w-full grid-cols-1 items-center gap-12">
            <div className="grid gap-6">
              <p className="text-12 text-grey-142">{canOpenFeatured ? `Ready to open` : `Next unlock`}</p>
              <p className="text-18 text-white">{featured.name}</p>
              <div className="flex items-center gap-10">
                <p className="shrink-0 text-12 text-grey-142">
                  {bonusXp.toLocaleString("en-US")} / {next.xp.toLocaleString("en-US")} XP
                </p>
                <div className="relative h-8 w-full rounded-full bg-grey-28">
                  <div className="absolute left-0 top-0 h-8 rounded-full bg-green" style={{ width: `${fill}%` }} />
                </div>
              </div>
            </div>
            {canOpenFeatured ? (
              <div className="group/button relative flex h-40 items-center justify-center rounded-8 border-b-3 border-t-3 border-b-green-95 border-t-green-222 bg-green px-16 shadow-[0_2px_0_rgba(0,0,0,0.25)]">
                <p className="ui-btn-label text-13 text-grey-28">Open bonus case</p>
              </div>
            ) : (
              <div className="relative flex h-40 items-center justify-center rounded-6 bg-grey-28 px-16">
                <p className="text-14 text-grey-142">View contents</p>
              </div>
            )}
          </div>
        </button>
        <div className="@sm/page:grid-cols-3 @bt/page:grid-cols-4 @lg/page:grid-cols-6 grid w-full grid-cols-2 gap-12">
          {BONUS_CASES.map((c) => {
            const unlocked = bonusXp >= c.xp;
            return (
              <CaseCard
                key={c.slug}
                name={c.name}
                img={c.image!}
                hue={c.hue}
                locked={!unlocked}
                lockLabel={unlocked ? "Unlocked" : `${c.xp.toLocaleString("en-US")} XP`}
                action={unlocked ? "Open case" : "View case"}
                onOpen={() => setViewing({ slug: c.slug, canOpen: unlocked })}
              />
            );
          })}
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-16">
        <div className="grid w-full grid-cols-1 gap-6">
          <h3 className="text-16 text-white">Daily Cases</h3>
          <p className="text-14 text-grey-190">Unlock a new daily case every 10 levels. Each case can be opened once every 24 hours.</p>
        </div>
        <div className="@sm/page:grid-cols-3 @bt/page:grid-cols-4 @lg/page:grid-cols-5 grid w-full grid-cols-2 gap-12">
          {DAILY_CASES.map((c) => {
            const unlocked = level >= c.level;
            const opened = Boolean(info?.dailyOpened?.includes(c.slug));
            const canOpen = unlocked && !opened;
            return (
              <CaseCard
                key={c.slug}
                name={c.name}
                img={c.image!}
                hue={c.hue}
                locked={!canOpen}
                lockLabel={!unlocked ? `Reach level ${c.level}` : opened ? "Come back tomorrow" : "Ready to open"}
                action={canOpen ? "Open case" : "View case"}
                onOpen={() => setViewing({ slug: c.slug, canOpen })}
              />
            );
          })}
        </div>
      </div>
      {viewing ? (
        <RewardCaseModal
          slug={viewing.slug}
          canOpen={viewing.canOpen}
          onClose={() => setViewing(null)}
          onOpened={(rewards) => {
            setInfo(rewards);
            setViewing((prev) => (prev ? { ...prev, canOpen: false } : prev));
          }}
        />
      ) : null}
    </div>
  );
}
