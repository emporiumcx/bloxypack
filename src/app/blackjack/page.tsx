"use client";

import { useRef, useState } from "react";
import { BetValueField, GameHeading, GameLayout, SideButton } from "@/components/game-chrome";
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
    <div className="absolute top-0 h-[72px] w-[52px] sm:h-[84px] sm:w-[60px] md:h-[92px] md:w-[66px]" style={{ left: offset, marginTop: offset ? -2 : 0 }}>
      <div
        className={`h-full w-full overflow-hidden rounded-6 border-1 border-black/20 bg-white shadow-[0_8px_18px_rgba(0,0,0,0.4)] ${
          deal ? "animate-card-deal" : ""
        } ${flip ? "animate-card-flip" : ""}`}
      >
        {hidden || !card ? (
          <div className="h-full w-full bg-[repeating-linear-gradient(135deg,#04060b_0_8px,#171c29_8px_16px)]" />
        ) : (
          <div className={`flex h-full flex-col p-6 ${card.suit.red ? "text-red" : "text-grey-28"}`}>
            <p className="text-13 leading-none sm:text-14">{card.rank}</p>
            <p className="mt-2 text-18 leading-none sm:mt-3 sm:text-20">{card.suit.mark}</p>
            <p className="mt-auto self-end rotate-180 text-13 leading-none sm:text-14">{card.rank}</p>
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
    <div className="relative flex justify-center py-8 sm:py-10 md:py-12">
      <div className="relative h-[72px] sm:h-[84px] md:h-[92px]" style={{ width }}>
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
            className="absolute -bottom-28 left-1/2 flex h-22 min-w-28 -translate-x-1/2 items-center justify-center rounded-6 bg-grey-28 px-8 md:-bottom-32"
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

  return (
    <GameLayout
      fairness="Blackjack"
      howTo={{
        body: (
          <>
            <p>Place a bet and get as close to 21 as you can without going over. Face cards are 10, aces are 1 or 11.</p>
            <p>Hit for another card, stand to lock your hand, or double on your first two cards to double the bet and take one more.</p>
          </>
        ),
      }}
      panel={
        <>
          <GameHeading icon={<Icons.blackjack className="text-12" />} title="Blackjack" subtitle="Beat the dealer to 21" />
          <div className="flex flex-col gap-12">
            <BetValueField value={bet} onChange={setBet} max={user?.balance ?? 10} disabled={live || dealing} />
            <div className="grid grid-cols-2 gap-8">
              <SideButton icon={<Icons.hit />} disabled={!canAct} onClick={hit}>
                Hit
              </SideButton>
              <SideButton icon={<Icons.stand />} disabled={!canAct} onClick={stand}>
                Stand
              </SideButton>
              <SideButton icon={<Icons.split />} disabled={!canSplit}>
                Split
              </SideButton>
              <SideButton icon={<Icons.double />} disabled={!canDouble} onClick={doubleDown}>
                Double
              </SideButton>
            </div>
          </div>
          <GreenButton onClick={deal} disabled={live || dealing} loading={dealing}>
            Play
          </GreenButton>
        </>
      }
      board={
        <div className="relative flex min-h-280 w-full flex-col items-center justify-between overflow-hidden rounded-12 border border-grey-58 bg-grey-28 p-16 sm:min-h-340 sm:p-20 md:min-h-400 md:p-24">
          <div className="absolute inset-16 rounded-12 border-3 border-grey-58 sm:inset-20" />
          <div className="absolute top-0 left-1/2 h-full w-[110px] -translate-x-1/2 bg-grey-39 sm:w-[140px] md:w-[170px]" />
          <div className="absolute top-0 right-20 z-20 h-44 w-44 bg-gradient-to-b from-grey-28 to-transparent md:right-28 md:h-64 md:w-64" />
          <div className="absolute -top-28 right-20 z-20 w-40 sm:-top-32 sm:w-48 md:right-28 md:w-56">
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
            className="absolute top-1/2 left-1/2 z-10 h-36 w-auto max-w-[58%] -translate-x-1/2 -translate-y-1/2 object-contain sm:h-48 md:h-56"
            src="/img/blackjack/board.svg"
          />
          <div className="relative z-20">
            <Hand cards={player} dealFrom={dealFromPlayer.current} score={player.length ? total(player) : undefined} />
          </div>
        </div>
      }
    />
  );
}
