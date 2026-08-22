"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import QRCode from "qrcode";
import { formatBux } from "@/lib/format";
import { BuxGlyph } from "./icons";
import { Icons } from "./icons";
import { useStore } from "./providers";
import { getCryptoData, sendCryptoWithdraw } from "@/lib/backend";

type Tab = "deposit" | "withdraw";
type WalletMethod = {
  id: string;
  kind: "crypto";
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

function WarningGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden>
      <path d="M8.87 1.8c-.38-.66-1.36-.66-1.74 0L.76 12.4c-.38.66.1 1.5.87 1.5h12.74c.77 0 1.25-.84.87-1.5L8.87 1.8ZM8 5.5c.4 0 .7.3.7.7v3.1c0 .4-.3.7-.7.7s-.7-.3-.7-.7V6.2c0-.4.3-.7.7-.7Zm0 7.1a.85.85 0 1 1 0-1.7.85.85 0 0 1 0 1.7Z" />
    </svg>
  );
}

const MARK: Record<string, { outer: string; inner: string; src: string }> = {
  sol: {
    outer: "linear-gradient(rgb(30, 40, 55) 0%, rgb(57, 23, 116) 100%)",
    inner: "radial-gradient(62.5% 62.5% at 50% 89.29%, rgb(172, 131, 243) 0%, rgba(59, 36, 99, 0) 85.58%), rgb(57, 23, 116)",
    src: "/img/payment/solana.svg",
  },
  usdc: {
    outer: "linear-gradient(rgb(30, 40, 55) 0%, rgb(20, 70, 140) 100%)",
    inner: "radial-gradient(62.5% 62.5% at 50% 89.29%, rgb(90, 170, 255) 0%, rgba(20, 70, 140, 0) 85.58%), rgb(20, 70, 140)",
    src: "/img/payment/usdc.svg",
  },
};

function MethodMark({ icon, size = 32 }: { icon: string; size?: number }) {
  const m = MARK[icon] ?? MARK.sol;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-6 p-px"
      style={{ width: size, height: size, background: m.outer }}
    >
      <div
        className="flex h-full w-full items-center justify-center overflow-hidden rounded-[5px]"
        style={{ background: m.inner }}
      >
        <img src={m.src} alt="" className="h-18 w-18 object-contain" />
      </div>
    </div>
  );
}

function AddressQr({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    let cancelled = false;

    const draw = async () => {
      await QRCode.toCanvas(canvas, value, {
        width: 168,
        margin: 1,
        errorCorrectionLevel: "H",
        color: { dark: "#0e111a", light: "#ffffff" },
      });
      if (cancelled) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const logo = new Image();
      logo.src = "/img/logo.png";
      await logo.decode();
      if (cancelled) return;
      const max = 52;
      const ratio = logo.width / Math.max(logo.height, 1);
      const w = ratio >= 1 ? max : max * ratio;
      const h = ratio >= 1 ? max / ratio : max;
      const x = (canvas.width - w) / 2;
      const y = (canvas.height - h) / 2;
      const pad = 5;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(x - pad, y - pad, w + pad * 2, h + pad * 2, 6);
      ctx.fill();
      ctx.drawImage(logo, x, y, w, h);
    };

    void draw();
    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div className="relative mx-auto my-16 flex h-180 w-180 items-center justify-center rounded-8 bg-white p-6">
      <canvas ref={canvasRef} width={168} height={168} className="block h-168 w-168" />
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
  const [cryptoAmt, setCryptoAmt] = useState("");
  const [receiveBux, setReceiveBux] = useState("");
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [address, setAddress] = useState("");
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
  } else {
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
