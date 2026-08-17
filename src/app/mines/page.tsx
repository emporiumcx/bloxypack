"use client";

import { useMemo, useState } from "react";
import { BetField, ChoiceBar } from "@/components/bet-field";
import { ModeTabs } from "@/components/dropdown";
import { AutobetFields, FieldBox, FieldInput, GameShell, GameSidebar } from "@/components/game-shell";
import { GreenButton } from "@/components/green-button";
import { useStore } from "@/components/providers";

export default function MinesPage() {
  const { user, spend, addBalance, openModal } = useStore();
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [size, setSize] = useState("5");
  const [bet, setBet] = useState(10);
  const [mines, setMines] = useState(1);
  const [started, setStarted] = useState(false);
  const [booting, setBooting] = useState(false);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [boom, setBoom] = useState<number | null>(null);
  const [mineSet, setMineSet] = useState<Set<number>>(new Set());
  const n = Number(size);
  const cells = n * n;
  const maxMines = Math.max(1, cells - 1);
  const safe = revealed.length;
  const multi = useMemo(() => {
    if (!safe) return 1;
    return Number((0.99 * (cells / (cells - mines)) ** safe).toFixed(2));
  }, [safe, mines, cells]);

  function start() {
    if (!user) return openModal("login");
    if (!spend(bet)) return openModal("deposit");
    setBooting(true);
    const set = new Set<number>();
    while (set.size < Math.min(mines, maxMines)) set.add(Math.floor(Math.random() * cells));
    window.setTimeout(() => {
      setMineSet(set);
      setRevealed([]);
      setBoom(null);
      setStarted(true);
      setBooting(false);
    }, 420);
  }

  function click(i: number) {
    if (!started || boom !== null || revealed.includes(i)) return;
    if (mineSet.has(i)) {
      setBoom(i);
      setStarted(false);
      return;
    }
    const next = [...revealed, i];
    setRevealed(next);
    if (next.length >= cells - mines) {
      addBalance(Math.round(bet * (0.99 * (cells / (cells - mines)) ** next.length)));
      setStarted(false);
    }
  }

  function cashout() {
    if (!started || !revealed.length) return;
    addBalance(Math.round(bet * multi));
    setStarted(false);
  }

  const minePresets = ["1", "3", "5", "10", String(maxMines)];

  return (
    <GameShell
      boardClassName="@lg/page:p-40 @sm/page:p-30 @xs/page:p-20 relative w-full p-14"
      sidebar={
        <GameSidebar
          action={
            started ? (
              <GreenButton onClick={cashout} disabled={!revealed.length}>
                Cashout
              </GreenButton>
            ) : (
              <GreenButton onClick={start} loading={booting} disabled={booting}>
                Start game
              </GreenButton>
            )
          }
        >
          <ModeTabs value={mode} onChange={setMode} />
          <BetField value={bet} onChange={setBet} max={user?.balance ?? 10} />
          {mode === "auto" ? (
            <AutobetFields />
          ) : (
            <>
              <div className="grid w-full grid-cols-1 gap-8">
                <p className="text-14 text-grey-142">Grid</p>
                <ChoiceBar
                  value={size}
                  onChange={(id) => {
                    if (started) return;
                    setSize(id);
                    const max = Number(id) * Number(id) - 1;
                    if (mines > max) setMines(max);
                  }}
                  options={[4, 5, 6, 7, 8].map((v) => ({ id: String(v), label: `${v}x${v}` }))}
                />
              </div>
              <div className="grid w-full grid-cols-1 gap-10">
                <FieldBox label="Number of mines" pad="px-6">
                  <FieldInput
                    value={mines}
                    name="bet_amount"
                    placeholder="Enter amount"
                    onChange={(v) => {
                      if (started) return;
                      setMines(Math.min(maxMines, Math.max(1, Number(v) || 1)));
                    }}
                  />
                </FieldBox>
                <ChoiceBar
                  value={minePresets.includes(String(mines)) ? String(mines) : ""}
                  onChange={(id) => {
                    if (started) return;
                    setMines(Number(id));
                  }}
                  options={minePresets.map((v) => ({ id: v, label: v }))}
                />
              </div>
            </>
          )}
        </GameSidebar>
      }
      board={
        <div
          className="@xs/page:gap-8 @sm/page:gap-12 mx-auto grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${n}, 1fr)`,
            minWidth: "min(100%, 500px)",
            maxWidth: "min(-350px + 100vh, 600px)",
            width: "100%",
          }}
        >
          {Array.from({ length: cells }).map((_, i) => {
            const isMine = boom !== null && mineSet.has(i);
            const isGem = revealed.includes(i);
            const open = isMine || isGem;
            return (
              <button
                key={i}
                aria-label="reveal"
                type="button"
                onClick={() => click(i)}
                className={`tr @sm/page:rounded-8 @md/page:rounded-10 group relative rounded-5 bg-grey-47 pt-[100%] ${
                  booting ? "animate-pulse" : ""
                }`}
              >
                <div
                  className={`tr @sm/page:rounded-8 @md/page:rounded-10 absolute top-0 right-0 bottom-3 left-0 flex h-auto w-auto items-center justify-center rounded-5 bg-grey-58 group-hover:bg-grey-70 group-active:bg-grey-70 ${
                    open ? "animate-minescover" : "opacity-100"
                  }`}
                >
                  <img alt="" className="w-[70%]" src="/img/robux_shadow.webp" />
                </div>
                <div
                  className={`tr @sm/page:rounded-8 @md/page:rounded-12 absolute inset-0 flex h-auto w-auto items-center justify-center rounded-5 bg-grey-39 ${
                    open ? "animate-minescontent opacity-100" : "opacity-0"
                  }`}
                >
                  <div
                    className={`@sm/page:rounded-8 @md/page:rounded-12 relative h-full w-full rounded-5 bg-grey-58 bg-gradient-to-b ${
                      isMine ? "from-red/20 to-red" : "from-green-20 to-green"
                    }`}
                  >
                    <div
                      className={`@sm/page:rounded-6 @md/page:rounded-10 absolute inset-0 flex items-center justify-center rounded-3 border-b-3 border-t-3 ${
                        isMine
                          ? "border-b-red border-t-red-143 bg-red"
                          : "border-b-green-95 border-t-green-202 bg-green"
                      }`}
                    >
                      <img
                        className="tr absolute top-1/2 left-1/2 w-[80%] -translate-x-1/2 -translate-y-1/2 object-contain"
                        alt=""
                        src="/img/robux_shadow_dark.webp"
                        style={{ height: "75%", opacity: isMine ? 0 : 1 }}
                      />
                      <img
                        className="tr absolute top-1/2 left-1/2 w-[80%] -translate-x-1/2 -translate-y-1/2 object-contain"
                        alt=""
                        src="/img/bomb.webp"
                        style={{ height: "72%", opacity: isMine ? 1 : 0 }}
                      />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      }
    />
  );
}
