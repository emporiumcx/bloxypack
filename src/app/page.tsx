"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BattleRow } from "@/components/battle-row";
import { BetsTable } from "@/components/bets-table";
import { Bux } from "@/components/bux";
import { GreenButton } from "@/components/green-button";
import { Icons } from "@/components/icons";
import { ItemBg } from "@/components/item-bg";
import { useStore } from "@/components/providers";
import { subscribeBattles } from "@/lib/backend";
import { mapBattleGame } from "@/lib/battles-map";
import { CASES, TICKER, type Battle } from "@/lib/catalog";
import { rankIdFromLevel, xpProgress } from "@/lib/levels";

const ORIGINALS = [
  { href: "/battles", label: "Case Battles", img: "/img/home/battles.webp", icon: Icons.battles, tag: "PvP", tagColor: "#01ffff", underline: "#01ffff" },
  { href: "/cases", label: "Case Opening", img: "/img/home/cases.webp", icon: Icons.cases, tag: "", tagColor: "#4a83ff", underline: "#4a83ff" },
  { href: "/blackjack", label: "Blackjack", img: "/img/home/blackjack.webp", icon: Icons.blackjack, tag: "new", tagColor: "#f5c487", underline: "#f5c487" },
  { href: "/mines", label: "Hidden Mines", img: "/img/home/mines.webp", icon: Icons.mines, tag: "", tagColor: "#ff969f", underline: "#ff969f" },
  { href: "/towers", label: "Towers", img: "/img/home/towers.webp", icon: Icons.towers, tag: "", tagColor: "#f5c487", underline: "#f5c487" },
  { href: "/dice", label: "Dice", img: "/img/home/dice.webp", icon: Icons.dice, tag: "", tagColor: "#ffeb69", underline: "#ffeb69" },
  { href: "/roulette", label: "Roulette", img: "/img/home/roulette.webp", icon: Icons.roulette, tag: "new", tagColor: "#ffeb69", underline: "#ffeb69" },
  { href: "/crash", label: "Crash", img: "/img/home/crash.webp", icon: Icons.crash, tag: "new", tagColor: "#ff969f", underline: "#ff969f", soon: true },
];

const REWARDS = [
  { title: "Claim Faucet", body: "Claim free coins every 20 minutes", href: "/rewards" },
  { title: "Coin Rain Events", body: "Random coin giveaways in chat", href: "/rewards" },
  { title: "Constant Giveaways", body: "Free code drops and giveaways on our socials", href: "/rewards" },
  { title: "Affiliate Earnings", body: "Invite users and get rewarded", href: "/affiliate" },
  { title: "Leaderboard", body: "Climb the ranks for weekly prizes", href: "/leaderboard" },
];

function tickerName(name: string) {
  const parts = name.split(" ");
  if (parts.length < 3) return name.length <= 22 ? name : `${name.slice(0, 21)}...`;
  return name.length <= 22 ? name : `${name.slice(0, 21)}...`;
}

export default function HomePage() {
  const { openModal, user } = useStore();
  const xpPct = user ? xpProgress(user.xp) : 0;
  const featured = CASES.slice(0, 8);
  const [payoutTab, setPayoutTab] = useState<"hour" | "day" | "week">("hour");
  const [live, setLive] = useState<Battle[]>([]);

  useEffect(() => {
    return subscribeBattles((state) => {
      setLive(state.games.map(mapBattleGame).filter((b) => b.status === "active"));
    });
  }, []);

  const homeBattles = live.slice(0, 4);

  return (
    <div className="grid w-full grid-cols-1 gap-56">
      {user ? (
        <div className="relative grid w-full grid-cols-[auto_1fr] items-center gap-12 overflow-hidden rounded-10 border-1 border-grey-58 bg-grey-39 p-12">
          <div className="pointer-events-none absolute inset-0 bg-hex-net opacity-40" />
          <img alt="" className="relative h-52 w-52 rounded-full object-cover" src="/cdn/avatars/default.webp" />
          <div className="relative grid w-full grid-cols-1 gap-8">
            <p className="text-20 font-extrabold text-grey-190">
              Welcome back, <span className="text-20 font-extrabold text-cream">{user.username}</span>
            </p>
            <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-14">
              <img alt="" src={`/img/rank/${rankIdFromLevel(user.level)}.svg`} className="h-24" />
              <div className="relative h-8 w-full rounded-full bg-grey-28">
                <div className="absolute left-0 top-0 h-8 rounded-full bg-green" style={{ width: `${xpPct}%` }} />
              </div>
              <p className="text-12 text-grey-142">{xpPct}% XP</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex w-full items-center gap-10">
        <div className="hidden h-86 shrink-0 grid-cols-1 gap-6 sm:grid">
          <div className="flex h-40 w-40 items-center justify-center rounded-8 bg-grey-39 text-grey-142">
            <Icons.cases style={{ marginLeft: 0, scale: 1 }} />
          </div>
          <div className="flex h-40 w-40 items-center justify-center rounded-8 bg-grey-39 text-grey-142">
            <Icons.trophy style={{ marginLeft: 0, scale: 1 }} />
          </div>
        </div>
        <div className="relative min-w-0 flex-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <div className="flex w-max">
            {TICKER.map((item, i) => (
              <div key={`${item.id}-${i}`} className="group relative mr-8 h-86 w-92">
                <div className="relative grid h-full w-full grid-cols-1 overflow-hidden rounded-8 bg-grey-39">
                  <div className="absolute left-0 right-0 top-0 h-3" style={{ background: item.glow }} />
                  <div className="relative flex h-full items-center justify-center p-6">
                    <ItemBg className="inset-0 h-full w-full opacity-35" />
                    <div
                      className="absolute inset-10 scale-100 blur-[22px] transition-transform group-hover:scale-150"
                      style={{ background: item.glow }}
                    />
                    <img
                      alt=""
                      className="relative h-44 w-44 object-contain transition-transform group-hover:-translate-y-2 group-hover:scale-125"
                      src={`https://cdn.rostake.com/items_centered/${item.id}.webp`}
                      onError={(e) => {
                        e.currentTarget.src = `/cdn/items/${item.id}.webp`;
                      }}
                    />
                  </div>
                  <div className="relative grid gap-0 px-6 pb-6">
                    <p className="truncate text-center text-10 leading-3 text-grey-190">{tickerName(item.name)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-12 border-1 border-grey-58 bg-grey-39">
        <div className="pointer-events-none absolute inset-0 bg-theme-net opacity-80" />
        <div className="pointer-events-none absolute inset-0 bg-scratches opacity-40" />
        <div className="@lg/page:grid-cols-[1.35fr_0.65fr] relative grid grid-cols-1 items-stretch">
          <div className="relative min-h-[280px] overflow-hidden p-20 sm:p-28">
            <img
              alt=""
              src="/img/landscape.webp"
              className="pointer-events-none absolute right-0 top-0 h-full w-[58%] object-cover object-center opacity-45"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-grey-39 via-grey-39/80 to-transparent" />
            <div className="relative grid max-w-[520px] gap-16">
              <h1 className="font-display text-42 uppercase leading-[0.88] text-cream sm:text-56">
                open cases
                <br />
                & win real skins
              </h1>
              <p className="flex items-center gap-8 text-13 text-grey-190">
                <Icons.person className="text-16 text-grey-142" />
                Players are opening cases right now
              </p>
              <div className="flex flex-wrap items-center gap-10">
                {user ? (
                  <GreenButton href="/cases">Open Cases</GreenButton>
                ) : (
                  <GreenButton onClick={() => openModal("register")}>Register</GreenButton>
                )}
                <div className="flex items-center gap-6">
                  <AuthIcon onClick={() => openModal(user ? "deposit" : "login")}>
                    <Icons.google className="text-16" />
                  </AuthIcon>
                  <AuthIcon onClick={() => openModal(user ? "deposit" : "login")}>
                    <Icons.discord className="text-16" />
                  </AuthIcon>
                </div>
              </div>
            </div>
          </div>
          <div className="relative grid gap-10 border-t-1 border-grey-58 p-16 @lg/page:border-l-1 @lg/page:border-t-0">
            <div className="relative overflow-hidden rounded-10 bg-grey-28 p-16">
              <div className="pointer-events-none absolute inset-0 bg-hex-net opacity-30" />
              <p className="relative font-display text-48 leading-none text-green">0.0</p>
              <p className="relative mt-6 text-12 font-extrabold uppercase tracking-[0.16em] text-grey-142">highest bet payout</p>
              <div className="relative mt-16 grid grid-cols-3 gap-6">
                {(["hour", "day", "week"] as const).map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setPayoutTab(label)}
                    className={`rounded-6 px-8 py-8 text-center text-12 font-extrabold uppercase ${
                      payoutTab === label ? "bg-green/20 text-green" : "bg-grey-39 text-grey-142"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="relative mt-16 text-13 text-grey-142">No wins this {payoutTab}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="grid gap-16">
        <h2 className="font-display text-32 uppercase text-cream">Games</h2>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-8">
          {ORIGINALS.map((g) => (
            <Link
              key={g.label}
              href={g.soon ? "#" : g.href}
              className={`group relative flex h-[264px] flex-col overflow-hidden rounded-10 bg-grey-47 ${
                g.soon ? "pointer-events-none opacity-40" : ""
              }`}
            >
              <div className="pointer-events-none absolute inset-0 bg-hex-net opacity-50" />
              <div className="pointer-events-none absolute inset-0 bg-scratches opacity-30" />
              {g.tag ? (
                <span
                  className="relative z-10 ml-auto mr-8 mt-8 rounded-4 px-6 py-2 text-10 font-extrabold uppercase"
                  style={{ color: g.tagColor, background: `${g.tagColor}22` }}
                >
                  {g.tag}
                </span>
              ) : (
                <span className="mt-8 h-20" />
              )}
              <div className="relative z-10 flex flex-1 items-center justify-center">
                <div
                  className="absolute h-90 w-90 rounded-full blur-[36px] opacity-50 transition-opacity group-hover:opacity-80"
                  style={{ background: g.underline }}
                />
                <div className="relative text-cream" style={{ fontSize: 72 }}>
                  <g.icon style={{ marginLeft: 0, scale: 3.2 }} />
                </div>
              </div>
              <div className="relative z-10 mt-auto px-10 pb-12">
                <p className="font-display text-22 uppercase leading-none text-cream">{g.label}</p>
                <div className="mt-8 h-3 w-full rounded-full" style={{ background: g.underline }} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Icons.battles className="text-22 text-cream" />
            <h2 className="font-display text-32 uppercase text-cream">Battles</h2>
          </div>
          <Link href="/battles" className="text-13 font-extrabold uppercase tracking-wide text-green">
            View All
          </Link>
        </div>
        <div className="grid gap-8">
          {homeBattles.length === 0 ? (
            <div className="rounded-12 bg-grey-39 px-16 py-20 text-center text-14 text-grey-142">
              No live battles yet. Create one to get started.
            </div>
          ) : (
            homeBattles.map((b) => <BattleRow key={b.id} battle={b} compact />)
          )}
        </div>
      </section>

      <section className="grid gap-16">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-32 uppercase text-cream">New Cases</h2>
          <Link href="/cases" className="text-13 font-extrabold uppercase tracking-wide text-green">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-8">
          {featured.map((item) => (
            <Link key={item.slug} href={`/cases/${item.slug}`} className="group relative overflow-hidden rounded-10 bg-grey-39 p-12">
              <span className="absolute right-8 top-8 z-10 rounded-4 bg-[#4a83ff22] px-6 py-2 text-10 font-extrabold uppercase text-[#4a83ff]">
                new
              </span>
              <ItemBg className="inset-0 h-full w-full opacity-30" />
              <div className="relative flex aspect-square items-center justify-center">
                <img
                  alt=""
                  src={`/cdn/cases/${item.imageId}.webp`}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[5deg]"
                />
              </div>
              <p className="relative mt-8 truncate text-center text-13 text-grey-190">{item.name}</p>
              <div className="relative mt-6 flex justify-center">
                <Bux value={item.price} size="sm" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-10 sm:grid-cols-2 xl:grid-cols-5">
        {REWARDS.map((r) => (
          <Link key={r.title} href={r.href} className="relative overflow-hidden rounded-10 border-1 border-grey-58 bg-grey-39 p-16">
            <div className="pointer-events-none absolute inset-0 bg-hex-net opacity-30" />
            <p className="relative font-display text-22 uppercase leading-none text-cream">{r.title}</p>
            <p className="relative mt-8 text-13 text-grey-142">{r.body}</p>
          </Link>
        ))}
      </section>

      <BetsTable />
    </div>
  );
}

function AuthIcon({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-40 w-40 items-center justify-center rounded-8 border-1 border-grey-70 bg-grey-58 text-cream"
    >
      {children}
    </button>
  );
}
