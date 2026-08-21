"use client";

import { useEffect, useState, type ReactNode } from "react";
import { claimAffiliateCode, claimPromoCode } from "@/lib/backend";
import { GreenButton, green3d } from "./green-button";
import { Icons } from "./icons";
import { useStore } from "./providers";
import { Bux, BuxIcon } from "./bux";
import { WalletModal } from "./wallet-modal";

const FEATURED_AFFILIATE_CODE = "BLOXYWILD";

const MODAL_EXIT_MS = 220;

function Overlay({
  children,
  onClose,
  leaving = false,
}: {
  children: React.ReactNode;
  onClose: () => void;
  leaving?: boolean;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <div className={`fixed inset-0 z-[100] isolate flex items-center justify-center overflow-y-auto ${leaving ? "pointer-events-none" : ""}`}>
      <button
        className={`${leaving ? "animate-overlay-out" : "animate-overlay-in"} absolute inset-0 bg-black/55 backdrop-blur-[8px]`}
        aria-label="close overlay"
        onClick={leaving ? undefined : onClose}
      />
      <div className={`relative z-10 my-24 ${leaving ? "animate-modal-out" : "animate-modal-in"}`}>{children}</div>
    </div>
  );
}

function ModalFrame({
  width,
  onClose,
  children,
  banner,
  leaving = false,
}: {
  width: number;
  onClose: () => void;
  children: ReactNode;
  banner?: string;
  leaving?: boolean;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 isolate flex w-full min-w-[330px] items-center overflow-hidden p-10 sm:p-12 sm:p-20 md:p-24 lg:p-30 ${
        leaving ? "pointer-events-none" : ""
      }`}
      style={{ zIndex: 100 }}
    >
      <div className="relative flex max-h-full w-full overflow-y-auto rounded-4 sm:rounded-4">
        <button
          type="button"
          aria-label="close"
          className={`${leaving ? "animate-overlay-out" : "animate-overlay-in"} fixed inset-0 bg-black/55 backdrop-blur-[8px]`}
          onClick={leaving ? undefined : onClose}
        />
        <div className={`relative left-1/2 -translate-x-1/2 xs:w-auto ${leaving ? "animate-modal-out" : "animate-modal-in"}`}>
          <div
            className={`relative z-50 overflow-hidden rounded-12 bg-grey-34 ${
              banner ? "w-[min(92vw,480px)] sm:w-[min(92vw,740px)]" : "!max-w-full"
            }`}
            style={banner ? undefined : { width }}
          >
            <div className="relative flex h-full w-full">
              {banner ? (
                <div className="relative hidden w-[260px] shrink-0 self-stretch overflow-hidden sm:block">
                  <img
                    src={banner}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-[center_20%]"
                  />
                </div>
              ) : null}
              <div className="relative flex min-w-0 flex-1 flex-col overflow-y-auto bg-grey-34">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthShell({
  title,
  onClose,
  children,
  leaving = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  leaving?: boolean;
}) {
  return (
    <ModalFrame width={480} onClose={onClose} banner="/img/auth-banner.png" leaving={leaving}>
      <div className="@sm/page:gap-24 @sm/page:p-24 grid w-full grid-cols-1 gap-14 p-16">
        <div className="grid w-full grid-cols-[1fr_auto] items-center">
          <div className="flex w-full">
            <div>
              <h1 className="text-white/90">{title}</h1>
            </div>
          </div>
          <button
            type="button"
            aria-label="close"
            className="group flex h-20 w-20 items-center justify-center"
            onClick={onClose}
          >
            <Icons.close className="text-22 text-grey-142 transition-colors group-hover:text-white group-active:text-white" />
          </button>
        </div>
        <div className="w-full border-b-1 border-grey-47 transition-colors duration-200" />
        {children}
      </div>
    </ModalFrame>
  );
}

function AuthField({
  label,
  name,
  type = "text",
  value,
  onChange,
  icon,
  trailing,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  icon: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="grid w-full grid-cols-1 gap-8">
      <h2 className="text-14 text-grey-142 transition-colors duration-200">{label}</h2>
      <div className="relative flex h-40 w-full items-center rounded-8 border-2 border-transparent bg-grey-28 px-12 py-4 transition-colors duration-200">
        <div className="mr-2">{icon}</div>
        <input
          autoComplete="off"
          className="flex h-full w-full items-center bg-grey-28 px-10 text-14 text-white outline-none"
          placeholder={label}
          type={type}
          value={value}
          name={name}
          onChange={(e) => onChange(e.target.value)}
        />
        {trailing}
      </div>
    </div>
  );
}

function ShowToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button type="button" aria-label="toggle" onClick={onToggle} className="group ml-4 flex h-24 items-start rounded-4 bg-grey-28">
      <div className="tr-s flex h-full w-full items-center justify-center rounded-4 bg-grey-39 px-8">
        <p className="text-14 text-grey-142">{show ? "Hide" : "Show"}</p>
      </div>
    </button>
  );
}

function GoogleButton() {
  return (
    <button
      type="button"
      aria-label="button"
      className="group/button relative flex h-40 cursor-pointer items-start justify-center rounded-6 bg-grey-58 opacity-100 transition-all duration-200 hover:bg-grey-70 active:bg-grey-70"
    >
      <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-16">
        <div className="-ml-2 text-white">
          <Icons.google />
        </div>
        <p className="transition-all duration-300 text-14 text-white">Sign in via Google</p>
      </div>
    </button>
  );
}

function RedeemCodeShell({
  title,
  description,
  extra,
  placeholder,
  value,
  onChange,
  onSubmit,
  submitLabel,
  saving,
  error,
  onClose,
  leaving,
}: {
  title: string;
  description: ReactNode;
  extra?: ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  submitLabel: string;
  saving: boolean;
  error: string;
  onClose: () => void;
  leaving: boolean;
}) {
  return (
    <ModalFrame width={420} onClose={onClose} leaving={leaving}>
      <div className="relative flex w-full flex-col p-20 sm:p-24">
        <div className="pointer-events-none absolute top-72 left-1/2 h-120 w-120 -translate-x-1/2 rounded-full bg-green/20 blur-[80px]" />
        <div className="relative z-10 grid w-full grid-cols-[1fr_auto] items-center">
          <h1 className="text-18 font-semibold text-white">{title}</h1>
          <button type="button" aria-label="close" className="group flex h-20 w-20 items-center justify-center" onClick={onClose}>
            <Icons.close className="text-22 text-grey-142 transition-colors group-hover:text-white group-active:text-white" />
          </button>
        </div>
        <div className="relative z-10 mt-16 mb-20 h-px w-full bg-grey-47" />
        <div className="relative z-10 mb-20 grid w-full grid-cols-1 justify-items-center gap-12">
          <div className="flex h-80 w-80 items-center justify-center rounded-16 bg-grey-28 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
            <img src="/img/rewards/gift.svg" alt="" className="h-48 w-32 object-contain" />
          </div>
          <p className="max-w-[320px] text-center text-13 leading-[18px] text-grey-142">{description}</p>
        </div>
        {extra ? <div className="relative z-10 mb-16 w-full">{extra}</div> : null}
        <form
          className="relative z-10 grid w-full grid-cols-1 gap-12"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="relative flex h-48 w-full items-center rounded-8 border-2 border-transparent bg-grey-28 px-14 py-4 transition-colors duration-200 focus-within:border-grey-47">
            <Icons.affiliate className="mr-8 text-18 text-grey-142" />
            <input
              autoComplete="off"
              autoFocus
              className="flex h-full w-full items-center bg-transparent text-14 text-white outline-none placeholder:text-grey-142"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
          {error ? <p className="text-13 text-red">{error}</p> : null}
          <GreenButton type="submit" loading={saving}>
            {submitLabel}
          </GreenButton>
        </form>
      </div>
    </ModalFrame>
  );
}

export function Modals() {
  const {
    modal,
    closeModal,
    dismissWelcome,
    openModal,
    login,
    register,
    user,
    tipRain,
    rain,
    applyUser,
  } = useStore();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [amount, setAmount] = useState("");
  const [affiliateCode, setAffiliateCode] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shown, setShown] = useState(modal);

  useEffect(() => {
    if (modal) {
      setShown(modal);
      return;
    }
    const t = window.setTimeout(() => setShown(null), MODAL_EXIT_MS);
    return () => window.clearTimeout(t);
  }, [modal]);

  const view = modal ?? shown;
  const leaving = !modal && !!shown;
  if (!view) return null;

  if (view === "welcome") {
    return (
      <Overlay onClose={closeModal} leaving={leaving}>
        <div className="grid w-[520px] max-w-[92vw] justify-items-center gap-16 text-center">
          <span className="rounded-full bg-green px-12 py-4 text-12 font-bold tracking-wide text-grey-1">
            WELCOME TO
          </span>
          <img src="/img/logo.png" alt="BloxyPack" className="h-56 object-contain" />
          <p className="text-16 text-grey-190">Welcome to the #1 Roblox Case Opening Site!</p>
          <GreenButton onClick={dismissWelcome}>Continue to BloxyWild →</GreenButton>
        </div>
      </Overlay>
    );
  }

  if (view === "login") {
    return (
      <AuthShell title="Log in" onClose={closeModal} leaving={leaving}>
        <form
          className="contents"
          onSubmit={async (e) => {
            e.preventDefault();
            const err = await login(username, password);
            setError(err ?? "");
          }}
        >
          <div className="grid w-full grid-cols-1 gap-16">
            <AuthField
              label="Username or email"
              name="login"
              value={username}
              onChange={setUsername}
              icon={<Icons.user className="text-18 text-grey-190" />}
            />
            <div className="relative w-full">
              <AuthField
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={setPassword}
                icon={<Icons.lock className="text-18 text-grey-190" />}
                trailing={<ShowToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
              />
              <button type="button" className="group absolute top-0 right-0 flex justify-center">
                <p className="text-14 text-grey-142 group-hover:underline">Forgot password?</p>
              </button>
            </div>
          </div>
          {error ? <p className="text-14 text-red">{error}</p> : null}
          <div className="grid w-full grid-cols-1 gap-16">
            <GreenButton type="submit">Login</GreenButton>
            <div className="flex items-center justify-center">
              <p className="text-14 text-grey-190">Don&apos;t have an account?</p>
              <button
                type="button"
                className="ml-4"
                onClick={() => {
                  setError("");
                  setShowPassword(false);
                  openModal("register");
                }}
              >
                <p className="text-14 text-white hover:underline active:underline">Register</p>
              </button>
            </div>
          </div>
          <div className="w-full border-b-1 border-grey-47 transition-colors duration-200" />
          <GoogleButton />
        </form>
      </AuthShell>
    );
  }

  if (view === "register") {
    return (
      <AuthShell title="Register" onClose={closeModal} leaving={leaving}>
        <form
          className="contents"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!agreed) {
              setError("Please confirm you are 18+ and agree to the terms.");
              return;
            }
            const err = await register(username, email, password);
            setError(err ?? "");
          }}
        >
          <div className="grid w-full grid-cols-1 gap-12">
            <div className="grid w-full grid-cols-1 gap-12 sm:grid-cols-2">
              <AuthField
                label="Username"
                name="username"
                value={username}
                onChange={setUsername}
                icon={<Icons.user className="text-18 text-grey-190" />}
              />
              <AuthField
                label="Email"
                name="email"
                value={email}
                onChange={setEmail}
                icon={<Icons.mail className="text-18 text-grey-190" />}
              />
            </div>
            <div className="relative w-full">
              <AuthField
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={setPassword}
                icon={<Icons.lock className="text-18 text-grey-190" />}
                trailing={<ShowToggle show={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
              />
            </div>
          </div>
          <button
            type="button"
            aria-label="toggle"
            className="grid w-full cursor-pointer grid-cols-[auto_1fr] items-center gap-8"
            onClick={() => setAgreed((v) => !v)}
          >
            <div
              className={`flex h-18 w-18 shrink-0 items-center justify-center rounded-4 border-2 transition-colors duration-200 ${
                agreed
                  ? "border-green bg-green"
                  : "border-grey-47 bg-transparent hover:border-grey-190 active:border-grey-190"
              }`}
            >
              <Icons.check
                className={`text-14 text-grey-28 transition-opacity duration-200 ${agreed ? "opacity-100" : "opacity-0"}`}
              />
            </div>
            <p className="w-full text-left text-12 leading-snug text-grey-190">
              I am 18+ and agree to the Terms & Privacy Policy.
            </p>
          </button>
          {error ? <p className="text-14 text-red">{error}</p> : null}
          <div className="grid w-full grid-cols-1 gap-16">
            <GreenButton type="submit">Register</GreenButton>
            <div className="flex items-center justify-center">
              <p className="text-14 text-grey-190">Already have an account?</p>
              <button
                type="button"
                className="ml-4"
                onClick={() => {
                  setError("");
                  setShowPassword(false);
                  openModal("login");
                }}
              >
                <p className="text-14 text-white hover:underline active:underline">Log in</p>
              </button>
            </div>
          </div>
          <div className="w-full border-b-1 border-grey-47 transition-colors duration-200" />
          <GoogleButton />
        </form>
      </AuthShell>
    );
  }

  if (view === "deposit" || view === "withdraw") {
    return <WalletModal tab={view} leaving={leaving} onClose={closeModal} />;
  }

  if (view === "support") {
    return (
      <Overlay onClose={closeModal} leaving={leaving}>
        <div className="w-[420px] max-w-[92vw] rounded-12 bg-grey-34 p-24">
          <h2 className="mb-8 text-20 font-semibold">Support</h2>
          <p className="mb-16 text-14 text-grey-190">
            Live chat with staff, or join Discord for faster help with deposits and withdrawals.
          </p>
          <a
            href="https://discord.gg/rostake"
            target="_blank"
            rel="noreferrer"
            className={`flex h-40 w-full items-center justify-center px-16 ${green3d}`}
          >
            <span className="ui-btn-label text-13 text-grey-190">Open Discord</span>
          </a>
        </div>
      </Overlay>
    );
  }

  if (view === "affiliate") {
    const submitCode = async () => {
      const code = affiliateCode.trim();
      if (!code) {
        setError("Enter an affiliate code.");
        return;
      }
      setSaving(true);
      setError("");
      try {
        const res = await claimAffiliateCode(code);
        if (res.user) applyUser(res.user);
        closeModal();
        setAffiliateCode("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not redeem code.");
      } finally {
        setSaving(false);
      }
    };
    return (
      <RedeemCodeShell
        title="Redeem a Code"
        description="Enter a creator code to support them and unlock affiliate rewards."
        extra={
          <button
            type="button"
            onClick={() => {
              setAffiliateCode(FEATURED_AFFILIATE_CODE);
              setError("");
            }}
            className="flex w-full items-center justify-between gap-12 rounded-8 bg-grey-28 px-14 py-12 text-left transition-colors duration-200 hover:bg-grey-39"
          >
            <span>
              <span className="block text-11 uppercase tracking-[0.04em] text-grey-142">Featured code</span>
              <span className="mt-4 block text-16 font-semibold text-green">{FEATURED_AFFILIATE_CODE}</span>
            </span>
            <span className="rounded-6 bg-green/15 px-10 py-6 text-12 font-semibold text-green">Use</span>
          </button>
        }
        placeholder="Affiliate Code"
        value={affiliateCode}
        onChange={(v) => {
          setAffiliateCode(v);
          if (error) setError("");
        }}
        onSubmit={() => void submitCode()}
        submitLabel="Update Code"
        saving={saving}
        error={error}
        onClose={closeModal}
        leaving={leaving}
      />
    );
  }

  if (view === "promo") {
    const submitPromo = async () => {
      const code = promoCode.trim();
      if (!code) {
        setError("Enter a promo code.");
        return;
      }
      setSaving(true);
      setError("");
      try {
        await claimPromoCode(code);
        closeModal();
        setPromoCode("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not redeem code.");
      } finally {
        setSaving(false);
      }
    };
    return (
      <RedeemCodeShell
        title="Redeem a Code"
        description="Promo codes drop regularly on Discord and Twitter. Grab one, then enter it below."
        extra={
          <div className="grid grid-cols-2 gap-8">
            <a
              href="https://discord.gg/rostake"
              target="_blank"
              rel="noreferrer"
              className="flex h-52 items-center gap-10 rounded-8 bg-grey-28 px-12 transition-colors duration-200 hover:bg-grey-39"
            >
              <Icons.discord className="text-20 text-[#5865F2]" />
              <span>
                <span className="block text-13 text-white">Discord</span>
                <span className="text-11 text-grey-142">Join for codes</span>
              </span>
            </a>
            <a
              href="https://x.com/rostakedotcom"
              target="_blank"
              rel="noreferrer"
              className="flex h-52 items-center gap-10 rounded-8 bg-grey-28 px-12 transition-colors duration-200 hover:bg-grey-39"
            >
              <Icons.twitter className="text-18 text-white" />
              <span>
                <span className="block text-13 text-white">Twitter</span>
                <span className="text-11 text-grey-142">Follow for drops</span>
              </span>
            </a>
          </div>
        }
        placeholder="Promo Code"
        value={promoCode}
        onChange={(v) => {
          setPromoCode(v);
          if (error) setError("");
        }}
        onSubmit={() => void submitPromo()}
        submitLabel="Redeem Code"
        saving={saving}
        error={error}
        onClose={closeModal}
        leaving={leaving}
      />
    );
  }

  if (view === "rain") {
    const remain = Math.max(0, rain.endsAt - Date.now());
    const pct = Math.min(100, Math.max(0, (remain / (60 * 60 * 1000)) * 100));
    const sendTip = async () => {
      const n = Number(amount);
      if (!user) return openModal("login");
      if (!Number.isFinite(n) || n <= 0) return;
      setSaving(true);
      setError("");
      const err = await tipRain(n);
      setSaving(false);
      if (err) {
        setError(err);
        return;
      }
      setAmount("");
      closeModal();
    };
    return (
      <ModalFrame width={380} onClose={closeModal} leaving={leaving}>
        <div className="absolute top-24 right-24 z-10">
          <button type="button" aria-label="close" className="group flex h-20 w-20 items-center justify-center" onClick={closeModal}>
            <Icons.close className="text-22 text-grey-142 transition-colors group-hover:text-white group-active:text-white" />
          </button>
        </div>
        <div className="relative grid w-full p-16 sm:p-24 md:p-32">
          <div className="absolute top-0 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 bg-green/60 blur-[80px]" />
          <div className="grid w-full grid-cols-1 gap-24 md:gap-32">
            <div className="grid w-full grid-cols-1 gap-12">
              <p className="text-center text-24 text-green">Tipping rain</p>
              <div className="grid w-full grid-cols-1 gap-24">
                <div className="relative flex h-48 w-full items-center rounded-t-8 bg-green/10 px-12 pb-2">
                  <div className="absolute bottom-0 left-0 h-2 w-full bg-grey-28">
                    <div className="h-2 bg-green" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="grid w-full grid-cols-[1fr_auto] items-center gap-10">
                    <div className="flex w-full items-center">
                      <div className="relative mr-6 h-14 w-14 rounded-full bg-green/20">
                        <div className="absolute top-1/2 left-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green" />
                      </div>
                      <h2 className="text-14 font-bold text-white">Rain pool</h2>
                    </div>
                    <Bux value={rain.amount} />
                  </div>
                </div>
                <div className="grid w-full grid-cols-1 gap-8">
                  <div className="relative flex h-48 w-full items-center rounded-8 border-2 border-transparent bg-grey-28 py-4 pr-6 pl-10 transition-colors duration-200">
                    <BuxIcon />
                    <input
                      autoComplete="off"
                      className="flex h-full w-full items-center bg-grey-28 px-10 text-14 text-white outline-none"
                      placeholder="Tip amount..."
                      type="number"
                      name="amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          sendTip();
                        }
                      }}
                    />
                    <div className="ml-4">
                      <div className="grid w-74 grid-cols-1">
                        <button
                          type="button"
                          aria-label="button"
                          onClick={sendTip}
                          className="group/button relative flex h-32 cursor-pointer items-start justify-center rounded-6 bg-gradient-to-b from-green to-green-2 opacity-100 transition-all duration-200 hover:brightness-110 active:brightness-95"
                        >
                          <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-6 @sm/page:px-10">
                            <p className="ui-btn-label text-12 text-grey-190 transition-all duration-300">Send tip</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {error ? <p className="text-center text-14 text-[#FF5562]">{error}</p> : <p className="text-center text-16 font-semibold text-grey-190">The tipped amount will be added to the Rain Pool</p>}
          </div>
        </div>
      </ModalFrame>
    );
  }

  return null;
}
