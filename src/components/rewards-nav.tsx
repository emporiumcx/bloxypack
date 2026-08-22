"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/rewards", label: "Rewards", exact: true },
  { href: "/rewards/giveaway", label: "Giveaways", exact: false },
] as const;

const SOON = ["VIP", "Inventory", "Missions"] as const;

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function RewardsNav() {
  const pathname = usePathname();

  return (
    <div className="flex w-full flex-wrap items-center gap-8">
      {TABS.map((tab) => {
        const on = isActive(pathname, tab.href, tab.exact);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex h-40 items-center rounded-8 px-16 transition-all duration-200 ${
              on
                ? "bg-gradient-to-b from-green to-green-2 text-grey-190 hover:brightness-110 active:brightness-95"
                : "bg-grey-39 text-grey-190 hover:bg-grey-47"
            }`}
          >
            <span className="ui-label text-11">{tab.label}</span>
          </Link>
        );
      })}
      {SOON.map((label) => (
        <span
          key={label}
          className="flex h-40 cursor-not-allowed items-center gap-8 rounded-8 bg-grey-39 px-16 text-grey-142"
        >
          <span className="ui-label text-11">{label}</span>
          <span className="rounded-4 bg-grey-58 px-6 py-2 text-10 font-bold uppercase tracking-[0.08em] text-grey-142">
            Soon
          </span>
        </span>
      ))}
    </div>
  );
}
