"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bux } from "./bux";
import { ChatPanel } from "./chat";
import { SiteFooter } from "./footer";
import { Icons } from "./icons";
import { Modals } from "./modals";
import { useStore } from "./providers";
import { GamesMenu, Sidebar } from "./sidebar";

function HeaderBalance({ value }: { value: number }) {
  const prev = useRef(value);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    setTick((n) => n + 1);
  }, [value]);
  return (
    <div key={tick} className={tick ? "animate-pop" : undefined}>
      <Bux value={value} />
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { chatOpen, user, openModal, toggleSidebar, toggleChat } = useStore();
  const pathname = usePathname();
  const [gamesOpen, setGamesOpen] = useState(false);

  useEffect(() => {
    setGamesOpen(false);
  }, [pathname]);

  return (
    <div className="relative flex h-screen min-h-0 w-full min-w-[330px] overflow-hidden bg-grey-34">
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="relative z-40 flex h-[62px] w-full shrink-0 items-center bg-grey-28 bg-scratches">
          <div className="flex h-full w-full items-center gap-8 px-12 sm:px-16">
            <button
              type="button"
              aria-label="menu"
              onClick={toggleSidebar}
              className="flex h-38 w-38 items-center justify-center rounded-8 bg-grey-47 text-cream xl:hidden"
            >
              <Icons.menu className="text-20" />
            </button>

            <Link href="/" aria-label="home" className="group relative mr-6 flex h-full items-center">
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-70 w-70 -translate-x-1/2 -translate-y-1/2 bg-hex-net opacity-90" />
              <div className="pointer-events-none absolute bottom-0 left-24 h-2 w-30 bg-gradient-to-r from-green to-transparent md:left-auto md:w-40" />
              <img alt="WildPVP" className="relative hidden h-32 w-auto object-contain sm:block" src="/img/logo.png" />
              <img alt="WildPVP" className="relative h-32 w-auto object-contain sm:hidden" src="/img/icon.png" />
            </Link>

            <div className="hidden items-center gap-8 xl:flex">
              <button
                type="button"
                onClick={() => setGamesOpen((v) => !v)}
                className="nav-pill nav-pill-games bg-button-net relative flex h-38 items-center gap-6 px-12 text-14 font-black capitalize"
              >
                <Icons.cases className="text-16 text-cream" />
                Games
                <Icons.chevron className={`text-16 transition-transform ${gamesOpen ? "rotate-180" : ""}`} />
              </button>
              <Link href="/rewards" className="nav-pill nav-pill-rewards bg-button-net flex h-38 items-center gap-6 px-14 text-14 font-black capitalize">
                <Icons.rewards className="text-16 text-cream" />
                Rewards
              </Link>
              <Link href="/leaderboard" className="nav-pill nav-pill-more bg-button-net flex h-38 items-center gap-6 px-14 text-14 font-black capitalize">
                <Icons.trophy className="text-16 text-cream" />
                Challenges
              </Link>
            </div>

            <div className="ml-auto flex items-center gap-8">
              <Link href="/rewards" className="nav-pill nav-pill-free hidden h-38 items-center gap-6 px-14 text-14 font-black capitalize md:flex">
                <Icons.cases className="text-16 text-cream" />
                Free Cases
              </Link>
              <Link href="/leaderboard" className="nav-pill nav-pill-rush hidden h-38 items-center gap-6 px-14 text-14 font-black capitalize lg:flex">
                <Icons.podium className="text-16 text-cream" />
                Gold Rush
              </Link>

              {user ? (
                <div className="flex h-38 items-center gap-8 rounded-8 bg-grey-39 py-2 pl-12 pr-4">
                  <HeaderBalance value={user.balance} />
                  <button
                    type="button"
                    onClick={() => openModal("deposit")}
                    className="btn-gold relative flex h-32 items-center justify-center rounded-6 px-10"
                  >
                    <Icons.plus className="text-16 text-gold-deep" />
                    <p className="ml-4 hidden text-14 font-extrabold uppercase text-gold-deep sm:block">Deposit</p>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openModal("login")}
                  className="btn-gold flex h-38 items-center rounded-6 px-16"
                >
                  <p className="text-14 font-extrabold uppercase text-gold-deep">Sign In</p>
                </button>
              )}

              <button
                type="button"
                aria-label="Toggle chat"
                onClick={toggleChat}
                className={`flex h-38 w-38 items-center justify-center rounded-8 border-1 border-grey-58 bg-grey-47 ${
                  chatOpen ? "text-green" : "text-grey-142"
                }`}
              >
                <Icons.chat className="text-18" />
              </button>
            </div>
          </div>
        </header>

        <GamesMenu open={gamesOpen} onClose={() => setGamesOpen(false)} />
        <Sidebar />

        <div className="relative min-h-0 flex-1 overflow-hidden bg-theme-pattern">
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-theme-net opacity-80" />
          <div className="relative h-full overflow-x-hidden overflow-y-auto">
            <div className="mx-auto flex w-11/12 max-w-[92rem] flex-col items-center gap-56 py-20 sm:w-10/12 lg:w-9/12">
              <div key={pathname} className="@container/page grid w-full animate-page-in grid-cols-1 items-start">
                {children}
              </div>
              <SiteFooter />
            </div>
          </div>
        </div>
      </div>

      <ChatPanel />
      <Modals />
    </div>
  );
}
