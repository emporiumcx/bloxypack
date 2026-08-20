"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bux } from "./bux";
import { GoldButton, GreenButton } from "./green-button";
import { Icons } from "./icons";
import { useStore } from "./providers";
import { SITE_GAMES } from "@/lib/games";
import { xpProgress } from "@/lib/levels";
import { UserAvatar } from "./user-avatar";

const TOP_LEFT = [
  { href: "/rewards", label: "Summer Event", color: "text-gold-btn" },
] as const;

const TOP_RIGHT = [
  { href: "/fairness", label: "Fairness" },
  { href: "/terms", label: "TOS" },
] as const;

const SOCIALS = [
  { href: "https://discord.gg/rostake", icon: "discord" },
  { href: "https://x.com/rostakedotcom", icon: "twitter" },
  { href: "https://www.twitch.tv", icon: "twitch" },
  { href: "https://kick.com/rostakedotcom", icon: "kick" },
] as const;

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

function NavChip({
  children,
  className = "",
  onClick,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
}) {
  const cls = `flex h-40 items-center gap-8 rounded-10 border-b-2 border-t-2 border-b-black/40 border-t-white/10 bg-grey-39 px-12 text-white shadow-[0_2px_0_rgba(0,0,0,0.2)] transition-colors hover:bg-grey-47 ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

const DROP_EXIT_MS = 220;

export function SiteHeader() {
  const pathname = usePathname();
  const { user, openModal, logout } = useStore();
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
    <header className="sticky top-0 z-40 w-full">
      <div className="flex h-36 items-center justify-between gap-12 bg-grey-28 px-16 sm:px-20">
        <div className="flex min-w-0 items-center gap-16 overflow-x-auto">
          <button
            type="button"
            onClick={() => openModal(user ? "affiliate" : "login")}
            className="ui-label shrink-0 text-11 text-green"
          >
            Redeem Affiliates
          </button>
          <button
            type="button"
            onClick={() => openModal(user ? "promo" : "login")}
            className="ui-label shrink-0 text-11 text-gold-btn"
          >
            Promo Codes
          </button>
          {TOP_LEFT.map((l) => (
            <Link key={l.label} href={l.href} className={`ui-label shrink-0 text-11 ${l.color}`}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-12 sm:flex">
          {TOP_RIGHT.map((l) => (
            <Link key={l.label} href={l.href} className="ui-label text-11 text-grey-142 hover:text-white">
              {l.label}
            </Link>
          ))}
          <div className="flex items-center gap-6">
            {SOCIALS.map((s) => {
              const Icon = Icons[s.icon];
              return (
                <a
                  key={s.icon}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-24 w-24 items-center justify-center rounded-6 bg-grey-39 text-grey-142 transition-colors hover:bg-grey-47 hover:text-white"
                >
                  <Icon className="text-12" />
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <div className="@container/nav relative flex h-64 items-center justify-between gap-6 bg-grey-34 px-16 @sm/nav:gap-8 sm:px-20">
        <div className="flex min-w-0 shrink-0 items-center gap-6 @sm/nav:gap-8">
          <NavChip href="/" className="h-40 w-40 justify-center px-0">
            <Icons.home className="text-18 text-grey-190" />
          </NavChip>
          <div ref={gamesRef} className="relative">
            <NavChip onClick={toggleGames}>
              <Icons.games className="text-18 text-grey-190" />
              <span className="ui-btn-label hidden text-12 @sm/nav:inline">Games</span>
              <Icons.chevron className={`text-14 text-grey-142 transition-transform ${gamesOpen && !gamesLeaving ? "rotate-180" : ""}`} />
            </NavChip>
            {gamesOpen ? (
              <div className={`panel-outline absolute left-0 top-[52px] z-50 w-[min(92vw,760px)] rounded-16 bg-grey-34 p-16 shadow-[0_24px_80px_rgba(0,0,0,0.55)] ${gamesLeaving ? "pointer-events-none animate-close-y" : "animate-open-y"}`}>
                <div className="mb-10 flex items-center justify-between">
                  <p className="ui-label text-12 text-white">Games</p>
                  <button type="button" onClick={closeGames} className="text-grey-142 hover:text-white">
                    <Icons.close className="text-16" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:grid-cols-4">
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
          <GreenButton href="/rewards" size="md" shine icon={<Icons.rewards className="text-16" />} wide={false} className="hidden px-4 @bt/nav:flex">
            Rewards
          </GreenButton>
        </div>

        <div className="flex min-w-0 items-center gap-6 @md/nav:gap-8">
          {user ? (
            <>
              <div className="flex h-40 items-center gap-8 rounded-12 border-b-2 border-t-2 border-b-black/30 border-t-white/8 bg-grey-28 py-4 pl-8 pr-4 @sm/nav:h-44 @sm/nav:gap-10 @sm/nav:pl-12">
                <HeaderBalance value={user.balance} />
                <button
                  type="button"
                  onClick={() => openModal("deposit")}
                  className="group/button relative flex h-32 w-32 shrink-0 cursor-pointer items-center justify-center rounded-8 border-b-3 border-t-3 border-b-green-95 border-t-green-222 bg-green shadow-[0_2px_0_rgba(0,0,0,0.25)] transition-all duration-200 active:translate-y-px @sm/nav:w-auto @sm/nav:px-12"
                >
                  <span className="ui-btn-label text-18 leading-none text-grey-28 @sm/nav:hidden">+</span>
                  <span className="ui-btn-label hidden text-12 text-grey-28 @sm/nav:inline">Deposit</span>
                </button>
              </div>
              <NavChip onClick={() => openModal("withdraw")} className="hidden @lg/nav:flex">
                <Icons.cart className="text-16 text-grey-190" />
                <span className="ui-btn-label text-12">Withdraw</span>
              </NavChip>
              <button
                type="button"
                className="hidden h-40 w-40 items-center justify-center rounded-10 border-b-2 border-t-2 border-b-black/40 border-t-white/10 bg-grey-39 text-grey-142 shadow-[0_2px_0_rgba(0,0,0,0.2)] transition-colors hover:bg-grey-47 hover:text-white @bt/nav:flex"
                aria-label="notifications"
              >
                <Icons.bell className="text-18" />
              </button>
              <div ref={userRef} className="relative">
                <button
                  type="button"
                  onClick={toggleUser}
                  className="flex h-40 w-40 items-center justify-center rounded-10 border-b-2 border-t-2 border-b-black/40 border-t-white/10 bg-grey-39 shadow-[0_2px_0_rgba(0,0,0,0.2)] transition-colors hover:bg-grey-47 @bt/nav:h-44 @bt/nav:w-auto @bt/nav:gap-8 @bt/nav:py-4 @bt/nav:pl-10 @bt/nav:pr-6"
                >
                  <div className="hidden min-w-72 max-w-110 grid-cols-1 gap-4 @bt/nav:grid">
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
            <GoldButton onClick={() => openModal("login")} icon={<Icons.login className="text-16" />} wide={false} className="px-16">
              Login
            </GoldButton>
          )}
        </div>
      </div>
    </header>
  );
}
