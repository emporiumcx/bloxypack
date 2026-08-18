"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BetsTable } from "@/components/bets-table";
import { Bux } from "@/components/bux";
import { GreenButton } from "@/components/green-button";
import { Icons } from "@/components/icons";
import { useStore } from "@/components/providers";
import { ItemBg } from "@/components/item-bg";
import { TICKER } from "@/lib/catalog";
import { RainBanner } from "@/components/rain-banner";
import { UserAvatar } from "@/components/user-avatar";
import { rankIdFromLevel, xpProgress } from "@/lib/levels";

const ORIGINALS: { href: string; label: string; img: string; icon: typeof Icons.battles; scale: number; soon?: boolean }[] = [
  { href: "/battles", label: "Battles", img: "/img/home/battles.webp", icon: Icons.battles, scale: 3.5 },
  { href: "/cases", label: "Cases", img: "/img/home/cases.webp", icon: Icons.cases, scale: 3.5 },
  { href: "/mines", label: "Mines", img: "/img/home/mines.webp", icon: Icons.mines, scale: 3.5 },
  { href: "/towers", label: "Towers", img: "/img/home/towers.webp", icon: Icons.towers, scale: 3.5 },
  { href: "/dice", label: "Dice", img: "/img/home/dice.webp", icon: Icons.dice, scale: 3.5 },
  { href: "/blackjack", label: "Blackjack", img: "/img/home/blackjack.webp", icon: Icons.blackjack, scale: 3.5 },
  { href: "/roulette", label: "Roulette", img: "/img/home/roulette.webp", icon: Icons.roulette, scale: 3.5 },
  { href: "/crash", label: "Crash", img: "/img/home/crash.webp", icon: Icons.crash, scale: 0.538462, soon: true },
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function TiltBanner({ href, src, external }: { href: string; src: string; external?: boolean }) {
  const ref = useRef<HTMLImageElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - el.left) / el.width - 0.5;
    const y = (e.clientY - el.top) / el.height - 0.5;
    if (ref.current) {
      ref.current.style.transform = `rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 10).toFixed(2)}deg) translateZ(0px)`;
    }
  };

  const inner = (
    <div
      className="group relative select-none [perspective:600px]"
      role="img"
      onMouseMove={onMove}
      onMouseLeave={() => {
        if (ref.current) ref.current.style.transform = "rotateX(0deg) rotateY(0deg) translateZ(0px)";
      }}
    >
      <img
        ref={ref}
        className="block h-full w-full rounded-2xl object-cover shadow-xl transition-transform duration-150 ease-out will-change-transform [transform-style:preserve-3d] group-hover:scale-[1.03]"
        alt=""
        draggable={false}
        src={src}
        style={{ transform: "rotateX(0deg) rotateY(0deg) translateZ(0px)" }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-60 mix-blend-screen transition-opacity duration-300"
        style={{ background: "radial-gradient(circle, rgba(255, 255, 255, 0.25), transparent 60%)" }}
      />
    </div>
  );

  if (external) {
    return (
      <a className="opacity-90 transition-opacity hover:opacity-100 active:opacity-100" target="_blank" rel="noreferrer" href={href}>
        {inner}
      </a>
    );
  }
  return (
    <Link className="opacity-90 transition-opacity hover:opacity-100 active:opacity-100" href={href}>
      {inner}
    </Link>
  );
}

function tickerName(name: string) {
  if (name.length <= 25) return name;
  return `${name.slice(0, 24)}...`;
}

export default function HomePage() {
  const { openModal, user, rain } = useStore();
  const xpPct = user ? xpProgress(user.xp) : 0;
  const scroller = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const [now, setNow] = useState(Date.now());

  function updateArrows() {
    const el = scroller.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    return () => el.removeEventListener("scroll", updateArrows);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remain = Math.max(0, rain.endsAt - now);
  const mm = pad(Math.floor(remain / 60000));
  const ss = pad(Math.floor((remain % 60000) / 1000));

  return (
    <div className="flex w-full justify-center">
    <div className="@sm/page:gap-24 @md/page:gap-32 grid w-full max-w-screen-xl grid-cols-1 gap-16">
      {user ? (
        <div className="grid w-full grid-cols-[auto_1fr] items-center gap-12 rounded-8 bg-grey-34 p-12">
          <UserAvatar avatar={user.avatar} seed={user.id || user.username} size={52} />
          <div className="grid w-full grid-cols-[1fr_auto] items-end gap-12">
            <div className="grid w-full grid-cols-1 gap-8">
              <p className="text-20 font-bold text-grey-190">
                Welcome back, <span className="text-20 font-bold text-white">{user.username}</span>
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
        </div>
      ) : null}
      <div className="w-full">
        <div className="relative w-full">
          <div className="relative w-full overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <div className="flex w-max pt-16">
              {TICKER.map((item, i) => (
                <div key={`${item.id}-${i}`} className="group relative mr-12 h-64">
                  <div className="group grid h-full grid-cols-[auto_auto] items-center overflow-hidden rounded-8 bg-grey-39 p-8 pr-12">
                    <div className="relative mr-8 flex h-48 w-48 items-center justify-center">
                      <div
                        className="absolute inset-10 scale-100 blur-[34px] transition-transform group-hover:scale-150 group-active:scale-150"
                        style={{ background: item.glow }}
                      />
                      <ItemBg className="inset-0 h-full w-full opacity-50" />
                      <img
                        alt=""
                        className="relative h-full w-full scale-100 object-contain transition-transform group-hover:-translate-y-2 group-hover:scale-125 group-active:-translate-y-2 group-active:scale-125"
                        src={`https://cdn.rostake.com/items_centered/${item.id}.webp`}
                        onError={(e) => {
                          e.currentTarget.src = `/cdn/items/${item.id}.webp`;
                        }}
                      />
                    </div>
                    <div className="relative grid w-max grid-cols-1 gap-4">
                      <p className="text-12 text-grey-190">{tickerName(item.name)}</p>
                      <div className="flex">
                        <Bux value={item.value} size="sm" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <RainBanner
        minutes={mm}
        seconds={ss}
        amount={rain.amount}
        onJoin={() => openModal(user ? "rain" : "login")}
      />

      <div className="@sm/page:grid-cols-2 @xl/page:grid-cols-3 grid w-full grid-cols-1 gap-12">
        <div className="relative aspect-[7.11/4]">
          <TiltBanner href="/leaderboard" src="/img/banners/lb.webp" />
        </div>
        <div className="relative aspect-[7.11/4]">
          <TiltBanner href="https://discord.gg/rostake" src="/img/banners/discord_3.webp" external />
        </div>
        <div className="@xl/page:block relative hidden aspect-[7.11/4]">
          <TiltBanner href="https://kick.com/rostakedotcom" src="/img/banners/kick.webp" external />
        </div>
      </div>

      <div className="@sm/page:gap-20 @sm/page:py-0 grid w-full grid-cols-1 gap-12 py-24">
        <div className="grid w-full grid-cols-[1fr_auto] items-center gap-10">
          <h2 className="@sm/page:text-20 text-16 text-white">WildPVP Originals</h2>
          <div className="grid w-full grid-cols-2 gap-8">
            <button
              type="button"
              disabled={!canLeft}
              onClick={() => scroller.current?.scrollBy({ left: -220, behavior: "smooth" })}
              className={`flex h-32 w-48 items-center justify-center rounded-6 bg-grey-58 ${canLeft ? "" : "opacity-40"}`}
            >
              <Icons.chevronLeft className="text-22 text-grey-142" />
            </button>
            <button
              type="button"
              disabled={!canRight}
              onClick={() => scroller.current?.scrollBy({ left: 220, behavior: "smooth" })}
              className={`flex h-32 w-48 items-center justify-center rounded-6 bg-grey-58 ${canRight ? "" : "opacity-40"}`}
            >
              <Icons.chevronRight className="text-22 text-grey-142" />
            </button>
          </div>
        </div>
        <div ref={scroller} className="flex w-full overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <div className="flex w-max min-w-full py-4">
            {ORIGINALS.map((g) => (
              <Link
                key={g.label}
                href={g.href}
                className={`duration-600 group relative mr-12 h-[240px] min-w-[190px] rounded-8 bg-grey-39 transition-all last:mr-0 ${
                  g.soon ? "cursor-default opacity-25" : ""
                }`}
              >
                <div className="absolute inset-0 overflow-hidden rounded-8">
                  <img
                    className={`duration-600 h-full w-full rounded-8 object-cover opacity-20 grayscale transition-all ease-out ${
                      g.soon ? "" : "group-hover:scale-[1.15] group-hover:opacity-100 group-hover:grayscale-60"
                    }`}
                    alt=""
                    src={g.img}
                  />
                  {!g.soon ? (
                    <>
                      <div className="duration-600 animate-pulse-slow absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-136 opacity-0 blur-[45px] transition-all group-hover:scale-[1.3] group-hover:opacity-80 group-hover:blur-[65px]" />
                      <div className="duration-600 animate-border-glow absolute inset-0 rounded-8 border-2 border-transparent bg-gradient-to-b from-transparent to-transparent opacity-0 transition-all group-hover:border-green group-hover:bg-gradient-to-b group-hover:from-transparent group-hover:to-green/40 group-hover:opacity-60" />
                      <div className="duration-600 absolute inset-0 overflow-hidden rounded-8 opacity-0 transition-opacity group-hover:opacity-20">
                        <div className="animate-light-sweep absolute left-[-50%] top-0 h-full w-[200%] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                      </div>
                    </>
                  ) : null}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="grid grid-cols-1 gap-30">
                    <div className="flex justify-center py-12">
                      <div className="relative">
                        <div className="duration-600 absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black opacity-0 blur-[25px] transition-opacity group-hover:opacity-90 group-hover:blur-[35px]" />
                        <div
                          className={`duration-600 relative flex h-80 w-80 items-center justify-center transition-all ease-[cubic-bezier(0.25,1,0.5,1)] ${
                            g.soon ? "" : "group-hover:-translate-y-[6px] group-hover:scale-[1.15]"
                          }`}
                        >
                          <div className="flex items-center justify-center" style={{ width: 70, height: 70 }}>
                            <g.icon
                              className={`transition-colors ${
                                g.soon ? "text-grey-190" : "text-grey-190 group-hover:text-white group-active:text-white"
                              }`}
                              style={{ marginLeft: 0, scale: g.scale }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="relative w-full">
                      <div className="duration-600 absolute left-1/2 top-1/2 h-12 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black opacity-0 blur-[12px] transition-opacity group-hover:opacity-90" />
                      <p
                        className={`@xl/page:text-20 relative text-center text-24 font-bold uppercase text-grey-190 duration-600 ${
                          g.soon
                            ? ""
                            : "transition-all ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:-translate-y-[6px] group-hover:scale-[1.1] group-hover:text-white"
                        }`}
                      >
                        {g.label}
                      </p>
                      {g.soon ? (
                        <p className="mt-4 text-center text-12 font-bold uppercase tracking-wide text-grey-142">Coming Soon</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <BetsTable />
      </div>

      <div className="w-full border-b-1 border-grey-47" />
      <div className="grid w-full grid-cols-[1fr_auto] items-center gap-16 py-16">
        <div className="grid w-full grid-cols-1 gap-24">
          <div className="grid w-full grid-cols-1 gap-8">
            <h2 className="@sm/page:text-20 text-16 text-white">Payment methods</h2>
            <div className="flex w-full">
              <p className="w-[500px] max-w-full text-14 text-grey-190">
                You can make payments using <span className="text-14 text-white">gift cards, credit cards</span> or{" "}
                <span className="text-14 text-white">crypto</span>. Deposit & withdraw instantly using any of our available methods.
              </p>
            </div>
          </div>
          <div className="flex">
            <GreenButton onClick={() => openModal("deposit")}>Deposit now</GreenButton>
          </div>
        </div>
        <div className="relative h-[150px] w-[150px]">
          <img
            alt=""
            className="absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 animate-float2 object-contain"
            src="/img/home/home_payments.webp"
          />
        </div>
      </div>
    </div>
    </div>
  );
}
