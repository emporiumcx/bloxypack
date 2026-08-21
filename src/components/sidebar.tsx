"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { Icons } from "./icons";
import { useStore } from "./providers";
import { SidebarGiveaway } from "./sidebar-giveaway";
import { SocialIconButton } from "./social-icon";
import { SIDEBAR_SOCIALS } from "@/lib/socials";

const GAMES = [
  { href: "/battles", label: "Battles", icon: Icons.battles },
  { href: "/cases", label: "Cases", icon: Icons.cases },
  { href: "/mines", label: "Mines", icon: Icons.mines },
  { href: "/towers", label: "Towers", icon: Icons.towers },
  { href: "/dice", label: "Dice", icon: Icons.dice },
  { href: "/blackjack", label: "Blackjack", icon: Icons.blackjack },
  { href: "/roulette", label: "Roulette", icon: Icons.roulette, isNew: true },
  { href: "/crash", label: "Crash", icon: Icons.crash, soon: true },
];

const MORE = [
  { href: "/profile", label: "Profile", icon: Icons.user },
  { href: "/rewards", label: "Rewards", icon: Icons.rewards },
  { href: "/affiliate", label: "Affiliate", icon: Icons.affiliate },
];

function NavItem({
  href,
  label,
  icon: Icon,
  soon = false,
  isNew = false,
}: {
  href: string;
  label: string;
  icon: (p: { className?: string; style?: CSSProperties }) => ReactNode;
  soon?: boolean;
  isNew?: boolean;
}) {
  const pathname = usePathname();
  const active = !soon && (pathname === href || pathname.startsWith(`${href}/`));
  return (
    <Link
      href={soon ? "/" : href}
      aria-label={label.toLowerCase()}
      title={label}
      className={`group relative z-1 flex w-full cursor-pointer items-center gap-8 overflow-hidden whitespace-nowrap rounded-6 px-12 py-8 text-[0.8rem] font-normal leading-none ${
        active ? "bg-green/10 text-white" : "bg-grey-34 text-grey-142 hover:bg-green/10 hover:text-white"
      } ${soon ? "pointer-events-none opacity-60" : ""}`}
    >
      <span className={`relative flex h-16 w-16 shrink-0 items-center justify-center [&>svg]:h-16 [&>svg]:w-16 ${active ? "text-green" : "text-icons-secondary group-hover:text-green"}`}>
        <Icon />
      </span>
      <span className="relative min-w-0 flex-1 truncate text-left font-normal leading-none">
        {label}
      </span>
      {isNew ? (
        <span className="animate-float-rotate relative inline-flex w-40 shrink-0 items-center justify-center rounded-2 bg-green text-[0.65rem] leading-none font-normal uppercase text-white">
          New
        </span>
      ) : null}
      {soon ? <span className="relative shrink-0 text-10 font-bold uppercase tracking-wide text-green">Soon</span> : null}
    </Link>
  );
}

export function Sidebar() {
  const { sidebarOpen } = useStore();
  const collapsed = !sidebarOpen;

  return (
    <aside
      className={`no-scrollbar fixed bottom-0 left-0 top-[var(--header-h)] z-30 hidden overflow-x-hidden overflow-y-auto border-r-1 border-grey-58 bg-grey-28 p-12 pt-10 transition-[width] duration-400 ease-in-out md:flex md:flex-col ${
        collapsed ? "w-64" : "w-208"
      }`}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className={`grid w-full grid-cols-1 ${collapsed ? "gap-8" : "gap-16"}`}>
          <div className={`grid w-full grid-cols-1 ${collapsed ? "gap-4" : "gap-8"}`}>
            {collapsed ? null : <p className="px-4 text-10 font-semibold uppercase tracking-wide text-grey-142">Games</p>}
            <div className="grid w-full grid-cols-1 gap-4">
              {GAMES.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>
          </div>
          <div className={`grid w-full grid-cols-1 ${collapsed ? "gap-4" : "gap-8"}`}>
            {collapsed ? null : <p className="px-4 text-10 font-semibold uppercase tracking-wide text-grey-142">More</p>}
            <div className="grid w-full grid-cols-1 gap-4">
              {MORE.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>
          </div>
        </div>
      </div>
      {collapsed ? null : (
        <div className="mt-auto flex flex-col gap-12 pt-12">
          <SidebarGiveaway />
          <div className="flex flex-wrap gap-8 border-t-1 border-grey-58 pt-12">
            {SIDEBAR_SOCIALS.map((s) => (
              <SocialIconButton key={s.label} href={s.href} label={s.label}>
                <s.icon />
              </SocialIconButton>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
