"use client";

import Link from "next/link";
import { Icons } from "./icons";

type Props = {
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  wide?: boolean;
  icon?: React.ReactNode;
  size?: "sm" | "md";
  href?: string;
  shine?: boolean;
};

export const green3d =
  "rounded-8 border-b-3 border-t-3 border-b-green-95 border-t-green-222 bg-green";

export const gold3d =
  "rounded-8 border-b-3 border-t-3 border-b-gold-lo border-t-gold-hi bg-gold-btn";

export function GreenButton({
  children,
  className = "",
  type = "button",
  onClick,
  disabled,
  loading,
  wide = true,
  icon,
  size = "md",
  href,
  shine = false,
}: Props) {
  const cls = `group/button relative flex ${href ? "items-center" : "cursor-pointer items-start"} justify-center rounded-8 border-b-3 border-t-3 border-b-green-95 border-t-green-222 bg-green opacity-100 shadow-[0_2px_0_rgba(0,0,0,0.25)] transition-all duration-200 active:translate-y-px active:border-green disabled:opacity-40 ${
    shine ? "overflow-hidden" : ""
  } ${size === "sm" ? "h-32" : "h-40"} ${className}`;
  const inner = (
    <div className={`tr relative flex h-full items-center justify-center gap-6 ${wide ? "w-full px-16" : "w-full px-10"}`}>
      {shine ? (
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <span className="animate-btn-shine absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/55 to-transparent" />
        </span>
      ) : null}
      {loading ? (
        <div className="text-18 text-grey-28">
          <Icons.spinner />
        </div>
      ) : icon ? (
        <div className="-ml-2 text-grey-28">{icon}</div>
      ) : null}
      <p className="ui-btn-label text-13 text-grey-28 transition-all duration-300">{children}</p>
    </div>
  );
  if (href) {
    return (
      <Link href={href} aria-label="link" className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={`cursor-pointer ${cls}`}>
      {inner}
    </button>
  );
}


export function GoldButton({
  children,
  className = "",
  type = "button",
  onClick,
  disabled,
  loading,
  wide = true,
  icon,
  size = "md",
  href,
}: Props) {
  const cls = `group/button relative flex ${href ? "items-center" : "cursor-pointer items-start"} justify-center rounded-8 border-b-3 border-t-3 border-b-gold-lo border-t-gold-hi bg-gold-btn opacity-100 shadow-[0_2px_0_rgba(0,0,0,0.25)] transition-all duration-200 active:translate-y-px active:border-gold-btn disabled:opacity-40 ${
    size === "sm" ? "h-32" : "h-40"
  } ${className}`;
  const inner = (
    <div className={`tr relative flex h-full items-center justify-center gap-6 ${wide ? "w-full px-16" : "w-full px-10"}`}>
      {loading ? (
        <div className="text-18 text-grey-28">
          <Icons.spinner />
        </div>
      ) : icon ? (
        <div className="-ml-2 text-grey-28">{icon}</div>
      ) : null}
      <p className="ui-btn-label text-13 text-grey-28 transition-all duration-300">{children}</p>
    </div>
  );
  if (href) {
    return (
      <Link href={href} aria-label="link" className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={`cursor-pointer ${cls}`}>
      {inner}
    </button>
  );
}

export function GreyButton({
  children,
  className = "",
  type = "button",
  onClick,
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`group/button relative flex h-40 cursor-pointer items-start justify-center rounded-8 border-b-2 border-t-2 border-b-black/40 border-t-white/10 bg-grey-39 opacity-100 shadow-[0_2px_0_rgba(0,0,0,0.2)] transition-all duration-200 hover:bg-grey-47 active:translate-y-px active:bg-grey-47 ${className}`}
    >
      <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-16">
        <p className="ui-btn-label text-13 text-grey-142 transition-all duration-300 group-hover:text-white">{children}</p>
      </div>
    </button>
  );
}
