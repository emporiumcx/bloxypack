"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BattleModeIcons, BattleSeat } from "@/components/battle-seat";
import { Bux } from "@/components/bux";
import { FairnessControl } from "@/components/fairness";
import { GreenButton, GreyButton, green3d } from "@/components/green-button";
import { Icons } from "@/components/icons";
import { ItemBg } from "@/components/item-bg";
import { useStore } from "@/components/providers";
import { subscribeBattles, type BattleGame, type BattleItem } from "@/lib/backend";
import { battleCaseImage, mapBattleGame } from "@/lib/battles-map";
import { botAvatar, botName } from "@/lib/avatars";
import { dropsForCase, itemImage, type CaseDrop, type DropColor } from "@/lib/catalog";
import { JackpotDraw, WinnerOverlay, battleSfx } from "@/components/battle-result";

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

const STRIP_LEN = 25;
const WIN_INDEX = 21;
const SPIN_MS = 4000;
const FAST_MS = 2000;
const SETTLE_MS = 750;
const OUT_BACK = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const IN_OUT_SINE = "cubic-bezier(0.37, 0, 0.63, 1)";

function easeOutQuart(t: number) {
  return 1 - (1 - t) ** 4;
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

function BattleReel({
  strip,
  phase,
  spinKey,
  duration,
  itemSize,
  slot,
  trackH,
}: {
  strip: CaseDrop[];
  phase: "idle" | "spinning" | "landed";
  spinKey: number;
  duration: number;
  itemSize: number;
  slot: number;
  trackH: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const frozen = useRef<{ key: number; strip: CaseDrop[] }>({ key: -1, strip });
  if (phase !== "spinning" || frozen.current.key !== spinKey || !frozen.current.strip.length) {
    frozen.current = { key: spinKey, strip };
  }
  const shown = frozen.current.strip;
  const startPct = -18;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reel = root.querySelector<HTMLElement>(".mm2-reel");
    if (!reel) return;
    const apply = (pct: number) => {
      reel.style.transform = `translate3d(0px, ${pct}%, 0px)`;
    };
    if (phase !== "spinning" || spinKey === 0) {
      apply(phase === "landed" ? -86 : startPct);
      return;
    }

    apply(startPct);
    const rafs: number[] = [];
    let cancelled = false;
    const endPct = -(84 + 4 * Math.random());

    const runPct = (from: number, to: number, ms: number) =>
      new Promise<void>((resolve) => {
        let t0 = 0;
        const step = (now: number) => {
          if (cancelled) return resolve();
          if (!t0) t0 = now;
          const u = Math.min((now - t0) / ms, 1);
          apply(easeOutQuart(u) * (to - from) + from);
          if (u < 1) rafs.push(requestAnimationFrame(step));
          else resolve();
        };
        rafs.push(requestAnimationFrame(step));
      });

    void (async () => {
      await runPct(startPct, endPct, duration);
      if (cancelled) return;
      reel.querySelectorAll(".mm2-reel-slot").forEach((node, i) => {
        node.classList.toggle("is-won", i === WIN_INDEX);
      });
      const win = reel.querySelector<HTMLElement>(`.mm2-reel-slot:nth-child(${WIN_INDEX + 1}) .mm2-reel-item`);
      if (win) {
        const pop = win.animate([{ transform: "scale(1)" }, { transform: "scale(1.15)", easing: OUT_BACK }], {
          duration: 800,
          fill: "forwards",
        });
        pop.onfinish = () => {
          win.animate([{ transform: "scale(1.15)" }, { transform: "scale(1)", easing: IN_OUT_SINE }], {
            duration: 1500,
            fill: "forwards",
          });
        };
      }
    })();

    return () => {
      cancelled = true;
      rafs.forEach((id) => cancelAnimationFrame(id));
    };
  }, [phase, spinKey, duration]);

  const winner = phase !== "idle" ? shown[WIN_INDEX] : null;
  const color = winner ? RARITY[winner.color] : "transparent";

  return (
    <div
      ref={rootRef}
      className={`mm2-cases-spinner is-battle relative w-full overflow-hidden rounded-12 bg-grey-28 ${phase === "landed" ? "is-landed" : ""}`}
      style={{
        ["--slot" as string]: `${slot}px`,
        ["--itemSize" as string]: `${itemSize}px`,
        ["--trackH" as string]: `${trackH}px`,
        height: trackH,
      }}
    >
      <div className="mm2-spinner-inner relative h-full w-full">
        <div className="mm2-reel-hit-info">
          <div className="mm2-reel-hit-info-container" style={{ ["--color" as string]: color }}>
            <div className={`mm2-item-glow-bg${phase === "landed" && winner ? " is-on" : ""}`} style={{ color, ["--circle-color" as string]: color }} />
          </div>
        </div>
        <div className="mm2-reels">
          <div className="mm2-reel-track">
            <div className="mm2-reel">
              {shown.map((d, j) => (
                <div key={j} className={`mm2-reel-slot${phase === "landed" && j === WIN_INDEX ? " is-won" : ""}`}>
                  <img alt="" className="mm2-reel-item rounded-lg" src={itemSrc(d.id, d.image)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BattleLive({ id }: { id: string }) {
  const router = useRouter();
  const { user, openModal, applyUser, battlesJoin, battlesBot, battlesGame, battlesCancel, battlesCreate } = useStore();
  const [game, setGame] = useState<BattleGame | null>(null);
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
    battlesGame(id).catch(() => {});
    return subscribeBattles((state) => {
      const found = state.games.find((g) => g._id === id);
      if (found) setGame(found);
    });
  }, [id, battlesGame]);

  useEffect(() => {
    if (!game || game.state !== "cancelled") return;
    router.replace("/battles");
  }, [game, router]);

  useEffect(() => {
    if (!game || game.state !== "countdown") {
      setCount(null);
      return;
    }
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
  const itemSize = seats >= 4 ? 72 : seats === 3 ? 84 : 100;
  const slot = seats >= 4 ? 92 : seats === 3 ? 104 : 120;
  const trackH = seats >= 4 ? 360 : seats === 3 ? 400 : 440;

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
        window.setTimeout(() => startRound(index + 1, nextGame), 420);
        return;
      }
      if (index + 1 >= totalRounds) {
        watchingRef.current = false;
        const winners = (nextGame.bets || []).filter((b) => (b.payout || 0) > 0);
        if (nextGame.options?.jackpot && winners.length === 1) setOverlay("jackpot");
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
          ← Back to battles
        </Link>
        <p className="text-16">Loading battle…</p>
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

  const join = async (slotIndex: number) => {
    if (!user) return openModal("login");
    if (user.balance < joinCost) return openModal("deposit");
    setBusy(true);
    try {
      if (sound) battleSfx("/sounds/battles/battle_join.mp3", 0.6);
      const res = await battlesJoin(game._id, slotIndex);
      if (res.user) applyUser(res.user);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not join.");
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
      alert(err instanceof Error ? err.message : "Could not add bots.");
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
      alert(err instanceof Error ? err.message : "Could not cancel.");
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
        affiliateOnly: false,
        levelMin: 0,
      });
      if (res.user) applyUser(res.user);
      router.push(`/battles/${res.game._id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not recreate battle.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex w-full justify-center">
      <div className="grid w-full max-w-screen-lg grid-cols-1 gap-16">
        <div className="flex w-full items-center justify-between gap-12">
          <Link
            href="/battles"
            className="group/button relative flex h-32 items-center justify-center rounded-6 bg-grey-39 px-10 text-14 text-grey-142 transition-colors hover:bg-grey-47 hover:text-white"
          >
            <Icons.chevronLeft className="text-18" />
            <span className="ml-4">Back to battles</span>
          </Link>
          <div className="flex items-center gap-12">
            <Toggle on={sound} icon={<Icons.volume />} onClick={() => setSound((v) => !v)} />
            <Toggle on={fast} icon={<Icons.bolt />} onClick={() => setFast((v) => !v)} />
            <button type="button" className="text-13 text-grey-142 hover:text-white" onClick={() => navigator.clipboard.writeText(window.location.href)}>
              Share
            </button>
            <FairnessControl
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

        <div className="panel-outline relative overflow-hidden rounded-12 bg-grey-39 px-12 py-12 md:px-20">
          <div className="grid w-full grid-cols-1 items-center gap-16 md:grid-cols-[auto_1fr_auto]">
            <div>
              <p className="text-12 uppercase text-grey-142">{funding > 0 ? "Join cost" : "Battle cost"}</p>
              <Bux value={funding > 0 ? joinCost : battle.cost} className="text-18" />
              {funding > 0 ? <p className="mt-4 text-11 uppercase text-green">Borrow {funding}%</p> : null}
            </div>
            <div className="relative min-h-[80px] overflow-hidden rounded-4 bg-grey-28">
              <div className="flex h-[80px] w-max items-center">
                {slugs.filter(Boolean).map((slug, i) => (
                  <span key={`${slug}-${i}`} className={`flex h-80 w-84 items-center justify-center ${i === round && !waiting ? "opacity-100" : "opacity-60"}`}>
                    <img alt="" src={battleCaseImage(slug)} className="h-72 w-72 object-contain" />
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-14 text-white">
                {(game.bets || []).length}
                <span className="text-grey-142">/{game.playerCount}</span>
              </p>
              <p className="text-12 uppercase text-grey-142">{battle.teams}</p>
              <p className="text-12 uppercase text-grey-142">{ended ? "completed" : waiting ? "waiting" : game.state}</p>
              <div className="mt-6 flex flex-wrap justify-end gap-8">
                <BattleModeIcons jackpot={game.options?.jackpot} crazy={game.options?.cursed} terminal={game.options?.terminal} />
                {ended ? (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void recreate()}
                      className="rounded-6 bg-green px-10 py-6 text-12 font-medium text-grey-28"
                    >
                      Recreate
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        watchingRef.current = true;
                        spinningRef.current = false;
                        landedRef.current = 0;
                        setPulled(Array.from({ length: game.playerCount }, () => []));
                        setOverlay("none");
                        startRound(0, game);
                      }}
                      className="inline-flex items-center gap-6 rounded-6 bg-grey-28 px-10 py-6 text-12 text-white"
                    >
                      <Icons.replay className="text-14" />
                      Replay
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          {count != null && count > 0 ? (
            <div className="absolute inset-0 z-40 grid place-items-center rounded-12 bg-grey-28/70">
              <p className="text-[72px] font-bold leading-none text-green">{count}</p>
            </div>
          ) : null}
          {overlay === "jackpot" ? (
            <JackpotDraw
              game={game}
              totals={Array.from({ length: game.playerCount }, (_, i) => (pulled[i] || []).reduce((s, d) => s + d.value, 0))}
              winnerSlot={(game.bets || []).find((b) => (b.payout || 0) > 0)?.slot ?? 0}
              sound={sound}
              onDone={() => setOverlay("winner")}
            />
          ) : null}
          {overlay === "winner" ? (
            <WinnerOverlay
              game={game}
              totals={Array.from({ length: game.playerCount }, (_, i) => (pulled[i] || []).reduce((s, d) => s + d.value, 0))}
              funding={funding}
              recreateCost={battle.cost + (battle.cost * (game.playerCount - 1) * funding) / 100}
              busy={busy}
              sound={sound}
              onRecreate={() => void recreate()}
              onWatchAgain={() => {
                watchingRef.current = true;
                spinningRef.current = false;
                landedRef.current = 0;
                setPulled(Array.from({ length: game.playerCount }, () => []));
                setOverlay("none");
                startRound(0, game);
              }}
            />
          ) : null}
          <div className="grid gap-12" style={{ gridTemplateColumns: `repeat(${game.playerCount}, minmax(0, 1fr))` }}>
            {Array.from({ length: game.playerCount }, (_, i) => {
              const bet = (game.bets || []).find((b) => b.slot === i);
              const filled = Boolean(bet);
              const name = bet?.bot ? botName(i) : bet?.user?.username || "Waiting";
              const seatPulled = pulled[i] || [];
              const total = seatPulled.reduce((s, d) => s + d.value, 0);
              const won = ended && (bet?.payout || 0) > 0;
              const lost = ended && filled && !won;
              return (
                <div
                  key={i}
                  className={`panel-outline flex min-w-0 flex-col rounded-12 bg-grey-39 p-12 ${won ? "ring-2 ring-green" : ""} ${lost ? "opacity-70" : ""}`}
                >
                  <div className="flex items-center justify-between gap-8">
                    <div className="flex min-w-0 items-center gap-8">
                      <BattleSeat
                        name={name}
                        filled={filled}
                        size={40}
                        src={bet?.bot ? botAvatar(i) : bet?.user?.avatar}
                        level={bet?.user?.level || 1}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-13 text-white">{filled ? name : "Waiting"}</p>
                        <p className="text-11 text-grey-142">
                          {bet?.bot ? "Bot" : filled ? (funding > 0 && (bet?.amount || 0) < (game.amount || 0) ? `Borrow ${funding}%` : "Player") : "Empty seat"}
                        </p>
                      </div>
                    </div>
                    {filled ? <Bux value={total} size="sm" /> : null}
                  </div>

                  <div className="relative mt-12">
                    {filled ? (
                      <BattleReel
                        strip={strips[i] || []}
                        phase={waiting ? "idle" : phase}
                        spinKey={spinKey}
                        duration={spinMs}
                        itemSize={itemSize}
                        slot={slot}
                        trackH={trackH}
                      />
                    ) : (
                      <div className="grid place-items-center rounded-12 bg-grey-28" style={{ height: trackH }}>
                        {waiting ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => join(i)}
                            className={`flex h-40 w-[min(100%,160px)] items-center justify-center ${green3d}`}
                          >
                            <span className="ui-btn-label text-13 text-grey-190">Join</span>
                          </button>
                        ) : (
                          <p className="text-13 text-grey-142">Empty</p>
                        )}
                      </div>
                    )}
                    {ended && filled ? (
                      <p className={`mt-10 rounded-6 px-8 py-6 text-center text-12 font-bold ${won ? "bg-green text-grey-28" : "bg-red/20 text-red"}`}>
                        {won ? "WINNER" : "LOST"}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-12 grid grid-cols-1 gap-6">
                    {seatPulled.map((item, ri) => (
                      <div
                        key={`${item.id}-${ri}`}
                        className="relative flex items-center gap-8 overflow-hidden rounded-8 bg-grey-28 px-8 py-6"
                        style={{
                          ...(item.color === "RAINBOW" || item.color === "GOLD" || item.color === "YELLOW"
                            ? { boxShadow: `inset 0 0 0 1px ${RARITY[item.color] ?? "rgba(228, 174, 57, 0.5)"}` }
                            : undefined),
                          opacity: game.options?.terminal && ri < seatPulled.length - 1 && !ended ? 0.45 : 1,
                        }}
                      >
                        <div className="relative h-36 w-36 shrink-0">
                          <ItemBg className="inset-0 h-full w-full opacity-40" color={RARITY[item.color] ?? RARITY.GRAY} />
                          <img alt="" src={itemSrc(item.id, item.image)} className="relative h-36 w-36 object-contain" />
                        </div>
                        <p className="min-w-0 flex-1 truncate text-12 text-white">{item.name}</p>
                        <Bux value={item.value} size="xs" />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center gap-8">
          {ended ? (
            <>
              <GreenButton onClick={() => void recreate()} disabled={busy} icon={<Icons.replay className="text-18" />}>
                Recreate battle
              </GreenButton>
              <GreyButton
                onClick={() => {
                  watchingRef.current = true;
                  spinningRef.current = false;
                  landedRef.current = 0;
                  setPulled(Array.from({ length: game.playerCount }, () => []));
                  setOverlay("none");
                  startRound(0, game);
                }}
              >
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
              {isCreator ? (
                <GreyButton onClick={() => void cancel()}>Cancel battle</GreyButton>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
