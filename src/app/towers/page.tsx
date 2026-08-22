"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BuxIcon } from "@/components/bux";
import { AutobetFields } from "@/components/game-shell";
import { FairnessControl } from "@/components/fairness";
import { GameWins } from "@/components/game-wins";
import { GreenButton } from "@/components/green-button";
import { GotQuestions, TOWER_FAQS } from "@/components/home-faq";
import { DropPanel, useDrop } from "@/components/dropdown";
import { Icons } from "@/components/icons";
import { SoundSettings } from "@/components/sound-settings";
import { useStore } from "@/components/providers";
import { FlipTile } from "@/components/flip-tile";
import { playSfx } from "@/lib/sfx";

const DIFF = {
  Easy: { cols: 4, mines: 1 },
  Medium: { cols: 3, mines: 1 },
  Hard: { cols: 2, mines: 1 },
  Expert: { cols: 3, mines: 2 },
} as const;

const ROWS = 9;

function rowMulti(diff: keyof typeof DIFF, steps: number) {
  const { cols, mines } = DIFF[diff];
  const p = cols / (cols - mines);
  return Number((0.97 * p ** steps).toFixed(2));
}

function DiffPips({ cols, mines }: { cols: number; mines: number }) {
  const safe = cols - mines;
  return (
    <span className="inline-flex items-center gap-2">
      {Array.from({ length: safe }).map((_, i) => (
        <span key={`s${i}`} className="size-14 rounded-3 bg-green" />
      ))}
      {Array.from({ length: mines }).map((_, i) => (
        <span key={`m${i}`} className="size-14 rounded-3 bg-red" />
      ))}
    </span>
  );
}

function DifficultySelect({
  value,
  disabled,
  onChange,
}: {
  value: keyof typeof DIFF;
  disabled?: boolean;
  onChange: (id: keyof typeof DIFF) => void;
}) {
  const { open, leaving, shown, close, toggle } = useDrop();
  const ref = useRef<HTMLDivElement>(null);
  const current = DIFF[value];

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, leaving]);

  return (
    <div ref={ref} className={`relative w-full ${shown ? "z-50" : ""}`}>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open && !leaving}
        onClick={() => {
          if (disabled) return;
          toggle();
        }}
        className="flex h-36 w-full items-center justify-between gap-8 rounded-6 border border-grey-58 bg-grey-28 px-12 text-13 text-white disabled:opacity-50"
      >
        <span className="flex items-center gap-8">
          <DiffPips cols={current.cols} mines={current.mines} />
          <span>{value}</span>
        </span>
        <Icons.chevron className={`text-14 text-grey-142 transition-transform duration-200 ${open && !leaving ? "rotate-180" : ""}`} />
      </button>
      <DropPanel shown={shown} leaving={leaving} className="absolute top-40 w-full overflow-hidden">
        {(Object.keys(DIFF) as (keyof typeof DIFF)[]).map((id, i) => (
          <button
            key={id}
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => {
              onChange(id);
              close();
            }}
            style={leaving ? undefined : { animation: "open-y 0.28s cubic-bezier(0.22, 1, 0.36, 1) both", animationDelay: `${i * 28}ms` }}
            className={`flex h-36 w-full items-center gap-8 rounded-6 px-8 text-13 ${
              value === id ? "bg-green text-white" : "text-white hover:bg-grey-39"
            }`}
          >
            <DiffPips cols={DIFF[id].cols} mines={DIFF[id].mines} />
            {id}
          </button>
        ))}
      </DropPanel>
    </div>
  );
}

function HowToPlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (open) setLeaving(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function requestClose() {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(onClose, 220);
  }

  if (!open) return null;
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-16 ${leaving ? "pointer-events-none" : ""}`}>
      <button
        type="button"
        aria-label="close overlay"
        className={`${leaving ? "animate-overlay-out" : "animate-overlay-in"} absolute inset-0 bg-black/60 backdrop-blur-[8px]`}
        onClick={leaving ? undefined : requestClose}
      />
      <div
        className={`relative z-10 w-full max-w-420 rounded-12 border border-grey-58 bg-grey-39 p-20 shadow-[0_24px_80px_rgba(0,0,0,0.45)] ${
          leaving ? "animate-modal-out" : "animate-modal-in"
        }`}
      >
        <div className="mb-12 flex items-center justify-between">
          <h2 className="ui-label text-14 text-white">How to play</h2>
          <button type="button" onClick={requestClose} className="text-14 text-grey-142 hover:text-white">
            Close
          </button>
        </div>
        <div className="grid gap-10 text-13 leading-relaxed text-grey-142">
          <p>Place your bet and pick a tile on the bottom row. A safe pick lets you advance with a higher multiplier; a bomb ends the run.</p>
          <p>Keep climbing for bigger rewards and cash out whenever you want. Harder difficulties hide more bombs per row.</p>
        </div>
      </div>
    </div>
  );
}

export default function TowersPage() {
  const { user, openModal, applyUser, towersBet, towersReveal, towersCashout } = useStore();
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [bet, setBet] = useState(0);
  const [diff, setDiff] = useState<keyof typeof DIFF>("Easy");
  const [row, setRow] = useState(ROWS);
  const [started, setStarted] = useState(false);
  const [dead, setDead] = useState<{ r: number; c: number } | null>(null);
  const [cleared, setCleared] = useState<Record<number, number>>({});
  const [bombs, setBombs] = useState<Record<number, number[]>>({});
  const [picking, setPicking] = useState<{ r: number; c: number } | null>(null);
  const [turbo, setTurbo] = useState(false);
  const [howTo, setHowTo] = useState(false);
  const cols = DIFF[diff].cols;
  const climbed = ROWS - row;
  const multi = climbed > 0 ? rowMulti(diff, climbed) : 1;

  async function start() {
    if (!user) return openModal("login");
    if (user.balance < bet || bet <= 0) return openModal("deposit");
    try {
      playSfx("click");
      const res = await towersBet(bet, diff.toLowerCase());
      applyUser(res.user);
      setStarted(true);
      setRow(ROWS - 1);
      setDead(null);
      setCleared({});
      setBombs({});
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not start towers.");
    }
  }

  async function pick(r: number, c: number) {
    if (!started || r !== row || dead || picking) return;
    playSfx("click");
    setPicking({ r, c });
    try {
      const res = await towersReveal(c);
      if (res.user) applyUser(res.user);
      const last = res.game.revealed[res.game.revealed.length - 1];
      const rowTiles = last?.row || [];
      const mineTiles = rowTiles.map((v, idx) => (v === "lose" ? idx : -1)).filter((v) => v >= 0);
      const lost = rowTiles[c] === "lose";
      setPicking(null);
      if (lost) {
        playSfx("bomb");
        setDead({ r, c });
        setBombs((b) => {
          const next = { ...b, [r]: mineTiles };
          const deck = res.game.deck || [];
          deck.forEach((deckRow, di) => {
            const uiRow = ROWS - 1 - di;
            if (next[uiRow]) return;
            next[uiRow] = deckRow.map((v, idx) => (v === "lose" ? idx : -1)).filter((v) => v >= 0);
          });
          return next;
        });
        setStarted(false);
        return;
      }
      setCleared((prev) => ({ ...prev, [r]: c }));
      playSfx("safe");
      const next = r - 1;
      if (res.game.state === "completed" || next < 0) {
        playSfx("win");
        setStarted(false);
        setRow(-1);
        return;
      }
      setRow(next);
    } catch (err) {
      setPicking(null);
      alert(err instanceof Error ? err.message : "Reveal failed.");
    }
  }

  async function cashout() {
    if (!started || climbed === 0) return;
    try {
      const res = await towersCashout();
      playSfx("win");
      applyUser(res.user);
      setStarted(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Cashout failed.");
    }
  }

  const multipliers = useMemo(
    () => Array.from({ length: ROWS }, (_, r) => rowMulti(diff, ROWS - r)),
    [diff],
  );

  return (
    <>
      <div className="flex w-full flex-col gap-12">
        <div className="flex min-h-0 flex-col-reverse gap-12 lg:flex-row">
          <aside className="flex w-full min-w-0 shrink-0 flex-col gap-16 overflow-visible self-start rounded-12 border border-grey-58 bg-grey-28 p-16 lg:w-320">
            <div className="flex items-center gap-8">
              <div className="flex size-32 shrink-0 items-center justify-center rounded-6 bg-green/15 text-green">
                <Icons.towers className="text-12" />
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <span className="ui-label text-13 text-white">Tower</span>
                <span className="text-12 text-grey-142">Climb the tower and cash out in time</span>
              </div>
            </div>

            <div className="flex w-full gap-4 rounded-8 border border-grey-58 bg-grey-39 p-4">
              {(["manual", "auto"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMode(id)}
                  className={`flex h-28 flex-1 items-center justify-center rounded-6 text-12 font-medium capitalize transition-colors ${
                    mode === id ? "bg-gradient-to-b from-green to-green-2 text-white" : "text-white hover:bg-white/5"
                  }`}
                >
                  {id === "auto" ? "Auto" : "Manual"}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-12">
              <div className="grid gap-6">
                <p className="text-11 text-grey-142">Total Value</p>
                <div className="flex h-40 w-full min-w-0 items-center gap-4 rounded-6 border border-grey-58 bg-grey-39 py-4 pl-8 pr-4">
                  <BuxIcon className="shrink-0 text-green" />
                  <input
                    autoComplete="off"
                    className="h-full min-w-0 flex-1 bg-transparent px-6 text-14 text-white outline-none"
                    placeholder="0.00"
                    inputMode="decimal"
                    type="text"
                    name="bet_amount"
                    disabled={started}
                    value={bet === 0 ? "0.00" : String(bet)}
                    onChange={(e) => {
                      const next = e.target.value.replace(/[^\d.]/g, "");
                      setBet(next === "" ? 0 : Number(next));
                    }}
                  />
                  <button
                    type="button"
                    disabled={started}
                    onClick={() => setBet(Number((Math.max(0, bet) / 2).toFixed(2)))}
                    className="flex h-32 shrink-0 items-center justify-center rounded-6 border border-grey-58 bg-grey-47 px-8 text-11 text-white hover:bg-green disabled:opacity-50"
                  >
                    1/2
                  </button>
                  <button
                    type="button"
                    disabled={started}
                    onClick={() => setBet(Number((Math.max(0, bet) * 2).toFixed(2)))}
                    className="flex h-32 shrink-0 items-center justify-center rounded-6 border border-grey-58 bg-grey-47 px-8 text-11 text-white hover:bg-green disabled:opacity-50"
                  >
                    x2
                  </button>
                  <button
                    type="button"
                    disabled={started}
                    onClick={() => setBet(user?.balance ?? 0)}
                    className="flex h-32 shrink-0 items-center justify-center rounded-6 border border-grey-58 bg-grey-47 px-8 text-11 text-white hover:bg-green disabled:opacity-50"
                  >
                    Max
                  </button>
                </div>
              </div>

              {mode === "auto" ? <AutobetFields /> : null}

              <div className="grid gap-6">
                <p className="text-11 text-grey-142">Difficulty</p>
                <DifficultySelect value={diff} disabled={started} onChange={setDiff} />
              </div>
            </div>

            {started ? (
              <GreenButton onClick={cashout} disabled={climbed === 0 || Boolean(picking)}>
                Cashout {climbed > 0 ? `${multi.toFixed(2)}x` : ""}
              </GreenButton>
            ) : (
              <GreenButton onClick={start}>Play</GreenButton>
            )}
          </aside>

          <div className="relative flex min-h-0 w-full min-w-0 flex-1 items-start justify-center lg:justify-end lg:pr-48 xl:pr-80">
            <div className="relative flex w-full min-w-0 max-w-640 gap-8 lg:max-h-[calc(100dvh-12rem)]">
              <div className="relative flex w-80 shrink-0 flex-col gap-4">
              {multipliers.map((m, r) => (
                <div
                  key={r}
                  className={`relative z-20 flex h-40 items-center justify-center rounded-6 bg-grey-39 transition-opacity sm:h-44 lg:h-56 xl:h-64 2xl:h-80 ${
                    started && r !== row && cleared[r] === undefined && !dead ? "opacity-40" : "opacity-100"
                  }`}
                >
                  <p className={`ui-btn-label whitespace-nowrap text-[8px] leading-none sm:rotate-60 sm:text-vertical lg:text-[9px] xl:text-[10px] 2xl:text-[11px] ${started && r === row ? "text-white" : "text-grey-142"}`}>
                    x{m.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-4">
              {Array.from({ length: ROWS }).map((_, r) => {
                const active = started && r === row && !dead && !picking;
                return (
                  <div
                    key={r}
                    className={`relative flex h-40 gap-4 rounded-6 p-2 sm:h-44 lg:h-56 xl:h-64 2xl:h-80 ${
                      active ? "bg-grey-58/40" : ""
                    }`}
                  >
                    {Array.from({ length: cols }).map((_, c) => {
                      const won = cleared[r] === c;
                      const isBomb = Boolean(bombs[r]?.includes(c));
                      const hit = dead?.r === r && dead?.c === c;
                      const pulsing = picking?.r === r && picking?.c === c;
                      const open = won || isBomb || Boolean(hit);
                      const dim = started && r !== row && !open && !dead;
                      return (
                        <FlipTile
                          key={c}
                          open={open}
                          backClassName="bg-grey-39"
                          disabled={!active}
                          aria-label={`Row ${ROWS - r} column ${c + 1}`}
                          onClick={() => pick(r, c)}
                          className={`relative h-full min-w-0 flex-1 rounded-6 bg-grey-39 shadow-[0px_2px_0px_rgba(0,0,0,0.25),inset_0px_2px_0px_#18202E] ${
                            active ? "cursor-pointer bg-grey-47" : "cursor-default"
                          } ${dim ? "opacity-45" : "opacity-100"}`}
                          front={
                            <img
                              alt=""
                              src="/img/bloxypack-mark.png"
                              className={`h-auto w-1/4 object-contain opacity-20 ${pulsing ? "animate-tower-pulse" : ""}`}
                            />
                          }
                          back={
                            hit || isBomb ? (
                              <img alt="" className="h-[58%] w-[58%] max-h-28 max-w-28 object-contain" src="/img/mine-x.png" />
                            ) : (
                              <img alt="" className="h-[58%] w-[58%] max-h-28 max-w-28 object-contain" src="/img/mine-diamond.png" />
                            )
                          }
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-8 border border-grey-58 bg-grey-39 px-12 py-8">
          <div className="flex items-center gap-6">
            <SoundSettings />
            <button
              type="button"
              aria-label="How to play"
              onClick={() => setHowTo(true)}
              className="toolbar-toggle flex h-32 w-32 items-center justify-center rounded-6 text-icons-secondary hover:bg-grey-47 hover:text-white"
            >
              <span className="flex size-16 items-center justify-center rounded-full border border-current text-11 font-semibold">i</span>
            </button>
          </div>
          <img alt="" src="/img/logo.png" className="h-28 w-auto opacity-70" />
          <div className="flex items-center gap-6">
            <button
              type="button"
              aria-label="Toggle turbo mode"
              aria-pressed={turbo}
              onClick={() => setTurbo((v) => !v)}
              className={`toolbar-toggle flex h-32 w-32 items-center justify-center rounded-6 ${
                turbo ? "is-on bg-gradient-to-b from-green to-green-2 text-white" : "text-icons-secondary hover:bg-grey-47 hover:text-white"
              }`}
            >
              <Icons.bolt className="text-14" />
            </button>
            <FairnessControl game="Towers" userSeeds compact />
          </div>
        </div>
      </div>
      <GameWins game="Tower" />
      <GotQuestions items={TOWER_FAQS} className="mt-40 w-full" />
      <HowToPlay open={howTo} onClose={() => setHowTo(false)} />
    </>
  );
}
