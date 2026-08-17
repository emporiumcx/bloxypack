"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { Icons } from "./icons";
import { useStore } from "./providers";

const GAMES = [
  { href: "/battles", label: "Battles", icon: Icons.battles },
  { href: "/cases", label: "Cases", icon: Icons.cases },
  { href: "/mines", label: "Mines", icon: Icons.mines },
  { href: "/towers", label: "Towers", icon: Icons.towers },
  { href: "/dice", label: "Dice", icon: Icons.dice },
  { href: "/blackjack", label: "Blackjack", icon: Icons.blackjack },
];

const MORE = [
  { href: "/rewards", label: "Rewards", icon: Icons.rewards },
  { href: "/marketplace", label: "Marketplace", icon: Icons.cases },
  { href: "/affiliate", label: "Affiliate", icon: Icons.affiliate },
  { href: "/leaderboard", label: "Leaderboard", icon: Icons.leaderboard },
];

function NavItem({
  href,
  label,
  icon: Icon,
  onClick,
  delay = 0,
}: {
  href?: string;
  label: string;
  icon: (p: { className?: string; style?: CSSProperties }) => React.ReactNode;
  onClick?: () => void;
  delay?: number;
}) {
  const pathname = usePathname();
  const active = href ? pathname === href || pathname.startsWith(href + "/") : false;
  const inner = (
    <>
      {active ? (
        <div className="absolute inset-0 rounded-8 bg-grey-39">
          <div className="absolute inset-0 rounded-8 bg-green/10 from-green/10 via-green/0 to-transparent xl:bg-transparent xl:bg-gradient-to-r" />
        </div>
      ) : null}
      <div className="relative grid h-full w-full grid-cols-1 items-center justify-center gap-8 px-10 xl:grid-cols-[auto_1fr_auto] xl:px-12">
        <div
          className={`relative transition-colors duration-200 ${
            active ? "text-green" : "text-grey-142 group-hover:text-white group-active:text-white"
          }`}
        >
          <div className="flex items-center justify-center" style={{ width: 20, height: 20 }}>
            <Icon style={{ marginLeft: 0, scale: 1 }} />
          </div>
        </div>
        <div className="relative hidden w-full grid-cols-1 gap-2 xl:grid">
          <p
            className={`ui-label text-left text-12 transition-colors duration-200 ${
              active ? "text-white" : "text-grey-142 group-hover:text-white group-active:text-white"
            }`}
          >
            {label}
          </p>
        </div>
      </div>
    </>
  );
  const cls = "group relative flex h-44 animate-nav-in rounded-8 bg-grey-34 xl:bg-transparent";
  const style = { animationDelay: `${delay}ms` };
  if (onClick) {
    return (
      <button type="button" aria-label={label.toLowerCase()} className={cls} style={style} onClick={onClick}>
        {inner}
      </button>
    );
  }
  return (
    <Link href={href!} aria-label={label.toLowerCase()} className={cls} style={style}>
      {inner}
    </Link>
  );
}

export function Sidebar() {
  const { openModal, sidebarOpen, toggleSidebar } = useStore();

  return (
    <aside
      className={`fixed bottom-0 left-0 top-0 z-40 flex w-64 flex-col border-r-1 border-grey-47 bg-grey-28 transition-transform duration-300 ease-in-out xl:w-[300px] ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="relative z-10 h-64 w-full overflow-hidden border-b-1 border-grey-47 p-10 transition-colors hover:bg-grey-34 active:bg-grey-34">
        <Link href="/" aria-label="home" className="relative flex h-full w-full items-center justify-center">
          <img alt="WildPVP" className="relative hidden h-full w-auto max-w-full object-contain xl:block" src="/img/logo.png" />
          <img alt="WildPVP" className="relative h-full w-auto object-contain xl:hidden" src="/img/icon.png" />
        </Link>
      </div>

      <div className="relative z-10 flex h-[calc(100vh-64px)] w-full flex-grow flex-col">
        <div className="relative flex w-full flex-grow items-start overflow-auto p-12 xl:p-16">
          <div className="relative z-10 grid w-full grid-cols-1 gap-10 sm:gap-16">
            <div className="grid w-full grid-cols-1 gap-10">
              <p className="ui-label w-full animate-nav-in text-center text-10 text-grey-142 xl:text-left">GAMES</p>
              <div className="grid w-full grid-cols-1 gap-4">
                {GAMES.map((item, i) => (
                  <NavItem key={item.href} {...item} delay={40 + i * 40} />
                ))}
              </div>
            </div>

            <Link href="/leaderboard" className="relative hidden h-64 w-full animate-nav-in rounded-12 xl:block" style={{ animationDelay: "260ms" }}>
              <img
                alt=""
                className="absolute h-full w-full rounded-12 object-cover"
                src="/img/leaderboard/leaderboard_banner.webp"
              />
              <div className="absolute inset-0 rounded-12 bg-gradient-to-r from-green to-yellow opacity-20 bg-blend-luminosity" />
              <div className="absolute inset-0 p-[1.5px]">
                <div className="relative h-full w-full overflow-hidden rounded-[10.5px]">
                  <div className="absolute -inset-[1.5px]">
                    <img alt="" className="h-full w-full object-cover" src="/img/leaderboard/leaderboard_banner.webp" />
                  </div>
                </div>
              </div>
              <div className="relative flex h-full w-full items-center gap-6 px-14">
                <img alt="" className="h-44 object-contain" src="/img/leaderboard/leaderboard_nav.webp" />
              </div>
              <img
                alt=""
                className="absolute bottom-0 right-16 h-74 animate-floaty"
                src="/img/leaderboard/leaderboard_person.webp"
              />
            </Link>

            <div className="grid w-full grid-cols-1 gap-10">
              <p className="ui-label w-full animate-nav-in text-center text-10 text-grey-142 xl:text-left" style={{ animationDelay: "280ms" }}>
                MORE
              </p>
              <div className="grid w-full grid-cols-1 gap-4">
                {MORE.map((item, i) => (
                  <NavItem key={item.href} {...item} delay={300 + i * 40} />
                ))}
                <NavItem label="Support" icon={Icons.support} delay={460} onClick={() => openModal("support")} />
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-12 grid w-full grid-cols-1 gap-12 px-12 pb-12 sm:mt-16 xl:grid-cols-2 xl:px-16 xl:pb-16">
          <a
            className="group flex h-40 w-full items-center justify-center rounded-8 bg-grey-39 px-10 py-6 transition-colors hover:bg-grey-47 active:bg-grey-47 xl:h-44"
            target="_blank"
            rel="noreferrer"
            href="https://discord.gg/rostake"
          >
            <div className="grid grid-cols-1 items-center justify-center gap-6 xl:grid-cols-[auto_1fr]">
              <div className="text-grey-142 transition-colors group-hover:text-white group-active:text-white xl:h-20 xl:w-20">
                <Icons.discord className="text-20" />
              </div>
              <p className="ui-btn-label hidden text-12 text-white xl:block">Discord</p>
            </div>
          </a>
          <a
            className="group flex h-40 w-full items-center justify-center rounded-8 bg-grey-39 px-10 py-6 transition-colors hover:bg-grey-47 active:bg-grey-47 xl:h-44"
            target="_blank"
            rel="noreferrer"
            href="https://x.com/rostakedotcom"
          >
            <div className="grid grid-cols-1 items-center justify-center gap-6 xl:grid-cols-[auto_1fr]">
              <div className="text-grey-142 transition-colors group-hover:text-white group-active:text-white xl:h-20 xl:w-20">
                <Icons.twitter className="text-20" />
              </div>
              <p className="ui-btn-label hidden text-12 text-white xl:block">Twitter</p>
            </div>
          </a>
        </div>
      </div>

      <button
        type="button"
        aria-label="nav_toggle"
        onClick={toggleSidebar}
        className="group absolute bottom-16 right-0 z-30 flex h-40 w-40 translate-x-[100%] items-center justify-center rounded-r-12 border-1 border-grey-47 bg-grey-28 transition-colors duration-200 hover:bg-grey-1 active:bg-grey-1"
      >
        <Icons.menu className="tr text-20 text-grey-142 group-hover:text-white group-active:text-white" />
      </button>
    </aside>
  );
}
