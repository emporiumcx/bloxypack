"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BattleSeat } from "@/components/battle-seat";
import { Bux } from "@/components/bux";
import { FairnessControl } from "@/components/fairness";
import { GreenButton, GreyButton, green3d } from "@/components/green-button";
import { Icons } from "@/components/icons";
import { ItemBg } from "@/components/item-bg";
import { useStore } from "@/components/providers";
import { subscribeBattles, type BattleGame, type BattleItem } from "@/lib/backend";
import { battleCaseImage, battleFormatTag, battleTeamSizes, mapBattleGame } from "@/lib/battles-map";
import { botAvatar, botName } from "@/lib/avatars";
import { dropsForCase, getCase, itemImage, type CaseDrop, type DropColor } from "@/lib/catalog";
import { JackpotDraw, SLOT_COLORS, WinnerOverlay, battleSfx } from "@/components/battle-result";
import { BattleBadge } from "@/components/battle-modes";
import { notifyError } from "@/components/toasts";

const RARITY: Record<DropColor, string> = {
  RAINBOW: "#ff4ecd",
  GOLD: "rgb(255, 200, 50)",
  RED: "rgb(255, 64, 80)",
  PURPLE: "rgb(136, 71, 255)",
  GREEN: "#5e98d9",
  GRAY: "rgb(176, 195, 217)",
  YELLOW: "rgb(255, 200, 50)",
  BLUE: "#4b69ff",
};

const STRIP_LEN = 32;
const WIN_INDEX = 24;
const SPIN_MS = 4200;
const FAST_MS = 2200;
const SETTLE_MS = 400;
const ARENA_H = 460;

function easeOutQuint(t: number) {
  return 1 - (1 - t) ** 5;
}

function itemSrc(id?: number, image?: string) {
  if (id) return itemImage(id);
  if (image && /^https?:\/\//i.test(image)) return image;
  if (image) return image.startsWith("/") ? image : `/cdn/items/${image}`;
  return "/img/home/cases.webp";
}

function asColor(raw?: string): DropColor {
  const c = String(raw || "").toUpperCase();
  if (c === "RAINBOW" || c.includes("FF4ECD") || c.includes("#FF4E")) return "RAINBOW";
  if (c === "GOLD" || c === "YELLOW" || c.includes("GOLD") || c.includes("228, 174") || c.includes("#E4AE") || c.includes("255, 200")) return "GOLD";
  if (c === "RED" || c.includes("255, 64") || c.includes("#FF40")) return "RED";
  if (c === "PURPLE" || c.includes("136, 71") || c.includes("#8847")) return "PURPLE";
  if (c === "GREEN" || c.includes("46, 204") || c.includes("#2ECC")) return "GREEN";
  if (c === "BLUE" || c.includes("94, 152") || c.includes("#5E98")) return "BLUE";
  return "GRAY";
}

function flattenItems(items: BattleItem[] | undefined): CaseDrop[] {
  if (!items?.length) return [];
  let pos = 0;
  return items.map((raw, i) => {
    const nested = raw.item || {};
    const id = raw.dropId || Number(String(nested.image || raw.image || "").match(/(\d+)/)?.[1]) || i;
    const minTicket = raw.minTicket ?? pos;
    const span = Math.max(1, raw.tickets || 0);
    const maxTicket = raw.maxTicket ?? minTicket + span - 1;
    pos = Math.max(pos, maxTicket + 1);
    return {
      name: nested.name || raw.name || "Item",
      id,
      value: (nested.amountFixed ?? raw.amountFixed ?? 0) / 1000,
      chance: 0,
      color: asColor(raw.color || nested.color),
      minTicket,
      maxTicket: maxTicket >= minTicket ? maxTicket : minTicket,
      image: itemSrc(id, nested.image || raw.image),
    };
  });
}

function dropsForRound(game: BattleGame, round: number): CaseDrop[] {
  const slugs: string[] = [];
  const boxes: BattleGame["boxes"] = [];
  for (const box of game.boxes || []) {
    for (let i = 0; i < (box.count || 1); i++) {
      slugs.push(box.box?.slug || "");
      boxes.push(box);
    }
  }
  const box = boxes[round];
  const fromServer = flattenItems(box?.box?.items);
  if (fromServer.length) return fromServer;
  return dropsForCase(slugs[round] || "");
}

function dropFromTicket(drops: CaseDrop[], ticket: number) {
  if (!drops.length) return null;
  return drops.find((d) => ticket >= d.minTicket && ticket <= d.maxTicket) ?? drops[drops.length - 1] ?? null;
}

function hashSeed(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619);
  return h >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleSeeded<T>(list: T[], seed: number) {
  const rand = mulberry32(seed);
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildStrip(drops: CaseDrop[], winner: CaseDrop | null | undefined, seed: number) {
  const strip: CaseDrop[] = [];
  if (!drops.length) return strip;
  const pool = shuffleSeeded(drops, seed);
  for (let i = 0; i < STRIP_LEN; i++) {
    strip.push(i === WIN_INDEX && winner ? winner : pool[i % pool.length]!);
  }
  return strip;
}

function playSfx(src: string, volume = 1) {
  const audio = new Audio(src);
  audio.volume = volume;
  void audio.play().catch(() => {});
}

function outcomeCount(game: BattleGame) {
  return Math.max(0, ...(game.bets || []).map((b) => b.outcomes?.length || 0));
}

function roundSlugs(game: BattleGame) {
  const slugs: string[] = [];
  for (const box of game.boxes || []) {
    for (let i = 0; i < (box.count || 1); i++) slugs.push(box.box?.slug || "");
  }
  return slugs;
}

function Toggle({ on, icon, onClick }: { on: boolean; icon: React.ReactNode; onClick: () => void }) {
  return (
    <div className="group/toggle relative flex cursor-pointer items-start">
      <div className="tr flex h-full w-full items-center justify-center rounded-8">
        <div className="text-18 text-green">{icon}</div>
        <div className="ml-8">
          <div className={`relative flex h-20 w-36 items-center justify-center rounded-full transition-colors duration-200 ${on ? "bg-green" : "bg-grey-39"}`}>
            <div className={`tr absolute top-2 h-16 w-16 rounded-full ${on ? "left-18 bg-grey-34" : "left-2 bg-grey-58"}`} />
          </div>
        </div>
        <button type="button" aria-label="toggle" className="absolute inset-0" onClick={onClick} />
      </div>
    </div>
  );
}

function jackpotShares(totals: number[], cursed?: boolean) {
  if (!totals.some((v) => v > 0)) return totals.map(() => 0);
  const max = Math.max(0, ...totals);
  const tickets = totals.map((v) => (cursed ? Math.max(0.0001, max - v + 0.0001) : Math.max(0, v)));
  const sum = tickets.reduce((a, b) => a + b, 0) || 1;
  return tickets.map((t) => (t / sum) * 100);
}

function BattleReel({
  strip,
  phase,
  spinKey,
  duration,
  itemSize,
  slot,
}: {
  strip: CaseDrop[];
  phase: "idle" | "spinning" | "landed";
  spinKey: number;
  duration: number;
  itemSize: number;
  slot: number;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const winRef = useRef<HTMLDivElement>(null);
  const frozen = useRef<{ key: number; strip: CaseDrop[] }>({ key: -1, strip });
  if (phase !== "spinning" || frozen.current.key !== spinKey || !frozen.current.strip.length) {
    frozen.current = { key: spinKey, strip };
  }
  const shown = frozen.current.strip;
  const startY = ARENA_H / 2 - slot * 2.2 - slot / 2;
  const endY = ARENA_H / 2 - WIN_INDEX * slot - slot / 2;

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const apply = (y: number, blur = 0) => {
      el.style.transform = `translate3d(0, ${y}px, 0)`;
      el.style.filter = blur > 0.4 ? `blur(${blur.toFixed(2)}px)` : "none";
    };
    if (phase !== "spinning" || spinKey === 0) {
      apply(phase === "landed" ? endY : startY);
      return;
    }
    apply(startY, 4);
    let raf = 0;
    let cancelled = false;
    let t0 = 0;
    const step = (now: number) => {
      if (cancelled) return;
      if (!t0) t0 = now;
      const u = Math.min((now - t0) / duration, 1);
      const y = startY + (endY - startY) * easeOutQuint(u);
      apply(y, u < 0.5 ? (1 - u / 0.5) * 2.4 : 0);
      if (u < 1) raf = requestAnimationFrame(step);
      else {
        apply(endY);
        winRef.current?.animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.12)", offset: 0.35 },
            { transform: "scale(1)" },
          ],
          { duration: 520, easing: "cubic-bezier(0.22, 1.4, 0.36, 1)" },
        );
      }
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [phase, spinKey, duration, startY, endY]);

  const winner = phase !== "idle" ? shown[WIN_INDEX] : null;
  const color = winner ? RARITY[winner.color] : "transparent";
  const landed = phase === "landed" && winner;

  return (
    <div className="csd-reel" style={{ ["--slot" as string]: `${slot}px`, ["--itemSize" as string]: `${itemSize}px` }}>
      <div className="csd-reel-window">
        <div
          className="csd-reel-glow"
          style={{
            background: `radial-gradient(circle, ${color}99 0%, ${color}22 42%, transparent 70%)`,
            opacity: phase === "idle" ? 0 : landed ? 1 : 0.55,
          }}
        />
        <div ref={stripRef} className="csd-reel-strip">
          {shown.map((d, j) => (
            <div key={j} className={`csd-reel-slot${landed && j === WIN_INDEX ? " is-won" : ""}`}>
              <div ref={landed && j === WIN_INDEX ? winRef : undefined} className="csd-reel-skin">
                <img alt="" src={itemSrc(d.id, d.image)} />
              </div>
            </div>
          ))}
        </div>
        {landed ? (
          <div className="csd-reel-meta">
            <p className="csd-reel-name">{winner.name}</p>
            <Bux value={winner.value} size="xs" tone="gold" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function BattleLive({ id }: { id: string }) {
  const router = useRouter();
  const { user, openModal, applyUser, battlesJoin, battlesBot, battlesGame, battlesCancel, battlesCreate } = useStore();
  const [game, setGame] = useState<BattleGame | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fast, setFast] = useState(false);
  const [sound, setSound] = useState(true);
  const [count, setCount] = useState<number | null>(null);
  const [phase, setPhase] = useState<"idle" | "spinning" | "landed">("idle");
  const [spinKey, setSpinKey] = useState(0);
  const [spinMs, setSpinMs] = useState(SPIN_MS);
  const [round, setRound] = useState(0);
  const [strips, setStrips] = useState<CaseDrop[][]>([]);
  const [pulled, setPulled] = useState<CaseDrop[][]>([]);
  const [busy, setBusy] = useState(false);
  const [overlay, setOverlay] = useState<"none" | "jackpot" | "winner">("none");
  const landedRef = useRef(0);
  const spinningRef = useRef(false);
  const primed = useRef(false);
  const gameRef = useRef(game);
  const spinTimer = useRef<number | null>(null);
  const watchingRef = useRef(false);
  gameRef.current = game;

  useEffect(() => {
    let alive = true;
    let tries = 0;
    let timer: number | undefined;
    primed.current = false;
    setGame(null);
    setLoadError(null);

    const apply = (found?: BattleGame) => {
      if (!alive || !found || String(found._id) !== String(id)) return;
      setGame(found);
      setLoadError(null);
    };

    const load = () => {
      battlesGame(id)
        .then((res) => apply(res.game))
        .catch((err) => {
          if (!alive) return;
          const msg = err instanceof Error ? err.message : "Could not load battle.";
          if (/not connected/i.test(msg) && tries < 40) {
            tries += 1;
            timer = window.setTimeout(load, 250);
            return;
          }
          setLoadError(msg);
        });
    };
    load();
    const unsub = subscribeBattles((state) => {
      apply(state.games.find((g) => String(g._id) === String(id)) || state.history.find((g) => String(g._id) === String(id)));
    });
    return () => {
      alive = false;
      if (timer) window.clearTimeout(timer);
      unsub();
    };
  }, [id, battlesGame]);

  useEffect(() => {
    if (!game || game.state !== "cancelled") return;
    router.replace("/battles");
  }, [game, router]);

  useEffect(() => {
    if (!game || game.state !== "countdown") return;
    setCount(3);
    if (sound) battleSfx("/sounds/battles/battle_countdown.mp3", 0.8);
    const timers = [window.setTimeout(() => setCount(2), 1000), window.setTimeout(() => setCount(1), 2000), window.setTimeout(() => setCount(0), 3000)];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [game?._id, game?.state, sound]);

  const battle = useMemo(() => (game ? mapBattleGame(game) : null), [game]);
  const duration = fast ? FAST_MS : SPIN_MS;
  const soundRef = useRef(sound);
  const durationRef = useRef(duration);
  soundRef.current = sound;
  durationRef.current = duration;
  const seats = game?.playerCount || 2;
  const itemSize = seats >= 6 ? 78 : seats >= 4 ? 88 : 100;
  const slot = seats >= 6 ? 102 : seats >= 4 ? 114 : 126;

  const startRound = (index: number, nextGame: BattleGame) => {
    if (spinningRef.current) return;
    const drops = dropsForRound(nextGame, index);
    const fallback: CaseDrop = { name: "Item", id: 0, value: 0, chance: 0, color: "GRAY", minTicket: 0, maxTicket: 0, image: "" };
    const pool = drops.length ? drops : [fallback];
    const nextStrips: CaseDrop[][] = [];
    const nextPulled: CaseDrop[] = [];
    for (let i = 0; i < nextGame.playerCount; i++) {
      const bet = (nextGame.bets || []).find((b) => b.slot === i);
      const ticket = bet?.outcomes?.[index];
      const winner = ticket == null ? null : dropFromTicket(pool, ticket);
      nextStrips[i] = buildStrip(pool, winner, hashSeed(`${nextGame._id}:${index}:${i}`));
      if (winner) nextPulled[i] = winner;
    }
    setStrips(nextStrips);
    setRound(index);
    setPhase("spinning");
    setSpinMs(durationRef.current);
    setSpinKey((n) => n + 1);
    spinningRef.current = true;
    if (soundRef.current) playSfx("/sounds/cases/spin_start.mp3", 0.35);
    if (spinTimer.current) window.clearTimeout(spinTimer.current);
    spinTimer.current = window.setTimeout(() => {
      spinningRef.current = false;
      landedRef.current = index + 1;
      setPulled((prev) => {
        const copy = prev.map((row) => [...row]);
        nextPulled.forEach((item, seat) => {
          if (!item) return;
          if (!copy[seat]) copy[seat] = [];
          if (copy[seat]!.length < index + 1) copy[seat] = [...copy[seat]!, item];
        });
        return copy;
      });
      setPhase("landed");
      if (soundRef.current) playSfx("/sounds/cases/battle-land-1.mp3", 1);
      const totalRounds = roundSlugs(nextGame).length;
      if (watchingRef.current && index + 1 < totalRounds) {
        window.setTimeout(() => startRound(index + 1, nextGame), 900);
        return;
      }
      if (index + 1 >= totalRounds) {
        watchingRef.current = false;
        if (nextGame.options?.jackpot) setOverlay("jackpot");
        else setOverlay("winner");
      }
    }, durationRef.current + SETTLE_MS);
  };

  const outcomes = game ? outcomeCount(game) : 0;

  useEffect(() => {
    const nextGame = gameRef.current;
    if (!nextGame) return;
    const n = outcomeCount(nextGame);
    if (!primed.current) {
      primed.current = true;
      const done = nextGame.state === "completed" ? n : Math.max(0, n - (n > 0 ? 1 : 0));
      const start: CaseDrop[][] = [];
      const history: CaseDrop[][] = [];
      for (let i = 0; i < nextGame.playerCount; i++) {
        const bet = (nextGame.bets || []).find((b) => b.slot === i);
        history[i] = [];
        for (let r = 0; r < done; r++) {
          const hit = dropFromTicket(dropsForRound(nextGame, r), bet?.outcomes?.[r] || 0);
          if (hit) history[i]!.push(hit);
        }
        const last = history[i]![history[i]!.length - 1];
        const roundIndex = Math.max(0, last ? done - 1 : 0);
        start[i] = buildStrip(dropsForRound(nextGame, roundIndex), last, hashSeed(`${nextGame._id}:idle:${i}:${roundIndex}`));
      }
      setPulled(history);
      setStrips(start);
      landedRef.current = done;
      if (nextGame.state === "completed") {
        setPhase("landed");
        setOverlay("winner");
        return;
      }
      if (n > landedRef.current) startRound(landedRef.current, nextGame);
      return;
    }
    if (spinningRef.current) return;
    if (n > landedRef.current) startRound(landedRef.current, nextGame);
  }, [game?._id, game?.state, outcomes, game?.playerCount]);

  useEffect(() => {
    return () => {
      if (spinTimer.current) window.clearTimeout(spinTimer.current);
    };
  }, []);

  if (!battle || !game) {
    return (
      <div className="grid gap-12">
        <Link href="/battles" className="text-14 text-grey-142 hover:text-white">
          ← Back to All Battles
        </Link>
        <p className="text-16">{loadError || "Loading battle…"}</p>
      </div>
    );
  }

  const ended = game.state === "completed";
  const waiting = game.state === "created";
  const funding = Math.min(80, Math.max(0, game.options?.funding || 0));
  const joinCost = battle.cost * (1 - funding / 100);
  const creatorId = game.bets?.find((b) => b.slot === 0)?.user?._id;
  const isCreator = Boolean(user && creatorId && String(creatorId) === String(user.id));
  const emptySeats = Array.from({ length: game.playerCount }, (_, i) => i).filter((i) => !(game.bets || []).some((b) => b.slot === i));
  const slugs = roundSlugs(game);
  const totals = Array.from({ length: game.playerCount }, (_, i) => (pulled[i] || []).reduce((s, d) => s + d.value, 0));
  const shares = jackpotShares(totals, game.options?.cursed);
  const pot = totals.reduce((a, b) => a + b, 0);
  const teamSizes = battleTeamSizes(game);
  const groups: number[][] = [];
  {
    let i = 0;
    for (const size of teamSizes) {
      groups.push(Array.from({ length: size }, (_, k) => i + k));
      i += size;
    }
  }
  const counting = count != null && count > 0;
  const roundLabel = counting
    ? "Countdown"
    : overlay === "jackpot"
      ? "Jackpot Draw"
      : `Round ${Math.min(round + 1, slugs.length || 1)} / ${slugs.length || 1}`;
  const formatTag = battleFormatTag(game);
  const currentCase = getCase(slugs[round] || "");
  const currentBox = game.boxes?.[Math.min(round, (game.boxes?.length || 1) - 1)];
  const currentPrice = currentCase?.price ?? (currentBox?.box?.amount || 0) / 1000;
  const payoutWinners = (game.bets || []).filter((b) => (b.payout || 0) > 0);
  const winnerSlot = [...payoutWinners].sort((a, b) => (totals[b.slot] || 0) - (totals[a.slot] || 0))[0]?.slot ?? 0;

  const runReplay = () => {
    watchingRef.current = true;
    spinningRef.current = false;
    landedRef.current = 0;
    setPulled(Array.from({ length: game.playerCount }, () => []));
    setOverlay("none");
    setPhase("idle");
    setCount(3);
    if (sound) battleSfx("/sounds/battles/battle_countdown.mp3", 0.8);
    window.setTimeout(() => setCount(2), 1000);
    window.setTimeout(() => setCount(1), 2000);
    window.setTimeout(() => {
      setCount(null);
      startRound(0, game);
    }, 3000);
  };

  const join = async (slotIndex: number) => {
    if (!user) return openModal("login");
    if (user.balance < joinCost) return openModal("deposit");
    setBusy(true);
    try {
      if (sound) battleSfx("/sounds/battles/battle_join.mp3", 0.6);
      const res = await battlesJoin(game._id, slotIndex);
      if (res.user) applyUser(res.user);
    } catch (err) {
      notifyError(err, "Could not join.");
    } finally {
      setBusy(false);
    }
  };

  const callBots = async () => {
    if (!user) return openModal("login");
    setBusy(true);
    try {
      await battlesBot(game._id);
    } catch (err) {
      notifyError(err, "Could not add bots.");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!user) return openModal("login");
    setBusy(true);
    try {
      const res = await battlesCancel(game._id);
      if (res.user) applyUser(res.user);
      router.replace("/battles");
    } catch (err) {
      notifyError(err, "Could not cancel.");
    } finally {
      setBusy(false);
    }
  };

  const recreate = async () => {
    if (!user) return openModal("login");
    const boxes = (game.boxes || [])
      .map((b) => ({ _id: b.box?._id || "", count: b.count || 1 }))
      .filter((b) => b._id);
    if (!boxes.length) return router.push("/battles/create");
    setBusy(true);
    try {
      const res = await battlesCreate({
        playerCount: game.playerCount,
        mode: game.mode,
        boxes,
        funding: game.options?.funding ?? 0,
        private: game.options?.private ?? false,
        cursed: game.options?.cursed ?? false,
        terminal: game.options?.terminal ?? false,
        jackpot: game.options?.jackpot ?? false,
        teams: game.options?.teams,
        affiliateOnly: false,
        levelMin: 0,
      });
      if (res.user) applyUser(res.user);
      router.push(`/battles/${res.game._id}`);
    } catch (err) {
      notifyError(err, "Could not recreate battle.");
    } finally {
      setBusy(false);
    }
  };


  const renderReel = (i: number) => {
    const bet = (game.bets || []).find((b) => b.slot === i);
    const filled = Boolean(bet);
    return filled ? (
      <BattleReel
        key={i}
        strip={strips[i] || []}
        phase={waiting || counting ? "idle" : phase}
        spinKey={spinKey}
        duration={spinMs}
        itemSize={itemSize}
        slot={slot}
      />
    ) : (
      <div key={i} className="grid h-full place-items-center">
        {waiting ? (
          <button type="button" disabled={busy} onClick={() => join(i)} className={`flex h-40 w-[min(100%,160px)] items-center justify-center ${green3d}`}>
            <span className="ui-btn-label text-13 text-grey-190">Join</span>
          </button>
        ) : (
          <p className="text-13 text-grey-142">Empty</p>
        )}
      </div>
    );
  };

  const renderSeat = (i: number) => {
    const bet = (game.bets || []).find((b) => b.slot === i);
    const filled = Boolean(bet);
    const name = bet?.bot ? botName(i) : bet?.user?.username || "Waiting";
    const seatPulled = pulled[i] || [];
    const borrowed = funding > 0 && filled && (bet?.amount || 0) < (game.amount || 0) - 1;
    return (
      <div key={i} className="flex min-w-0 flex-col">
        <div className="flex items-center gap-8 rounded-8 bg-grey-39 px-10 py-8">
          <BattleSeat name={name} filled={filled} size={40} src={bet?.bot ? botAvatar(i) : bet?.user?.avatar} level={bet?.user?.level || 1} interactive={false} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-13 uppercase text-white">{filled ? name : "Waiting"}</p>
            <div className="mt-4 flex flex-wrap items-center gap-6">
              {game.options?.jackpot ? (
                <span
                  className="rounded-4 px-6 py-2 text-11 font-bold"
                  style={{
                    color: SLOT_COLORS[i % SLOT_COLORS.length],
                    background: `${SLOT_COLORS[i % SLOT_COLORS.length]}22`,
                    boxShadow: `inset 0 0 0 1px ${SLOT_COLORS[i % SLOT_COLORS.length]}66`,
                  }}
                >
                  {(shares[i] || 0).toFixed(2)}%
                </span>
              ) : filled ? (
                <Bux value={totals[i] || 0} size="xs" />
              ) : null}
              {borrowed ? <span className="rounded-4 bg-[#f2c338]/20 px-6 py-2 text-11 font-bold text-[#f2c338]">{funding}%</span> : null}
            </div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6">
          {seatPulled.map((item, ri) => (
            <div
              key={`${item.id}-${ri}`}
              className="relative overflow-hidden rounded-8 bg-grey-28 px-8 py-8"
              style={{ opacity: game.options?.terminal && ri < seatPulled.length - 1 && !ended ? 0.45 : 1 }}
            >
              <p className="text-11 uppercase text-grey-142">Round {ri + 1}</p>
              <div className="mt-6 flex items-center gap-8">
                <div className="relative h-40 w-40 shrink-0">
                  <ItemBg className="inset-0 h-full w-full opacity-40" color={RARITY[item.color] ?? RARITY.GRAY} />
                  <img alt="" src={itemSrc(item.id, item.image)} className="relative h-40 w-40 object-contain" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-12 text-white">{item.name}</p>
                  <Bux value={item.value} size="xs" tone="gold" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-full justify-center">
      <div className="grid w-full max-w-screen-lg grid-cols-1 gap-12">
        <div className="flex w-full items-center justify-between gap-12">
          <Link
            href="/battles"
            className="group/button relative flex h-32 items-center justify-center rounded-6 bg-grey-39 px-10 text-14 text-grey-142 transition-colors hover:bg-grey-47 hover:text-white"
          >
            <Icons.chevronLeft className="text-18" />
            <span className="ml-4">Back to All Battles</span>
          </Link>
          <div className="flex items-center gap-8 rounded-8 bg-grey-39 px-8 py-6 text-13 text-white">
            <Icons.chevronLeft className="text-16 text-grey-142" />
            <span className="ui-label">{roundLabel}</span>
            <Icons.chevronRight className="text-16 text-grey-142" />
          </div>
          <div className="flex items-center gap-8">
            <Toggle on={sound} icon={<Icons.volume />} onClick={() => setSound((v) => !v)} />
            <Toggle on={fast} icon={<Icons.bolt />} onClick={() => setFast((v) => !v)} />
            <FairnessControl
              compact
              game="Battles"
              fields={[
                { label: "Server Seed", value: game.fair?.seedServer, placeholder: "Revealed after the battle" },
                { label: "Server Seed (Hashed)", value: game.fair?.hash },
                { label: "Block Number", value: game.fair?.blockId != null ? String(game.fair.blockId) : undefined, placeholder: "Set when the battle starts" },
                { label: "Block Hash", value: game.fair?.seedPublic, placeholder: "Set when the battle starts" },
              ]}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-12">
          <div className="flex items-center gap-8">
            <span className="inline-flex h-26 items-center rounded-6 bg-grey-28 px-8 text-11 font-medium text-grey-142">{formatTag}</span>
            {game.options?.jackpot ? <BattleBadge kind="jackpot" /> : game.mode === "group" ? <BattleBadge kind="group" /> : <BattleBadge kind="normal" />}
            {game.options?.cursed ? <BattleBadge kind="crazy" /> : null}
            {game.options?.terminal ? <BattleBadge kind="terminal" /> : null}
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-12 overflow-x-auto">
            {slugs.filter(Boolean).map((slug, i) => {
              const active = i === round && !waiting;
              const c = getCase(slug);
              const price = c?.price ?? (game.boxes?.find((b) => b.box?.slug === slug)?.box?.amount || 0) / 1000;
              return (
                <div key={`${slug}-${i}`} className={`flex shrink-0 items-center gap-8 ${active ? "opacity-100" : "opacity-45"}`}>
                  <img alt="" src={battleCaseImage(slug)} className={active ? "h-56 w-56 object-contain" : "h-40 w-40 object-contain"} />
                  {active ? (
                    <div>
                      <p className="max-w-140 truncate text-12 text-white">{c?.name || currentBox?.box?.name || slug}</p>
                      <Bux value={price || currentPrice} size="xs" tone="gold" />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="ml-auto text-right">
            <p className="text-14 text-white">
              {Math.min(round + 1, slugs.length || 1)}
              <span className="text-grey-142">/{slugs.length || 1}</span>
            </p>
            <p className="text-11 uppercase text-grey-142">Battle Cost</p>
            <Bux value={battle.cost} size="sm" tone="gold" />
          </div>
        </div>

        <div className="csd-arena relative" style={{ height: ARENA_H }}>
          <div className="csd-arena-grid" />
          <div className="csd-hitline" />
          <div className="csd-pointer csd-pointer-l" />
          <div className="csd-pointer csd-pointer-r" />
          {game.options?.jackpot && overlay === "none" && !counting ? (
            <div className="pointer-events-none absolute left-1/2 top-12 z-20 flex -translate-x-1/2 items-center gap-8 rounded-full bg-black/55 px-12 py-6 ring-1 ring-white/10">
              <Icons.jackpot className="text-16" />
              <span className="text-11 font-black tracking-[0.18em] text-[#7eb6ff]">JACKPOT</span>
              <Bux value={pot} size="xs" tone="gold" />
            </div>
          ) : game.mode === "group" && overlay === "none" && !counting ? (
            <div className="pointer-events-none absolute left-1/2 top-12 z-20 flex -translate-x-1/2 items-center gap-8 rounded-full bg-black/55 px-12 py-6 ring-1 ring-white/10">
              <span className="text-11 font-black tracking-[0.18em] text-[#e8b923]">GROUP</span>
              <Bux value={pot} size="xs" tone="gold" />
            </div>
          ) : null}
          {counting ? (
            <div className="absolute inset-0 z-30 grid place-items-center">
              <p className="text-[120px] font-black leading-none text-white/75">{count}</p>
            </div>
          ) : null}
          {overlay === "jackpot" ? (
            <JackpotDraw game={game} totals={totals} winnerSlot={winnerSlot} sound={sound} onDone={() => setOverlay("winner")} />
          ) : null}
          {overlay === "winner" ? (
            <WinnerOverlay
              game={game}
              totals={totals}
              funding={funding}
              recreateCost={battle.cost + (battle.cost * (game.playerCount - 1) * funding) / 100}
              busy={busy}
              sound={sound}
              onRecreate={() => void recreate()}
              onWatchAgain={runReplay}
            />
          ) : null}
          <div className={`relative z-10 flex h-full ${counting ? "opacity-0" : ""}`}>
            {groups.map((g, gi) => (
              <div key={gi} className="flex min-w-0 flex-1">
                {gi > 0 ? (
                  <div className="relative z-10 flex w-36 shrink-0 items-center justify-center">
                    <div className="absolute inset-y-24 left-1/2 w-px -translate-x-1/2 bg-white/12" />
                    <span className="relative grid size-28 place-items-center rounded-full bg-grey-28 text-11 font-bold text-grey-142 ring-1 ring-white/10">
                      VS
                    </span>
                  </div>
                ) : null}
                <div className="flex min-w-0 flex-1">
                  {g.map((i, ii) => (
                    <div key={i} className="relative min-w-0 flex-1">
                      {ii > 0 ? (
                        <div className="csd-col-split">
                          <span className="csd-col-split-icon">
                            <Icons.user className="text-12" />
                          </span>
                        </div>
                      ) : null}
                      {renderReel(i)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex">
          {groups.map((g, gi) => (
            <div key={gi} className="flex min-w-0 flex-1">
              {gi > 0 ? <div className="w-28 shrink-0" /> : null}
              <div className="flex min-w-0 flex-1 flex-col gap-8">
              {game.mode === "team" ? (
                <div className="flex items-center justify-center gap-8 rounded-8 border border-grey-58 bg-grey-39 py-8">
                  <span className="text-12 text-grey-142">Team value:</span>
                  <Bux value={g.reduce((s, i) => s + (totals[i] || 0), 0)} size="sm" tone="gold" />
                </div>
              ) : null}
              <div className="grid gap-8" style={{ gridTemplateColumns: `repeat(${g.length}, minmax(0, 1fr))` }}>
                {g.map((i) => renderSeat(i))}
              </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-8">
          {ended ? (
            <>
              <GreenButton onClick={() => void recreate()} disabled={busy} icon={<Icons.replay className="text-18" />}>
                Recreate battle
              </GreenButton>
              <GreyButton onClick={runReplay} icon={<Icons.replay className="text-16" />}>
                Watch again
              </GreyButton>
            </>
          ) : waiting ? (
            <>
              {isCreator && emptySeats.length ? (
                <GreenButton onClick={() => void callBots()} disabled={busy}>
                  Call bots
                </GreenButton>
              ) : null}
              {isCreator ? <GreyButton onClick={() => void cancel()}>Cancel battle</GreyButton> : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
