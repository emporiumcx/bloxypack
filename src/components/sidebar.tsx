"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { Icons } from "./icons";
import { useStore } from "./providers";

export const GAMES = [
  { href: "/battles", label: "Battles", icon: Icons.battles, img: "/img/home/battles.webp", tag: "PvP", tagColor: "#01ffff" },
  { href: "/cases", label: "Cases", icon: Icons.cases, img: "/img/home/cases.webp", tag: "New", tagColor: "#4a83ff" },
  { href: "/mines", label: "Mines", icon: Icons.mines, img: "/img/home/mines.webp", tag: "", tagColor: "#ff969f" },
  { href: "/towers", label: "Towers", icon: Icons.towers, img: "/img/home/towers.webp", tag: "", tagColor: "#f5c487" },
  { href: "/dice", label: "Dice", icon: Icons.dice, img: "/img/home/dice.webp", tag: "", tagColor: "#ffeb69" },
  { href: "/blackjack", label: "Blackjack", icon: Icons.blackjack, img: "/img/home/blackjack.webp", tag: "New", tagColor: "#f5c487" },
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
}: {
  href?: string;
  label: string;
  icon: (p: { className?: string; style?: CSSProperties }) => React.ReactNode;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const active = href ? pathname === href || pathname.startsWith(href + "/") : false;
  const inner = (
    <div className="relative grid h-full w-full grid-cols-[auto_1fr] items-center gap-10 px-12">
      <div className={`flex h-20 w-20 items-center justify-center ${active ? "text-green" : "text-grey-142 group-hover:text-cream"}`}>
        <Icon style={{ marginLeft: 0, scale: 1 }} />
      </div>
      <p className={`text-14 font-extrabold ${active ? "text-cream" : "text-grey-142 group-hover:text-cream"}`}>{label}</p>
    </div>
  );
  const cls = "group relative flex h-44 rounded-8 bg-grey-39/80";
  if (onClick) {
    return (
      <button type="button" aria-label={label.toLowerCase()} className={cls} onClick={onClick}>
        {inner}
      </button>
    );
  }
  return (
    <Link href={href!} aria-label={label.toLowerCase()} className={cls}>
      {inner}
    </Link>
  );
}

export function GamesMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <div
        className="absolute left-16 top-[62px] z-50 w-[min(720px,calc(100vw-32px))] animate-open-y overflow-hidden rounded-12 border-1 border-grey-58 bg-grey-28 p-16 shadow-[0_16px_40px_#00000080]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-12 flex items-center justify-between">
          <p className="text-12 font-extrabold uppercase tracking-[0.16em] text-grey-142">Games</p>
          <button type="button" className="text-12 text-grey-142 hover:text-cream" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          {GAMES.map((g) => (
              <Link
                key={g.href}
                href={g.href}
                onClick={onClose}
                className="group relative flex h-[180px] flex-col overflow-hidden rounded-10 bg-grey-47"
              >
                <div className="pointer-events-none absolute inset-0 bg-hex-net opacity-40" />
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
                <div className="relative z-10 flex flex-1 items-center justify-center text-cream" style={{ fontSize: 48 }}>
                  <g.icon style={{ marginLeft: 0, scale: 2.2 }} />
                </div>
                <div className="relative z-10 px-10 pb-10">
                  <p className="font-display text-20 uppercase text-cream">{g.label}</p>
                  <div className="mt-6 h-3 w-full rounded-full" style={{ background: g.tagColor || "#f5c487" }} />
                </div>
              </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { openModal, sidebarOpen, toggleSidebar } = useStore();
  const pathname = usePathname();
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      if (sidebarOpen) toggleSidebar();
    }
  }, [pathname, sidebarOpen, toggleSidebar]);

  return (
    <>
      {sidebarOpen ? (
        <button type="button" aria-label="close menu" className="fixed inset-0 z-40 bg-black/50 xl:hidden" onClick={toggleSidebar} />
      ) : null}
      <aside
        className={`fixed bottom-0 left-0 top-[62px] z-50 flex w-[280px] flex-col border-r-1 border-grey-47 bg-grey-28 transition-transform duration-300 ease-in-out xl:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative flex h-full w-full flex-col overflow-auto p-16">
          <p className="mb-10 text-12 font-extrabold uppercase tracking-[0.16em] text-grey-142">Games</p>
          <div className="mb-20 grid grid-cols-1 gap-6">
            {GAMES.map((item) => (
              <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
            ))}
          </div>
          <p className="mb-10 text-12 font-extrabold uppercase tracking-[0.16em] text-grey-142">More</p>
          <div className="grid grid-cols-1 gap-6">
            {MORE.map((item) => (
              <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} />
            ))}
            <NavItem label="Support" icon={Icons.support} onClick={() => openModal("support")} />
          </div>
        </div>
      </aside>
    </>
  );
}
