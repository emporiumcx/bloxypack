"use client";

import { useMemo, useState } from "react";
import { BetField } from "@/components/bet-field";
import { Dropdown, ModeTabs } from "@/components/dropdown";
import { AutobetFields, GameShell, GameSidebar } from "@/components/game-shell";
import { GreenButton } from "@/components/green-button";
import { BuxGlyph } from "@/components/icons";
import { useStore } from "@/components/providers";

const DIFF = {
  Easy: { cols: 4, mines: 1 },
  Medium: { cols: 3, mines: 1 },
  Hard: { cols: 2, mines: 1 },
  Expert: { cols: 3, mines: 2 },
} as const;

const ROWS = 10;

function rowMulti(diff: keyof typeof DIFF, steps: number) {
  const { cols, mines } = DIFF[diff];
  const p = cols / (cols - mines);
  return Number((0.97 * p ** steps).toFixed(2));
}

export default function TowersPage() {
  const { user, spend, addBalance, openModal } = useStore();
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [bet, setBet] = useState(10);
  const [diff, setDiff] = useState<keyof typeof DIFF>("Medium");
  const [row, setRow] = useState(ROWS);
  const [started, setStarted] = useState(false);
  const [dead, setDead] = useState<{ r: number; c: number } | null>(null);
  const [cleared, setCleared] = useState<Record<number, number>>({});
  const [picking, setPicking] = useState<{ r: number; c: number } | null>(null);
  const cols = DIFF[diff].cols;
  const mineCount = DIFF[diff].mines;
  const climbed = ROWS - row;
  const multi = climbed > 0 ? rowMulti(diff, climbed) : 1;

  function plantRow() {
    const spots = new Set<number>();
    while (spots.size < mineCount) spots.add(Math.floor(Math.random() * cols));
    return [...spots];
  }

  function start() {
    if (!user) return openModal("login");
    if (!spend(bet)) return openModal("deposit");
    setStarted(true);
    setRow(ROWS - 1);
    setDead(null);
    setCleared({});
    setBombs({});
  }

  function pick(r: number, c: number) {
    if (!started || r !== row || dead || picking) return;
    setPicking({ r, c });
    const mines = plantRow();
    window.setTimeout(() => {
      setBombs((b) => ({ ...b, [r]: mines }));
      setPicking(null);
      if (mines.includes(c)) {
        setDead({ r, c });
        setStarted(false);
        return;
      }
      const next = r - 1;
      setCleared((prev) => ({ ...prev, [r]: c }));
      if (next < 0) {
        addBalance(Math.round(bet * rowMulti(diff, ROWS)));
        setStarted(false);
        setRow(-1);
        return;
      }
      setRow(next);
    }, 280);
  }

  function cashout() {
    if (!started || climbed === 0) return;
    addBalance(Math.round(bet * multi));
    setStarted(false);
  }

  const payoutForRow = useMemo(() => {
    return Array.from({ length: ROWS }, (_, r) => {
      const steps = ROWS - r;
      return Math.round(bet * rowMulti(diff, steps));
    });
  }, [bet, diff]);

  return (
    <GameShell
      boardClassName="@lg/page:p-40 @sm/page:p-30 relative flex w-full justify-center p-20"
      sidebar={
        <GameSidebar
          action={
            started ? (
              <GreenButton onClick={cashout} disabled={climbed === 0 || Boolean(picking)}>
                Cashout
              </GreenButton>
            ) : (
              <GreenButton onClick={start}>Start game</GreenButton>
            )
          }
        >
          <div className="grid w-full grid-cols-1 gap-12">
            <ModeTabs value={mode} onChange={setMode} />
            <BetField value={bet} onChange={setBet} max={user?.balance ?? 10} />
            {mode === "auto" ? (
              <AutobetFields />
            ) : (
              <div className="grid w-full grid-cols-1 gap-8">
                <h1 className="text-14 text-grey-142 transition-colors duration-200">Difficulty</h1>
                <Dropdown
                  value={diff}
                  onChange={(id) => {
                    if (started) return;
                    setDiff(id as keyof typeof DIFF);
                  }}
                  options={Object.keys(DIFF).map((d) => ({ id: d, label: d }))}
                />
              </div>
            )}
          </div>
        </GameSidebar>
      }
      board={
        <>
          <div className="absolute inset-0">
            <img alt="" className="h-full w-full object-cover opacity-80 grayscale" src="/img/games/bg_mines.webp" />
          </div>
          <div
            className="@xl/page:gap-12 @xl/page:w-[480px] relative grid h-full w-[406px] max-w-full gap-8 rounded-16 bg-grey-28 p-12"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {Array.from({ length: ROWS * cols }).map((_, i) => {
              const r = Math.floor(i / cols);
              const c = i % cols;
              const active = started && r === row && !dead && !picking;
              const won = cleared[r] === c;
              const isBomb = dead && bombs[r]?.includes(c);
              const hit = dead?.r === r && dead?.c === c;
              const pulsing = picking?.r === r && picking?.c === c;
              const open = won || Boolean(hit) || Boolean(isBomb);
              return (
                <div
                  key={i}
                  className={`@xl/page:h-52 relative flex h-44 w-full items-center justify-center overflow-hidden rounded-12 ${
                    active ? "cursor-pointer" : "cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`tr border-b-black/25 border-t-white/15 absolute inset-0 flex h-full w-full items-center justify-center rounded-12 border-b-3 border-t-3 bg-grey-58 ${
                      open ? "animate-minescover" : "opacity-100"
                    }`}
                  >
                    <img alt="" className={`h-34 w-34 ${pulsing ? "animate-tower-pulse" : ""}`} src="/img/robux_dark.webp" />
                  </div>
                  <button
                    type="button"
                    onClick={() => pick(r, c)}
                    className={`tr border-b-black/25 absolute inset-0 flex h-full w-full items-center justify-center rounded-12 border-b-3 border-t-3 border-solid transition-colors ${
                      hit || isBomb
                        ? "border-b-red border-t-red-143 bg-red"
                        : "border-t-white/60 bg-green active:border-b-green active:border-t-green"
                    } ${open ? "animate-minescontent opacity-100" : active ? "opacity-100" : "opacity-0"}`}
                  >
                    {hit || isBomb ? (
                      <img alt="" className="h-28 w-28 object-contain" src="/img/bomb.webp" />
                    ) : (
                      <div className="flex items-center">
                        <BuxGlyph style={{ width: 18, height: 18 }} />
                        <p className="text-14 text-grey-28">{payoutForRow[r].toLocaleString("en-US")}</p>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      }
    />
  );
}
