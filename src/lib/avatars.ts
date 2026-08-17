export const ARCTIC_AVATARS = ["red", "green", "blue", "orange", "yellow", "pink", "purple"] as const;

export type ArcticAvatar = (typeof ARCTIC_AVATARS)[number];

export const AVATAR_RING: Record<ArcticAvatar, string> = {
  red: "var(--color-red)",
  green: "var(--color-green)",
  blue: "var(--color-blue)",
  orange: "var(--color-orange)",
  yellow: "var(--color-yellow)",
  pink: "var(--color-pink)",
  purple: "var(--color-purple)",
};

export function avatarFromSeed(seed?: string | null) {
  const value = String(seed || "user");
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash + value.charCodeAt(i) * (i + 1)) % ARCTIC_AVATARS.length;
  }
  return ARCTIC_AVATARS[hash];
}

export function avatarName(avatar?: string | null, seed?: string | null): ArcticAvatar {
  const raw = String(avatar || "").trim();
  const name = raw.replace(/\.(png|webp|jpe?g)$/i, "").toLowerCase();
  if ((ARCTIC_AVATARS as readonly string[]).includes(name)) return name as ArcticAvatar;
  return avatarFromSeed(seed || name || "user");
}

export function avatarRing(avatar?: string | null, seed?: string | null) {
  return AVATAR_RING[avatarName(avatar, seed)];
}

export function avatarSrc(avatar?: string | null, seed?: string | null) {
  const raw = String(avatar || "").trim();
  if (/^https?:\/\//i.test(raw) || (raw.startsWith("/img/") && !raw.startsWith("/img/avatars/"))) {
    return raw;
  }
  return `/img/avatars/${avatarName(avatar, seed)}.png`;
}
