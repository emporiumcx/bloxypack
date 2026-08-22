"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BuxIcon } from "@/components/bux";
import { BetsTable } from "@/components/bets-table";
import { DropPanel, useDrop } from "@/components/dropdown";
import { AutobetFields } from "@/components/game-shell";
import { FairnessControl } from "@/components/fairness";
import { GreenButton } from "@/components/green-button";
import { Icons } from "@/components/icons";
import { SoundSettings } from "@/components/sound-settings";
import { useStore } from "@/components/providers";
import { playSfx } from "@/lib/sfx";

const GRID_SIZES = [4, 5, 6, 7, 8];

function stepMulti(cells: number, minesCount: number, steps: number) {
  if (steps < 1) return 1;
  return Number((0.99 * (cells / (cells - minesCount)) ** steps).toFixed(2));
}

function Select<T extends string>({
  value,
  options,
  disabled,
  onChange,
  prefix,
  accent,
}: {
  value: T;
  options: { id: T; label: string }[];
  disabled?: boolean;
  onChange: (id: T) => void;
  prefix?: React.ReactNode;
  accent?: boolean;
}) {
  const { open, leaving, shown, close, toggle } = useDrop();
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.id === value)?.label ?? value;
  const stagger = options.length <= 12;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, leaving]);

  return (
    <div ref={ref} className={`relative w-full ${shown ? "z-50" : ""}`}>
      <div
        className={
          accent
            ? "rounded-6 p-px [background:linear-gradient(90deg,#E6244080_0%,#1E2837_31%)]"
            : ""
        }
      >
        <button
          type="button"
          disabled={disabled}
          aria-expanded={open && !leaving}
          onClick={() => {
            if (disabled) return;
            toggle();
          }}
          className={`flex h-36 w-full items-center justify-between gap-8 rounded-6 px-12 text-13 text-white disabled:opacity-50 ${
            accent ? "border-0 bg-grey-28" : "border border-grey-58 bg-grey-28"
          }`}
        >
          <span className="flex items-center gap-8">
            {prefix}
            <span>{current}</span>
          </span>
          <Icons.chevron className={`text-14 text-grey-142 transition-transform duration-200 ${open && !leaving ? "rotate-180" : ""}`} />
        </button>
      </div>
      <DropPanel shown={shown} leaving={leaving} className="absolute top-40 max-h-240 w-full overflow-y-auto">
        {options.map((o, i) => (
          <button
            key={o.id}
            type="button"
            onClick={() => {
              onChange(o.id);
              close();
            }}
            style={
              leaving || !stagger
                ? undefined
                : { animation: "open-y 0.28s cubic-bezier(0.22, 1, 0.36, 1) both", animationDelay: `${i * 28}ms` }
            }
            className={`flex h-36 w-full items-center rounded-6 px-8 text-13 ${
              value === o.id ? "bg-green text-white" : "text-white hover:bg-grey-39"
            }`}
          >
            {o.label}
          </button>
        ))}
      </DropPanel>
    </div>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-16 fill-icons-secondary" aria-hidden>
      <path d="M5.333.667H2.667a2 2 0 0 0-2 2v2.666a2 2 0 0 0 2 2h2.666a2 2 0 0 0 2-2V2.667a2 2 0 0 0-2-2M13.333.667h-2.667a2 2 0 0 0-2 2v2.666a2 2 0 0 0 2 2h2.667a2 2 0 0 0 2-2V2.667a2 2 0 0 0-2-2M5.333 8.667H2.667a2 2 0 0 0-2 2v2.666a2 2 0 0 0 2 2h2.666a2 2 0 0 0 2-2v-2.666a2 2 0 0 0-2-2M13.333 8.667h-2.667a2 2 0 0 0-2 2v2.666a2 2 0 0 0 2 2h2.667a2 2 0 0 0 2-2v-2.666a2 2 0 0 0-2-2" />
    </svg>
  );
}

function DragIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={`size-16 ${className}`} fill="currentColor" aria-hidden>
      <path d="M4.2 1.1a.75.75 0 0 1 .8.08l7.5 6.2a.75.75 0 0 1-.28 1.3l-2.76.46 1.7 3.22a.75.75 0 1 1-1.32.7l-1.74-3.3-2.1 1.86A.75.75 0 0 1 5 11.4V1.75A.75.75 0 0 1 4.2 1.1Z" />
    </svg>
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
          <p>Set your bet and choose how many bombs sit on the grid. Start revealing tiles — each safe pick raises your multiplier.</p>
          <p>Cash out whenever you want. Hit a bomb and the round ends. More bombs means bigger jumps and more risk.</p>
        </div>
      </div>
    </div>
  );
}

export default function MinesPage() {
  const { user, openModal, applyUser, minesBet, minesReveal, minesCashout } = useStore();
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [size, setSize] = useState("5");
  const [bet, setBet] = useState(0);
  const [mines, setMines] = useState(8);
  const [started, setStarted] = useState(false);
  const [booting, setBooting] = useState(false);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [boom, setBoom] = useState<number | null>(null);
  const [mineSet, setMineSet] = useState<Set<number>>(new Set());
  const [turbo, setTurbo] = useState(false);
  const [drag, setDrag] = useState(false);
  const [howTo, setHowTo] = useState(false);
  const dragging = useRef(false);
  const queue = useRef(Promise.resolve());
  const revealedRef = useRef<number[]>([]);
  const n = Number(size);
  const cells = n * n;
  const maxMines = Math.max(1, cells - 1);
  const safe = revealed.length;
  const multi = useMemo(() => stepMulti(cells, mines, safe), [safe, mines, cells]);
  const steps = Math.max(1, cells - mines);
  const multipliers = useMemo(
    () => Array.from({ length: steps }, (_, i) => ({ step: i + 1, multi: stepMulti(cells, mines, i + 1) })),
    [steps, cells, mines],
  );

  async function start() {
    if (!user) return openModal("login");
    if (user.balance < bet || bet <= 0) return openModal("deposit");
    setBooting(true);
    try {
      playSfx("click");
      const res = await minesBet(bet, Math.min(mines, maxMines), n);
      if (res.user) applyUser(res.user);
      setMineSet(new Set());
      revealedRef.current = [];
      setRevealed([]);
      setBoom(null);
      setStarted(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not start mines.");
    } finally {
      setBooting(false);
    }
  }

  async function click(i: number) {
    if (!started || boom !== null || revealedRef.current.includes(i)) return;
    playSfx("click");
    try {
      const res = await minesReveal(i);
      if (res.user) applyUser(res.user);
      const last = res.game.revealed[res.game.revealed.length - 1];
      if (last?.value === "mine") {
        playSfx("bomb");
        setBoom(i);
        const tiles = res.game.revealed.map((r) => r.tile);
        revealedRef.current = tiles;
        setRevealed(tiles);
        const minesFound = (res.game.deck || []).map((v, idx) => (v === "mine" ? idx : -1)).filter((v) => v >= 0);
        setMineSet(new Set(minesFound));
        setStarted(false);
        dragging.current = false;
        return;
      }
      const tiles = res.game.revealed.map((r) => r.tile);
      revealedRef.current = tiles;
      setRevealed(tiles);
      playSfx("safe");
      if (res.game.state === "completed") {
        playSfx("win");
        setStarted(false);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Reveal failed.");
    }
  }

  function reveal(i: number) {
    queue.current = queue.current.then(() => click(i));
  }

  async function cashout() {
    if (!started || !revealed.length) return;
    try {
      const res = await minesCashout();
      playSfx("win");
      applyUser(res.user);
      setStarted(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Cashout failed.");
    }
  }

  useEffect(() => {
    const up = () => {
      dragging.current = false;
    };
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  return (
    <>
      <div className="flex w-full flex-col gap-12">
        <div className="flex min-h-0 flex-col-reverse gap-12 lg:flex-row">
          <aside className="flex w-full min-w-0 shrink-0 flex-col gap-16 overflow-visible self-start rounded-12 border border-grey-58 bg-grey-28 p-16 lg:w-320">
            <div className="flex items-center gap-8">
              <div className="flex size-32 shrink-0 items-center justify-center rounded-6 bg-green/15 text-green">
                <Icons.mines className="text-12" />
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <span className="ui-label text-13 text-white">Mines</span>
                <span className="text-12 text-grey-142">Reveal tiles and dodge the mines</span>
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
                <p className="text-11 text-grey-142">Grid size</p>
                <Select
                  value={size}
                  disabled={started}
                  prefix={<GridIcon />}
                  onChange={(id) => {
                    if (started) return;
                    setSize(id);
                    const max = Number(id) * Number(id) - 1;
                    if (mines > max) setMines(max);
                  }}
                  options={GRID_SIZES.map((v) => ({ id: String(v), label: `${v}x${v}` }))}
                />
              </div>

              <div className="grid gap-6">
                <p className="text-11 text-grey-142">Mines</p>
                <Select
                  value={String(mines)}
                  disabled={started}
                  accent
                  prefix={<img alt="" src="/img/bomb.webp" className="size-20 object-contain" />}
                  onChange={(id) => {
                    if (started) return;
                    setMines(Math.min(maxMines, Math.max(1, Number(id) || 1)));
                  }}
                  options={Array.from({ length: maxMines }, (_, i) => ({
                    id: String(i + 1),
                    label: String(i + 1),
                  }))}
                />
              </div>
            </div>

            {started ? (
              <GreenButton onClick={cashout} disabled={!revealed.length}>
                Cashout {revealed.length ? `${multi.toFixed(2)}x` : ""}
              </GreenButton>
            ) : (
              <GreenButton onClick={start} loading={booting} disabled={booting}>
                Play
              </GreenButton>
            )}
          </aside>

          <div className="flex w-full min-w-0 flex-col items-center gap-12 p-4 pt-4 lg:p-16 lg:pt-4">
            <div className="relative w-full max-w-528">
              <div
                className="grid w-full gap-10"
                style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: cells }).map((_, i) => {
                  const isMine = boom !== null && mineSet.has(i);
                  const isGem = revealed.includes(i);
                  const open = isMine || isGem;
                  const hit = boom === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Tile ${i + 1}`}
                      disabled={!started || open || booting}
                      onPointerDown={(e) => {
                        if (!started || open) return;
                        if (drag) {
                          e.preventDefault();
                          dragging.current = true;
                          reveal(i);
                        }
                      }}
                      onPointerEnter={() => {
                        if (drag && dragging.current) reveal(i);
                      }}
                      onClick={() => {
                        if (!drag) reveal(i);
                      }}
                      className={`relative aspect-square overflow-hidden rounded-12 bg-grey-39 shadow-[0px_2px_0px_rgba(0,0,0,0.25),inset_0px_2px_0px_#18202E] ${
                        started && !open ? "cursor-pointer hover:bg-grey-47" : "cursor-default"
                      } ${booting ? "animate-pulse" : ""}`}
                    >
                      <div className="absolute inset-0 flex h-full w-full items-center justify-center">
                        <img
                          alt=""
                          src="/img/bloxypack-mark.png"
                          className={`h-auto w-1/3 object-contain ${open ? "opacity-0" : "opacity-20"}`}
                        />
                      </div>
                      <div
                        className={`absolute inset-0 flex items-center justify-center rounded-12 ${
                          isMine ? (hit ? "bg-red" : "bg-red/70") : "bg-green"
                        } ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
                      >
                        {isMine ? (
                          <img alt="" className="h-[62%] w-[62%] object-contain" src="/img/bomb.webp" />
                        ) : (
                          <img alt="" className="h-[58%] w-[58%] object-contain" src="/img/bloxypack-mark-dark.png" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative w-full max-w-528">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-grey-28 to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-grey-28 to-transparent" />
              <div className="no-scrollbar flex gap-8 overflow-x-auto">
                {multipliers.map((m) => {
                  const active = started && safe === m.step;
                  const done = safe > m.step;
                  return (
                    <div
                      key={m.step}
                      className={`flex min-w-64 shrink-0 flex-col rounded-6 bg-grey-39 px-8 py-6 ${
                        active ? "text-white" : "text-grey-142"
                      } ${done ? "opacity-50" : ""}`}
                    >
                      <span className="ui-label text-11">x{m.multi.toFixed(2)}</span>
                      <span className="text-10 lowercase text-grey-142">
                        {m.step} {m.step === 1 ? "step" : "steps"}
                      </span>
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
              <span className="flex size-16 items-center justify-center rounded-full border border-current text-11 font-semibold">
                i
              </span>
            </button>
          </div>
          <img alt="" src="/img/logo.png" className="h-28 w-auto opacity-70" />
          <div className="flex items-center gap-6">
            <button
              type="button"
              aria-label="Toggle drag select"
              aria-pressed={drag}
              onClick={() => setDrag((v) => !v)}
              className={`toolbar-toggle flex h-32 w-32 items-center justify-center rounded-6 ${
                drag ? "is-on bg-gradient-to-b from-green to-green-2 text-white" : "text-icons-secondary hover:bg-grey-47 hover:text-white"
              }`}
            >
              <DragIcon />
            </button>
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
            <FairnessControl game="Mines" userSeeds compact />
          </div>
        </div>
      </div>
      <BetsTable />
      <HowToPlay open={howTo} onClose={() => setHowTo(false)} />
    </>
  );
}
