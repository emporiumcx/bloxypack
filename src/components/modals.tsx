"use client";

import { useEffect, useState, type ReactNode } from "react";
import { GreenButton, green3d } from "./green-button";
import { Icons } from "./icons";
import { useStore } from "./providers";
import { Bux, BuxIcon } from "./bux";

function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm">
      <button className="absolute inset-0" aria-label="close overlay" onClick={onClose} />
      <div className="relative z-10 my-24 animate-pop">{children}</div>
    </div>
  );
}

function ModalFrame({
  width,
  onClose,
  children,
}: {
  width: number;
  onClose: () => void;
  children: ReactNode;
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
      className="fixed inset-0 flex w-full min-w-[330px] items-center overflow-hidden p-10 sm:p-12 sm:p-20 md:p-24 lg:p-30"
      style={{ zIndex: 80 }}
    >
      <div className="relative flex max-h-full w-full overflow-y-auto rounded-4 sm:rounded-4">
        <button
          type="button"
          aria-label="close"
          className="animate-hide animate-show fixed top-0 left-0 h-full w-screen min-w-[330px] bg-black/10 backdrop-blur-[4px] backdrop-filter transition-opacity"
          onClick={onClose}
        />
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 animate-open relative xs:w-auto">
          <div className="relative z-50 grid !max-w-full rounded-8 bg-grey-39 @sm/page:rounded-12" style={{ width }}>
            <div className="bg-purple-46 relative flex h-full w-full flex-col overflow-y-auto rounded-8 @sm/page:h-auto @sm/page:rounded-12">
              {children}
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
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <ModalFrame width={480} onClose={onClose}>
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

export function Modals() {
  const {
    modal,
    closeModal,
    openModal,
    login,
    register,
    user,
    addBalance,
    addRain,
    spend,
    rain,
  } = useStore();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  if (!modal) return null;

  if (modal === "welcome") {
    return (
      <Overlay onClose={closeModal}>
        <div className="grid w-[520px] max-w-[92vw] justify-items-center gap-16 text-center">
          <span className="rounded-full bg-green px-12 py-4 text-12 font-bold tracking-wide text-grey-1">
            WELCOME TO
          </span>
          <img src="/img/logo.png" alt="WildPVP" className="h-48 object-contain" />
          <p className="text-16 text-grey-190">Welcome to the #1 Roblox Case Opening Site!</p>
          <GreenButton onClick={closeModal}>Continue to WildPVP →</GreenButton>
        </div>
      </Overlay>
    );
  }

  if (modal === "login") {
    return (
      <AuthShell title="Log in" onClose={closeModal}>
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            const err = login(username, password);
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

  if (modal === "register") {
    return (
      <AuthShell title="Register" onClose={closeModal}>
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            if (!agreed) {
              setError("Please confirm you are 18+ and agree to the terms.");
              return;
            }
            const err = register(username, email, password);
            setError(err ?? "");
          }}
        >
          <div className="grid w-full grid-cols-1 gap-16">
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
              className={`flex h-20 w-20 items-center justify-center rounded-6 border-2 transition-colors duration-200 ${
                agreed
                  ? "border-green bg-green"
                  : "border-grey-47 bg-transparent hover:border-grey-190 active:border-grey-190"
              }`}
            >
              <Icons.check
                className={`text-18 text-grey-28 transition-opacity duration-200 ${agreed ? "opacity-100" : "opacity-0"}`}
              />
            </div>
            <div className="grid w-full grid-cols-1 gap-4">
              <p className="w-full text-left text-14 text-grey-190">
                By checking this box and signing in, You confirm that you are of legal age (18+) and agree to our Terms of
                Service and Privacy Policy.
              </p>
            </div>
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

  if (modal === "deposit") {
    const fiat = [
      { name: "Credit card", sub: "Credit cards", img: "/img/payment/paypal.webp" },
      { name: "Paypal", sub: "Kinguin", img: "/img/payment/paypal.webp" },
    ];
    const crypto = [
      ["Bitcoin", "$63,658", "/img/payment/btc.webp"],
      ["Ethereum", "$3,887.09", "/img/payment/eth.webp"],
      ["Litecoin", "$85.03", "/img/payment/ltc.webp"],
      ["USDT", "$1", "/img/payment/tether.webp"],
      ["USDC", "$1", "/img/payment/usdc.webp"],
      ["Solana", "$172.94", "/img/payment/sol.webp"],
      ["Ripple", "$0.57", "/img/payment/xrp.webp"],
      ["Tron", "$0.12", "/img/payment/tron.webp"],
      ["BNB", "$587.28", "/img/payment/bnb.webp"],
      ["BTC Cash", "$210.10", "/img/payment/btc.webp"],
      ["DAI", "$1", "/img/payment/dai.webp"],
      ["Toncoin", "$1.39", "/img/payment/ton.webp"],
    ] as const;
    return (
      <Overlay onClose={closeModal}>
        <div className="max-h-[86vh] w-[720px] max-w-[94vw] overflow-y-auto rounded-12 bg-grey-34 p-24">
          <div className="mb-18 flex items-center justify-between">
            <h2 className="flex items-center gap-8 text-20 font-semibold">
              <span className="text-green">↓</span> Deposit
            </h2>
            <button onClick={closeModal} className="text-grey-142 hover:text-white">
              ✕
            </button>
          </div>
          <p className="mb-10 text-13 text-grey-142">Fiat methods</p>
          <div className="mb-18 grid grid-cols-2 gap-10">
            {fiat.map((m) => (
              <button
                key={m.name}
                type="button"
                onClick={() => {
                  if (!user) return openModal("login");
                  addBalance(10000);
                  closeModal();
                }}
                className="flex items-center gap-12 rounded-8 bg-grey-28 p-14 text-left hover:bg-grey-39"
              >
                <img src={m.img} alt="" className="h-40 w-40 rounded-8 object-contain" />
                <span>
                  <span className="block text-15">{m.name}</span>
                  <span className="text-12 text-grey-142">{m.sub}</span>
                </span>
              </button>
            ))}
          </div>
          <p className="mb-10 text-13 text-grey-142">Crypto methods</p>
          <div className="grid grid-cols-4 gap-10">
            {crypto.map(([name, price, icon]) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  if (!user) return openModal("login");
                  addBalance(25000);
                  closeModal();
                }}
                className="rounded-8 bg-grey-28 p-12 text-left hover:bg-grey-39"
              >
                <img src={icon} alt="" className="mb-8 h-28 w-28 object-contain" />
                <span className="block text-13">{name}</span>
                <span className="text-12 text-grey-142">{price}</span>
              </button>
            ))}
          </div>
        </div>
      </Overlay>
    );
  }

  if (modal === "support") {
    return (
      <Overlay onClose={closeModal}>
        <div className="w-[420px] max-w-[92vw] rounded-12 bg-grey-34 p-24">
          <h2 className="mb-8 text-20 font-semibold">Support</h2>
          <p className="mb-16 text-14 text-grey-190">
            Live chat with staff, or join Discord for faster help with deposits and withdrawals.
          </p>
          <a
            href="https://discord.gg/rostake"
            target="_blank"
            rel="noreferrer"
            className={`flex h-40 w-full items-center justify-center px-16 text-14 text-grey-28 ${green3d}`}
          >
            Open Discord
          </a>
        </div>
      </Overlay>
    );
  }

  if (modal === "rain") {
    const remain = Math.max(0, rain.endsAt - Date.now());
    const pct = Math.min(100, Math.max(0, (remain / (15 * 60 * 1000)) * 100));
    const sendTip = () => {
      const n = Number(amount);
      if (!user) return openModal("login");
      if (!Number.isFinite(n) || n <= 0) return;
      if (spend(n)) addRain(n);
      setAmount("");
      closeModal();
    };
    return (
      <ModalFrame width={380} onClose={closeModal}>
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
                          className="group/button relative flex h-32 cursor-pointer items-start justify-center rounded-6 border-b-3 border-t-3 border-b-green-95 border-t-green-222 bg-green opacity-100 transition-all duration-200 active:border-green"
                        >
                          <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-6 @sm/page:px-10">
                            <p className="transition-all duration-300 text-14 text-grey-28">Send tip</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-16 font-semibold text-grey-190">The tipped amount will be added to the Rain Pool</p>
          </div>
        </div>
      </ModalFrame>
    );
  }

  return null;
}
