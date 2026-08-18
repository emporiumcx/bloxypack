"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { BattleReel, BATTLE_SPIN_MS, type BattleReelPhase } from "@/components/battle-reel";
import { BattleSeat, BattleVs } from "@/components/battle-seat";
import { Bux } from "@/components/bux";
import { GreenButton, GreyButton, green3d } from "@/components/green-button";
import { Icons } from "@/components/icons";
import { ItemBg } from "@/components/item-bg";
import { useStore } from "@/components/providers";
import { subscribeBattles, type BattleGame } from "@/lib/backend";
import { battleCaseImage, mapBattleGame } from "@/lib/battles-map";
import { botName } from "@/lib/bots";
import { dropFromTicket, dropsForCase, type CaseDrop } from "@/lib/catalog";

function playSfx(src: string, volume = 1) {
  const audio = new Audio(src);
  audio.volume = volume;
  void audio.play().catch(() => {});
}

function mergeBattle(prev: BattleGame | null, next: BattleGame) {
  if (!prev) return next;
  return {
    ...next,
    boxes: next.boxes?.some((b) => b.box?.items?.length) ? next.boxes : prev.boxes,
    fair: { ...prev.fair, ...next.fair },
  };
}

function seatGroups(slots: number, mode: BattleGame["mode"]) {
  if (mode === "team" && slots === 4) return [[0, 1], [2, 3]];
  if (slots === 2) return [[0], [1]];
  return [Array.from({ length: slots }, (_, i) => i)];
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function caseSlugs(game: BattleGame) {
  const slugs: string[] = [];
  for (const box of game.boxes || []) {
    const slug = box.box?.slug;
    if (!slug) continue;
    for (let i = 0; i < (box.count || 1); i++) slugs.push(slug);
  }
  return slugs;
}

function playLandSfx(game: BattleGame, round: number) {
  playSfx("/sounds/case_land_sweet.wav", 0.8);
  const slugs = caseSlugs(game);
  const colors = (game.bets || []).map((b) => {
    const ticket = b.outcomes?.[round];
    const slug = slugs[round];
    if (ticket == null || !slug) return null;
    return dropFromTicket(slug, ticket)?.color;
  });
  if (colors.includes("YELLOW")) playSfx("/sounds/goldspin.mp3", 0.7);
  else if (colors.includes("PURPLE")) {
    const v = 1 + Math.floor(Math.random() * 2);
    playSfx(`/sounds/battle/Land Epic V${v}.wav`, 0.75);
  }
}

export default function BattleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, openModal, applyUser, battlesJoin, battlesBot, battlesGame } = useStore();
  const [game, setGame] = useState<BattleGame | null>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<BattleReelPhase>("idle");
  const [spinKey, setSpinKey] = useState(0);
  const [round, setRound] = useState(-1);
  const [count, setCount] = useState<number | null>(null);
  const [replaying, setReplaying] = useState(false);
  const seenRef = useRef(-1);
  const landTimer = useRef(0);
  const replayRef = useRef(false);

  useEffect(() => {
    let alive = true;
    let retry = 0;
    const load = () => {
      battlesGame(id)
        .then((res) => {
          if (alive && res.game) setGame((prev) => mergeBattle(prev, res.game));
        })
        .catch(() => {
          if (!alive) return;
          retry = window.setTimeout(load, 400);
        });
    };
    load();
    const unsub = subscribeBattles((state) => {
      const found = state.games.find((g) => g._id === id);
      if (found) setGame((prev) => mergeBattle(prev, found));
    });
    return () => {
      alive = false;
      window.clearTimeout(retry);
      unsub();
    };
  }, [id, battlesGame]);

  useEffect(() => {
    return () => window.clearTimeout(landTimer.current);
  }, []);

  const battle = useMemo(() => (game ? mapBattleGame(game) : null), [game]);
  const cases = battle?.cases.filter(Boolean) ?? [];
  const outcomeCount = Math.max(0, ...(game?.bets || []).map((b) => b.outcomes?.length || 0));

  useEffect(() => {
    if (game?.state !== "countdown") {
      setCount(null);
      return;
    }
    setCount(3);
    playSfx("/sounds/countdown.mp3", 0.55);
    const t = window.setInterval(() => {
      setCount((c) => {
        if (c == null || c <= 1) {
          window.clearInterval(t);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [game?.state]);

  useEffect(() => {
    if (!game || replayRef.current) return;
    if (game.state === "completed") {
      if (outcomeCount > 0 && seenRef.current < 0) {
        seenRef.current = outcomeCount;
        setRound(outcomeCount - 1);
        setPhase("landed");
      }
      return;
    }
    if (outcomeCount <= 0) return;
    if (seenRef.current < 0 && ["rolling", "pending"].includes(game.state) && outcomeCount > 1) {
      seenRef.current = outcomeCount;
      setRound(outcomeCount - 1);
      setPhase("landed");
      return;
    }
    if (outcomeCount > seenRef.current) {
      seenRef.current = outcomeCount;
      setRound(outcomeCount - 1);
      setPhase("spinning");
      setSpinKey((k) => k + 1);
      window.clearTimeout(landTimer.current);
      landTimer.current = window.setTimeout(() => {
        setPhase("landed");
        playLandSfx(game, outcomeCount - 1);
      }, BATTLE_SPIN_MS);
    }
  }, [game, game?.state, outcomeCount]);

  const replay = async () => {
    if (!game || replayRef.current || outcomeCount <= 0) return;
    replayRef.current = true;
    setReplaying(true);
    for (let r = 0; r < outcomeCount; r++) {
      if (!replayRef.current) break;
      setRound(r);
      setPhase("spinning");
      setSpinKey((k) => k + 1);
      await wait(BATTLE_SPIN_MS);
      if (!replayRef.current) break;
      setPhase("landed");
      playLandSfx(game, r);
      await wait(700);
    }
    replayRef.current = false;
    setReplaying(false);
  };

  const stopReplay = () => {
    replayRef.current = false;
    setReplaying(false);
    if (outcomeCount > 0) {
      setRound(outcomeCount - 1);
      setPhase("landed");
    }
  };

  if (!battle || !game) {
    return (
      <div className="grid gap-12">
        <Link href="/battles" className="text-14 text-grey-142 hover:text-white">
          ← Back to battles
        </Link>
        <p className="text-16">Loading battle…</p>
      </div>
    );
  }

  const ended = game.state === "completed";
  const waiting = game.state === "created";
  const groups = seatGroups(battle.slots, game.mode);
  const joinCost = battle.cost * (1 - (game.options?.funding || 0) / 100);
  const creatorId = game.bets.find((b) => b.slot === 0)?.user?._id;
  const isCreator = Boolean(user && creatorId && String(creatorId) === user.id);
  const alreadyIn = Boolean(user && game.bets.some((b) => b.user?._id && String(b.user._id) === user.id));
  const currentSlug = cases[Math.max(0, round)] || cases[0];
  const catalogDrops = currentSlug ? dropsForCase(currentSlug) : [];
  const currentDrops =
    catalogDrops.length > 0
      ? catalogDrops
      : (game.boxes?.find((b) => b.box?.slug === currentSlug)?.box?.items || []).map((it, i) => ({
          name: it.name,
          id: it.dropId ?? i,
          value: (it.amountFixed || 0) / 1000,
          chance: 0,
          color: (it.color === "YELLOW" || it.color === "PURPLE" || it.color === "BLUE" ? it.color : "GRAY") as CaseDrop["color"],
          minTicket: 0,
          maxTicket: 0,
          image: it.image,
        }));

  const seats = Array.from({ length: battle.slots }, (_, i) => {
    const bet = (game.bets || []).find((b) => b.slot === i);
    if (!bet) return { slot: i, filled: false as const };
    const pulls = (bet.outcomes || [])
      .map((ticket, ri) => {
        const slug = cases[ri];
        return slug ? dropFromTicket(slug, ticket) : null;
      })
      .filter(Boolean) as CaseDrop[];
    const total = pulls.reduce((s, d) => s + d.value, 0);
    const score = game.options?.terminal ? pulls[pulls.length - 1]?.value ?? 0 : total;
    const winner = round >= 0 ? pulls[round] ?? null : null;
    return {
      slot: i,
      filled: true as const,
      bet,
      name: bet.bot ? botName(i) : bet.user?.username || "Player",
      pulls,
      total,
      score,
      winner,
      won: ended && (bet.payout || 0) > 0,
      bot: Boolean(bet.bot),
    };
  });

  const jackpotOdds = seats.map((seat) => {
    if (!game.options?.jackpot || !seat.filled) return 0;
    const raw = seats.map((s) => (s.filled ? Math.max(1, Math.round(s.score * 1000)) : 0));
    const max = Math.max(1, ...raw);
    const weights = game.options?.cursed ? raw.map((v) => (v > 0 ? max + 1 - v : 0)) : raw;
    const sum = weights.reduce((a, b) => a + b, 0);
    return sum > 0 ? weights[seat.slot]! / sum : 0;
  });

  const join = async (slot: number) => {
    if (!user) return openModal("login");
    if (user.balance < joinCost) return openModal("deposit");
    setBusy(true);
    try {
      const res = await battlesJoin(game._id, slot);
      if (res.user) applyUser(res.user);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not join.");
    } finally {
      setBusy(false);
    }
  };

  const fillBots = async () => {
    if (!user) return openModal("login");
    setBusy(true);
    try {
      await battlesBot(game._id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not add bots.");
    } finally {
      setBusy(false);
    }
  };

  const statusText = replaying
    ? `Replay ${Math.max(1, round + 1)}/${cases.length || 1}`
    : ended
      ? "Completed"
      : game.state === "countdown"
        ? count && count > 0
          ? `Starting in ${count}`
          : "Starting…"
        : game.state === "pending"
          ? "Waiting for EOS block"
          : game.state === "rolling"
            ? `Round ${Math.max(1, outcomeCount)}/${cases.length || 1}`
            : waiting
              ? "Waiting for players"
              : game.state;

  const firstFilled = seats.findIndex((s) => s.filled);

  return (
    <div className="grid w-full grid-cols-1 gap-16">
      <div className="flex items-center justify-between text-13 text-grey-142">
        <Link href="/battles" className="hover:text-white">
          ← Back to battles
        </Link>
        <div className="flex gap-12">
          <button type="button" className="hover:text-white" onClick={() => navigator.clipboard.writeText(window.location.href)}>
            Share
          </button>
          <Link href="/fairness" className="hover:text-white">
            Provably fair
          </Link>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-12 bg-grey-39 px-12 py-12 md:px-20">
        <div className="grid w-full grid-cols-1 items-center gap-16 md:grid-cols-[auto_1fr_auto]">
          <div>
            <p className="text-12 uppercase text-grey-142">Battle cost</p>
            <Bux value={battle.cost} className="text-18" />
            {(game.options?.funding || 0) > 0 ? (
              <div className="mt-6 flex items-center gap-8 text-12 text-grey-142">
                <span>Borrow {Math.min(80, game.options?.funding || 0)}%</span>
                <span>·</span>
                <span>Join</span>
                <Bux value={joinCost} size="sm" />
              </div>
            ) : null}
          </div>
          <div className="relative min-h-[80px] overflow-hidden rounded-4 bg-grey-28">
            <div className="flex h-[80px] w-max items-center transition-transform duration-500" style={{ transform: `translateX(${Math.max(0, 8 - Math.max(0, round) * 84)}px)` }}>
              {cases.map((slug, i) => {
                const active = i === Math.max(0, round);
                const opened = i < Math.max(0, round) || (phase === "landed" && i === round);
                return (
                  <span
                    key={`${slug}-${i}`}
                    className={`flex h-80 w-84 items-center justify-center transition-opacity ${active ? "opacity-100" : opened ? "opacity-55" : "opacity-35"}`}
                  >
                    <img alt="" src={battleCaseImage(slug)} className={`h-72 w-72 object-contain ${active ? "scale-110" : ""}`} />
                  </span>
                );
              })}
            </div>
          </div>
          <div className="text-right">
            <p className="text-14 text-white">
              {battle.players.length}
              <span className="text-grey-142">/{battle.slots}</span>
            </p>
            <p className="text-12 uppercase text-grey-142">{battle.teams}</p>
            <div className="mt-4 flex justify-end gap-6">
              {game.options?.jackpot ? (
                <span title="Jackpot" className="flex items-center gap-4 text-11 uppercase text-[#FE963B]">
                  <Icons.jackpot /> Jackpot
                </span>
              ) : null}
              {game.options?.cursed ? (
                <span title="Crazy" className="flex items-center gap-4 text-11 uppercase text-pink-231">
                  <Icons.wild /> Crazy
                </span>
              ) : null}
              {game.options?.terminal ? (
                <span title="Terminal" className="flex items-center gap-4 text-11 uppercase text-red">
                  <Icons.terminal /> Terminal
                </span>
              ) : null}
            </div>
            <p className="text-12 uppercase text-grey-142">{statusText}</p>
          </div>
        </div>
      </div>

      <div className="relative">
        {count != null && count > 0 ? (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <p className="font-display text-72 text-cream drop-shadow-[0_8px_24px_rgba(0,0,0,0.65)]">{count}</p>
          </div>
        ) : game.state === "pending" && !replaying && phase === "idle" ? (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <p className="rounded-8 bg-grey-28/80 px-16 py-8 text-14 text-grey-190">Waiting for EOS block…</p>
          </div>
        ) : null}

        <div className="flex w-full items-start gap-12">
          {groups.map((group, gi) => (
            <div key={`g-${gi}`} className="contents">
              {gi > 0 ? (
                <div className="flex w-20 shrink-0 items-center self-stretch">
                  <BattleVs />
                </div>
              ) : null}
              {group.map((slot) => {
                const seat = seats[slot]!;
                return (
                  <div key={slot} className="grid min-w-0 flex-1 grid-cols-1 gap-12 rounded-12 bg-grey-39 p-12">
                    <div className="flex items-center justify-between gap-8">
                      <div className="flex min-w-0 items-center gap-8">
                        <BattleSeat
                          name={seat.filled ? seat.name : undefined}
                          filled={seat.filled}
                          size={44}
                          bot={seat.filled ? seat.bot : false}
                          slot={seat.slot}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-13 text-white">{seat.filled ? seat.name : "Waiting"}</p>
                          {seat.filled ? <Bux value={seat.score} size="xs" /> : <p className="text-11 text-grey-142">Empty seat</p>}
                          {seat.filled && game.options?.jackpot && jackpotOdds[slot]! > 0 ? (
                            <p className="text-11 text-[#FE963B]">{Math.round(jackpotOdds[slot]! * 100)}%</p>
                          ) : null}
                        </div>
                      </div>
                      {ended && seat.filled ? (
                        <span className={`rounded-6 px-8 py-4 text-11 font-bold ${seat.won ? "bg-green text-grey-28" : "bg-red/20 text-red"}`}>
                          {seat.won ? "WINNER" : "LOST"}
                        </span>
                      ) : null}
                    </div>

                    {seat.filled ? (
                      <BattleReel
                        drops={currentDrops}
                        winner={seat.winner}
                        phase={waiting || (!replaying && game.state === "countdown") ? "idle" : phase}
                        spinKey={spinKey}
                        sound={slot === firstFilled}
                      />
                    ) : waiting && !alreadyIn ? (
                      <div className="flex min-h-[420px] flex-col items-center justify-center gap-12 rounded-10 bg-grey-28">
                        <Icons.seat className="text-32 text-grey-142" />
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void join(slot)}
                          className={`flex h-40 w-[min(180px,80%)] items-center justify-center ${green3d} text-14 font-bold uppercase text-gold-deep`}
                        >
                          Join
                        </button>
                        <Bux value={joinCost} size="sm" />
                      </div>
                    ) : (
                      <div className="flex min-h-[420px] items-center justify-center rounded-10 bg-grey-28">
                        <p className="text-13 text-grey-142">Waiting…</p>
                      </div>
                    )}

                    {seat.filled && seat.pulls.length ? (
                      <div className="grid grid-cols-4 gap-6">
                        {seat.pulls.map((d, i) => (
                          <div
                            key={`${d.id}-${i}`}
                            className={`relative flex flex-col items-center rounded-8 bg-grey-28 p-6 ${i === round ? "ring-1 ring-green" : ""}`}
                          >
                            <ItemBg className="opacity-30" />
                            <img
                              alt=""
                              src={`https://cdn.rostake.com/items_centered/${d.id}.webp`}
                              className="relative h-36 w-36 object-contain"
                              onError={(e) => {
                                e.currentTarget.src = d.image;
                              }}
                            />
                            <Bux value={d.value} size="xs" />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {ended ? (
        <div className="flex justify-center gap-8">
          {replaying ? (
            <GreyButton onClick={stopReplay}>Stop replay</GreyButton>
          ) : (
            <GreenButton onClick={() => void replay()} icon={<Icons.replay className="text-18" />} disabled={outcomeCount <= 0} wide={false} className="min-w-[160px]">
              Replay
            </GreenButton>
          )}
          <Link href="/battles" className="flex h-40 items-center rounded-6 border-1 border-grey-70 bg-grey-58 px-16 text-14 font-bold uppercase tracking-wide text-cream">
            Back to battles
          </Link>
        </div>
      ) : waiting && isCreator ? (
        <div className="flex justify-center gap-8">
          <GreenButton onClick={() => void fillBots()} disabled={busy || battle.players.length >= battle.slots}>
            Fill with bots
          </GreenButton>
        </div>
      ) : waiting && !alreadyIn ? (
        <p className="text-center text-13 text-grey-142">Join an empty seat to start this battle.</p>
      ) : null}
    </div>
  );
}
