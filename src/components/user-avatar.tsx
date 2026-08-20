"use client";

import { avatarRing, avatarSrc } from "@/lib/avatars";
import { rankRingFromLevel } from "@/lib/levels";

export function UserAvatar({
  avatar,
  seed,
  size = 52,
  className = "",
  rounded = "full",
  level,
  rank,
}: {
  avatar?: string | null;
  seed?: string | null;
  size?: number;
  className?: string;
  rounded?: "full" | "8";
  level?: number | null;
  rank?: string | null;
}) {
  const staff = rank === "staff" || rank === "admin";
  const ring = staff
    ? "#88FF55"
    : level != null && Number.isFinite(level)
      ? rankRingFromLevel(level)
      : avatarRing(avatar, seed);
  const radius = rounded === "full" ? "999px" : "8px";
  return (
    <div
      className={`shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        boxShadow: `0 0 0 2px ${ring}`,
      }}
    >
      <img alt="" src={avatarSrc(avatar, seed)} className="h-full w-full object-cover" style={{ borderRadius: radius }} />
    </div>
  );
}
