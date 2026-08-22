"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { formatBux } from "@/lib/format";
import { qrModules } from "@/lib/qr-pattern";
import { BuxGlyph } from "./icons";
import { Icons } from "./icons";
import { useStore } from "./providers";
import { getCryptoData, sendCryptoWithdraw } from "@/lib/backend";

const BUX_USD = 0.002;
const WITHDRAW_FEE = 0.02;
const FIAT_PRESETS = [25, 50, 100, 250, 500, 1000];
const GIFT_PRESETS = [20, 50, 100, 250, 500];

type Tab = "deposit" | "withdraw";
type MethodKind = "crypto";

type WalletMethod = {
  id: string;
  kind: MethodKind;
  name: string;
  sub: string;
  badge?: string;
  ticker: string;
  price: number;
  minCrypto?: number;
  icon: string;
};

const DEPOSIT_CRYPTO: WalletMethod[] = [
  { id: "sol", kind: "crypto", name: "Solana", sub: "SOL", badge: "Fastest", ticker: "SOL", price: 89.03, minCrypto: 0.05, icon: "sol" },
  { id: "usdc", kind: "crypto", name: "USD Coin", sub: "USDC", ticker: "USDC", price: 1, minCrypto: 1, icon: "usdc" },
];

const WITHDRAW_CRYPTO: WalletMethod[] = [
  { id: "w-sol", kind: "crypto", name: "Solana", sub: "SOL", badge: "Fastest", ticker: "SOL", price: 89.03, icon: "sol" },
  { id: "w-usdc-sol", kind: "crypto", name: "USDC (Solana)", sub: "USDC", ticker: "USDC", price: 1, icon: "usdc" },
];

function usdToBux(usd: number) {
  return usd / BUX_USD;
}

function PanelIcon({
  tone = "primary",
  size = 32,
  children,
}: {
  tone?: "primary" | "gold";
  size?: 32 | 40;
  children: ReactNode;
}) {
  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-6 ${
        size === 40 ? "h-40 w-40 [&_svg]:size-16" : "h-32 w-32 [&_svg]:size-12"
      } ${tone === "gold" ? "bg-yellow/15 text-yellow" : "bg-green/15 text-green"}`}
    >
      {children}
    </div>
  );
}

function WalletGlyph() {
  return (
    <svg viewBox="0 0 15 15" fill="currentColor" aria-hidden>
      <path d="M1.515 5.672c.087.031.086.184.086.488v.012a6.56 6.56 0 0 0 6.561 6.561h.012c.304 0 .457 0 .488.086.031.088-.078.178-.298.358A5.122 5.122 0 0 1 1.157 5.97c.18-.22.27-.33.358-.298M8.5 0a5.834 5.834 0 1 1 0 11.669A5.834 5.834 0 0 1 8.5 0m-.01 2.667a.5.5 0 0 0-.5.5v.161c-.681.189-1.231.754-1.231 1.507 0 .394.116.793.469 1.074.326.26.77.348 1.262.348.41 0 .61.074.702.145.064.05.142.147.142.43 0 .234-.082.346-.184.419-.127.09-.347.157-.66.157-.5 0-.789-.285-.835-.496a.5.5 0 1 0-.976.213c.138.635.68 1.072 1.311 1.224V8.5a.5.5 0 0 0 1 0v-.136c.264-.048.52-.142.74-.299.384-.273.604-.699.604-1.233 0-.485-.146-.925-.53-1.222-.355-.274-.827-.353-1.314-.353-.404 0-.574-.077-.64-.13-.039-.03-.091-.092-.091-.292 0-.256.262-.575.731-.575.412 0 .677.256.723.487a.5.5 0 0 0 .98-.197c-.123-.613-.61-1.06-1.203-1.223v-.16a.5.5 0 0 0-.5-.5" />
    </svg>
  );
}

function CoinsGlyph() {
  return (
    <svg viewBox="0 0 15 16" fill="currentColor" aria-hidden>
      <path d="M14.8 11.146c.033.019.033.071.033.175v1.88c0 .49-.294.854-.59 1.091-.303.242-.7.431-1.132.577-.87.295-2.029.464-3.278.464s-2.408-.17-3.277-.464c-.432-.146-.83-.335-1.132-.577-.297-.237-.591-.602-.591-1.092v-1.879c0-.104 0-.156.033-.175.033-.02.08.006.173.057 1.223.671 2.896.964 4.794.964 1.899 0 3.571-.293 4.795-.964.093-.051.14-.077.173-.057M.3 10.793c.026 0 .063.015.137.045.857.35 1.936.535 3.144.614.12.008.18.012.216.05.036.04.036.099.036.218v1.48c0 .357.083.669.209.936.116.247.175.372.13.435-.044.064-.166.052-.41.028a9.7 9.7 0 0 1-1.856-.352c-.427-.131-.822-.302-1.125-.522-.287-.21-.614-.559-.614-1.058v-1.653c0-.076 0-.114.01-.138a.13.13 0 0 1 .123-.083m9.533-5.46c1.25 0 2.411.175 3.282.477.433.15.83.343 1.133.59.298.244.585.612.585 1.1v1.754c0 .302 0 .453-.083.603s-.186.216-.392.345c-1.008.635-2.564.965-4.525.965-1.96 0-3.516-.33-4.524-.965-.206-.13-.31-.194-.393-.345s-.083-.301-.083-.603V7.5c0-.488.287-.856.585-1.1.303-.247.7-.44 1.133-.59.871-.302 2.032-.477 3.282-.477" />
    </svg>
  );
}

function BriefcaseGlyph() {
  return (
    <svg viewBox="0 0 16 15" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M8.003 5.333a.667.667 0 0 0 .667-.666V3h.388c.118 0 .261 0 .379-.015h.002c.084-.01.469-.058.651-.435.184-.378-.018-.712-.061-.784l-.002-.002c-.061-.102-.15-.216-.224-.31l-.016-.02C9.591 1.184 9.336.86 9.082.6a3 3 0 0 0-.425-.37C8.52.136 8.287 0 8 0s-.521.136-.658.23c-.154.106-.299.24-.425.37-.254.26-.508.583-.705.834l-.016.02c-.073.094-.163.208-.224.31l-.002.002c-.043.072-.245.406-.061.784.183.377.567.425.65.435h.003C6.68 3 6.824 3 6.941 3h.396v1.667c0 .368.298.666.666.666M8 7.823c-1.105 0-2 .897-2 2.003s.895 2.003 2 2.003 2-.897 2-2.003a2 2 0 0 0-2-2.003m4.338 1.333a.669.669 0 1 0 .667.668.667.667 0 0 0-.667-.668m-8.672 0a.668.668 0 1 0 .667.668.667.667 0 0 0-.667-.668"
        clipRule="evenodd"
      />
    </svg>
  );
}

function GiftGlyph() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8.5 1.2c.9 0 1.6.5 2 .9.3-.3.8-.9 1.7-.9 1.2 0 2.1 1 2.1 2.2 0 1.5-1.3 2.4-2.8 2.6H13v6.5c0 .9-.7 1.5-1.5 1.5H4.5C3.7 14 3 13.4 3 12.5V6h1.5C3.1 5.8 1.7 4.9 1.7 3.4 1.7 2.2 2.6 1.2 3.8 1.2c.9 0 1.4.6 1.7.9.4-.4 1.1-.9 2-.9.5 0 1 .2 1.3.5.3-.3.8-.5 1.3-.5ZM4.2 3.4c0 .6.8 1.2 2.1 1.2h.4C6.4 4 6 3.4 6 2.8c0-.4.2-.7.5-.9.4-.3.8 0 1.1.4L8 3l.4-.7c.3-.4.7-.7 1.1-.4.3.2.5.5.5.9 0 .6-.4 1.2-.7 1.8h.4c1.3 0 2.1-.6 2.1-1.2 0-.5-.4-.9-.8-.9-.4 0-.8.3-1.2.8L8.7 5 8 4.1 7.3 5 6.2 3.3c-.4-.5-.8-.8-1.2-.8-.4 0-.8.4-.8.9ZM4.5 7v5.5h7V7h-7Z" />
    </svg>
  );
}

function WarningGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M8.87 1.8c-.38-.66-1.36-.66-1.74 0L.76 12.4c-.38.66.1 1.5.87 1.5h12.74c.77 0 1.25-.84.87-1.5L8.87 1.8ZM8 5.5c.4 0 .7.3.7.7v3.1c0 .4-.3.7-.7.7s-.7-.3-.7-.7V6.2c0-.4.3-.7.7-.7Zm0 7.1a.85.85 0 1 1 0-1.7.85.85 0 0 1 0 1.7Z" />
    </svg>
  );
}

const MARK: Record<string, { outer: string; inner: string; src?: string; letter?: string; color?: string }> = {
  sol: {
    outer: "linear-gradient(rgb(30, 40, 55) 0%, rgb(57, 23, 116) 100%)",
    inner: "radial-gradient(62.5% 62.5% at 50% 89.29%, rgb(172, 131, 243) 0%, rgba(59, 36, 99, 0) 85.58%), rgb(57, 23, 116)",
    src: "/img/payment/solana.svg",
  },
  usdt: {
    outer: "linear-gradient(rgb(30, 40, 55) 0%, rgb(14, 90, 70) 100%)",
    inner: "radial-gradient(62.5% 62.5% at 50% 89.29%, rgb(80, 210, 170) 0%, rgba(14, 90, 70, 0) 85.58%), rgb(14, 90, 70)",
    src: "/img/payment/tether.svg",
  },
  eth: {
    outer: "linear-gradient(rgb(30, 40, 55) 0%, rgb(50, 60, 90) 100%)",
    inner: "radial-gradient(62.5% 62.5% at 50% 89.29%, rgb(170, 180, 220) 0%, rgba(50, 60, 90, 0) 85.58%), rgb(40, 48, 72)",
    src: "/img/payment/eth.svg",
  },
  usdc: {
    outer: "linear-gradient(rgb(30, 40, 55) 0%, rgb(20, 70, 140) 100%)",
    inner: "radial-gradient(62.5% 62.5% at 50% 89.29%, rgb(90, 170, 255) 0%, rgba(20, 70, 140, 0) 85.58%), rgb(20, 70, 140)",
    src: "/img/payment/usdc.svg",
  },
  btc: {
    outer: "linear-gradient(rgb(30, 40, 55) 0%, rgb(140, 80, 10) 100%)",
    inner: "radial-gradient(62.5% 62.5% at 50% 89.29%, rgb(255, 190, 80) 0%, rgba(140, 80, 10, 0) 85.58%), rgb(140, 80, 10)",
    src: "/img/payment/btc.svg",
  },
  ltc: {
    outer: "linear-gradient(rgb(30, 40, 55) 0%, rgb(70, 90, 130) 100%)",
    inner: "radial-gradient(62.5% 62.5% at 50% 89.29%, rgb(180, 200, 230) 0%, rgba(70, 90, 130, 0) 85.58%), rgb(70, 90, 130)",
    src: "/img/payment/ltc.svg",
  },
  trx: {
    outer: "linear-gradient(rgb(30, 40, 55) 0%, rgb(120, 30, 40) 100%)",
    inner: "radial-gradient(62.5% 62.5% at 50% 89.29%, rgb(255, 110, 110) 0%, rgba(120, 30, 40, 0) 85.58%), rgb(120, 30, 40)",
    src: "/img/payment/brand/tron.webp",
  },
  xrp: {
    outer: "linear-gradient(rgb(30, 40, 55) 0%, rgb(20, 28, 40) 100%)",
    inner: "radial-gradient(62.5% 62.5% at 50% 89.29%, rgb(160, 180, 200) 0%, rgba(20, 28, 40, 0) 85.58%), rgb(28, 36, 52)",
    src: "/img/payment/brand/ripple.webp",
  },
  bnb: {
    outer: "linear-gradient(rgb(30, 40, 55) 0%, rgb(120, 90, 10) 100%)",
    inner: "radial-gradient(62.5% 62.5% at 50% 89.29%, rgb(255, 220, 80) 0%, rgba(120, 90, 10, 0) 85.58%), rgb(120, 90, 10)",
    src: "/img/payment/brand/bnb.webp",
  },
  bch: {
    outer: "linear-gradient(rgb(30, 40, 55) 0%, rgb(20, 110, 50) 100%)",
    inner: "radial-gradient(62.5% 62.5% at 50% 89.29%, rgb(90, 220, 130) 0%, rgba(20, 110, 50, 0) 85.58%), rgb(20, 110, 50)",
    src: "/img/payment/brand/bch.webp",
  },
  ton: {
    outer: "linear-gradient(rgb(30, 40, 55) 0%, rgb(10, 90, 160) 100%)",
    inner: "radial-gradient(62.5% 62.5% at 50% 89.29%, rgb(80, 190, 255) 0%, rgba(10, 90, 160, 0) 85.58%), rgb(10, 90, 160)",
    letter: "◆",
    color: "#fff",
  },
  doge: {
    outer: "linear-gradient(rgb(30, 40, 55) 0%, rgb(140, 110, 20) 100%)",
    inner: "radial-gradient(62.5% 62.5% at 50% 89.29%, rgb(255, 214, 80) 0%, rgba(140, 110, 20, 0) 85.58%), rgb(140, 110, 20)",
    letter: "Ð",
    color: "#fff",
  },
  ada: {
    outer: "linear-gradient(rgb(30, 40, 55) 0%, rgb(20, 60, 130) 100%)",
    inner: "radial-gradient(62.5% 62.5% at 50% 89.29%, rgb(90, 140, 255) 0%, rgba(20, 60, 130, 0) 85.58%), rgb(20, 60, 130)",
    letter: "₳",
    color: "#fff",
  },
  apple: {
    outer: "linear-gradient(rgb(30, 40, 55) 0%, rgb(221, 228, 234) 100%)",
    inner: "radial-gradient(62.5% 62.5% at 50% 89.29%, rgb(196, 196, 196) 0%, rgba(96, 63, 155, 0) 85.58%), rgb(221, 228, 234)",
  },
  gpay: {
    outer: "linear-gradient(rgb(30, 40, 55) 0%, rgb(235, 240, 246) 100%)",
    inner: "radial-gradient(62.5% 62.5% at 50% 89.29%, rgb(220, 230, 255) 0%, rgba(96, 63, 155, 0) 85.58%), rgb(235, 240, 246)",
  },
  card: {
    outer: "linear-gradient(rgb(30, 40, 55) 0%, rgb(40, 70, 140) 100%)",
    inner: "radial-gradient(62.5% 62.5% at 50% 89.29%, rgb(120, 170, 255) 0%, rgba(40, 70, 140, 0) 85.58%), rgb(32, 54, 110)",
  },
  gift: {
    outer: "linear-gradient(rgb(30, 40, 55) 0%, rgb(180, 90, 20) 100%)",
    inner: "radial-gradient(62.5% 62.5% at 50% 89.29%, rgb(255, 170, 70) 0%, rgba(180, 90, 20, 0) 85.58%), rgb(180, 90, 20)",
  },
};

function AppleLogo() {
  return (
    <svg viewBox="0 0 13 16" className="size-16" fill="#171717" aria-hidden>
      <path d="M12.582 5.455c-.075.047-1.743 1.02-1.724 3.045.02 2.422 2.118 3.228 2.142 3.237-.019.058-.335 1.149-1.105 2.275-.666.976-1.356 1.947-2.444 1.967-1.07.02-1.414-.635-2.635-.635-1.222 0-1.605.615-2.616.655-1.05.04-1.85-1.054-2.52-2.025C.308 11.988-.74 8.36.667 5.912c.699-1.216 1.947-1.986 3.302-2.006 1.032-.02 2.005.695 2.637.695.622 0 1.737-.833 3.051-.735.515.038 1.978.192 2.924 1.59m-3.735-2.9c.558-.677.934-1.618.83-2.555-.803.032-1.775.536-2.35 1.212-.517.599-.97 1.557-.847 2.475.895.07 1.81-.456 2.367-1.133" />
    </svg>
  );
}

function MethodMark({ icon, size = 32 }: { icon: string; size?: number }) {
  const m = MARK[icon] ?? MARK.btc;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-6 p-px"
      style={{ width: size, height: size, background: m.outer }}
    >
      <div
        className="flex h-full w-full items-center justify-center overflow-hidden rounded-[5px]"
        style={{ background: m.inner }}
      >
        {icon === "apple" ? (
          <AppleLogo />
        ) : icon === "gpay" ? (
          <Icons.google className="text-14 text-[#4285F4]" />
        ) : icon === "card" ? (
          <div className="flex items-center">
            <img src="/img/payment/visa.svg" alt="" className="h-10 w-14 object-contain" />
            <img src="/img/payment/mastercard.svg" alt="" className="-ml-4 h-10 w-14 object-contain" />
          </div>
        ) : icon === "gift" ? (
          <span className="text-10 font-bold text-white">K</span>
        ) : m.src ? (
          <img src={m.src} alt="" className="h-18 w-18 object-contain" />
        ) : (
          <span className="text-12 font-bold" style={{ color: m.color }}>
            {m.letter}
          </span>
        )}
      </div>
    </div>
  );
}

function AddressQr({ value }: { value: string }) {
  const modules = useMemo(() => qrModules(value, 25), [value]);
  const n = modules.length;
  const size = 168;
  const cell = size / n;
  return (
    <div className="relative mx-auto my-16 flex h-180 w-180 items-center justify-center rounded-8 bg-white p-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
        {modules.map((row, y) =>
          row.map((on, x) =>
            on ? <rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell} height={cell} fill="#0e111a" /> : null,
          ),
        )}
      </svg>
      <img src="/img/bloxypack-mark.png" alt="" className="pointer-events-none absolute h-28 w-28 object-contain" />
    </div>
  );
}

function PrimaryBtn({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-32 w-full shrink-0 cursor-pointer items-center justify-center rounded-6 bg-gradient-to-b from-green to-green-2 px-12 text-12 font-medium text-grey-190 transition-all duration-200 hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Field({
  label,
  tone = "muted",
  children,
}: {
  label: string;
  tone?: "muted" | "green";
  children: ReactNode;
}) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-6">
      <p className={`text-11 ${tone === "green" ? "text-green" : "text-grey-142"}`}>{label}</p>
      {children}
    </div>
  );
}

function DarkInput({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex h-36 items-center rounded-8 border-1 border-grey-58 bg-grey-34 px-10 focus-within:border-grey-70 ${className}`}>
      {children}
    </div>
  );
}

function AffiliateBanner({ onClick }: { onClick: () => void }) {
  return (
    <div className="mt-auto shrink-0 space-y-12 pt-16">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full cursor-pointer items-center gap-8 rounded-8 border-1 border-grey-58 bg-grey-47 px-12 py-10 text-left text-12 leading-[16px] text-grey-142 transition-opacity hover:opacity-80"
      >
        <span className="text-yellow">
          <WarningGlyph />
        </span>
        No active affiliate code. Add one now before depositing to support your favorite creator!
      </button>
    </div>
  );
}

function MethodCard({
  method,
  selected,
  onClick,
}: {
  method: WalletMethod;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-58 w-full cursor-pointer rounded-8 border-1 p-12 text-left transition-colors ${
        selected ? "border-green/10 bg-green/10" : "border-grey-58 bg-grey-39 hover:border-grey-70"
      }`}
    >
      {method.badge ? (
        <span className="absolute top-6 right-6 rounded-full bg-green/10 px-6 py-2 text-10 font-medium text-green">
          {method.badge}
        </span>
      ) : null}
      <div className="flex items-center gap-8">
        <MethodMark icon={method.icon} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-14 text-white">{method.name}</span>
          <span className="text-12 text-grey-142">{method.sub}</span>
        </div>
      </div>
    </button>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="mb-12 flex h-28 items-center gap-4 self-start rounded-6 border-1 border-white/10 bg-white/5 px-10 text-12 text-white sm:hidden"
      onClick={onClick}
    >
      <Icons.chevronLeft className="text-12" />
      Back
    </button>
  );
}

export function WalletModal({
  tab: initialTab,
  leaving,
  onClose,
}: {
  tab: Tab;
  leaving: boolean;
  onClose: () => void;
}) {
  const { user, openModal, applyUser } = useStore();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [methodId, setMethodId] = useState(initialTab === "withdraw" ? WITHDRAW_CRYPTO[0].id : DEPOSIT_CRYPTO[0].id);
  const [usd, setUsd] = useState("50");
  const [cryptoAmt, setCryptoAmt] = useState("");
  const [receiveBux, setReceiveBux] = useState("");
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [address, setAddress] = useState("");
  const [giftCode, setGiftCode] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [detailOpen, setDetailOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  const [depositAddress, setDepositAddress] = useState("");
  const [solUsd, setSolUsd] = useState(0);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    setTab(initialTab);
    setMethodId(initialTab === "withdraw" ? WITHDRAW_CRYPTO[0].id : DEPOSIT_CRYPTO[0].id);
    setError("");
    setCopied(false);
    setDetailOpen(true);
  }, [initialTab]);

  const methods = tab === "withdraw" ? WITHDRAW_CRYPTO : DEPOSIT_CRYPTO;
  const method = methods.find((m) => m.id === methodId) ?? methods[0];
  const livePrice = method.ticker === "SOL" && solUsd > 0 ? solUsd : method.price;
  const usdNum = Number(usd) || 0;
  const cryptoPay = Number(cryptoAmt) || 0;
  const buxFromFiat = usdToBux(usdNum);
  const withdrawBux = Number(withdrawAmt) || 0;
  const withdrawCrypto = livePrice > 0 ? withdrawBux / livePrice : 0;
  const available = user?.balance ?? 0;

  const requireUser = (next: () => void) => {
    if (!user) return openModal("login");
    next();
  };

  const selectTab = (next: Tab) => {
    setTab(next);
    setMethodId(next === "withdraw" ? WITHDRAW_CRYPTO[0].id : DEPOSIT_CRYPTO[0].id);
    setError("");
    setCopied(false);
    setWithdrawAmt("");
    setAddress("");
    setDetailOpen(true);
  };

  const selectMethod = (id: string) => {
    setMethodId(id);
    setError("");
    setCopied(false);
    setCryptoAmt("");
    setReceiveBux("");
    setDetailOpen(true);
  };

  useEffect(() => {
    if (!user || method.kind !== "crypto") return;
    let cancelled = false;
    getCryptoData()
      .then((res) => {
        if (cancelled) return;
        const ticker = method.ticker === "USDCS" || method.ticker === "USDC" ? "usdc" : method.ticker.toLowerCase();
        setDepositAddress(res.addresses?.[ticker] || res.addresses?.sol || "");
        const solMilli = res.prices?.sol?.price;
        if (solMilli) setSolUsd(solMilli / 1000);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || "Could not load deposit address.");
      });
    return () => {
      cancelled = true;
    };
  }, [user, method.kind, method.ticker, method.id]);

  const setPayCrypto = (value: string) => {
    setCryptoAmt(value);
    const n = Number(value);
    if (!Number.isFinite(n) || !value.trim()) return setReceiveBux("");
    setReceiveBux(String(Math.round(n * livePrice)));
  };

  const setRecvBux = (value: string) => {
    setReceiveBux(value);
    const n = Number(value);
    if (!Number.isFinite(n) || !value.trim() || method.price <= 0) return setCryptoAmt("");
    setCryptoAmt((n / livePrice).toFixed(6).replace(/0+$/, "").replace(/\.$/, ""));
  };

  const proceedFiat = () => {
    requireUser(() => {
      setError("Card deposits are not live. Use SOL or USDC on Solana.");
    });
  };

  const redeemGift = () => {
    requireUser(() => {
      setError("Gift cards are not live. Use SOL or USDC on Solana.");
    });
  };

  const submitWithdraw = () => {
    requireUser(() => {
      const currency = method.id === "w-sol" ? "sol" : method.id === "w-usdc-sol" ? "usdc" : null;
      if (!currency) return setError("Withdraws are SOL and USDC (Solana) only. Send to a Phantom address.");
      if (!address.trim()) return setError("Enter a destination address.");
      if (withdrawBux <= 0) return setError("Enter an amount.");
      if (withdrawBux > available) return setError("Not enough balance.");
      setBusy(true);
      setError("");
      sendCryptoWithdraw(currency, address, withdrawBux)
        .then((res) => {
          if (res.user) applyUser(res.user);
          onClose();
        })
        .catch((err: Error) => setError(err.message || "Withdraw failed."))
        .finally(() => setBusy(false));
    });
  };

  let leftPanel: ReactNode;
  if (tab === "withdraw") {
    leftPanel = (
      <div className="flex min-h-0 flex-1 flex-col rounded-8 bg-grey-39 p-12">
        <BackBtn onClick={() => setDetailOpen(false)} />
        <div className="mb-8 flex items-center gap-8">
          <PanelIcon tone="gold">
            <BriefcaseGlyph />
          </PanelIcon>
          <div className="flex min-w-0 flex-col gap-2">
            <h3 className="tactic-heading-xs text-start text-white">Withdraw cryptocurrency</h3>
            <span className="text-start text-13 text-grey-142">Send your coins to an external crypto wallet</span>
          </div>
        </div>
        <div className="mb-16 flex h-32 items-center gap-8 rounded-6 border-1 border-grey-58 bg-grey-34 px-12">
          <MethodMark icon={method.icon} size={20} />
          <span className="text-12 text-white">{method.name}</span>
        </div>
        <p className="mb-6 text-11 uppercase tracking-[0.04em] text-grey-142">{method.name}</p>
        <DarkInput className="mb-16">
          <input
            autoComplete="off"
            className="h-full w-full bg-transparent text-13 text-white outline-none placeholder:text-grey-112"
            placeholder="Enter address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </DarkInput>
        <p className="mb-6 text-11 uppercase tracking-[0.04em] text-grey-142">Amount</p>
        <DarkInput className="mb-16">
          <BuxGlyph style={{ width: 16, height: 16 }} />
          <input
            autoComplete="off"
            className="ml-8 h-full min-w-0 flex-1 bg-transparent text-13 text-white outline-none"
            placeholder="0.00"
            type="number"
            value={withdrawAmt}
            onChange={(e) => setWithdrawAmt(e.target.value)}
          />
          <button
            type="button"
            className="rounded-6 bg-gradient-to-b from-green to-green-2 px-8 py-4 text-11 font-medium text-grey-190"
            onClick={() => setWithdrawAmt(String(Math.floor(available)))}
          >
            MAX
          </button>
        </DarkInput>
        <p className="mb-6 text-11 text-green">You will receive</p>
        <DarkInput className="mb-16">
          <MethodMark icon={method.icon} size={16} />
          <span className="ml-8 text-13 text-white">{withdrawCrypto > 0 ? withdrawCrypto.toFixed(6) : ""}</span>
        </DarkInput>
        <p className="mt-auto mb-12 flex flex-wrap items-center gap-4 text-12 text-grey-142">
          Available balance:
          <BuxGlyph style={{ width: 14, height: 14 }} />
          {formatBux(available)}
          <span>-</span>
          <BuxGlyph style={{ width: 14, height: 14 }} />
          0.00 balance locked by wager
        </p>
        {error ? <p className="mb-8 text-12 text-red">{error}</p> : null}
        <PrimaryBtn onClick={submitWithdraw}>{busy ? "Sending…" : "Withdraw"}</PrimaryBtn>
      </div>
    );
  } else if (method.kind === "crypto") {
    leftPanel = (
      <>
        <div className="flex shrink-0 flex-col rounded-8 bg-grey-39 p-12">
          <BackBtn onClick={() => setDetailOpen(false)} />
          <div className="mb-8 flex items-center gap-8">
            <PanelIcon>
              <CoinsGlyph />
            </PanelIcon>
            <div className="flex min-w-0 flex-col gap-2">
              <h3 className="tactic-heading-xs text-start text-white">Crypto</h3>
              <span className="text-start text-13 text-grey-142">Send cryptocurrency to your deposit address</span>
            </div>
          </div>
          <div className="mb-16 flex h-32 items-center gap-8 rounded-6 border-1 border-grey-58 bg-grey-34 px-12">
            <MethodMark icon={method.icon} size={20} />
            <span className="text-12 text-white">{method.name}</span>
          </div>
          {depositAddress ? (
            <AddressQr value={depositAddress} />
          ) : (
            <div className="relative mx-auto my-16 flex h-180 w-180 items-center justify-center rounded-8 bg-white/90 p-6 text-center text-12 text-grey-58">
              {error || "Loading address…"}
            </div>
          )}
          <p className="mb-12 text-center text-12 text-grey-142">Your personal {method.name} address</p>
          <p className="mb-6 text-12 text-grey-142">{method.name} address</p>
          <div className="mb-16 flex h-36 items-center gap-8 rounded-8 border-1 border-grey-58 bg-grey-34 py-4 pl-12 pr-4">
            <input readOnly value={depositAddress} placeholder="Loading…" className="h-full min-w-0 flex-1 bg-transparent text-12 text-white outline-none" />
            <button
              type="button"
              className="flex h-28 w-28 shrink-0 items-center justify-center rounded-6 bg-gradient-to-b from-green to-green-2 text-grey-190"
              onClick={() => {
                void navigator.clipboard.writeText(depositAddress);
                setCopied(true);
              }}
              aria-label="copy address"
            >
              <Icons.copy className="text-14" />
            </button>
          </div>
          {method.ticker !== "SOL" && method.ticker !== "USDC" && method.ticker !== "USDCS" ? (
            <div className="mb-16 flex items-center gap-8 rounded-8 bg-[#2a2210] px-12 py-10 text-12 text-grey-142">
              Live deposits are SOL and USDC on Solana only.
            </div>
          ) : null}
          {method.minCrypto ? (
            <div className="mb-16 flex items-center gap-8 rounded-8 bg-[#2a2210] px-12 py-10 text-12 text-grey-142">
              <span className="text-yellow">
                <WarningGlyph />
              </span>
              Deposits under {method.minCrypto} {method.ticker} are not accepted.
            </div>
          ) : null}
          <p className="mb-12 text-12 text-grey-142">
            Current rate: 1 {method.ticker} = {livePrice.toLocaleString("en-US", { maximumFractionDigits: 2 })} USD
          </p>
          <div className="grid grid-cols-2 gap-12">
            <Field label="You will pay">
              <DarkInput>
                <MethodMark icon={method.icon} size={16} />
                <input
                  autoComplete="off"
                  className="ml-8 h-full min-w-0 flex-1 bg-transparent text-13 text-white outline-none"
                  placeholder="0.00"
                  type="number"
                  value={cryptoAmt}
                  onChange={(e) => setPayCrypto(e.target.value)}
                />
              </DarkInput>
            </Field>
            <Field label="You will receive" tone="green">
              <DarkInput>
                <BuxGlyph style={{ width: 16, height: 16 }} />
                <input
                  autoComplete="off"
                  className="ml-8 h-full min-w-0 flex-1 bg-transparent text-13 text-green outline-none"
                  placeholder="0.00"
                  type="number"
                  value={receiveBux}
                  onChange={(e) => setRecvBux(e.target.value)}
                />
              </DarkInput>
            </Field>
          </div>
        </div>
        <AffiliateBanner onClick={() => openModal("affiliate")} />
      </>
    );
  } else {
    const presets = method.kind === "gift" ? GIFT_PRESETS : FIAT_PRESETS;
    leftPanel = (
      <>
        <div className="flex shrink-0 flex-col rounded-8 bg-grey-39 p-12">
          <BackBtn onClick={() => setDetailOpen(false)} />
          {method.kind === "gift" ? (
            <>
              <div className="mb-16 flex items-center gap-8">
                <PanelIcon>
                  <GiftGlyph />
                </PanelIcon>
                <div className="flex min-w-0 flex-col gap-2">
                  <h3 className="tactic-heading-xs text-start text-white">1. Select Provider</h3>
                  <span className="text-start text-13 text-grey-142">Choose where to buy your gift card</span>
                </div>
              </div>
              <div className="mb-24 grid grid-cols-2 gap-12">
                <div className="relative flex h-40 cursor-default items-center justify-center rounded-8 border-1 border-green/20 bg-green/20">
                  <span className="text-13 font-semibold tracking-[0.12em] text-orange">KINGUIN</span>
                </div>
              </div>
            </>
          ) : null}
          <div className={`${method.kind === "gift" ? "mb-16" : "mb-32"} flex items-center gap-8`}>
            <PanelIcon>
              <WalletGlyph />
            </PanelIcon>
            <div className="flex min-w-0 flex-col gap-2">
              <h3 className="tactic-heading-xs text-start text-white">{method.kind === "gift" ? "2. Enter amount" : "Enter amount"}</h3>
              <span className="text-start text-13 text-grey-142">Choose how much you want to deposit</span>
            </div>
          </div>
          <div className="mb-16 grid grid-cols-2 gap-12">
            <Field label="You will pay">
              <DarkInput>
                <span className="mr-6 text-13 text-grey-142">$</span>
                <input
                  autoComplete="off"
                  className="h-full w-full bg-transparent text-13 text-white outline-none"
                  type="number"
                  value={usd}
                  onChange={(e) => setUsd(e.target.value)}
                />
              </DarkInput>
            </Field>
            <Field label="You will receive" tone="green">
              <DarkInput>
                <BuxGlyph style={{ width: 16, height: 16 }} />
                <span className="ml-8 text-13 text-green">{usdNum > 0 ? formatBux(buxFromFiat) : ""}</span>
              </DarkInput>
            </Field>
          </div>
          <div className="mb-24 grid grid-cols-3 gap-8 border-b-1 border-grey-58 pb-32">
            {presets.map((n) => {
              const on = usdNum === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setUsd(String(n))}
                  className={`h-32 rounded-6 text-12 font-medium transition-colors ${
                    on
                      ? "bg-gradient-to-b from-green to-green-2 text-grey-190"
                      : "bg-grey-34 text-grey-142 hover:bg-grey-47 hover:text-white"
                  }`}
                >
                  ${n}
                </button>
              );
            })}
          </div>
          <label className="mb-16 flex cursor-pointer items-center gap-8">
            <button
              type="button"
              aria-label="toggle"
              onClick={() => setAgreed((v) => !v)}
              className={`flex h-18 w-18 shrink-0 items-center justify-center rounded-4 border-2 ${
                agreed ? "border-green bg-green" : "border-grey-58 bg-transparent"
              }`}
            >
              <Icons.check className={`text-12 text-grey-28 ${agreed ? "opacity-100" : "opacity-0"}`} />
            </button>
            <span className="text-12 leading-snug text-grey-142">
              I understand and accept that this transaction is non-refundable.
            </span>
          </label>
          {error && method.kind !== "gift" ? <p className="mb-8 text-12 text-red">{error}</p> : null}
          <PrimaryBtn onClick={proceedFiat}>Proceed Payment</PrimaryBtn>
          {method.kind === "gift" ? (
            <div className="mt-24">
              <div className="mb-12 flex items-center gap-8">
                <PanelIcon>
                  <GiftGlyph />
                </PanelIcon>
                <div className="flex min-w-0 flex-col gap-2">
                  <h3 className="tactic-heading-xs text-start text-white">Got a gift card? Redeem it here</h3>
                  <span className="text-start text-13 text-grey-142">Enter your gift card code to add funds to your account</span>
                </div>
              </div>
              <DarkInput className="mb-12">
                <input
                  autoComplete="off"
                  className="h-full w-full bg-transparent text-13 text-white outline-none placeholder:text-grey-112"
                  placeholder="Gift card code"
                  value={giftCode}
                  onChange={(e) => setGiftCode(e.target.value)}
                />
              </DarkInput>
              {error ? <p className="mb-8 text-12 text-red">{error}</p> : null}
              <PrimaryBtn onClick={redeemGift}>Redeem</PrimaryBtn>
            </div>
          ) : null}
        </div>
        <AffiliateBanner onClick={() => openModal("affiliate")} />
      </>
    );
  }

  return (
    <div
      className={`fixed inset-0 isolate flex w-full items-center justify-center overflow-hidden p-10 sm:p-20 ${
        leaving ? "pointer-events-none" : ""
      }`}
      style={{ zIndex: 100 }}
    >
      <button
        type="button"
        aria-label="close overlay"
        className={`${leaving ? "animate-overlay-out" : "animate-overlay-in"} absolute inset-0 bg-black/55 backdrop-blur-[8px]`}
        onClick={leaving ? undefined : onClose}
      />
      <div
        className={`relative z-50 flex max-h-[90vh] w-full max-w-[1024px] flex-col overflow-hidden rounded-8 border-1 border-grey-58 bg-grey-34 shadow-xl ${
          leaving ? "animate-modal-out" : "animate-modal-in"
        }`}
      >
        <button
          type="button"
          aria-label="close"
          className="absolute top-16 right-16 z-30 flex h-24 w-24 items-center justify-center text-grey-142 transition-colors hover:text-white"
          onClick={onClose}
        >
          <Icons.close className="text-18" />
        </button>
        <div className="relative flex min-h-0 w-full gap-0 overflow-hidden sm:h-[min(90vh,800px)]">
          <div
            className={`absolute z-20 h-full w-full overflow-hidden rounded-8 bg-grey-34 transition-transform duration-500 ease-in-out sm:relative sm:z-0 sm:h-full sm:max-w-[450px] sm:min-w-[450px] ${
              detailOpen ? "max-sm:translate-x-0" : "max-sm:-translate-x-full"
            }`}
          >
            <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto overscroll-contain p-8">{leftPanel}</div>
          </div>
          <div className="flex min-h-0 w-full flex-col p-24">
            <div className="flex items-center justify-start gap-10 pr-32">
              <PanelIcon size={40}>
                <WalletGlyph />
              </PanelIcon>
              <div className="flex min-w-0 flex-col gap-2">
                <h2 className="tactic-heading-xs text-start text-white">My Wallet</h2>
                <span className="text-start text-13 text-grey-142">
                  Find various options to fund your account and ways to withdraw your winnings.
                </span>
              </div>
            </div>
            <div className="mt-8 mb-12 flex-shrink-0">
              <div className="inline-flex w-full gap-4 rounded-8 border-1 border-grey-58 bg-grey-39 p-4">
                {(["deposit", "withdraw"] as const).map((id) => {
                  const on = tab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => selectTab(id)}
                      className={`flex h-26 flex-1 items-center justify-center rounded-6 px-10 text-12 font-medium transition-colors ${
                        on
                          ? "border-1 border-green bg-gradient-to-b from-green to-green-2 text-grey-190"
                          : "border-1 border-transparent text-white hover:bg-white/10"
                      }`}
                    >
                      {id === "deposit" ? "Deposit" : "Withdraw"}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pr-4">
              {tab === "deposit" ? (
                <>
                  <p className="mb-8 text-12 text-grey-142">Cryptocurrency</p>
                  <div className="grid grid-cols-3 gap-8 pb-8">
                    {DEPOSIT_CRYPTO.map((m) => (
                      <MethodCard key={m.id} method={m} selected={methodId === m.id} onClick={() => selectMethod(m.id)} />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-8 text-12 text-grey-142">Cryptocurrency</p>
                  <div className="grid grid-cols-3 gap-8 pb-8">
                    {WITHDRAW_CRYPTO.map((m) => (
                      <MethodCard key={m.id} method={m} selected={methodId === m.id} onClick={() => selectMethod(m.id)} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
