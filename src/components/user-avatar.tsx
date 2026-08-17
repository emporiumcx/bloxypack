"use client";

import { avatarRing, avatarSrc } from "@/lib/avatars";

export function UserAvatar({
  avatar,
  seed,
  size = 52,
  className = "",
  rounded = "full",
}: {
  avatar?: string | null;
  seed?: string | null;
  size?: number;
  className?: string;
  rounded?: "full" | "8";
}) {
  const ring = avatarRing(avatar, seed);
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
