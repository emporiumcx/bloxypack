"use client";

import { useRef, useState } from "react";
import { BetField } from "@/components/bet-field";
import { GameShell } from "@/components/game-shell";
import { GreenButton } from "@/components/green-button";
import { Icons } from "@/components/icons";
import { useStore, useBalanceHold } from "@/components/providers";
import type { BjCard } from "@/lib/backend";

const SUITS = [
  { mark: "♠", red: false },
  { mark: "♥", red: true },
  { mark: "♦", red: true },
  { mark: "♣", red: false },
] as const;
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

type Card = { rank: string; suit: (typeof SUITS)[number] };

const SUIT_MAP: Record<string, (typeof SUITS)[number]> = {
  heart: SUITS[1],
  diamond: SUITS[2],
  spade: SUITS[0],
  club: SUITS[3],
};

function fromServer(cards: BjCard[]): Card[] {
  return cards
    .filter((c) => !c.hidden && c.rank)
    .map((c) => ({
      rank: c.rank,
      suit: SUIT_MAP[c.suit || "spade"] ?? SUITS[0],
    }));
}

function total(cards: Card[]) {
  let t = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.rank === "A") {
      aces += 1;
      t += 11;
    } else if (["J", "Q", "K"].includes(c.rank)) t += 10;
    else t += Number(c.rank);
  }
  while (t > 21 && aces) {
    t -= 10;
    aces -= 1;
  }
  return t;
}

function PlayingCard({ card, hidden, offset, deal, flip }: { card?: Card; hidden?: boolean; offset: number; deal?: boolean; flip?: boolean }) {
  return (
    <div className="absolute top-0" style={{ width: 72, height: 100, left: offset, marginTop: offset ? -3 : 0 }}>
      <div
        className={`h-full w-full overflow-hidden rounded-[8px] border-1 border-black/20 bg-white shadow-[0_10px_22px_rgba(0,0,0,0.4)] ${
          deal ? "animate-card-deal" : ""
        } ${flip ? "animate-card-flip" : ""}`}
      >
      {hidden || !card ? (
        <div className="h-full w-full bg-[repeating-linear-gradient(135deg,#0d1013_0_8px,#1e2228_8px_16px)]" />
      ) : (
        <div className={`flex h-full flex-col p-8 ${card.suit.red ? "text-red" : "text-grey-28"}`}>
          <p className="text-16 leading-none">{card.rank}</p>
          <p className="mt-4 text-22 leading-none">{card.suit.mark}</p>
          <p className="mt-auto self-end rotate-180 text-16 leading-none">{card.rank}</p>
        </div>
      )}
      </div>
    </div>
  );
}

function Hand({
  cards,
  hideHole,
  score,
  dealFrom,
}: {
  cards: Card[];
  hideHole?: boolean;
  score?: number;
  dealFrom?: number;
}) {
  const width = Math.max(72, 72 + Math.max(0, cards.length - 1) * 36);
  return (
    <div className="@lg/page:py-40 relative flex justify-center py-20">
      <div className="relative" style={{ width, height: 100 }}>
        {cards.map((c, i) => (
          <PlayingCard
            key={`${c.rank}${c.suit.mark}${i}`}
            card={c}
            hidden={hideHole && i === 1}
            offset={i * 36}
            deal={dealFrom != null && i >= dealFrom}
            flip={!hideHole && i === 1}
          />
        ))}
        {score != null ? (
          <div
            className="@lg/page:-bottom-48 absolute left-1/2 -bottom-32 flex h-24 min-w-32 -translate-x-1/2 items-center justify-center rounded-6 bg-grey-28 px-8"
            style={{ opacity: cards.length ? 1 : 0 }}
          >
            <p className="text-14 text-white">{score}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function BlackjackPage() {
  const { user, openModal, applyUser, blackjackStart, blackjackHit, blackjackStand, blackjackDouble, addBalance } = useStore();
  const { begin: holdBalance, end: revealBalance } = useBalanceHold();
  const [bet, setBet] = useState(10);
  const [player, setPlayer] = useState<Card[]>([]);
  const [dealer, setDealer] = useState<Card[]>([]);
  const [live, setLive] = useState(false);
  const [dealing, setDealing] = useState(false);
  const dealFromPlayer = useRef(0);
  const dealFromDealer = useRef(0);

  function wait(ms: number) {
    return new Promise((r) => window.setTimeout(r, ms));
  }

  async function deal() {
    if (!user) return openModal("login");
    if (user.balance < bet) return openModal("deposit");
    setDealing(true);
    setLive(false);
    setPlayer([]);
    setDealer([]);
    dealFromPlayer.current = 0;
    dealFromDealer.current = 0;
    try {
      holdBalance();
      const res = await blackjackStart(bet);
      addBalance(-bet);
      applyUser(res.user);
      const p = fromServer(res.game.player);
      const d = fromServer(res.game.dealer);
      await wait(120);
      setDealer(d.slice(0, 1));
      await wait(220);
      setPlayer(p.slice(0, 1));
      await wait(220);
      setDealer(d.length > 1 ? d.slice(0, 2) : d);
      await wait(220);
      setPlayer(p);
      setDealing(false);
      setLive(res.game.state === "live");
      if (res.game.state === "completed") setDealer(fromServer(res.game.dealer));
      revealBalance();
    } catch (err) {
      setDealing(false);
      revealBalance();
      alert(err instanceof Error ? err.message : "Could not start blackjack.");
    }
  }

  async function hit() {
    if (!live || dealing) return;
    dealFromPlayer.current = player.length;
    try {
      holdBalance();
      const res = await blackjackHit();
      applyUser(res.user);
      setPlayer(fromServer(res.game.player));
      if (res.game.state === "completed") {
        setDealer(fromServer(res.game.dealer));
        setLive(false);
        await wait(280);
      }
      revealBalance();
    } catch (err) {
      revealBalance();
      alert(err instanceof Error ? err.message : "Hit failed.");
    }
  }

  async function stand() {
    if (!live) return;
    try {
      holdBalance();
      const res = await blackjackStand();
      applyUser(res.user);
      setPlayer(fromServer(res.game.player));
      setDealer(fromServer(res.game.dealer));
      setLive(false);
      await wait(280);
      revealBalance();
    } catch (err) {
      revealBalance();
      alert(err instanceof Error ? err.message : "Stand failed.");
    }
  }

  async function doubleDown() {
    if (!live || player.length !== 2) return;
    try {
      holdBalance();
      addBalance(-bet);
      const res = await blackjackDouble();
      applyUser(res.user);
      setPlayer(fromServer(res.game.player));
      setDealer(fromServer(res.game.dealer));
      setLive(false);
      await wait(280);
      revealBalance();
    } catch (err) {
      revealBalance();
      alert(err instanceof Error ? err.message : "Double failed.");
    }
  }

  const canAct = live && !dealing;
  const canDouble = live && player.length === 2;
  const canSplit = live && player.length === 2 && player[0]?.rank === player[1]?.rank;

  function Action({
    label,
    icon,
    onClick,
    enabled,
  }: {
    label: string;
    icon: React.ReactNode;
    onClick?: () => void;
    enabled: boolean;
  }) {
    return (
      <button
        type="button"
        aria-label="button"
        disabled={!enabled}
        onClick={onClick}
        className={`group/button relative flex h-40 items-start justify-center rounded-6 bg-grey-58 transition-all duration-200 ${
          enabled ? "cursor-pointer opacity-100 hover:bg-grey-70" : "cursor-default opacity-40"
        }`}
      >
        <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-16">
          <p className="transition-all duration-300 text-14 text-white">{label}</p>
          <div className="-mr-2 text-white">{icon}</div>
        </div>
      </button>
    );
  }

  return (
    <GameShell
      tall
      boardClassName="@lg/page:p-40 @sm/page:p-30 @lg/page:h-full relative flex h-[350px] w-full flex-col items-center justify-between overflow-hidden p-20 md:h-[420px]"
      sidebar={
        <>
          <div className="flex items-start">
            <div className="@sm/page:gap-20 grid w-full grid-cols-1 gap-16">
              <div className="grid w-full grid-cols-1 gap-12">
                <BetField value={bet} onChange={setBet} max={user?.balance ?? 10} />
              </div>
              <div className="grid w-full grid-cols-1 items-center gap-8">
                <div className="grid grid-cols-2 gap-8">
                  <Action label="Hit" icon={<Icons.hit />} enabled={canAct} onClick={hit} />
                  <Action label="Stand" icon={<Icons.stand />} enabled={canAct} onClick={stand} />
                  <Action label="Split" icon={<Icons.split />} enabled={canSplit} />
                  <Action label="Double" icon={<Icons.double />} enabled={canDouble} onClick={doubleDown} />
                </div>
              </div>
            </div>
          </div>
          <GreenButton onClick={deal} disabled={live || dealing} loading={dealing}>
            Bet
          </GreenButton>
        </>
      }
      board={
        <>
          <div className="@lg/page:top-40 @lg/page:right-40 @lg/page:bottom-40 @lg/page:left-40 absolute top-16 right-16 bottom-16 left-16 rounded-2xl border-3 border-[#2A2F36]" />
          <div className="@lg/page:w-[300px] absolute top-0 left-1/2 h-full w-[170px] -translate-x-1/2 bg-grey-39" />
          <div className="@lg/page:right-80 @lg/page:h-[100px] @lg/page:w-[100px] absolute top-0 right-40 z-20 h-[60px] w-[60px] bg-gradient-to-b from-grey-39 to-transparent" />
          <div className="@lg/page:-top-74 @lg/page:right-80 @lg/page:w-[100px] absolute -top-40 right-40 w-[56px]">
            <img alt="shoe" width={100} height={150} className="@lg/page:w-[100px] w-[56px]" src="/img/blackjack/stacked-cards.svg" />
          </div>
          <div className="relative z-20">
            <Hand
              cards={dealer}
              hideHole={live}
              dealFrom={dealFromDealer.current}
              score={dealer.length ? (live ? total([dealer[0]]) : total(dealer)) : undefined}
            />
          </div>
          <img
            alt="board"
            width={294}
            height={100}
            className="@lg/page:block @lg/page:h-[100px] absolute top-1/2 z-10 h-[50px] -translate-y-1/2"
            src="/img/blackjack/board.svg"
          />
          <div className="relative z-20">
            <Hand cards={player} dealFrom={dealFromPlayer.current} score={player.length ? total(player) : undefined} />
          </div>
        </>
      }
    />
  );
}
