"use client";

import { useEffect, useState } from "react";
import { Bux } from "@/components/bux";
import { Icons } from "@/components/icons";
import { ItemBg } from "@/components/item-bg";
import { LEADERBOARD } from "@/lib/catalog";
import { avatarSrc } from "@/lib/avatars";

const PRIZE_IMG: Record<number, string> = {
  1: "/img/leaderboard/prizes/ice_valkyrie.webp",
  2: "/img/leaderboard/prizes/red_bucket_of_cheer.webp",
  3: "/img/leaderboard/prizes/gold_emperor.webp",
};

const TONE = {
  1: { from: "from-gold", bg: "bg-gold", text: "text-gold", tone: "gold" as const, delay: "2s" },
  2: { from: "from-silver", bg: "bg-silver", text: "text-silver", tone: "silver" as const, delay: "4s" },
  3: { from: "from-bronze", bg: "bg-bronze", text: "text-bronze", tone: "bronze" as const, delay: "6s" },
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function PodiumCard({
  place,
  user,
  wagered,
  prize,
  item,
}: {
  place: number;
  user: string;
  wagered: number;
  prize: number;
  item: string;
}) {
  const t = TONE[place as 1 | 2 | 3];
  return (
    <div className="relative mt-36 w-full cursor-pointer duration-500 hover:translate-y-[-8px] hover:scale-[1.02] active:translate-y-[-8px] active:scale-[1.02]">
      <div className="absolute left-1/2 top-[-40px] z-[0] -translate-x-1/2">
        <Icons.podium className={t.text} style={{ width: "1em", height: "1em", fontSize: 54 }} />
      </div>
      <div className="relative w-full overflow-hidden rounded-16 bg-grey-39 p-2">
        <div
          className={`absolute left-1/2 top-1/2 w-[130%] -translate-x-1/2 -translate-y-1/2 animate-leaderboard bg-gradient-to-b to-transparent pt-[130%] ${t.from} min-[1240px]:w-[200%] min-[1240px]:pt-[200%]`}
          style={{ animationDelay: t.delay }}
        />
        <div className="relative grid w-full grid-cols-1 rounded-[15px] bg-grey-34 p-2">
          <div className={`absolute -top-1/4 left-1/4 h-1/2 w-1/2 opacity-20 blur-[60px] ${t.bg}`} />
          <div className="relative grid w-full grid-cols-1 gap-16 p-24">
            <div className="flex w-full justify-center">
              <div className="h-80 w-80">
                <div className="relative flex w-full items-center justify-center rounded-full" style={{ width: 80, height: 80 }}>
                  <div
                    className="absolute inset-0 left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-grey-58"
                    style={{ width: 80, height: 80 }}
                  >
                    <Icons.user className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-show text-grey-142" style={{ width: 40, height: 40 }} />
                  </div>
                  <img alt="" className="relative rounded-full object-cover opacity-100" src={avatarSrc(undefined, user)} style={{ width: 80, height: 80 }} />
                </div>
              </div>
            </div>
            <div className="grid w-full grid-cols-1 gap-12">
              <p className="truncate text-center text-16 text-white">{user}</p>
              <div className="flex w-full justify-center">
                <div className="flex h-36 items-center rounded-8 bg-grey-58 px-12">
                  <p className="mr-6 text-14 text-grey-190">Wagered</p>
                  <Bux value={wagered} tone={t.tone} />
                </div>
              </div>
            </div>
          </div>
          <div className="relative grid w-full overflow-hidden p-16">
            <div className={`absolute -top-1/4 left-1/4 h-1/2 w-1/2 opacity-30 blur-[40px] ${t.bg}`} />
            <div className="relative grid w-full grid-cols-[auto_1fr] items-center gap-12">
              <div className="relative h-80 w-80">
                <div className={`absolute left-1/4 top-1/4 h-1/2 w-1/2 rounded opacity-80 blur-[40px] ${t.bg}`} />
                <ItemBg className="inset-6 h-68 w-68 animate-floaty opacity-60" />
                <img alt="" className="relative h-[80px] w-full animate-floaty object-contain" src={PRIZE_IMG[place]} />
              </div>
              <div className="grid w-full grid-cols-1 gap-8">
                <p className="text-14 text-white">{item}</p>
                <div className="flex w-full">
                  <div className="relative flex h-32 items-center rounded-8 px-10">
                    <div className={`absolute inset-0 rounded-8 opacity-10 ${t.bg}`} />
                    <div className="relative">
                      <Bux value={prize} tone={t.tone} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [remain, setRemain] = useState(2 * 3600 + 22 * 60 + 12);
  useEffect(() => {
    const t = setInterval(() => setRemain((n) => (n > 0 ? n - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const d = Math.floor(remain / 86400);
  const h = Math.floor((remain % 86400) / 3600);
  const m = Math.floor((remain % 3600) / 60);
  const s = remain % 60;
  const clock = `${pad(d)}:${pad(h)}:${pad(m)}:${pad(s)}`;

  const first = LEADERBOARD[0];
  const second = LEADERBOARD[1];
  const third = LEADERBOARD[2];
  const rest = LEADERBOARD.slice(3);

  return (
    <div className="relative w-full">
      <div className="@lg/page:-inset-32 @sm/page:-inset-20 @md/page:-inset-32 absolute -inset-16">
        <div className="absolute -top-1/3 left-1/3 h-1/3 w-1/3 rounded-full bg-green opacity-60 blur-[100px]" />
        <img
          alt=""
          className="absolute left-1/2 top-0 w-full min-w-[600px] max-w-[300%] -translate-x-1/2 mix-blend-luminosity"
          src="/img/leaderboard/banner_leaderboard.webp"
        />
        <img alt="" className="absolute left-1/2 top-0 w-full min-w-[1000px] -translate-x-1/2 animate-float2" src="/img/leaderboard/trophies_left.webp" />
        <img alt="" className="absolute left-1/2 top-0 w-full min-w-[1000px] -translate-x-1/2 animate-float" src="/img/leaderboard/trophies_right.webp" />
      </div>

      <div className="flex w-full justify-center">
        <div className="@sm/page:p-20 relative grid w-full max-w-screen-lg grid-cols-1 gap-50 pt-12">
          <div className="flex w-full justify-center">
            <div className="@sm/page:gap-32 @xs/page:w-[500px] grid w-full grid-cols-1 gap-16">
              <div className="relative h-60 w-full">
                <img alt="" className="absolute -left-24 top-1/2 w-full -translate-y-1/2" src="/img/leaderboard/prize_leaderboard.webp" />
              </div>
              <div className="flex w-full justify-center">
                <div className="relative">
                  <div className="absolute -left-10 top-1/2 h-2 w-60 -translate-x-full -translate-y-1/2 bg-gradient-to-r from-transparent to-green" />
                  <div className="absolute -right-10 top-1/2 h-2 w-60 -translate-y-1/2 translate-x-full bg-gradient-to-l from-transparent to-green" />
                  <p className="@lg/page:text-42 @md/page:text-32 relative text-24 font-black text-white">LEADERBOARD</p>
                </div>
              </div>
              <div className="flex w-full justify-center">
                <button type="button" className="flex h-44 items-center rounded-8 bg-grey-58 px-16">
                  <p className="text-16 text-grey-190">
                    Ends in <span className="text-16 text-white">{clock}</span>
                  </p>
                </button>
              </div>
            </div>
          </div>

          <div className="flex w-full justify-center">
            <div className="@md/page:mt-20 grid w-full max-w-screen-bt grid-cols-1 gap-50">
              <div className="@bt/page:grid-cols-3 @bt/page:gap-32 grid w-full grid-cols-1 gap-20">
                <div className="@bt/page:col-start-2 @bt/page:-mt-30 col-start-1 row-start-1">
                  <PodiumCard {...first} />
                </div>
                <div className="@bt/page:col-start-1 @bt/page:row-start-1 col-start-1 row-start-2">
                  <PodiumCard {...second} />
                </div>
                <div className="@bt/page:col-start-3 @bt/page:row-start-1 col-start-1 row-start-3">
                  <PodiumCard {...third} />
                </div>
              </div>

              <div className="scrollbar @sm/page:rounded-4 w-full overflow-x-auto pb-10" style={{ scrollbarWidth: "thin" }}>
                <div className="grid w-full grid-cols-1 items-start gap-6" style={{ minWidth: 530 }}>
                  <div className="@sm/page:rounded-4 relative flex h-18 w-full items-center justify-between px-12">
                    <p className="mr-20 text-12 text-grey-142" style={{ width: 60 }}>
                      Place
                    </p>
                    <p className="mr-20 text-12 text-grey-142" style={{ width: 180 }}>
                      User
                    </p>
                    <p className="mr-20 text-12 text-grey-142" style={{ width: 100 }}>
                      Wagered
                    </p>
                    <p className="text-right text-12 text-grey-142" style={{ width: 100 }}>
                      Prize
                    </p>
                  </div>
                  {rest.map((row) => (
                    <div key={row.place} className="panel-outline relative mt-6 w-full rounded-8 bg-grey-39">
                      <div className="hover:bg-grey-70/50 active:bg-grey-70/50 @sm/page:rounded-8 w-full transition-colors duration-200">
                        <div className="relative flex min-h-[40px] w-full items-center justify-between gap-y-6 rounded-4 px-12 py-10">
                          <p className="mr-20 w-full text-14 text-grey-190" style={{ width: 60 }}>
                            #{row.place}
                          </p>
                          <div className="mr-20 grid grid-cols-[auto_1fr] items-center gap-8" style={{ width: 180 }}>
                            <img alt="" className="h-32 w-32 rounded-full object-cover" src={avatarSrc(undefined, row.user)} />
                            <p className="truncate text-left text-14 text-white">{row.user}</p>
                          </div>
                          <div className="mr-20 flex justify-start" style={{ width: 100 }}>
                            <Bux value={row.wagered} />
                          </div>
                          <div className="flex justify-end" style={{ width: 100 }}>
                            <Bux value={row.prize} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
