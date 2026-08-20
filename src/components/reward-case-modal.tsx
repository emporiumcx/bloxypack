"use client";

import { useEffect, useMemo, useState } from "react";
import { Bux } from "./bux";
import { Icons } from "./icons";
import { useStore } from "./providers";
import { sendRewardOpen, type RewardsInfo } from "@/lib/backend";
import { dropsForCase, pickDrop, type CaseDrop } from "@/lib/catalog";
import { getRewardCase } from "@/lib/rewards";

const EXIT_MS = 220;

function itemSrc(id: number) {
  return `https://cdn.rostake.com/items_centered/${id}.webp`;
}

function formatChance(n: number) {
  return `${n.toFixed(2)}%`;
}

export function RewardCaseModal({
  slug,
  canOpen,
  onClose,
  onOpened,
}: {
  slug: string;
  canOpen: boolean;
  onClose: () => void;
  onOpened?: (rewards: RewardsInfo) => void;
}) {
  const { user, openModal, applyUser } = useStore();
  const box = getRewardCase(slug);
  const drops = useMemo(() => dropsForCase(slug), [slug]);
  const listed = useMemo(() => [...drops].sort((a, b) => b.value - a.value || a.minTicket - b.minTicket), [drops]);
  const [leaving, setLeaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hit, setHit] = useState<CaseDrop | null>(null);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function requestClose() {
    if (leaving || busy) return;
    setLeaving(true);
    window.setTimeout(onClose, EXIT_MS);
  }

  function showHit(drop: CaseDrop, isDemo: boolean) {
    setHit(drop);
    setDemo(isDemo);
  }

  function onDemo() {
    if (busy) return;
    const drop = pickDrop(drops);
    if (drop) showHit(drop, true);
  }

  async function onUnbox() {
    if (busy) return;
    if (!user) return openModal("login");
    if (!canOpen) return;
    setBusy(true);
    setError("");
    try {
      const res = await sendRewardOpen(slug);
      applyUser(res.user);
      const won =
        drops.find((d) => d.id === res.games[0]?.item.dropId) ??
        drops.find((d) => res.games[0] && res.games[0].ticket >= d.minTicket && res.games[0].ticket <= d.maxTicket) ??
        pickDrop(drops);
      if (won) showHit(won, false);
      if (res.rewards) onOpened?.(res.rewards);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open case.");
    }
    setBusy(false);
  }

  if (!box) return null;

  const bonus = slug.startsWith("bonus-");
  const daily = slug.startsWith("daily-");

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-12 sm:p-24 ${leaving ? "pointer-events-none" : ""}`}>
      <button
        type="button"
        aria-label="close overlay"
        className={`${leaving ? "animate-overlay-out" : "animate-overlay-in"} absolute inset-0 bg-black/70 backdrop-blur-[8px]`}
        onClick={leaving ? undefined : requestClose}
      />
      <div
        className={`relative z-10 flex h-[min(860px,calc(100vh-48px))] w-full max-w-[780px] ${
          leaving ? "animate-modal-out" : "animate-modal-in"
        } flex-col overflow-hidden rounded-12 bg-grey-34 shadow-[0_24px_80px_rgba(0,0,0,0.55)]`}
      >
        <div className="flex items-center justify-between gap-12 border-b-1 border-grey-47 px-16 py-14 sm:px-24">
          <p className="truncate text-18 font-bold text-white sm:text-20">{box.name}</p>
          <button
            type="button"
            aria-label="close"
            onClick={requestClose}
            className="flex h-36 w-36 shrink-0 items-center justify-center rounded-8 bg-grey-28 text-grey-142 hover:bg-grey-47 hover:text-white"
          >
            <Icons.close className="text-18" />
          </button>
        </div>

        <div className="scrollbar-y min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-16 px-16 py-16 sm:px-24">
            <div className="flex justify-center">
              <img
                alt=""
                src={box.image}
                className="h-[140px] w-[140px] object-contain"
                style={box.hue ? { filter: `hue-rotate(${box.hue}deg)` } : undefined}
              />
            </div>

            {hit ? (
              <div className="flex items-center gap-12 rounded-10 bg-grey-28 p-12">
                <img
                  alt=""
                  src={itemSrc(hit.id)}
                  className="h-48 w-48 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = hit.image;
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-12 text-grey-142">{demo ? "Demo result" : "You unboxed"}</p>
                  <p className="truncate text-14 text-white">{hit.name}</p>
                </div>
                <Bux value={hit.value} size="sm" />
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
              <button
                type="button"
                disabled={busy}
                onClick={onDemo}
                className="flex h-40 items-center justify-center rounded-8 border-b-2 border-t-2 border-b-black/40 border-t-white/10 bg-grey-28 px-16 text-grey-142 transition-colors hover:bg-grey-39 hover:text-white disabled:opacity-40"
              >
                <span className="ui-btn-label text-13">Demo Spin</span>
              </button>
              <button
                type="button"
                disabled={busy || !canOpen}
                onClick={onUnbox}
                className="flex h-40 items-center justify-center rounded-8 border-b-3 border-t-3 border-b-green-95 border-t-green-222 bg-green px-16 shadow-[0_2px_0_rgba(0,0,0,0.25)] disabled:opacity-40"
              >
                <span className="ui-btn-label text-13 text-grey-28">{busy ? "..." : "Unbox for free"}</span>
              </button>
            </div>

            {error ? <p className="text-13 text-red">{error}</p> : null}

            <div className="grid gap-4">
              <p className="text-16 text-white">{bonus ? "Your bonus case" : daily ? "Your daily case" : "Case contents"}</p>
              {!canOpen ? (
                <p className="text-13 text-grey-142">
                  {bonus ? "Wager more to unlock better rewards..." : daily ? "Reach a higher level or wait until this case resets." : "This case is locked."}
                </p>
              ) : (
                <p className="text-13 text-grey-142">Open this case for free.</p>
              )}
            </div>

            <div className="grid gap-6">
              {listed.map((d) => {
                const active = hit?.id === d.id && hit.minTicket === d.minTicket;
                return (
                  <div
                    key={`${d.id}-${d.minTicket}`}
                    className={`grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-10 rounded-8 px-10 py-8 sm:grid-cols-[48px_minmax(0,1.4fr)_auto_72px_110px] ${
                      active ? "bg-green-8 ring-1 ring-inset ring-green" : "bg-grey-28"
                    }`}
                  >
                    <img
                      alt=""
                      src={itemSrc(d.id)}
                      className="h-40 w-40 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = d.image;
                      }}
                    />
                    <p className="truncate text-13 text-white">{d.name}</p>
                    <Bux value={d.value} size="xs" />
                    <p className="hidden text-right text-12 text-grey-142 sm:block">{formatChance(d.chance)}</p>
                    <p className="hidden text-right text-12 text-grey-142 sm:block">
                      {d.minTicket.toLocaleString("en-US")} - {d.maxTicket.toLocaleString("en-US")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
