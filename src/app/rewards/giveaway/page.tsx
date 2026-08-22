"use client";

import { useEffect, useState } from "react";
import { CaseOpening } from "@/components/case-opening";
import { Icons } from "@/components/icons";
import { useStore } from "@/components/providers";
import { getGiveawayData, type GiveawayClaim, type GiveawayLive } from "@/lib/backend";
import { getCase } from "@/lib/catalog";
import {
  GIVEAWAY_THEME,
  OFFICIAL_GIVEAWAYS,
  formatGiveawayAmount,
  padGiveaway,
  remainingParts,
  type GiveawayRecurrence,
  type OfficialGiveaway,
} from "@/lib/giveaways";

function TicketIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-16 fill-current" aria-hidden>
      <path d="M1.5 5.25A1.75 1.75 0 0 1 3.25 3.5h9.5A1.75 1.75 0 0 1 14.5 5.25v1.1a.75.75 0 0 1-.53.72 1.5 1.5 0 1 0 0 2.86.75.75 0 0 1 .53.72v1.1A1.75 1.75 0 0 1 12.75 13.5h-9.5A1.75 1.75 0 0 1 1.5 11.75v-1.1a.75.75 0 0 1 .53-.72 1.5 1.5 0 1 0 0-2.86.75.75 0 0 1-.53-.72zm4.25.5a.5.5 0 0 0 0 1h.01a.5.5 0 0 0 0-1zm0 3.5a.5.5 0 0 0 0 1h4.5a.5.5 0 0 0 0-1z" />
    </svg>
  );
}

function PrizeAmount({ amount }: { amount: number }) {
  const { whole, frac } = formatGiveawayAmount(amount);
  return (
    <div className="flex items-center gap-8 text-white">
      <img alt="" src="/img/currency.png" className="size-20 object-contain" />
      <span className="tactic-title-sm">
        {whole}
        <span className="text-grey-142">.{frac}</span>
      </span>
    </div>
  );
}

function CardCountdown({ kind }: { kind: GiveawayRecurrence }) {
  const [parts, setParts] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => setParts(remainingParts(kind));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [kind]);

  const cells = [
    { value: parts.days, label: "Days" },
    { value: parts.hours, label: "Hrs" },
    { value: parts.minutes, label: "Min" },
    { value: parts.seconds, label: "Sec" },
  ];

  return (
    <div className="grid grid-cols-4 gap-8">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="flex flex-col items-center justify-center rounded-8 border border-grey-58 bg-grey-34 px-4 py-10"
        >
          <span className="text-18 font-bold tabular-nums text-white">{padGiveaway(cell.value)}</span>
          <span className="ui-label mt-4 text-10 text-grey-142">{cell.label}</span>
        </div>
      ))}
    </div>
  );
}

function GiveawayCard({
  giveaway,
  live,
}: {
  giveaway: OfficialGiveaway;
  live: GiveawayLive | null;
}) {
  const { user, openModal } = useStore();
  const theme = GIVEAWAY_THEME[giveaway.id];
  const prize = giveaway.prizes[0];
  const deposited = live?.deposited ?? 0;
  const fill = Math.min(100, (deposited / giveaway.depositReq) * 100);
  const entries = live?.entries ?? 0;
  const tickets = live?.tickets ?? 0;
  const eligible = Boolean(live?.eligible);

  function enter() {
    if (!user) return openModal("login");
    openModal("deposit");
  }

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-12 border border-grey-58 bg-grey-39">
      <div className={`pointer-events-none absolute inset-x-0 top-80 h-180 ${theme.glow} opacity-15 blur-[56px]`} />
      <div className="relative z-1 flex h-full flex-col gap-16 p-16">
        <div className="flex items-center justify-between gap-8">
          <div className={`inline-flex items-center gap-6 rounded-6 px-8 py-4 text-11 uppercase ${theme.badge}`}>
            {giveaway.id === "weekly" ? (
              <svg viewBox="0 0 16 16" className="size-14 fill-current" aria-hidden>
                <path d="M8 .833a7.167 7.167 0 1 1 0 14.335A7.167 7.167 0 0 1 8 .833m-.001 3.334c-.327 0-.594.215-.783.524l-.076.14-.628 1.265-.001.002a.45.45 0 0 1-.132.145.6.6 0 0 1-.097.059l-.078.026-1.137.19c-.41.07-.755.272-.866.623-.11.35.053.713.347 1.008l.884.892a.45.45 0 0 1 .098.188.5.5 0 0 1 .016.215v.001l-.253 1.102c-.105.458-.068.912.255 1.15.324.239.767.136 1.17-.105l1.064-.636a.46.46 0 0 1 .219-.049c.092 0 .169.021.214.048l1.066.637c.403.24.847.345 1.171.107s.359-.693.254-1.151l-.253-1.103a.5.5 0 0 1 .016-.216.45.45 0 0 1 .098-.188l.884-.89c.296-.297.46-.661.348-1.011-.112-.351-.457-.552-.867-.621l-1.138-.19a.5.5 0 0 1-.178-.087.45.45 0 0 1-.132-.144L8.856 4.83c-.188-.381-.483-.663-.857-.663" />
              </svg>
            ) : giveaway.id === "monthly" ? (
              <svg viewBox="0 0 14 14" className="size-14 fill-current" aria-hidden>
                <path d="m13.073 7.708.152-1.624c.12-1.275.18-1.912-.038-2.176a.66.66 0 0 0-.45-.245c-.317-.028-.715.426-1.512 1.332-.412.47-.617.704-.847.74a.6.6 0 0 1-.375-.06c-.212-.106-.353-.396-.636-.976L7.875 1.643C7.341.548 7.073 0 6.667 0c-.407 0-.674.548-1.21 1.643L3.968 4.7c-.283.58-.425.87-.637.976a.6.6 0 0 1-.374.06c-.23-.036-.436-.27-.848-.74C1.31 4.09.913 3.635.596 3.663a.66.66 0 0 0-.45.245c-.218.264-.158.901-.038 2.176L.26 7.708c.251 2.675.377 4.012 1.166 4.819.788.806 1.97.806 4.333.806h1.813c2.364 0 3.545 0 4.334-.806.788-.807.914-2.144 1.166-4.82" />
              </svg>
            ) : (
              <Icons.bolt className="size-14" />
            )}
            {giveaway.label}
          </div>
          <div className="flex items-center gap-6 text-grey-142">
            <Icons.users className="size-14" />
            <span className={`text-12 tabular-nums ${live ? "" : "invisible"}`}>{entries.toLocaleString("en-US")}</span>
          </div>
        </div>

        <div className="relative flex h-200 items-center justify-center">
          <div className={`pointer-events-none absolute left-1/2 top-1/2 size-160 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl ${theme.glow}`} />
          <div className="relative z-1 flex -rotate-12 items-center justify-center">
            <img
              alt={prize.name}
              src={prize.image}
              className="h-auto max-h-176 w-auto max-w-[94%] animate-float object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.45)]"
            />
          </div>
        </div>

        <div className="grid gap-4 text-center">
          <h3 className="text-16 text-white">{prize.name}</h3>
          <p className="text-12 text-grey-142">{prize.kind}</p>
        </div>

        <CardCountdown kind={giveaway.id} />

        <div className="grid gap-6">
          <p className="ui-label text-10 text-grey-142">Total prize</p>
          <PrizeAmount amount={giveaway.amount} />
        </div>

        <div className="grid gap-8">
          <div className="flex items-center justify-between gap-8">
            <p className="ui-label text-10 text-grey-142">Deposit</p>
            <p className="text-12 tabular-nums text-grey-190">
              {deposited.toFixed(2)} / {giveaway.depositReq.toFixed(2)}
            </p>
          </div>
          <div className="relative h-8 w-full overflow-hidden rounded-full bg-grey-28">
            <div className={`absolute inset-y-0 left-0 rounded-full ${theme.bar}`} style={{ width: `${fill}%` }} />
          </div>
        </div>

        <div className="mt-auto flex items-center gap-12 pt-4">
          <div className="flex min-w-64 items-center gap-6 text-grey-142">
            <TicketIcon />
            <span className="text-14 tabular-nums text-white">{tickets}</span>
          </div>
          <button
            type="button"
            onClick={enter}
            className={`group/button relative flex h-40 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-6 bg-gradient-to-b ${theme.cta} px-12 shadow-[0_1px_0_rgba(0,0,0,0.25)] transition-all duration-200 hover:brightness-110 active:brightness-95`}
          >
            <p className="ui-btn-label text-13 text-grey-190">{eligible ? "Deposit more" : "Deposit to enter"}</p>
          </button>
        </div>
      </div>
    </article>
  );
}

function ClaimTimer({ expiresAt }: { expiresAt: number }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const tick = () => {
      const total = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      const days = Math.floor(total / 86400);
      const hours = Math.floor((total % 86400) / 3600);
      const mins = Math.floor((total % 3600) / 60);
      const secs = total % 60;
      setLabel(`${padGiveaway(days)}d ${padGiveaway(hours)}h ${padGiveaway(mins)}m ${padGiveaway(secs)}s`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  return <span className="text-12 tabular-nums text-grey-190">{label}</span>;
}

export default function GiveawayPage() {
  const { user, ready } = useStore();
  const [live, setLive] = useState<Record<GiveawayRecurrence, GiveawayLive> | null>(null);
  const [claims, setClaims] = useState<GiveawayClaim[]>([]);
  const [opening, setOpening] = useState<GiveawayClaim | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const load = () => {
      getGiveawayData()
        .then((res) => {
          if (cancelled) return;
          setLive(res.giveaways);
          setClaims(res.claims || []);
        })
        .catch(() => {
          if (cancelled) return;
          setLive({
            daily: { entries: 0, deposited: 0, tickets: 0, eligible: false },
            weekly: { entries: 0, deposited: 0, tickets: 0, eligible: false },
            monthly: { entries: 0, deposited: 0, tickets: 0, eligible: false },
          });
          setClaims([]);
        });
    };
    load();
    const id = window.setInterval(load, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [ready, user?.id, user?.stats.deposit]);

  const openingCase = opening ? getCase(opening.slug) : null;

  return (
    <div className="grid w-full grid-cols-1 gap-20 @md/page:gap-24">
      <div className="flex items-center gap-10">
        <Icons.trophy className="size-20 text-green" />
        <h2 className="text-18 text-white @sm/page:text-24">Official Giveaways</h2>
      </div>
      <p className="text-14 text-grey-190">
        Deposit during the period to earn tickets. Meet the deposit requirement to be eligible when the timer ends.
      </p>
      <div className="grid w-full grid-cols-1 gap-12 @md/page:grid-cols-3">
        {OFFICIAL_GIVEAWAYS.map((giveaway) => (
          <GiveawayCard key={giveaway.id} giveaway={giveaway} live={live?.[giveaway.id] ?? null} />
        ))}
      </div>

      <div className="grid w-full grid-cols-1 gap-16">
        <div className="grid gap-6">
          <h2 className="text-18 text-white @sm/page:text-24">Claim your pack</h2>
          <p className="text-14 text-grey-190">
            If your ticket is drawn, the pack stays here for 7 days. Open it before the timer runs out.
          </p>
        </div>
        {claims.length ? (
          <div className="@sm/page:grid-cols-3 @bt/page:grid-cols-4 grid w-full grid-cols-1 gap-12 sm:grid-cols-2">
            {claims.map((claim) => {
              const theme = GIVEAWAY_THEME[claim.kind];
              return (
                <button
                  key={claim.id}
                  type="button"
                  onClick={() => setOpening(claim)}
                  className="group relative w-full overflow-hidden rounded-12 border border-grey-58 bg-grey-39 text-left transition-transform duration-300 ease-out hover:scale-[1.01]"
                >
                  <div className={`pointer-events-none absolute inset-x-0 top-40 h-120 ${theme.glow} opacity-15 blur-[48px]`} />
                  <div className="relative grid w-full grid-cols-1 gap-12 p-16">
                    <div className="flex items-center justify-between gap-8">
                      <span className={`inline-flex items-center rounded-6 px-8 py-4 text-11 uppercase ${theme.badge}`}>
                        {claim.kind}
                      </span>
                      <ClaimTimer expiresAt={claim.expiresAt} />
                    </div>
                    <div className="relative flex w-full justify-center">
                      <img alt="" className="h-[120px] w-[120px] object-contain" src={claim.image} />
                    </div>
                    <h4 className="text-center text-16 text-white">{claim.name}</h4>
                    <div className="flex h-40 items-center justify-center rounded-6 bg-gradient-to-b from-green to-green-2 px-10">
                      <p className="ui-btn-label text-13 text-grey-190">Open case</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-180 items-center justify-center rounded-12 border border-dashed border-grey-58 bg-grey-39 px-20 py-32">
            <p className="max-w-520 text-center text-14 text-grey-142">
              {user
                ? "No packs to claim right now. When your ticket is called, it will show up here for 7 days."
                : "Sign in to see packs you win. Drawn tickets stay claimable for 7 days."}
            </p>
          </div>
        )}
      </div>

      {opening && openingCase ? (
        <CaseOpening
          item={openingCase}
          variant="modal"
          canOpen
          giveawayWinId={opening.id}
          onClose={() => setOpening(null)}
          onOpened={() => {
            setClaims((prev) => prev.filter((claim) => claim.id !== opening.id));
          }}
        />
      ) : null}
    </div>
  );
}

