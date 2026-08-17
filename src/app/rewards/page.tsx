"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GreenButton } from "@/components/green-button";
import { Icons } from "@/components/icons";

const RAKEBACK = [
  { name: "Daily Rakeback", kind: "daily" as const, img: "/img/rewards/rakeback/daily_rakeback_fixed.svg" },
  { name: "Weekly Rakeback", kind: "weekly" as const, img: "/img/rewards/rakeback/weekly_rakeback.svg" },
  { name: "Monthly Rakeback", kind: "monthly" as const, img: "/img/rewards/rakeback/monthly_rakeback.svg" },
];

const RANK_CASES = [
  { name: "Bronze", img: "/img/rewards/1.webp", rank: 4, slug: "bronze-case" },
  { name: "Silver", img: "/img/rewards/2.webp", rank: 7, slug: "silver-case" },
  { name: "Gold", img: "/img/rewards/3.webp", rank: 12, slug: "gold-case" },
  { name: "Platinum", img: "/img/rewards/4.webp", rank: 17, slug: "platinum-case" },
  { name: "Diamond", img: "/img/rewards/5.webp", rank: 22, slug: "diamond-case" },
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

export default function RewardsPage() {
  const router = useRouter();

  return (
    <div className="@md/page:gap-32 @md/page:py-10 grid w-full grid-cols-1 gap-24">
      <div className="grid w-full grid-cols-[1fr_auto] items-center gap-16">
        <div className="grid w-full grid-cols-[auto_1fr] items-center gap-12">
          <img alt="" className="-mt-16 w-24" src="/img/rewards/gift.svg" />
          <h2 className="@sm/page:text-24 text-18 text-white">Rewards</h2>
        </div>
        <div className="relative h-30 w-[220px]">
          <img alt="" className="absolute -bottom-32 right-0 w-full" src="/img/rewards/cases.webp" />
        </div>
      </div>
      <div className="w-full border-b-1 border-grey-47" />

      <div className="grid w-full grid-cols-1 gap-16">
        <h3 className="text-16 text-white">Rakeback</h3>
        <div className="@md/page:grid-cols-3 grid w-full grid-cols-1 gap-12">
          {RAKEBACK.map((r) => (
            <div
              key={r.name}
              className="group relative w-full overflow-hidden rounded-12 border-2 border-[#2F353D] bg-grey-39 transition-transform duration-300 ease-out"
            >
              <div className="relative flex w-full items-center gap-16 p-8">
                <div className="relative flex items-center justify-center pl-9">
                  <img alt="" className="h-auto w-full object-contain grayscale transition-all duration-300" src={r.img} />
                </div>
                <div className="flex flex-1 flex-col gap-8">
                  <h4 className="text-balance text-14 text-white">{r.name}</h4>
                  <div className="flex w-full">
                    <button
                      className="group/button relative flex h-40 cursor-pointer items-start justify-center rounded-6 bg-grey-28 opacity-100 transition-all duration-200"
                      aria-label="button"
                      type="button"
                    >
                      <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-16">
                        <RakebackTimer kind={r.kind} />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative w-full rounded-12 bg-grey-39 p-1">
        <div className="from-green/10 absolute inset-0 rounded-12 bg-gradient-to-r to-green" />
        <div className="relative w-full rounded-11 bg-grey-39">
          <div className="from-green/10 absolute inset-0 rounded-11 bg-gradient-to-r to-transparent" />
          <div className="grid w-full grid-cols-1 items-center gap-1 p-20 sm:grid-cols-[auto_1fr_auto] sm:gap-0">
            <div className="relative hidden w-140 sm:block" />
            <div className="grid w-full grid-cols-1 gap-4">
              <p className="text-16 text-white">Rank Cases</p>
              <p className="text-14 text-grey-190">You can open your rank cases on your own or open them in a battle</p>
            </div>
            <GreenButton icon={<Icons.battles />} onClick={() => router.push("/battles")}>
              Open in battle
            </GreenButton>
          </div>
        </div>
        <div className="absolute bottom-0 left-10 hidden h-80 w-[150px] max-w-[200px] sm:block">
          <img alt="" className="h-full w-full object-contain" src="/img/rewards/battles.webp" />
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-16">
        <h3 className="text-16 text-white">Available Cases</h3>
        <div className="@sm/page:grid-cols-3 @bt/page:grid-cols-4 @lg/page:grid-cols-5 grid w-full grid-cols-2 gap-12">
          {RANK_CASES.map((rank) => (
            <div
              key={rank.name}
              className="group relative w-full overflow-hidden rounded-12 border-2 border-[#2F353D] bg-grey-39 transition-transform duration-300 ease-out hover:scale-[1.01]"
            >
              <div className="relative grid w-full grid-cols-1 gap-12 p-16">
                <div className="relative flex w-full justify-center transition-all duration-300">
                  <img alt="" className="object-contain opacity-25 blur-[4px] transition-all duration-300" src={rank.img} />
                  <Icons.lock className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-32 text-grey-190" />
                </div>
                <div className="grid w-full grid-cols-1 gap-4">
                  <div className="flex w-full justify-center">
                    <div className="flex items-center">
                      <p className="text-center text-14 text-grey-190">Reach </p>
                      <img alt="" className="mx-4 h-18 w-18" src={`/img/rank/${rank.rank}.svg`} />
                      <p className="text-center text-14 text-grey-190">to unlock</p>
                    </div>
                  </div>
                  <h4 className="text-center text-16 text-white">{rank.name}</h4>
                </div>
                <div className="flex w-full justify-center">
                  <Link
                    href={`/cases/${rank.slug}`}
                    aria-label="link"
                    className="group/button relative flex h-40 items-center justify-center rounded-6 bg-grey-28 opacity-100 transition-all duration-200"
                  >
                    <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-6 @sm/page:px-10">
                      <p className="transition-all duration-300 text-14 text-grey-142">No Keys</p>
                    </div>
                  </Link>
                </div>
              </div>
              <div className="absolute top-10 right-10 rounded-6 bg-grey-39">
                <div className="flex h-32 items-center rounded-6 bg-grey-58 px-10">
                  <p className="text-16 text-grey-190">x0</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
