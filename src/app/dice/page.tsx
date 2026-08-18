"use client";

import { useMemo, useRef, useState } from "react";
import { BetField } from "@/components/bet-field";
import { ModeTabs } from "@/components/dropdown";
import { AutobetFields, FieldBox, FieldInput, GameShell, GameSidebar } from "@/components/game-shell";
import { GreenButton } from "@/components/green-button";
import { Icons } from "@/components/icons";
import { BuxIcon } from "@/components/bux";
import { useStore, useBalanceHold } from "@/components/providers";

export default function DicePage() {
  const { user, openModal, applyUser, diceBet, addBalance } = useStore();
  const { begin: holdBalance, end: revealBalance } = useBalanceHold();
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [bet, setBet] = useState(10);
  const [rollUnder, setRollUnder] = useState(true);
  const [target, setTarget] = useState(50);
  const [last, setLast] = useState<number | null>(null);
  const [win, setWin] = useState<boolean | null>(null);
  const [rolling, setRolling] = useState(false);
  const rollTimer = useRef<number | null>(null);

  const chance = rollUnder ? target : 100 - target;
  const multiplier = useMemo(() => Math.max(1.01, Number((90 / Math.max(1, chance)).toFixed(4))), [chance]);
  const profit = Math.round(bet * multiplier);

  function setChance(next: number) {
    const c = Math.min(95, Math.max(2, next));
    if (rollUnder) setTarget(c);
    else setTarget(100 - c);
  }

  function setMulti(next: number) {
    const m = Math.max(1.01, next);
    const c = Math.min(95, Math.max(2, 90 / m));
    setChance(c);
  }

  async function play() {
    if (!user) return openModal("login");
    if (user.balance < bet) return openModal("deposit");
    if (rollTimer.current) window.clearInterval(rollTimer.current);
    setRolling(true);
    setWin(null);
    rollTimer.current = window.setInterval(() => {
      setLast(Math.random() * 100);
    }, 40);
    try {
      holdBalance();
      const res = await diceBet(bet, target, !rollUnder);
      addBalance(-bet);
      applyUser(res.user);
      window.setTimeout(() => {
        if (rollTimer.current) window.clearInterval(rollTimer.current);
        rollTimer.current = null;
        setLast(res.game.roll / 100);
        setWin(res.game.won);
        setRolling(false);
        revealBalance();
      }, 1100);
    } catch (err) {
      if (rollTimer.current) window.clearInterval(rollTimer.current);
      rollTimer.current = null;
      setRolling(false);
      revealBalance();
      alert(err instanceof Error ? err.message : "Roll failed.");
    }
  }

  const slider = Math.round(target * 100);

  const stats = (
    <>
      <FieldBox label="Multiplier" tone="grey-28">
        <FieldInput tone="grey-28" value={multiplier.toFixed(2)} name="multiplier" placeholder="Enter multiplier" onChange={(v) => setMulti(Number(v) || 1.01)} />
        <div className="ml-4 px-8 text-14 font-bold text-grey-190">X</div>
      </FieldBox>
      <div className="group relative w-full">
        <FieldBox label={rollUnder ? "Roll under" : "Roll over"} tone="grey-28">
          <FieldInput tone="grey-28" value={target} name="range" placeholder="Enter range" readOnly />
          <div className="ml-4 flex items-center">
            <div className="px-6">
              <Icons.swap className="text-16 text-grey-190 transition-colors group-hover:text-green group-active:text-green" />
            </div>
          </div>
        </FieldBox>
        <button type="button" className="absolute inset-0" onClick={() => setRollUnder((v) => !v)} aria-label="swap" />
      </div>
      <FieldBox label="Win chance" tone="grey-28">
        <FieldInput tone="grey-28" value={Number(chance.toFixed(2))} name="chance" placeholder="Enter chance" onChange={(v) => setChance(Number(v) || 2)} />
        <div className="ml-4 px-8 text-14 font-bold text-grey-190">%</div>
      </FieldBox>
    </>
  );

  return (
    <GameShell
      fairness="Dice"
      boardClassName="@lg/page:p-40 @sm/page:p-30 relative grid w-full grid-cols-1 justify-center p-20"
      sidebar={
        <GameSidebar action={<GreenButton onClick={play} disabled={rolling} loading={rolling}>Start game</GreenButton>}>
          <div className="grid w-full grid-cols-1 gap-12">
            <ModeTabs value={mode} onChange={setMode} />
            <BetField value={bet} onChange={setBet} max={user?.balance ?? 10} />
            {mode === "auto" ? (
              <AutobetFields />
            ) : (
              <div className="grid grid-cols-2 gap-10">
                <div className="group relative min-w-0">
                  <FieldBox label={rollUnder ? "Roll under" : "Roll over"} pad="pl-6 pr-2">
                    <FieldInput value={target} name="range" placeholder="Enter range" readOnly />
                    <Icons.swap className="mr-4 shrink-0 text-14 text-grey-190 transition-colors group-hover:text-green" />
                  </FieldBox>
                  <button type="button" className="absolute inset-0" onClick={() => setRollUnder((v) => !v)} aria-label="swap" />
                </div>
                <FieldBox label="Multiplier" pad="pl-6 pr-2">
                  <FieldInput value={multiplier.toFixed(2)} name="multiplier" placeholder="0" onChange={(v) => setMulti(Number(v) || 1.01)} />
                  <span className="mr-6 shrink-0 text-12 font-bold text-grey-190">X</span>
                </FieldBox>
                <FieldBox label="Win chance" pad="pl-6 pr-2">
                  <FieldInput value={Number(chance.toFixed(2))} name="chance" placeholder="0" onChange={(v) => setChance(Number(v) || 2)} />
                  <span className="mr-6 shrink-0 text-12 text-grey-190">%</span>
                </FieldBox>
                <FieldBox label="Profit on win" pad="pl-8 pr-6">
                  <BuxIcon className="shrink-0 text-green" />
                  <FieldInput value={profit} name="profit" placeholder="0" readOnly />
                </FieldBox>
              </div>
            )}
          </div>
        </GameSidebar>
      }
      board={
        <div className="flex h-full w-full justify-center">
          <div className="flex h-full w-[660px] max-w-full flex-col">
            <div className="flex w-full justify-end">
              <div className="flex h-32" />
            </div>
            <div className="flex w-full flex-grow items-center py-40">
              <div className="grid w-full grid-cols-1 gap-10">
                <span
                  className={`text-center text-64 transition-colors ${rolling ? "animate-dice-tick" : ""} ${
                    rolling ? "!text-white text-white" : win === true ? "!text-green text-green" : win === false ? "text-red-206" : "!text-white text-red"
                  }`}
                >
                  {last === null ? "0.00" : last.toFixed(2)}
                </span>
                <div className="relative w-full pb-40">
                  <div className="relative z-10 flex h-48 w-full items-center justify-center rounded-full bg-grey-28 px-16">
                    <div className="relative h-16 w-full">
                      <div className="relative h-16 w-full overflow-hidden rounded-full bg-red">
                        <div
                          className={`absolute top-0 h-16 ${rollUnder ? "left-0 rounded-l-16 bg-green" : "right-0 rounded-r-16 bg-green"}`}
                          style={rollUnder ? { left: 0, width: `${target}%` } : { right: 0, width: `${100 - target}%` }}
                        />
                      </div>
                      <div className="absolute top-1/2 right-6 left-6 -translate-y-1/2">
                        <div
                          className="border-b-black/20 absolute top-1/2 grid h-32 w-24 -translate-x-1/2 -translate-y-1/2 grid-cols-1 gap-4 rounded-6 border-b-3 bg-white px-4 py-6"
                          style={{ left: `${target}%` }}
                        >
                          <div className="bg-black/20 h-3 w-full rounded-full" />
                          <div className="bg-black/20 h-3 w-full rounded-full" />
                          <div className="bg-black/20 h-3 w-full rounded-full" />
                        </div>
                      </div>
                      <div
                        className={`absolute top-10 z-20 w-48 -translate-x-1/2 transition-[left,opacity] ease-out ${
                          rolling ? "duration-75" : "duration-500"
                        }`}
                        style={{ left: `${last ?? 0}%`, opacity: last === null ? 0 : 1 }}
                      >
                        <img alt="" className="w-48" src="/img/games/dice_blob.webp" />
                        <p className="font-outline-2 absolute top-26 w-full px-4 text-center text-14 text-white">
                          {last === null ? 0 : Math.floor(last)}
                        </p>
                        <p className={`absolute top-26 w-full px-4 text-center text-14 transition-colors ${rolling ? "text-white" : win ? "text-green" : "text-red-206"}`}>
                          {last === null ? 0 : Math.floor(last)}
                        </p>
                      </div>
                      <div className="absolute top-1/2 -right-16 -left-16 h-48 -translate-y-1/2">
                        <input
                          className="relative h-full w-full cursor-pointer opacity-0"
                          max={10000}
                          min={200}
                          type="range"
                          value={slider}
                          onChange={(e) => setTarget(Number(e.target.value) / 100)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 flex w-full justify-between px-4">
                    {[0, 25, 50, 75, 100].map((n) => (
                      <div key={n} className="relative w-30">
                        <div className="absolute bottom-24 left-1/2 h-30 w-1 -translate-x-1/2 border-l-1 border-grey-58" />
                        <p className="w-full text-center text-14 text-grey-190">{n}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="@md/page:hidden grid w-full grid-cols-3 gap-10">{stats}</div>
          </div>
        </div>
      }
    />
  );
}
