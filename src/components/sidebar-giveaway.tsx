"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icons } from "./icons";

type Recurrence = "daily" | "weekly" | "monthly";

const THEME = {
  daily: {
    badge: "bg-[#14d96b]/10 text-[#14d96b]",
    glow: "bg-[#14d96b]",
    fill: "fill-[#14d96b]",
    dot: "bg-[#14d96b]",
  },
  weekly: {
    badge: "bg-[#f81f48]/10 text-[#f81f48]",
    glow: "bg-[#f81f48]",
    fill: "fill-[#f81f48]",
    dot: "bg-[#f81f48]",
  },
  monthly: {
    badge: "bg-[#ffae3a]/10 text-[#ffae3a]",
    glow: "bg-[#ffae3a]",
    fill: "fill-[#ffae3a]",
    dot: "bg-[#ffae3a]",
  },
} as const;

const GIVEAWAYS: {
  id: Recurrence;
  label: string;
  amount: number;
  image: string;
}[] = [
  { id: "daily", label: "Daily", amount: 242.3, image: "/cdn/packs/daily-1.webp" },
  { id: "weekly", label: "Weekly", amount: 2871.76, image: "/cdn/cases/prestige.webp" },
  { id: "monthly", label: "Monthly", amount: 10392.86, image: "/cdn/cases/oil-baron.webp" },
];

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function remainingParts(kind: Recurrence) {
  const now = Date.now();
  const d = new Date();
  let end: number;
  if (kind === "daily") {
    end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
  } else if (kind === "weekly") {
    const day = d.getUTCDay();
    const daysToAdd = (8 - day) % 7 || 7;
    end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + daysToAdd);
  } else {
    end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
  }
  const total = Math.max(0, Math.floor((end - now) / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function StarBadgeIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-14 fill-current" aria-hidden>
      <path d="M8 .833a7.167 7.167 0 1 1 0 14.335A7.167 7.167 0 0 1 8 .833m-.001 3.334c-.327 0-.594.215-.783.524l-.076.14-.628 1.265-.001.002a.45.45 0 0 1-.132.145.6.6 0 0 1-.097.059l-.078.026-1.137.19c-.41.07-.755.272-.866.623-.11.35.053.713.347 1.008l.884.892a.45.45 0 0 1 .098.188.5.5 0 0 1 .016.215v.001l-.253 1.102c-.105.458-.068.912.255 1.15.324.239.767.136 1.17-.105l1.064-.636a.46.46 0 0 1 .219-.049c.092 0 .169.021.214.048l1.066.637c.403.24.847.345 1.171.107s.359-.693.254-1.151l-.253-1.103a.5.5 0 0 1 .016-.216.45.45 0 0 1 .098-.188l.884-.89c.296-.297.46-.661.348-1.011-.112-.351-.457-.552-.867-.621l-1.138-.19a.5.5 0 0 1-.178-.087.45.45 0 0 1-.132-.144L8.856 4.83c-.188-.381-.483-.663-.857-.663" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg viewBox="0 0 14 14" className="size-14 fill-current" aria-hidden>
      <path d="m13.073 7.708.152-1.624c.12-1.275.18-1.912-.038-2.176a.66.66 0 0 0-.45-.245c-.317-.028-.715.426-1.512 1.332-.412.47-.617.704-.847.74a.6.6 0 0 1-.375-.06c-.212-.106-.353-.396-.636-.976L7.875 1.643C7.341.548 7.073 0 6.667 0c-.407 0-.674.548-1.21 1.643L3.968 4.7c-.283.58-.425.87-.637.976a.6.6 0 0 1-.374.06c-.23-.036-.436-.27-.848-.74C1.31 4.09.913 3.635.596 3.663a.66.66 0 0 0-.45.245c-.218.264-.158.901-.038 2.176L.26 7.708c.251 2.675.377 4.012 1.166 4.819.788.806 1.97.806 4.333.806h1.813c2.364 0 3.545 0 4.334-.806.788-.807.914-2.144 1.166-4.82" />
    </svg>
  );
}

function BadgeIcon({ id }: { id: Recurrence }) {
  if (id === "weekly") return <StarBadgeIcon />;
  if (id === "monthly") return <CrownIcon />;
  return <Icons.bolt className="size-14" />;
}

function GiveawayAmount({ amount }: { amount: number }) {
  const [whole, frac] = amount.toFixed(2).split(".");
  return (
    <div className="tactic-title-sm inline-block w-full whitespace-nowrap text-center text-white">
      <span className="mr-3">
        <img
          alt=""
          src="/img/currency.png"
          className="mb-[0.1em] inline-block size-[1em] object-contain align-middle"
        />
      </span>
      {Number(whole).toLocaleString("en-US")}
      <span className="text-grey-142">.{frac}</span>
    </div>
  );
}

function Countdown({ kind }: { kind: Recurrence }) {
  const [parts, setParts] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => setParts(remainingParts(kind));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [kind]);

  const cells = [
    { value: parts.days, label: "d" },
    { value: parts.hours, label: "h" },
    { value: parts.minutes, label: "m" },
    { value: parts.seconds, label: "s" },
  ];

  return (
    <div className="grid auto-cols-fr grid-flow-col gap-4">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="flex flex-col items-center justify-center rounded-6 border border-grey-58 bg-grey-34/80 px-4 py-6 backdrop-blur-sm"
        >
          <span className="text-13 font-bold tabular-nums text-white">{pad(cell.value)}</span>
          <span className="text-[9px] uppercase leading-none text-grey-142">{cell.label}</span>
        </div>
      ))}
    </div>
  );
}

export function SidebarGiveaway() {
  const [index, setIndex] = useState(0);
  const active = GIVEAWAYS[index] ?? GIVEAWAYS[0];
  const theme = THEME[active.id];

  useEffect(() => {
    if (GIVEAWAYS.length <= 1) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % GIVEAWAYS.length), 5000);
    return () => window.clearInterval(id);
  }, []);

  const slides = useMemo(() => GIVEAWAYS, []);

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="relative isolate overflow-hidden rounded-12 border border-grey-58 bg-grey-39">
        <div className={`pointer-events-none absolute inset-x-0 bottom-64 -z-0 h-200 ${theme.glow} opacity-20 blur-[48px]`} />
        <div className="relative z-1">
          {slides.map((item, i) => {
            const on = i === index;
            const look = THEME[item.id];
            return (
              <Link
                key={item.id}
                href="/rewards"
                aria-hidden={!on}
                tabIndex={on ? 0 : -1}
                className={`group inset-0 flex flex-col gap-8 p-12 pb-4 transition-opacity ease-out ${
                  i === 0 ? "relative" : "absolute"
                } ${on ? "opacity-100" : "pointer-events-none opacity-0"}`}
                style={{ transitionDuration: "600ms" }}
              >
                <div
                  className={`inline-flex items-center gap-6 self-center rounded-6 px-8 py-4 text-11 uppercase ${look.badge}`}
                >
                  <BadgeIcon id={item.id} />
                  {item.label}
                </div>
                <GiveawayAmount amount={item.amount} />
                <div className="relative flex h-96 items-center justify-center">
                  <div
                    className={`pointer-events-none absolute top-1/2 left-1/2 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-2xl ${look.glow}`}
                  />
                  <img
                    alt=""
                    src="/img/bloxypack-mark.png"
                    className="pointer-events-none absolute top-1/2 left-1/2 z-0 h-4/5 w-auto max-w-[45%] -translate-x-1/2 -translate-y-1/2 opacity-15 blur-[2px]"
                  />
                  <img
                    alt=""
                    src={item.image}
                    className="relative z-1 h-auto max-h-88 w-auto max-w-[75%] animate-float object-contain transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                </div>
                <Countdown kind={item.id} />
                <div className="ui-label text-center text-10 text-grey-142">Giveaway</div>
              </Link>
            );
          })}
        </div>
      </div>
      {slides.length > 1 ? (
        <div className="flex items-center justify-center gap-6">
          {slides.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Show giveaway ${i + 1} of ${slides.length}`}
              onClick={() => setIndex(i)}
              className={`h-6 cursor-pointer rounded-full transition-all duration-500 ease-out ${
                i === index ? `w-20 ${theme.dot}` : "w-6 bg-grey-58"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
