"use client";

import { Bux } from "@/components/bux";
import { GoldButton, GreenButton } from "@/components/green-button";
import { useStore } from "@/components/providers";
import { bonusProgress, bonusTierForXp } from "@/lib/rewards";

const PAY_METHODS = [
  { name: "BTC", src: "/img/payment/brand/btc.webp" },
  { name: "ETH", src: "/img/payment/brand/eth.webp" },
  { name: "LTC", src: "/img/payment/brand/ltc.webp" },
  { name: "USDT", src: "/img/payment/brand/usdt.webp" },
  { name: "USDC", src: "/img/payment/brand/usdc.webp" },
  { name: "SOL", src: "/img/payment/brand/sol.webp" },
  { name: "XRP", src: "/img/payment/brand/ripple.webp" },
  { name: "TRX", src: "/img/payment/brand/tron.webp" },
  { name: "BNB", src: "/img/payment/brand/bnb.webp" },
  { name: "BCH", src: "/img/payment/brand/bch.webp" },
  { name: "POLY", src: "/img/payment/brand/poly.webp" },
  { name: "Visa", src: "/img/payment/brand/visa.webp" },
  { name: "Mastercard", src: "/img/payment/brand/mastercard.webp" },
] as const;

function RewardAction({
  href,
  children,
  onLogin,
  loggedIn,
  gold = false,
}: {
  href: string;
  children: React.ReactNode;
  onLogin: () => void;
  loggedIn: boolean;
  gold?: boolean;
}) {
  const Btn = gold ? GoldButton : GreenButton;
  if (!loggedIn) {
    return (
      <Btn className="w-full" size="sm" onClick={onLogin}>
        {children}
      </Btn>
    );
  }
  return (
    <Btn className="w-full" size="sm" href={href}>
      {children}
    </Btn>
  );
}

function RewardCard({
  img,
  imgClass,
  glow,
  children,
}: {
  img: string;
  imgClass: string;
  glow: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative overflow-visible rounded-12 border-2 border-grey-58 bg-grey-39 px-14 pb-14 pt-72 transition-transform duration-300 ease-out hover:scale-[1.01]">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-80 rounded-t-[10px] ${glow}`} />
      <img alt="" draggable={false} src={img} className={`pointer-events-none absolute left-1/2 -translate-x-1/2 object-contain ${imgClass}`} />
      <div className="relative grid gap-10">{children}</div>
    </div>
  );
}

export function ExploreRewards() {
  const { user, openModal } = useStore();
  const loggedIn = Boolean(user);
  const rakeback = user?.rakebackAvailable ?? 0;
  const bonusXp = user?.bonusXp ?? 0;
  const { current, next } = bonusTierForXp(bonusXp);
  const fill = user ? Math.min(100, Math.max(0, bonusProgress(bonusXp))) : 0;
  const login = () => openModal("login");

  return (
    <div className="@sm/page:grid-cols-3 mx-auto grid w-full max-w-[980px] grid-cols-1 gap-x-16 gap-y-80 overflow-visible pt-12 @sm/page:gap-y-64">
      <h2 className="@sm/page:col-span-3 @sm/page:text-20 text-16 text-white">Explore Rewards</h2>

      <RewardCard
        img="/img/home/chest-character.webp"
        imgClass="top-[-44px] h-[118px] w-[122px]"
        glow="bg-[radial-gradient(circle_at_50%_80%,rgba(242,195,56,0.2),transparent_70%)]"
      >
        <div className="grid gap-4">
          <p className="text-12 text-grey-142">Instant Rakeback</p>
          <p className="text-16 text-white">Available to claim</p>
          <Bux value={rakeback} size="sm" />
        </div>
        <RewardAction href="/rewards" gold loggedIn={loggedIn} onLogin={login}>
          {loggedIn ? (rakeback > 0 ? "Claim rakeback" : "View rakeback") : "Login to claim"}
        </RewardAction>
      </RewardCard>

      <RewardCard
        img="/cdn/packs/bonus-1.webp"
        imgClass="top-[-58px] h-[132px] w-[132px]"
        glow="bg-[radial-gradient(circle_at_50%_80%,rgba(98,126,234,0.16),transparent_70%)]"
      >
        <div className="grid gap-8">
          <div className="grid gap-4">
            <p className="text-12 text-grey-142">Bonus Case</p>
            <p className="text-16 text-white">{current ? current.name : next.name}</p>
          </div>
          <div className="flex items-center gap-8">
            <p className="shrink-0 text-12 text-grey-142">{current ? `Tier ${current.tier}` : "Tier 1"}</p>
            <div className="relative h-6 w-full rounded-full bg-grey-28">
              <div className="absolute top-0 left-0 h-6 rounded-full bg-green" style={{ width: `${fill}%` }} />
            </div>
          </div>
        </div>
        <RewardAction href="/rewards" loggedIn={loggedIn} onLogin={login}>
          {loggedIn ? "View bonus case" : "Login to open"}
        </RewardAction>
      </RewardCard>

      <RewardCard
        img="/cdn/packs/daily-1.webp"
        imgClass="top-[-64px] h-[136px] w-[136px]"
        glow="bg-[radial-gradient(circle_at_50%_80%,rgba(82,181,255,0.18),transparent_70%)]"
      >
        <div className="grid gap-4">
          <p className="text-12 text-grey-142">Free Daily Case</p>
          <p className="text-16 text-white">Ready to open</p>
          <p className="text-12 text-grey-142">Claimable every 24 hours</p>
        </div>
        <RewardAction href="/rewards" gold loggedIn={loggedIn} onLogin={login}>
          {loggedIn ? "Open daily case" : "Login to open"}
        </RewardAction>
      </RewardCard>
    </div>
  );
}

export function PaymentTicker() {
  const { openModal } = useStore();

  return (
    <div className="grid w-full grid-cols-1 gap-16">
      <h2 className="@sm/page:text-20 text-16 text-white">Select your preferred payment method</h2>
      <div className="pay-ticker relative w-full overflow-hidden">
        <div className="pay-marquee flex">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 gap-10 pr-10">
              {PAY_METHODS.map((m) => (
                <button
                  key={`${copy}-${m.name}`}
                  type="button"
                  onClick={() => openModal("deposit")}
                  className="panel-outline flex h-[84px] w-[84px] shrink-0 cursor-pointer flex-col items-center justify-center gap-6 rounded-10 bg-grey-39 transition-colors duration-200 hover:bg-grey-47"
                >
                  <div className="flex h-40 w-full items-center justify-center">
                    <img alt="" src={m.src} className="h-40 w-40 object-contain" draggable={false} />
                  </div>
                  <p className="text-11 text-grey-142 uppercase">{m.name}</p>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
