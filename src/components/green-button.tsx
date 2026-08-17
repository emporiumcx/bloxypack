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

export const green3d =
  "rounded-6 border-b-3 border-t-3 border-b-green-95 border-t-green-222 bg-green";

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
  const cls = `group/button relative flex ${href ? "items-center" : "cursor-pointer items-start"} justify-center rounded-6 border-b-3 border-t-3 border-b-green-95 border-t-green-222 bg-green opacity-100 transition-all duration-200 active:border-green disabled:opacity-40 ${
    size === "sm" ? "h-32" : "h-40"
  } ${className}`;
  const inner = (
    <div className={`tr relative flex h-full items-center justify-center gap-4 ${wide ? "w-full px-16" : "w-full px-10"}`}>
      {loading ? (
        <div className="text-18 text-grey-28">
          <Icons.spinner />
        </div>
      ) : icon ? (
        <div className="-ml-2 text-grey-28">{icon}</div>
      ) : null}
      <p className="transition-all duration-300 text-14 text-grey-28">{children}</p>
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
      className={`group/button relative flex h-40 cursor-pointer items-start justify-center rounded-6 bg-grey-39 opacity-100 transition-all duration-200 hover:bg-grey-47 active:bg-grey-47 ${className}`}
    >
      <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-16">
        <p className="transition-all duration-300 text-14 text-grey-142">{children}</p>
      </div>
    </button>
  );
}
