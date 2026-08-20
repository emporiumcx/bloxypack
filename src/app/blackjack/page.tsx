"use client";

import { useRef, useState } from "react";
import { BetField } from "@/components/bet-field";
import { GameShell, GameSidebar } from "@/components/game-shell";
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
    <div className="absolute top-0 h-[72px] w-[52px] @sm/page:h-[84px] @sm/page:w-[60px] @md/page:h-[92px] @md/page:w-[66px]" style={{ left: offset, marginTop: offset ? -2 : 0 }}>
      <div
        className={`h-full w-full overflow-hidden rounded-[7px] border-1 border-black/20 bg-white shadow-[0_8px_18px_rgba(0,0,0,0.4)] ${
          deal ? "animate-card-deal" : ""
        } ${flip ? "animate-card-flip" : ""}`}
      >
      {hidden || !card ? (
        <div className="h-full w-full bg-[repeating-linear-gradient(135deg,#0d1013_0_8px,#32363e_8px_16px)]" />
      ) : (
        <div className={`flex h-full flex-col p-6 ${card.suit.red ? "text-red" : "text-grey-28"}`}>
          <p className="text-13 leading-none @sm/page:text-14">{card.rank}</p>
          <p className="mt-2 text-18 leading-none @sm/page:mt-3 @sm/page:text-20">{card.suit.mark}</p>
          <p className="mt-auto self-end rotate-180 text-13 leading-none @sm/page:text-14">{card.rank}</p>
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
  const width = Math.max(66, 66 + Math.max(0, cards.length - 1) * 32);
  return (
    <div className="relative flex justify-center py-8 @sm/page:py-10 @md/page:py-12">
      <div className="relative h-[72px] @sm/page:h-[84px] @md/page:h-[92px]" style={{ width }}>
        {cards.map((c, i) => (
          <PlayingCard
            key={`${c.rank}${c.suit.mark}${i}`}
            card={c}
            hidden={hideHole && i === 1}
            offset={i * 32}
            deal={dealFrom != null && i >= dealFrom}
            flip={!hideHole && i === 1}
          />
        ))}
        {score != null ? (
          <div
            className="absolute left-1/2 -bottom-28 flex h-22 min-w-28 -translate-x-1/2 items-center justify-center rounded-6 bg-grey-28 px-8 @md/page:-bottom-32"
            style={{ opacity: cards.length ? 1 : 0 }}
          >
            <p className="text-13 text-white">{score}</p>
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
      fairness="Blackjack"
      boardClassName="relative flex h-[min(280px,calc(100dvh-260px))] w-full min-h-[240px] flex-col items-center justify-between overflow-hidden p-12 @sm/page:h-[min(340px,calc(100dvh-230px))] @sm/page:p-16 @md/page:h-[min(400px,calc(100dvh-210px))] @md/page:p-20 @lg/page:h-[min(420px,calc(100dvh-200px))] @lg/page:p-24"
      sidebar={
        <GameSidebar
          action={
            <GreenButton onClick={deal} disabled={live || dealing} loading={dealing}>
              Bet
            </GreenButton>
          }
        >
          <BetField value={bet} onChange={setBet} max={user?.balance ?? 10} />
          <div className="grid grid-cols-2 gap-8">
            <Action label="Hit" icon={<Icons.hit />} enabled={canAct} onClick={hit} />
            <Action label="Stand" icon={<Icons.stand />} enabled={canAct} onClick={stand} />
            <Action label="Split" icon={<Icons.split />} enabled={canSplit} />
            <Action label="Double" icon={<Icons.double />} enabled={canDouble} onClick={doubleDown} />
          </div>
        </GameSidebar>
      }
      board={
        <>
          <div className="absolute inset-12 rounded-2xl border-3 border-[#3A3F46] @sm/page:inset-16 @md/page:inset-20 @lg/page:inset-24" />
          <div className="absolute top-0 left-1/2 h-full w-[110px] -translate-x-1/2 bg-grey-39 @sm/page:w-[140px] @md/page:w-[170px] @lg/page:w-[190px]" />
          <div className="absolute top-0 right-20 z-20 h-[44px] w-[44px] bg-gradient-to-b from-grey-39 to-transparent @md/page:right-28 @md/page:h-[64px] @md/page:w-[64px]" />
          <div className="absolute -top-28 right-20 z-20 w-[40px] @sm/page:-top-32 @sm/page:w-[48px] @md/page:right-28 @md/page:w-[56px]">
            <img alt="shoe" className="h-auto w-full" src="/img/blackjack/stacked-cards.svg" />
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
            className="absolute top-1/2 left-1/2 z-10 h-[36px] w-auto max-w-[58%] -translate-x-1/2 -translate-y-1/2 object-contain @sm/page:h-[48px] @md/page:h-[56px] @lg/page:h-[64px]"
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
