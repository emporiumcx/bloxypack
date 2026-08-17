"use client";

import { useState } from "react";
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

function MultiBadge({ multi }: { multi: number }) {
  const win = multi >= 1;
  const whole = Math.floor(multi);
  const frac = (multi - whole).toFixed(2).slice(2);
  return (
    <div className={`@sm/page:h-36 @sm/page:px-12 flex h-28 items-center rounded-4 px-6 ${win ? "bg-green/20" : "bg-red-dark/20"}`}>
      <p className="flex items-end text-14 text-grey-190">
        x{whole}.<span className="text-14">{frac}</span>
      </p>
    </div>
  );
}

export function BetsTable() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All Bets");
  const rows =
    tab === "Lucky Wins" ? ALL.filter((r) => r.multi >= 2) : tab === "High Rollers" ? [...ALL].sort((a, b) => b.bet - a.bet) : ALL;

  return (
    <div className="@sm/page:gap-24 relative grid w-full grid-cols-1 gap-12">
      <div className="@sm/page:pt-0 flex w-full pt-24">
        <div className="grid grid-cols-1">
          <div className="relative flex w-full justify-start">
            <button type="button" className="group flex h-40 w-full items-start rounded-5 bg-grey-28 hidden" aria-label="toggle">
              <div className="tr grid h-full w-full grid-cols-[1fr_auto] items-center gap-6 rounded-5 bg-grey-39 px-14">
                <div className="flex items-center justify-start gap-6">
                  <p className="text-14 font-bold capitalize text-white transition-colors duration-200">{tab}</p>
                </div>
                <Icons.chevron className="tr transform text-18 text-white" />
              </div>
            </button>
            <div
              className="relative grid w-full min-w-[120px] items-center justify-start overflow-hidden rounded-6 bg-transparent p-0 transition-colors duration-200"
              style={{ gridTemplateColumns: "repeat(3, auto)" }}
            >
              {TABS.map((t) => (
                <div key={t} className="@lg/page:w-auto group grid h-36 w-full grid-cols-1 overflow-hidden bg-grey-28">
                  <button
                    type="button"
                    aria-label="toggle"
                    onClick={() => setTab(t)}
                    className={`tr @lg/page:justify-center @lg/page:gap-8 relative flex h-full w-full items-center justify-start gap-6 px-12 transition-colors ${
                      tab === t ? "bg-grey-58" : "group-active:bg-grey-58"
                    }`}
                  >
                    {tab === t ? (
                      <div className="absolute inset-0 right-1/2 hidden animate-show bg-gradient-to-r from-green/10 to-transparent" />
                    ) : null}
                    <p
                      className={`w-full truncate overflow-ellipsis text-center text-13 font-bold uppercase tracking-[0.06em] transition-colors duration-200 ${
                        tab === t ? "text-white" : "text-grey-142 group-hover:text-white group-active:text-white"
                      }`}
                    >
                      {t}
                    </p>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="scrollbar @sm/page:rounded-4 w-full overflow-x-auto pb-10">
        <div className="grid w-full grid-cols-1 items-start gap-6" style={{ minWidth: 780 }}>
          <div className="@sm/page:rounded-4 relative hidden h-18 w-full items-center justify-between px-12 @sm/page:flex">
            <button className="mr-20 flex items-center" aria-label="column" style={{ width: 150 }}>
              <p className="ui-label text-11 text-grey-142">Game</p>
            </button>
            <button className="mr-20 flex items-center" aria-label="column" style={{ width: 140 }}>
              <p className="ui-label text-11 text-grey-142">User</p>
            </button>
            <button className="mr-20 flex items-center" aria-label="column" style={{ width: 60 }}>
              <p className="ui-label text-11 text-grey-142">Time</p>
            </button>
            <button className="mr-20 flex items-center" aria-label="column" style={{ width: 120 }}>
              <p className="ui-label text-11 text-grey-142">Bet</p>
            </button>
            <button className="mr-20 flex items-center !justify-center" aria-label="column" style={{ width: 60 }}>
              <p className="ui-label text-11 text-grey-142">Multi</p>
            </button>
            <button className="flex items-center justify-end" aria-label="column" style={{ width: 120 }}>
              <p className="ui-label text-11 text-grey-142">Payout</p>
            </button>
          </div>
          <div className="w-full overflow-hidden" style={{ height: 310 }}>
            <div className="flex w-full flex-wrap items-start">
              {rows.map((row, i) => {
                const Icon = Icons[GAME_ICON[row.game]];
                const win = row.payout > 0;
                return (
                  <div key={`${row.user}-${row.time}-${i}`} className="relative mt-6 w-full rounded-8 bg-grey-39">
                    <div className="tr relative flex min-h-[40px] items-start">
                      <div className="tr grid min-h-[40px] w-full grid-cols-1">
                        <div className="hover:bg-grey-70/50 active:bg-grey-70/50 @sm/page:rounded-8 w-full transition-colors duration-200">
                          <div className="relative flex min-h-[40px] w-full items-center justify-between gap-y-6 rounded-4 border-transparent px-12 py-10">
                            <div className="mr-20 flex items-center" style={{ width: 150 }}>
                              <div className="absolute -top-4 left-0 text-10 text-grey-142 opacity-0">{row.id}</div>
                              <div className="bg-green-8 flex h-36 items-center rounded-4 px-12 text-grey-142">
                                <div className="flex items-center justify-center" style={{ width: 18, height: 18 }}>
                                  <Icon className="text-green" style={{ marginLeft: -1, scale: 0.9 }} />
                                </div>
                                <p className="@md/page:block ml-8 hidden text-14 text-grey-142">Playing</p>
                                <p className="ml-6 text-14 text-white">{row.game}</p>
                              </div>
                            </div>
                            <div className="mr-20 grid" style={{ width: 140 }}>
                              <button type="button" aria-label="profile" className="mr-20 grid grid-cols-[auto_1fr] items-center gap-8" style={{ width: 140 }}>
                                <div className="relative w-32">
                                  <div className="relative mr-12 flex h-32 w-full items-center justify-center">
                                    <div className="relative flex w-full items-center justify-center rounded-full" style={{ width: 32, height: 32 }}>
                                      <div
                                        className="absolute inset-0 top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-grey-58"
                                        style={{ width: 32, height: 32 }}
                                      >
                                        <Icons.person
                                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-show text-grey-142"
                                          style={{ fontSize: 16 }}
                                        />
                                      </div>
                                      {row.avatar ? (
                                        <img
                                          alt=""
                                          className="relative rounded-full object-cover opacity-100"
                                          src={avatarSrc(row.avatar, row.user)}
                                          style={{ width: 32, height: 32 }}
                                        />
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                                <p className="truncate overflow-ellipsis text-left text-14 text-white">{row.user}</p>
                              </button>
                            </div>
                            <div className="mr-20 flex items-center" style={{ width: 60 }}>
                              <p className="text-14 text-grey-190">{row.time}</p>
                            </div>
                            <div className="mr-20 flex items-center" style={{ width: 120 }}>
                              <div className="flex h-28 items-center rounded-6 bg-green/10 px-10">
                                <Bux value={row.bet} amount="green" className="text-14" />
                              </div>
                            </div>
                            <div className="mr-20 flex justify-center" style={{ width: 60 }}>
                              <MultiBadge multi={row.multi} />
                            </div>
                            <div className="flex items-center justify-end" style={{ width: 120 }}>
                              <div className={`flex h-28 items-center rounded-6 px-10 ${win ? "bg-green/10" : "bg-grey-190/10"}`}>
                                <Bux value={row.payout} tone={win ? "green" : "muted"} className="text-14" />
                              </div>
                            </div>
                          </div>
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
