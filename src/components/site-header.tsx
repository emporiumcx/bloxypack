"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bux } from "./bux";
import { BuxGlyph, Icons } from "./icons";
import { useStore } from "./providers";
import { SITE_GAMES } from "@/lib/games";
import { xpProgress } from "@/lib/levels";
import { UserAvatar } from "./user-avatar";

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

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function nextWeekEnd() {
  const now = new Date();
  const day = now.getUTCDay();
  const add = day === 0 ? 7 : 7 - day;
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + add, 0, 0, 0);
}

function LogoGlow({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <div
        className={
          compact
            ? "pointer-events-none absolute inset-0 -top-24 left-1/2 hidden h-32 w-96 -translate-x-1/2 rounded-full bg-green/60 blur-lg sm:block"
            : "pointer-events-none absolute inset-0 -top-40 left-1/2 h-50 w-104 -translate-x-1/2 rounded-full bg-green/40 blur-xl"
        }
      />
      <div
        className={
          compact
            ? "header-logo-dots pointer-events-none absolute inset-0 -top-16 left-1/2 hidden h-240 w-240 -translate-x-1/2 sm:block"
            : "header-logo-dots pointer-events-none absolute left-1/2 top-[-40px] h-[400px] w-[400px] -translate-x-1/2"
        }
      />
    </>
  );
}

function RaceChip() {
  const [remain, setRemain] = useState(0);
  useEffect(() => {
    const tick = () => setRemain(Math.max(0, Math.floor((nextWeekEnd() - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  const d = Math.floor(remain / 86400);
  const h = Math.floor((remain % 86400) / 3600);
  const m = Math.floor((remain % 3600) / 60);
  const s = remain % 60;
  return (
    <Link
      href="/leaderboard"
      aria-label="Weekly Raffle"
      className="group relative isolate hidden h-44 items-center gap-8 overflow-hidden rounded-6 bg-grey-39 px-12 shadow-[-1px_-1px_0px_color-mix(in_oklab,var(--color-gold-btn)_55%,transparent)] transition-all duration-300 hover:-translate-y-px lg:flex"
    >
      <div className="pointer-events-none absolute -top-32 -right-24 -z-[1] h-72 w-72 rounded-full bg-gold-btn/20 opacity-40 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
      <BuxGlyph className="h-32 w-32 shrink-0 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]" style={{ width: 32, height: 32 }} />
      <div className="flex flex-col leading-none whitespace-nowrap">
        <span className="font-tactic text-14 font-black uppercase italic text-white">
          Race <span className="inline-block text-gold-btn">50K</span>
        </span>
        <span className="mt-2 font-tactic text-10 font-medium uppercase tracking-wide text-grey-142 tabular-nums">
          {pad(d)}:{pad(h)}:{pad(m)}:{pad(s)}
        </span>
      </div>
    </Link>
  );
}

const DROP_EXIT_MS = 220;

export function SiteHeader() {
  const pathname = usePathname();
  const { user, openModal, logout, toggleSidebar } = useStore();
  const [gamesOpen, setGamesOpen] = useState(false);
  const [gamesLeaving, setGamesLeaving] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [userLeaving, setUserLeaving] = useState(false);
  const gamesRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const gamesTimer = useRef(0);
  const userTimer = useRef(0);
  const xpPct = user ? xpProgress(user.xp) : 0;

  function closeGames() {
    if (!gamesOpen || gamesLeaving) return;
    setGamesLeaving(true);
    window.clearTimeout(gamesTimer.current);
    gamesTimer.current = window.setTimeout(() => {
      setGamesOpen(false);
      setGamesLeaving(false);
    }, DROP_EXIT_MS);
  }

  function toggleGames() {
    if (gamesOpen && !gamesLeaving) return closeGames();
    window.clearTimeout(gamesTimer.current);
    setGamesLeaving(false);
    setGamesOpen(true);
  }

  function closeUser() {
    if (!userOpen || userLeaving) return;
    setUserLeaving(true);
    window.clearTimeout(userTimer.current);
    userTimer.current = window.setTimeout(() => {
      setUserOpen(false);
      setUserLeaving(false);
    }, DROP_EXIT_MS);
  }

  function toggleUser() {
    if (userOpen && !userLeaving) return closeUser();
    window.clearTimeout(userTimer.current);
    setUserLeaving(false);
    setUserOpen(true);
  }

  useEffect(() => {
    setGamesOpen(false);
    setGamesLeaving(false);
    setUserOpen(false);
    setUserLeaving(false);
    window.clearTimeout(gamesTimer.current);
    window.clearTimeout(userTimer.current);
  }, [pathname]);

  useEffect(() => {
    const onDoc = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!gamesRef.current?.contains(t)) closeGames();
      if (!userRef.current?.contains(t)) closeUser();
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [gamesOpen, gamesLeaving, userOpen, userLeaving]);

  useEffect(() => {
    return () => {
      window.clearTimeout(gamesTimer.current);
      window.clearTimeout(userTimer.current);
    };
  }, []);

  return (
    <header className="fixed top-0 right-0 left-0 z-50 w-full border-b-1 border-grey-58 bg-grey-28">
      <div className="flex items-center justify-between px-12 py-10 md:p-16 md:pl-12">
        <div className="flex min-w-0 items-center gap-16">
          <Link href="/" aria-label="home" className="relative flex items-center overflow-visible md:hidden">
            <LogoGlow compact />
            <img alt="BloxyPack" className="relative z-10 h-36 w-auto object-contain" src="/img/logo.png" />
          </Link>

          <div className="hidden items-center gap-16 pl-0 md:flex">
            <button type="button" aria-label="Toggle sidebar" onClick={toggleSidebar} className="btn-glass flex h-32 w-32 items-center justify-center">
              <Icons.menu className="text-18" />
            </button>
            <Link href="/" aria-label="home" className="relative mr-24 overflow-visible">
              <LogoGlow />
              <img alt="BloxyPack" className="relative z-10 h-44 w-auto object-contain" src="/img/logo.png" />
            </Link>
          </div>

          <Link
            href="/rewards"
            className="group/button relative hidden h-32 items-center gap-8 overflow-hidden rounded-6 bg-gradient-to-b from-green to-green-2 px-12 text-12 font-medium text-white transition-all duration-400 hover:brightness-110 active:brightness-95 md:flex"
          >
            <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
              <span className="animate-btn-shine absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/55 to-transparent" />
            </span>
            <Icons.rewards className="relative text-16 text-grey-190" />
            <span className="relative">Rewards</span>
          </Link>

          <RaceChip />

          <div ref={gamesRef} className="relative md:hidden">
            <button
              type="button"
              onClick={toggleGames}
              className="flex h-32 items-center gap-8 rounded-6 border-1 border-grey-58 bg-grey-39 px-12 text-white transition-colors hover:bg-grey-47"
            >
              <Icons.games className="text-18 text-grey-190" />
              <Icons.chevron className={`text-14 text-grey-142 transition-transform ${gamesOpen && !gamesLeaving ? "rotate-180" : ""}`} />
            </button>
            {gamesOpen ? (
              <div className={`panel-outline absolute left-0 top-[calc(100%+8px)] z-50 w-[min(92vw,760px)] rounded-16 bg-grey-34 p-16 shadow-[0_24px_80px_rgba(0,0,0,0.55)] ${gamesLeaving ? "pointer-events-none animate-close-y" : "animate-open-y"}`}>
                <div className="mb-10 flex items-center justify-between">
                  <p className="ui-label text-12 text-white">Games</p>
                  <button type="button" onClick={closeGames} className="text-grey-142 hover:text-white">
                    <Icons.close className="text-16" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
                  {SITE_GAMES.map((g) => (
                    <Link
                      key={g.href}
                      href={g.soon ? "/" : g.href}
                      onClick={closeGames}
                      className={`panel-outline group relative overflow-hidden rounded-12 bg-grey-39 ${g.soon ? "pointer-events-none opacity-40" : ""}`}
                    >
                      <img alt="" src={g.img} className="h-88 w-full object-cover opacity-80 transition-transform duration-300 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-grey-28 via-transparent to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 flex items-center gap-6 p-8">
                        <div className="flex h-22 w-22 items-center justify-center rounded-full bg-grey-39 text-white">
                          <g.icon className="text-12" />
                        </div>
                        <p className="ui-label text-10 text-white">{g.label}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-8 sm:gap-16">
          {user ? (
            <>
              <div className="flex h-40 items-center gap-8 rounded-6 bg-grey-39 py-4 pl-12 pr-4">
                <HeaderBalance value={user.balance} />
                <button
                  type="button"
                  onClick={() => openModal("deposit")}
                  className="group/button relative flex h-32 w-32 shrink-0 cursor-pointer items-center justify-center rounded-6 bg-gradient-to-b from-green to-green-2 transition-all duration-200 hover:brightness-110 active:brightness-95 sm:w-auto sm:px-12"
                >
                  <span className="ui-btn-label text-18 leading-none text-grey-190 sm:hidden">+</span>
                  <span className="ui-btn-label hidden text-12 text-grey-190 sm:inline">Deposit</span>
                </button>
              </div>
              <button
                type="button"
                className="hidden h-40 w-40 items-center justify-center rounded-6 border-1 border-grey-58 bg-grey-39 text-grey-142 transition-colors hover:bg-grey-47 hover:text-white sm:flex"
                aria-label="notifications"
              >
                <Icons.bell className="text-18" />
              </button>
              <div ref={userRef} className="relative">
                <button
                  type="button"
                  onClick={toggleUser}
                  className="flex h-40 w-40 items-center justify-center rounded-6 border-1 border-grey-58 bg-grey-39 transition-colors hover:bg-grey-47 sm:h-44 sm:w-auto sm:gap-8 sm:py-4 sm:pl-10 sm:pr-6"
                >
                  <div className="hidden min-w-72 max-w-110 grid-cols-1 gap-4 sm:grid">
                    <p className="truncate text-left text-12 font-semibold text-white">{user.username}</p>
                    <div className="h-4 overflow-hidden rounded-full bg-grey-28">
                      <div className="h-4 rounded-full bg-green" style={{ width: `${xpPct}%` }} />
                    </div>
                  </div>
                  <UserAvatar avatar={user.avatar} seed={user.id || user.username} size={32} rounded="8" level={user.level} />
                </button>
                {userOpen ? (
                  <div className={`absolute right-0 top-[52px] z-50 w-200 overflow-hidden rounded-12 panel-outline bg-grey-34 p-8 ${userLeaving ? "pointer-events-none animate-close-y" : "animate-open-y"}`}>
                    {[
                      { href: "/profile", label: "Profile", icon: Icons.user },
                      { href: "/rewards", label: "Rewards", icon: Icons.rewards },
                      { href: "/affiliate", label: "Affiliates", icon: Icons.affiliate },
                      { href: "/fairness", label: "Fairness", icon: Icons.scale },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeUser}
                        className="flex h-36 w-full items-center gap-10 rounded-8 px-10 text-13 text-grey-142 hover:bg-grey-39 hover:text-white"
                      >
                        <item.icon className="text-16" />
                        {item.label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        closeUser();
                        openModal("withdraw");
                      }}
                      className="flex h-36 w-full items-center gap-10 rounded-8 px-10 text-13 text-grey-142 hover:bg-grey-39 hover:text-white"
                    >
                      <Icons.cart className="text-16" />
                      Withdraw
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        closeUser();
                        logout();
                      }}
                      className="flex h-36 w-full items-center gap-10 rounded-8 px-10 text-13 text-red hover:bg-red/10"
                    >
                      <Icons.logout className="text-16" />
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => openModal("login")}
                className="inline-flex h-32 min-w-80 shrink-0 items-center justify-center rounded-6 border-1 border-white/10 bg-gradient-to-b from-white/5 to-white/10 px-12 text-12 font-medium text-white transition-colors duration-400 hover:from-white/10 hover:to-white/20"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => openModal("register")}
                className="inline-flex h-32 min-w-80 shrink-0 items-center justify-center rounded-6 bg-gradient-to-b from-green to-green-2 px-12 text-12 font-medium text-white transition-all duration-400 hover:brightness-110 active:brightness-95"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
