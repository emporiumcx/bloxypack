import { Icons } from "@/components/icons";

export const SITE_GAMES = [
  { href: "/battles", label: "Case Battles", img: "/img/home/battles.webp", icon: Icons.battles, soon: false },
  { href: "/blackjack", label: "Blackjack", img: "/img/home/blackjack.webp", icon: Icons.blackjack, soon: false },
  { href: "/dice", label: "Dice", img: "/img/home/dice.webp", icon: Icons.dice, soon: false },
  { href: "/mines", label: "Mines", img: "/img/home/mines.webp", icon: Icons.mines, soon: false },
  { href: "/towers", label: "Towers", img: "/img/home/towers.webp", icon: Icons.towers, soon: false },
  { href: "/cases", label: "Case Opening", img: "/img/home/cases.webp", icon: Icons.cases, soon: false },
  { href: "/roulette", label: "Roulette", img: "/img/home/roulette.webp", icon: Icons.roulette, soon: false },
  { href: "/crash", label: "Crash", img: "/img/home/crash.webp", icon: Icons.crash, soon: true },
] as const;
