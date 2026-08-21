"use client";

import Link from "next/link";
import { Icons } from "./icons";
import { useStore } from "./providers";
import { CHAT_SOCIALS } from "@/lib/socials";

const GAMES = [
  { href: "/cases", label: "Cases" },
  { href: "/battles", label: "Battles" },
  { href: "/towers", label: "Tower" },
  { href: "/mines", label: "Mines" },
  { href: "/dice", label: "Dice" },
];

const PLATFORM = [
  { href: "/rewards", label: "Rewards" },
  { href: "/affiliate", label: "Affiliates" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/fairness", label: "Provably Fair" },
  { href: "/faq", label: "FAQ" },
];

const DOCUMENTS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/cookies", label: "Cookie Policy" },
];

const PAYMENTS = [
  { name: "Visa", src: "/img/payment/brand/visa.webp" },
  { name: "Mastercard", src: "/img/payment/brand/mastercard.webp" },
  { name: "BTC", src: "/img/payment/brand/btc.webp" },
  { name: "ETH", src: "/img/payment/brand/eth.webp" },
  { name: "LTC", src: "/img/payment/brand/ltc.webp" },
  { name: "USDT", src: "/img/payment/brand/usdt.webp" },
  { name: "USDC", src: "/img/payment/brand/usdc.webp" },
  { name: "SOL", src: "/img/payment/brand/sol.webp" },
  { name: "BNB", src: "/img/payment/brand/bnb.webp" },
];

const SEO = [
  { href: "/", label: "roblox case opening" },
  { href: "/", label: "apertura de cajas de roblox" },
  { href: "/", label: "abertura de caixas roblox" },
  { href: "/", label: "открытие кейсов roblox" },
  { href: "/", label: "ouverture de caisses roblox" },
  { href: "/", label: "roblox Kisten öffnen" },
  { href: "/", label: "otwieranie skrzynek roblox" },
  { href: "/", label: "apertura casse roblox" },
  { href: "/", label: "roblox ládanyitás" },
  { href: "/", label: "otvaranje kutija roblox" },
  { href: "/", label: "roblox dėžučių atidarymas" },
];

const LINK = "text-12 text-grey-142 transition-colors hover:text-white";

function LogoGlow() {
  return (
    <div className="relative flex h-56 items-center justify-center py-12">
      <div className="pointer-events-none absolute top-0 left-1/2 h-32 w-136 -translate-x-1/2 bg-green/60 opacity-60 blur-[30px]" />
      <div className="pointer-events-none absolute top-0 left-1/2 h-2 w-200 -translate-x-1/2 bg-gradient-to-r from-green/0 via-green to-green/0 opacity-30 blur-[1px]" />
      <div className="header-logo-dots pointer-events-none absolute top-0 left-1/2 h-240 w-240 -translate-x-1/2" />
      <img alt="BloxyPack" src="/img/logo.png" className="relative z-10 h-36 w-auto object-contain" />
    </div>
  );
}

function FlagEn() {
  return (
    <svg viewBox="0 0 60 30" className="h-12 w-auto rounded-2" aria-hidden>
      <clipPath id="en-flag">
        <rect width="60" height="30" rx="1" />
      </clipPath>
      <g clipPath="url(#en-flag)">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0 0l60 30M60 0L0 30" stroke="#fff" strokeWidth="6" />
        <path d="M0 0l60 30M60 0L0 30" stroke="#C8102E" strokeWidth="4" />
        <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
        <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

function Col({ title, items }: { title: string; items: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-14 font-medium text-white">{title}</h3>
      <ul className="mt-12 space-y-4">
        {items.map((item) => (
          <li key={item.href + item.label}>
            <Link href={item.href} className={LINK}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const { openModal } = useStore();

  return (
    <div className="mx-auto mb-32 mt-66 w-full max-w-1600 overflow-hidden rounded-8 px-16 pb-80 transition-all duration-400 ease-in-out md:mt-86 md:pb-40">
      <div className="flex w-full items-center gap-8 px-16 md:hidden">
        <LogoGlow />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-64">
        <div className="mb-auto hidden flex-col items-center justify-center self-stretch md:flex">
          <LogoGlow />
          <div className="z-10 mt-12 mb-auto flex max-w-200 flex-wrap gap-8 px-16">
            {CHAT_SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="btn-glass inline-flex size-32 items-center justify-center rounded-6 p-7 text-14 text-grey-190"
              >
                <s.icon className="text-14" />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-1 flex-wrap justify-between gap-24 px-16 md:mt-16 md:px-0">
          <Col title="Games" items={GAMES} />
          <div>
            <h3 className="text-14 font-medium text-white">Platform</h3>
            <ul className="mt-12 space-y-4">
              {PLATFORM.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={LINK}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <button type="button" onClick={() => openModal("support")} className={LINK}>
                  Support
                </button>
              </li>
            </ul>
          </div>
          <Col title="Documents" items={DOCUMENTS} />
        </div>

        <div className="hidden gap-8 self-start md:flex">
          <button
            type="button"
            className="inline-flex h-32 cursor-pointer items-center gap-8 rounded-6 border border-grey-58 bg-grey-39 px-12 text-12 text-white"
          >
            <FlagEn />
            EN
            <Icons.chevron className="text-14 text-grey-142" />
          </button>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="btn-glass inline-flex h-32 items-center rounded-6 px-12 text-12 font-medium text-white"
          >
            To Top
          </button>
        </div>
      </div>

      <div className="mx-auto my-16 w-full border-y border-grey-58 py-16">
        <div className="flex flex-wrap items-center justify-center gap-24">
          {PAYMENTS.map((p) => (
            <img
              key={p.name}
              alt={p.name}
              src={p.src}
              className="h-16 w-60 min-w-40 object-contain opacity-45 grayscale"
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 px-16 py-12 text-center text-12 text-grey-142">
        {SEO.map((item, i) => (
          <span key={item.label}>
            {i > 0 ? <span className="mr-4">|</span> : null}
            <Link href={item.href} className="hover:text-white">
              {item.label}
            </Link>
          </span>
        ))}
      </div>

      <div className="px-16">
        <div className="mb-8 text-center text-12 text-grey-142">© 2026 BloxyPack. All rights reserved. v0.1.0</div>
        <div className="text-center text-12 text-grey-142">
          BloxyPack is an entirely independent platform. It has no association, partnership, or endorsement from Roblox
          Corporation or any of its subsidiaries or affiliates. Roblox accounts cannot be used to access our site, and
          Robux is not accepted or exchangeable here. BloxyPack is a service provided by D.G.P. SOFTWORKS LTD, registered
          at Themistokli Dervi 48, 306, 1066 Nicosia, Cyprus.
        </div>
      </div>
    </div>
  );
}
