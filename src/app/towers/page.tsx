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
  const { user, openModal, applyUser, towersBet, towersReveal, towersCashout } = useStore();
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [bet, setBet] = useState(10);
  const [diff, setDiff] = useState<keyof typeof DIFF>("Medium");
  const [row, setRow] = useState(ROWS);
  const [started, setStarted] = useState(false);
  const [dead, setDead] = useState<{ r: number; c: number } | null>(null);
  const [cleared, setCleared] = useState<Record<number, number>>({});
  const [bombs, setBombs] = useState<Record<number, number[]>>({});
  const [picking, setPicking] = useState<{ r: number; c: number } | null>(null);
  const cols = DIFF[diff].cols;
  const climbed = ROWS - row;
  const multi = climbed > 0 ? rowMulti(diff, climbed) : 1;

  async function start() {
    if (!user) return openModal("login");
    if (user.balance < bet) return openModal("deposit");
    try {
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
      const next = r - 1;
      if (res.game.state === "completed" || next < 0) {
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
      applyUser(res.user);
      setStarted(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Cashout failed.");
    }
  }

  const payoutForRow = useMemo(() => {
    return Array.from({ length: ROWS }, (_, r) => Math.round(bet * rowMulti(diff, ROWS - r)));
  }, [bet, diff]);

  return (
    <GameShell
      boardClassName="@lg/page:p-40 @sm/page:p-30 relative flex w-full justify-center p-20"
      sidebar={
        <GameSidebar
          action={
            started ? (
              <GreenButton onClick={cashout} disabled={climbed === 0 || Boolean(picking)}>
                Cashout {climbed > 0 ? `${multi.toFixed(2)}x` : ""}
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
                <h1 className="text-14 text-grey-142">Difficulty</h1>
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
            className="@xl/page:gap-10 @xl/page:w-[480px] relative grid h-full w-[406px] max-w-full gap-6 rounded-16 bg-grey-28/90 p-12"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {Array.from({ length: ROWS * cols }).map((_, i) => {
              const r = Math.floor(i / cols);
              const c = i % cols;
              const active = started && r === row && !dead && !picking;
              const won = cleared[r] === c;
              const isBomb = Boolean(bombs[r]?.includes(c));
              const hit = dead?.r === r && dead?.c === c;
              const pulsing = picking?.r === r && picking?.c === c;
              const open = won || isBomb || Boolean(hit);
              const dim = started && r !== row && !open && !dead;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!active}
                  onClick={() => pick(r, c)}
                  className={`@xl/page:h-52 relative flex h-44 w-full items-center justify-center overflow-hidden rounded-12 ${
                    active ? "cursor-pointer" : "cursor-default"
                  } ${dim ? "opacity-45" : "opacity-100"}`}
                >
                  <div
                    className={`tr absolute inset-0 flex items-center justify-center rounded-12 border-b-3 border-t-3 border-b-black/25 border-t-white/15 bg-grey-58 ${
                      open ? "animate-minescover pointer-events-none" : "opacity-100"
                    } ${active ? "bg-grey-70" : ""}`}
                  >
                    <img alt="" className={`h-34 w-34 ${pulsing ? "animate-tower-pulse" : ""}`} src="/img/robux_dark.webp" />
                  </div>
                  <div
                    className={`tr absolute inset-0 flex items-center justify-center rounded-12 border-b-3 border-t-3 ${
                      hit || isBomb
                        ? "border-b-red border-t-red-143 bg-red"
                        : "border-b-green-95 border-t-green-222 bg-green"
                    } ${open ? "animate-minescontent opacity-100" : "pointer-events-none opacity-0"}`}
                  >
                    {hit || isBomb ? (
                      <img alt="" className="h-28 w-28 object-contain" src="/img/bomb.webp" />
                    ) : (
                      <div className="flex items-center gap-4">
                        <BuxGlyph style={{ width: 16, height: 16 }} />
                        <p className="text-13 font-semibold text-grey-28">{payoutForRow[r].toLocaleString("en-US")}</p>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      }
    />
  );
}
