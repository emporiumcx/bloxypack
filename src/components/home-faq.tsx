"use client";

import { useState } from "react";
import { Icons } from "@/components/icons";

const FAQS = [
  {
    q: "How does the Welcome Bonus work?",
    a: "New players can claim a welcome offer after creating an account and making their first deposit. Depending on the active promotion it may be a deposit match, bonus cash, or free cases. Activate it from Rewards, where the bonus amount and any wagering requirement are shown before you claim.",
  },
  {
    q: "Are the odds verifiable?",
    a: "Yes. Every case opening and game is provably fair. The result is generated with HMAC-SHA256 from a server seed shown to you as a hash before you play, your own client seed, and an incrementing nonce. Because the hashed server seed is committed up front, the outcome is fixed in advance and cannot be changed — and you can verify any result from your game history.",
  },
  {
    q: "What deposit methods can I use?",
    a: "BloxyPack supports a wide range of options. You can pay by card (Visa and Mastercard), or with cryptocurrencies including Bitcoin, Ethereum, Litecoin, Solana, XRP, Tron, BNB, Bitcoin Cash, Polygon and USDT/USDC across several networks. You can also redeem a gift card or apply a deposit code. Funds are credited instantly and any active deposit bonus is applied automatically.",
  },
  {
    q: "How do I withdraw my winnings?",
    a: "Withdraw in whatever way suits you. Cash out directly in cryptocurrency to an external wallet, or sell items back to your balance. Withdrawals may require account verification (KYC) depending on the amount, and any balance still locked by a wagering requirement must be cleared first.",
  },
  {
    q: "What is Rakeback?",
    a: "Rakeback returns a percentage of the amount you wager back to you as a claimable bonus, and your rate increases as you climb levels. It accumulates automatically as you play and can be collected from the Rewards section, giving you extra value on every bet regardless of whether you win or lose.",
  },
  {
    q: "Is KYC mandatory?",
    a: "Identity verification (KYC) is not required to play, but it may be requested before processing certain withdrawals or to raise your withdrawal limits due to AML regulations. Completing it also unlocks extra perks such as instant withdrawals. You can verify quickly from the verification tab in your profile settings.",
  },
  {
    q: "Can I play from my country?",
    a: "Availability depends on the laws in your jurisdiction. Some countries and regions are restricted from using the platform. Please review our Terms & Conditions to confirm whether your location is eligible before depositing or playing.",
  },
];

export type FaqItemData = { q: string; a: string };

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="h-fit min-w-0 overflow-hidden rounded-12 border border-grey-58 bg-grey-39 px-16">
      <h3 className="flex min-w-0">
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-12 py-16 text-left text-grey-190 transition-all"
        >
          <span className="flex min-w-0 flex-1 items-center gap-12">
            <span className="flex h-28 w-28 shrink-0 items-center justify-center rounded-6 bg-grey-1 text-grey-112">
              <Icons.faq className="text-14" />
            </span>
            <span className="min-w-0 flex-1 text-[15.3125px] font-semibold leading-[17.5px] break-words">
              {q}
            </span>
          </span>
          <Icons.chevron
            className={`shrink-0 text-20 text-grey-112 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </h3>
      <div className={`faq-answer ${open ? "is-open" : ""}`}>
        <div className="faq-answer-inner">
          <p className="pb-16 text-[13.125px] font-thin leading-[21.875px] break-words text-grey-142">{a}</p>
        </div>
      </div>
    </div>
  );
}

export function GotQuestions({
  items,
  subtitle = "Find answers to the most common questions about BloxyPack",
  className = "mt-4 w-full",
}: {
  items: FaqItemData[];
  subtitle?: string;
  className?: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const mid = Math.ceil(items.length / 2);
  const cols = [items.slice(0, mid), items.slice(mid)];

  return (
    <section className={className}>
      <div className="mb-20 flex items-center justify-start gap-10">
        <div className="inline-flex h-40 w-40 shrink-0 items-center justify-center rounded-6 bg-gold-btn/15 text-gold-btn">
          <Icons.faq className="size-16" />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="font-tactic text-start text-14 font-black uppercase leading-[1.14] text-white">Got Questions?</h2>
          <span className="text-start text-12 leading-[1.17] text-grey-142">{subtitle}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-2">
        {cols.map((col, i) => (
          <div key={i} className="flex min-w-0 flex-col gap-12">
            {col.map((item) => (
              <FaqItem
                key={item.q}
                q={item.q}
                a={item.a}
                open={open === item.q}
                onToggle={() => setOpen(open === item.q ? null : item.q)}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomeFaq() {
  return <GotQuestions items={FAQS} />;
}

export const TOWER_FAQS: FaqItemData[] = [
  {
    q: "How does the Tower game work?",
    a: "Place your bet and climb the tower one row at a time, picking a safe tile on each of the 9 rows. A safe pick advances you with a higher multiplier; hit a bomb and the run ends. Cash out at any level after the first to lock in your winnings, and clearing all 9 rows pays out automatically.",
  },
  {
    q: "What do the difficulty levels change?",
    a: "Difficulty sets how many bombs sit on each row: Easy (1 bomb on 4 tiles), Medium (1 on 3), Hard (1 on 2), and Expert (2 on 3). Fewer safe tiles mean lower odds on each pick but much larger multipliers.",
  },
  {
    q: "How is my multiplier calculated?",
    a: "Each row you clear multiplies your reward, and harder difficulties grow far faster — Easy reaches around 13x at the top row while Expert can exceed 19,000x. Your payout is your bet multiplied by the multiplier when you cash out.",
  },
  {
    q: "What are the bet and win limits?",
    a: "Use the bet field on the Tower panel to stake any amount within the site limits. Your payout is your bet multiplied by the cashout multiplier for the rows you cleared.",
  },
  {
    q: "Can I cash out mid-climb?",
    a: "Yes. After clearing the first row you can stop and collect your current multiplier at any time, and it is added to your balance. If you clear all 9 rows the game cashes out automatically at the top multiplier for your difficulty.",
  },
  {
    q: "Is the Tower game provably fair?",
    a: "Yes. The safe tiles for every row are set by a provably fair HMAC-SHA256 shuffle using a hashed server seed committed before you start, your client seed, and a nonce — all verifiable from your game history once the server seed is revealed.",
  },
];
