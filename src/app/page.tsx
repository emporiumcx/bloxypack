"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BetsTable } from "@/components/bets-table";
import { Icons } from "@/components/icons";
import { LiveDrops } from "@/components/live-drops";
import { useStore } from "@/components/providers";
import { ExploreRewards, PaymentTicker } from "@/components/home-explore";
import { HomeFaq } from "@/components/home-faq";

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

function HomeHero() {
  const { user, openModal } = useStore();
  return (
    <div className="relative flex min-h-224 w-full overflow-hidden rounded-12 bg-grey-34 sm:min-h-288">
      <div className="relative z-10 flex max-w-600 flex-1 flex-col items-start gap-12 p-24 pl-32 sm:p-28 sm:pl-40">
        <h2 className="font-tactic text-32 font-black uppercase leading-[0.92] tracking-tight text-white sm:text-[3.25rem]">
          Open Cases
          <br />
          Win Real Items
        </h2>
        <p className="max-w-300 text-12 leading-[0.875rem] text-grey-142">Start your opening journey by claiming your 3 free cases now!</p>
        <div className="mt-auto flex w-full max-w-332 flex-col gap-8">
          {user ? (
            <Link
              href="/rewards"
              className="flex h-40 w-full items-center justify-center rounded-8 bg-gradient-to-b from-green to-green-2 px-14 text-14 font-medium text-white transition-all duration-200 hover:brightness-110 active:brightness-95"
            >
              Claim 3 Cases for FREE!
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => openModal("register")}
              className="flex h-40 w-full items-center justify-center rounded-8 bg-gradient-to-b from-green to-green-2 px-14 text-14 font-medium text-white transition-all duration-200 hover:brightness-110 active:brightness-95"
            >
              Claim 3 Cases for FREE!
            </button>
          )}
          <div className="flex w-full gap-8">
            <a
              href="https://discord.gg/rostake"
              target="_blank"
              rel="noreferrer"
              className="flex h-40 flex-1 items-center justify-center gap-8 rounded-6 bg-grey-39 text-14 font-medium text-white transition-colors hover:bg-grey-47"
            >
              <Icons.discord className="text-16" />
              Discord
            </a>
            <button
              type="button"
              onClick={() => openModal("login")}
              className="flex h-40 flex-1 items-center justify-center gap-8 rounded-6 bg-grey-39 text-14 font-medium text-white transition-colors hover:bg-grey-47"
            >
              <Icons.google className="text-16" />
              Google
            </button>
          </div>
        </div>
      </div>
      <div className="pointer-events-none relative hidden w-260 shrink-0 items-center justify-center lg:flex xl:w-320">
        <div className="absolute left-1/2 top-1/2 h-140 w-140 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green/25 blur-[50px]" />
        <img
          alt=""
          src="/img/home/chest-character.webp"
          className="relative h-200 w-auto object-contain mix-blend-lighten xl:h-240"
        />
      </div>
    </div>
  );
}

export default function HomePage() {
  const scroller = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

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

  return (
    <div className="flex w-full flex-col gap-32">
      <LiveDrops />
      <HomeHero />

      <div className="@sm/page:gap-20 @sm/page:py-0 grid w-full grid-cols-1 gap-12 py-24">
        <div className="grid w-full grid-cols-[1fr_auto] items-center gap-10">
          <h2 className="@sm/page:text-20 text-16 text-white">BloxyWild Originals</h2>
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
                className={`panel-outline duration-600 group relative mr-12 h-[240px] min-w-[190px] rounded-8 bg-grey-39 transition-all last:mr-0 ${
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
      </div>
      <ExploreRewards />
      <PaymentTicker />
      <BetsTable />
      <HomeFaq />
    </div>
  );
}
