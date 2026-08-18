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
};

export const green3d = "rounded-6 btn-gold";

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
}: Props) {
  const cls = `group/button btn-gold relative flex ${href ? "items-center" : "cursor-pointer items-center"} justify-center rounded-6 opacity-100 transition-all duration-200 disabled:opacity-40 ${
    size === "sm" ? "h-32" : "h-40"
  } ${className}`;
  const inner = (
    <div className={`tr relative flex h-full items-center justify-center gap-4 ${wide ? "w-full px-16" : "w-full px-10"}`}>
      {loading ? (
        <div className="text-18 text-gold-deep">
          <Icons.spinner />
        </div>
      ) : icon ? (
        <div className="-ml-2 text-gold-deep">{icon}</div>
      ) : null}
      <p className="text-14 font-bold uppercase tracking-wide text-gold-deep transition-all duration-300">{children}</p>
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
      className={`group/button relative flex h-40 cursor-pointer items-center justify-center rounded-6 border-1 border-grey-70 bg-grey-58 opacity-100 transition-all duration-200 hover:bg-grey-70 active:bg-grey-70 ${className}`}
    >
      <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-16">
        <p className="text-14 font-bold uppercase tracking-wide text-cream transition-all duration-300">{children}</p>
      </div>
    </button>
  );
}
