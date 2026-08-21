import { Icons } from "@/components/icons";

export const CHAT_SOCIALS = [
  { href: "https://kick.com/rostakedotcom", label: "Kick", icon: Icons.kick },
  { href: "https://www.tiktok.com/@rostakedotcom", label: "TikTok", icon: Icons.tiktok },
  { href: "https://x.com/rostakedotcom", label: "X", icon: Icons.twitter },
  { href: "https://discord.gg/rostake", label: "Discord", icon: Icons.discord },
  { href: "https://t.me/rostakedotcom", label: "Telegram", icon: Icons.telegram },
] as const;

export const SIDEBAR_SOCIALS = CHAT_SOCIALS.filter((s) => s.label !== "TikTok");
