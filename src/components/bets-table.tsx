"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Bux } from "./bux";
import { Icons } from "./icons";
import { avatarSrc } from "@/lib/avatars";

type BetRow = {
  id: string;
  game: "Towers" | "Blackjack" | "Mines" | "Dice" | "Cases" | "Battles";
  user: string;
  avatar: string;
  time: string;
  bet: number;
  multi: number;
  payout: number;
};

const ALL: BetRow[] = [
  { id: "e9783b7b-4f2f-4d57-a3fa-e15bd7edd4b6", game: "Mines", user: "R4ITH", avatar: "red", time: "00:19", bet: 23, multi: 0, payout: 0 },
  { id: "2d390018-79cc-4eb7-a38e-4dc5149fa7c5", game: "Blackjack", user: "Alpha_mil0", avatar: "blue", time: "00:12", bet: 32, multi: 0, payout: 0 },
  { id: "e79e29f4-fa3c-4401-898e-e733ca66301d", game: "Towers", user: "Vasky", avatar: "green", time: "22:22", bet: 2636, multi: 0, payout: 0 },
  { id: "f4da6c3e-df75-4c12-9a11-0c0c0c0c0c0c", game: "Blackjack", user: "Joris67", avatar: "orange", time: "22:08", bet: 1537, multi: 0, payout: 0 },
  { id: "f9e119bd-3cf2-4a11-8b22-111111111111", game: "Towers", user: "Vasky", avatar: "green", time: "22:05", bet: 5424, multi: 0, payout: 0 },
  { id: "af837a15-87ed-4b33-9c44-222222222222", game: "Towers", user: "Vasky", avatar: "green", time: "22:04", bet: 5424, multi: 2.02, payout: 10983 },
  { id: "a2904fc6-6659-452c-a224-c13f0a6f5d21", game: "Mines", user: "monarch", avatar: "purple", time: "21:58", bet: 250, multi: 1.48, payout: 370 },
  { id: "98f1b331-c849-43ae-af20-f1bf6a5dff03", game: "Dice", user: "voids", avatar: "pink", time: "21:51", bet: 1000, multi: 0, payout: 0 },
];

const TABS = ["All Bets", "High Rollers", "Lucky Wins"] as const;

const GAME_ICON: Record<BetRow["game"], keyof typeof Icons> = {
  Towers: "towers",
  Blackjack: "blackjack",
  Mines: "mines",
  Dice: "dice",
  Cases: "cases",
  Battles: "battles",
};

const ROW_COLS =
  "w-full min-w-0 grid-cols-[minmax(0,1.15fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.7fr)_minmax(0,0.95fr)] items-center gap-6 @xs/page:grid-cols-[minmax(0,1.2fr)_minmax(0,1.15fr)_minmax(36px,0.45fr)_minmax(0,0.95fr)_minmax(72px,0.7fr)_minmax(0,0.95fr)] @xs/page:gap-8 @sm/page:gap-12 @md/page:grid-cols-[minmax(0,150px)_minmax(0,140px)_60px_minmax(0,120px)_88px_minmax(0,120px)] @md/page:justify-between @md/page:gap-20";

function MultiBadge({ multi }: { multi: number }) {
  const win = multi >= 1;
  return (
    <div
      className={`inline-flex h-24 w-max min-w-56 shrink-0 items-center justify-center rounded-4 px-8 @sm/page:h-28 @sm/page:min-w-64 @sm/page:px-10 @md/page:h-36 ${
        win ? "bg-success/15" : "bg-red-dark/20"
      }`}
    >
      <p className={`whitespace-nowrap text-11 leading-none @sm/page:text-14 ${win ? "text-success" : "text-grey-190"}`}>
        x{multi.toFixed(2)}
      </p>
    </div>
  );
}

function BetAmount({ value, win }: { value: number; win?: boolean }) {
  const tone = win == null ? "green" : win ? "green" : "muted";
  return (
    <div className={`flex h-24 max-w-full items-center overflow-hidden rounded-6 px-6 @sm/page:h-28 @sm/page:px-10 ${win === false ? "bg-grey-190/10" : "bg-green/10"}`}>
      <Bux value={value} tone={tone} amount={win === false ? "muted" : "green"} size="xs" className="min-w-0" />
    </div>
  );
}

export function BetsTable() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All Bets");
  const barRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });
  const rows =
    tab === "Lucky Wins" ? ALL.filter((r) => r.multi >= 2) : tab === "High Rollers" ? [...ALL].sort((a, b) => b.bet - a.bet) : ALL;

  useLayoutEffect(() => {
    const bar = barRef.current;
    const el = tabRefs.current[TABS.indexOf(tab)];
    if (!bar || !el) return;

    const place = () => {
      const barBox = bar.getBoundingClientRect();
      const box = el.getBoundingClientRect();
      setPill({ left: box.left - barBox.left, width: box.width, ready: true });
    };

    place();
    const ro = new ResizeObserver(place);
    ro.observe(bar);
    window.addEventListener("resize", place);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [tab]);

  return (
    <div className="@sm/page:mt-24 @sm/page:gap-24 relative mt-16 grid w-full min-w-0 grid-cols-1 gap-12">
      <div className="flex w-full">
        <div className="relative flex w-full justify-start">
          <div ref={barRef} className="relative flex min-w-[120px] items-center justify-start rounded-6 bg-transparent">
            <div
              className={`bets-tab-pill h-36 rounded-6 bg-green-8 ring-1 ring-inset ring-green @sm/page:h-40 ${
                pill.ready ? "is-ready" : "opacity-0"
              }`}
              style={{ width: pill.width, ["--pill-x" as string]: `${pill.left}px` }}
            />
            {TABS.map((t, i) => (
              <button
                key={t}
                type="button"
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                onClick={() => setTab(t)}
                className={`group relative z-10 flex h-36 w-auto items-center justify-center rounded-6 px-12 transition-colors @sm/page:h-40 ${
                  tab === t ? "" : "hover:bg-grey-39"
                }`}
              >
                <p
                  className={`relative whitespace-nowrap text-center text-11 font-bold uppercase tracking-[0.04em] transition-colors duration-200 @sm/page:text-13 @sm/page:tracking-[0.06em] ${
                    tab === t ? "text-white" : "text-grey-142 group-hover:text-white"
                  }`}
                >
                  {t}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="@sm/page:rounded-4 w-full min-w-0">
        <div className="grid w-full min-w-0 grid-cols-1 items-start gap-6">
          <div className={`@sm/page:rounded-4 relative hidden h-18 px-8 @sm/page:grid @sm/page:px-12 ${ROW_COLS}`}>
            <p className="ui-label min-w-0 truncate text-11 text-grey-142">Game</p>
            <p className="ui-label min-w-0 truncate text-11 text-grey-142">User</p>
            <p className="ui-label hidden min-w-0 truncate text-11 text-grey-142 @xs/page:block">Time</p>
            <p className="ui-label min-w-0 truncate text-11 text-grey-142">Bet</p>
            <p className="ui-label min-w-0 truncate text-center text-11 text-grey-142">Multi</p>
            <p className="ui-label min-w-0 truncate text-right text-11 text-grey-142">Payout</p>
          </div>
          <svg width="0" height="0" className="absolute" aria-hidden>
            <defs>
              <linearGradient id="bet-icon-green" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c4ebff" />
                <stop offset="42%" stopColor="#52b5ff" />
                <stop offset="100%" stopColor="#0d5cb8" />
              </linearGradient>
            </defs>
          </svg>
          <div className="bets-fade w-full min-w-0 overflow-hidden" style={{ height: 400 }}>
            <div key={tab} className="flex w-full min-w-0 flex-col items-stretch">
              {rows.map((row, i) => {
                const Icon = Icons[GAME_ICON[row.game]];
                const win = row.payout > 0;
                return (
                  <div
                    key={`${tab}-${row.user}-${row.time}-${i}`}
                    className="animate-bets-in panel-outline relative mt-6 w-full min-w-0 rounded-8 bg-grey-39"
                    style={{ animationDelay: `${i * 45}ms` }}
                  >
                    <div className="hover:bg-grey-70/50 active:bg-grey-70/50 @sm/page:rounded-8 w-full min-w-0 transition-colors duration-200">
                      <div className={`relative grid min-h-[40px] rounded-4 border-transparent px-8 py-8 @sm/page:px-12 @sm/page:py-10 ${ROW_COLS}`}>
                        <div className="flex min-w-0 items-center">
                          <div className="bg-green-8 flex h-28 max-w-full items-center rounded-4 px-6 text-grey-142 @sm/page:h-36 @sm/page:px-12">
                            <div className="flex h-18 w-18 shrink-0 items-center justify-center">
                              <Icon style={{ marginLeft: -1, scale: 0.9, fill: "url(#bet-icon-green)" }} />
                            </div>
                            <p className="ml-6 truncate text-12 text-white @sm/page:ml-8 @sm/page:text-14">{row.game}</p>
                          </div>
                        </div>
                        <button type="button" aria-label="profile" className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-6 @sm/page:gap-8">
                          <div className="relative h-24 w-24 shrink-0 @sm/page:h-32 @sm/page:w-32">
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-grey-58">
                              <Icons.person className="text-12 text-grey-142 @sm/page:text-16" />
                            </div>
                            {row.avatar ? (
                              <img
                                alt=""
                                className="relative h-full w-full rounded-full object-cover"
                                src={avatarSrc(row.avatar, row.user)}
                              />
                            ) : null}
                          </div>
                          <p className="truncate text-left text-12 text-white @sm/page:text-14">{row.user}</p>
                        </button>
                        <p className="hidden min-w-0 truncate text-12 text-grey-190 @xs/page:block @sm/page:text-14">{row.time}</p>
                        <div className="flex min-w-0 items-center">
                          <BetAmount value={row.bet} />
                        </div>
                        <div className="flex justify-center">
                          <MultiBadge multi={row.multi} />
                        </div>
                        <div className="flex min-w-0 items-center justify-end">
                          <BetAmount value={row.payout} win={win} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
