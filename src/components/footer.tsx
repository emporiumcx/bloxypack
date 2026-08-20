"use client";

import Link from "next/link";
import { Icons } from "./icons";

const PAYMENTS = [
  { src: "/img/payment/btc.webp", border: "border-orange", bg: "bg-orange" },
  { src: "/img/payment/eth.webp", border: "border-blue-98", bg: "bg-blue-98" },
  { src: "/img/payment/ltc.webp", border: "border-grey-190", bg: "bg-grey-190" },
  { src: "/img/payment/tether.webp", border: "border-green-83", bg: "bg-green-83" },
  { src: "/img/payment/usdc.webp", border: "border-blue-40", bg: "bg-blue-40" },
  { src: "/img/payment/sol.webp", border: "border-purple-153", bg: "bg-purple-153" },
  { src: "/img/payment/xrp.webp", border: "border-blue-170", bg: "bg-blue-170" },
  { src: "/img/payment/tron.webp", border: "border-red-19", bg: "bg-red-19" },
  { src: "/img/payment/bnb.webp", border: "border-yellow-241", bg: "bg-yellow-241" },
  { src: "/img/payment/dai.webp", border: "border-yellow-244", bg: "bg-yellow-244" },
] as const;

const LINK =
  "w-full text-left text-14 text-grey-142 transition-colors duration-200 hover:text-white active:text-white";

function ColHead({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <button type="button" className="flex w-full items-center justify-start">
      <p className={`text-left text-12 font-bold uppercase ${accent ? "text-green" : "text-grey-70"}`}>{label}</p>
      <div className="@sm/page:hidden ml-4">
        <Icons.chevron className="text-20 text-green transition-transform duration-300 ease-in-out" />
      </div>
    </button>
  );
}

export function SiteFooter() {
  return (
    <div className="relative grid w-full grid-cols-1">
      <div className="@lg/page:grid-cols-[1fr_auto] @sm/page:p-24 @md/page:px-70 @md/page:py-56 grid w-full grid-cols-1 gap-30 border-t-1 border-grey-47 p-24">
        <div className="flex w-full justify-start">
          <div className="grid w-[450px] max-w-full grid-cols-1 gap-16 sm:gap-26">
            <Link aria-label="home" className="relative flex h-full w-full items-center justify-start" href="/">
              <img alt="BloxyWild" className="relative h-64 w-auto object-contain" src="/img/logo.png" />
            </Link>
            <div className="font-chat grid w-full grid-cols-1 gap-16">
              <p className="text-left text-12 text-grey-142">
                BloxyWild is an entirely independent platform. It has no association, partnership, or endorsement from
                Roblox Corporation or any of its subsidiaries or affiliates. Roblox accounts cannot be used to access
                our site, and Robux is not accepted or exchangeable here.
              </p>
              <p className="text-left text-12 text-grey-142">
                BloxyWild is a service provided by D.G.P. SOFTWORKS LTD, registered at Themistokli Dervi 48, 306, 1066
                Nicosia, Cyprus.
              </p>
            </div>
            <div className="flex w-full justify-start">
              <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}>
                {PAYMENTS.map((p) => (
                  <button key={p.src} type="button" className="group relative w-full overflow-hidden rounded-4 bg-grey-47">
                    <div
                      className={`absolute inset-0 rounded-4 border-1 opacity-10 transition-opacity group-hover:opacity-100 group-active:opacity-100 ${p.border}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-grey-58" />
                    <div className={`absolute -top-1/2 left-0 h-1/2 w-full rounded-t-4 blur-[40px] transition-all ${p.bg}`} />
                    <div className="relative grid w-full grid-cols-1 gap-12">
                      <div className="flex w-full justify-center">
                        <div
                          className={`flex h-24 w-24 items-center justify-center rounded-4 border-b-1 border-t-1 border-b-black/20 border-t-white/40 p-3 ${p.bg}`}
                        >
                          <img alt="" className="h-full w-full object-contain" src={p.src} />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full items-start justify-start">
          <div className="@lg/page:w-auto @md/page:grid-cols-[auto_auto_auto_auto] @sm/page:gap-40 grid w-full max-w-full grid-cols-2 items-start gap-24">
            <div className="grid w-full grid-cols-1 gap-16">
              <ColHead label="Play" accent />
              <div className="grid w-full grid-cols-1 gap-8">
                <Link aria-label="link" className={LINK} href="/battles">
                  Battles
                </Link>
                <Link aria-label="link" className={LINK} href="/cases">
                  Cases
                </Link>
                <Link aria-label="link" className={LINK} href="/dice">
                  Dice
                </Link>
                <Link aria-label="link" className={LINK} href="/mines">
                  Mines
                </Link>
                <Link aria-label="link" className={LINK} href="/towers">
                  Towers
                </Link>
                <Link aria-label="link" className={LINK} href="/blackjack">
                  Blackjack
                </Link>
              </div>
            </div>
            <div className="grid w-full grid-cols-1 gap-16">
              <ColHead label="Features" />
              <div className="grid w-full grid-cols-1 gap-8">
                <Link aria-label="link" className={LINK} href="/affiliate">
                  Affiliates
                </Link>
                <Link aria-label="link" className={LINK} href="/leaderboard">
                  Leaderboard
                </Link>
                <Link aria-label="link" className={LINK} href="/marketplace">
                  Marketplace
                </Link>
                <Link aria-label="link" className={LINK} href="/rewards">
                  Rewards
                </Link>
              </div>
            </div>
            <div className="grid w-full grid-cols-1 gap-16">
              <ColHead label="Info" />
              <div className="grid w-full grid-cols-1 gap-8">
                <Link aria-label="link" className={LINK} href="/support">
                  Support
                </Link>
                <Link aria-label="link" className={LINK} href="/faq">
                  FAQ
                </Link>
                <Link aria-label="link" className={LINK} href="/terms">
                  TOS
                </Link>
                <Link aria-label="link" className={LINK} href="/aml">
                  AML
                </Link>
                <Link aria-label="link" className={LINK} href="/privacy">
                  Privacy
                </Link>
                <Link aria-label="link" className={LINK} href="/fairness">
                  Fairness
                </Link>
              </div>
            </div>
            <div className="grid w-full grid-cols-1 gap-16">
              <ColHead label="Socials" />
              <div className="grid w-full grid-cols-1 gap-8">
                <a aria-label="link" className={LINK} target="_blank" rel="noreferrer" href="https://x.com/rostakedotcom">
                  Twitter/X
                </a>
                <a aria-label="link" className={LINK} target="_blank" rel="noreferrer" href="https://discord.gg/rostake">
                  Discord
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full bg-grey-28 p-14">
        <h2 className="text-center text-12 text-grey-142">© 2026 BloxyWild.com All rights reserved.</h2>
      </div>
    </div>
  );
}
