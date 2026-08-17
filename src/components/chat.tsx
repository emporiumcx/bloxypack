"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { EMOTES, EMOTE_SET, emoteSrc } from "@/lib/emotes";
import { Bux } from "./bux";
import { GreenButton, GreyButton } from "./green-button";
import { Icons } from "./icons";
import { useStore } from "./providers";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

const RANK_META: Record<string, { id: number; label: string }> = {
  staff: { id: 23, label: "Staff" },
  gold: { id: 12, label: "Level 41-44" },
  silver: { id: 7, label: "Level 25-28" },
  bronze: { id: 4, label: "Level 13-16" },
};

const MENU_ITEM =
  "group relative flex h-40 overflow-hidden rounded-5 border-b-2 border-t-2 border-b-black/50 border-t-white-5 bg-grey-34";
const MENU_INNER = "relative grid h-full w-full grid-cols-[auto_1fr] items-center justify-center gap-8 px-10";
const MENU_ICON = "relative w-16 text-grey-142 transition-colors duration-200 group-hover:text-green group-active:text-green";
const MENU_LABEL = "text-left text-14 text-grey-142 transition-colors duration-200 group-hover:text-green group-active:text-green";

function ChatAvatar({ src, size }: { src?: string; size: number }) {
  return (
    <div className="relative flex w-full items-center justify-center rounded-full" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-grey-58"
        style={{ width: size, height: size }}
      >
        <Icons.user
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-show text-grey-142"
          style={{ fontSize: size / 2 }}
        />
      </div>
      {src ? (
        <img alt="" className="relative rounded-full object-cover opacity-100" src={src} style={{ width: size, height: size }} />
      ) : null}
    </div>
  );
}

function rankKey(rank: string) {
  const k = rank.toLowerCase();
  if (k.includes("staff")) return "staff";
  if (k.includes("gold")) return "gold";
  if (k.includes("silver")) return "silver";
  return "bronze";
}

function RankBadge({ rank }: { rank: string }) {
  const meta = RANK_META[rankKey(rank)] ?? RANK_META.bronze;
  return (
    <div className="group/rank relative" style={{ width: 16.2, height: 18 }}>
      <img alt="" className="absolute left-1/2 top-0 max-w-none -translate-x-1/2" src={`/img/rank/${meta.id}.svg`} style={{ height: 18 }} />
      <div className="absolute top-1/2 z-10 -right-8 hidden h-20 -translate-y-1/2 translate-x-[100%] items-center rounded-4 bg-grey-190 px-6 group-hover/rank:flex">
        <div className="absolute left-0 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-1 bg-grey-190" />
        <p className="whitespace-nowrap text-12 text-grey-28">{meta.label}</p>
      </div>
    </div>
  );
}

const EMOTE_TOKEN = /(:[a-z0-9_]+:)/i;

function ChatText({ text }: { text: string }) {
  const parts = text.split(EMOTE_TOKEN);
  return (
    <>
      {parts.map((part, i) => {
        const name = part.match(/^:([a-z0-9_]+):$/i)?.[1]?.toLowerCase();
        if (name && EMOTE_SET.has(name)) {
          return (
            <img
              key={`${name}-${i}`}
              alt={part}
              src={emoteSrc(name)}
              className="relative mx-2 mb-[-4px] inline-block h-22 w-22 object-contain align-middle"
              height={22}
              width={22}
            />
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function MenuIcon({ viewBox, d }: { viewBox: string; d: string }) {
  return (
    <svg viewBox={viewBox} fill="currentColor" stroke="currentColor" strokeWidth="0" height="1em" width="1em" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function ChatPanel() {
  const { chat, sendChat, rain, user, logout, openModal, chatOpen, toggleChat } = useStore();
  const [text, setText] = useState("");
  const [now, setNow] = useState(Date.now());
  const [menuOpen, setMenuOpen] = useState(false);
  const [emotesOpen, setEmotesOpen] = useState(false);
  const [hoveredEmote, setHoveredEmote] = useState<string>(EMOTES[0]);
  const menuRef = useRef<HTMLDivElement>(null);
  const emoteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [menuOpen]);

  useEffect(() => {
    if (!emotesOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!emoteRef.current?.contains(e.target as Node)) setEmotesOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [emotesOpen]);

  const remain = Math.max(0, rain.endsAt - now);
  const total = 15 * 60 * 1000;
  const pct = Math.min(100, Math.max(0, (remain / total) * 100));
  const mm = pad(Math.floor(remain / 60000));
  const ss = pad(Math.floor((remain % 60000) / 1000));
  const online = useMemo(() => 110 + (chat.length % 12), [chat.length]);

  const insertEmote = (name: string) => {
    const token = `:${name}:`;
    setText((t) => {
      const prefix = t && !t.endsWith(" ") ? `${t} ` : t;
      return `${prefix}${token} `.slice(0, 200);
    });
  };

  const submit = () => {
    if (!user) {
      openModal("login");
      return;
    }
    sendChat(text);
    setText("");
  };

  return (
    <aside
      className={`tr fixed bottom-0 right-0 top-0 z-50 flex w-[300px] max-w-[220px] flex-col border-l-1 border-grey-47 bg-grey-28 duration-200 ease-in-out xs:max-w-[240px] sm:max-w-[90vw] ${
        chatOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex h-64 w-full items-center border-b-1 border-grey-47 p-12 sm:px-16 sm:py-10">
        {user ? (
          <div ref={menuRef} className="grid w-full grid-cols-[1fr_auto] items-center gap-16">
            <button
              type="button"
              className="group relative grid h-36 w-full grid-cols-[1fr_auto] items-center gap-10"
              aria-label="toggle"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <div className="tr grid h-full w-full grid-cols-[auto_1fr] items-center gap-8">
                <div className="mr-8 h-36 w-36 rounded-full bg-grey-39">
                  <ChatAvatar size={36} />
                </div>
                <div className="grid w-full grid-cols-1 gap-8">
                  <div className="grid grid-cols-[auto_1fr] items-center gap-8">
                    <RankBadge rank={user.rank || "silver"} />
                    <p className="w-full truncate overflow-ellipsis text-left text-14 text-white">{user.username}</p>
                  </div>
                  <div className="flex h-4 w-full overflow-hidden rounded-full bg-grey-39">
                    <div
                      className="h-4 rounded-r-full bg-green transition-all duration-500 ease-in-out"
                      style={{ width: `${Math.min(96, 40 + user.level * 2)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex w-20 items-center justify-center">
                <svg
                  viewBox="0 0 512 512"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="0"
                  className={`tr text-20 text-grey-142 ${menuOpen ? "rotate-180" : "rotate-0"}`}
                  height="1em"
                  width="1em"
                  aria-hidden
                >
                  <path fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="48" d="m112 184 144 144 144-144" />
                </svg>
              </div>
            </button>
            <div
              className={`scrollbar-y @container absolute left-0 top-[63px] w-[230px] rounded-b-12 border-1 border-grey-47 bg-grey-28 p-8 transition-colors duration-200 sm:left-16 animate-open-y ${
                menuOpen ? "" : "hidden"
              }`}
            >
              <div className="grid w-full grid-cols-1 gap-4">
                <Link aria-label="profile" href="/profile" onClick={() => setMenuOpen(false)}>
                  <div className={MENU_ITEM}>
                    <div className={MENU_INNER}>
                      <div className={MENU_ICON}>
                        <MenuIcon
                          viewBox="0 0 448 512"
                          d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"
                        />
                      </div>
                      <div className="relative w-full grid-cols-1 gap-2 xl:grid">
                        <p className={MENU_LABEL}>Profile</p>
                      </div>
                    </div>
                  </div>
                </Link>
                <Link aria-label="transactions" href="/profile" onClick={() => setMenuOpen(false)}>
                  <div className={MENU_ITEM}>
                    <div className={MENU_INNER}>
                      <div className={MENU_ICON}>
                        <MenuIcon
                          viewBox="0 0 384 512"
                          d="M358.4 3.2L320 48 265.6 3.2a15.9 15.9 0 0 0-19.2 0L192 48 137.6 3.2a15.9 15.9 0 0 0-19.2 0L64 48 25.6 3.2C15-4.7 0 2.8 0 16v480c0 13.2 15 20.7 25.6 12.8L64 464l54.4 44.8a15.9 15.9 0 0 0 19.2 0L192 464l54.4 44.8a15.9 15.9 0 0 0 19.2 0L320 464l38.4 44.8c10.5 7.9 25.6.4 25.6-12.8V16c0-13.2-15-20.7-25.6-12.8zM320 360c0 4.4-3.6 8-8 8H72c-4.4 0-8-3.6-8-8v-16c0-4.4 3.6-8 8-8h240c4.4 0 8 3.6 8 8v16zm0-96c0 4.4-3.6 8-8 8H72c-4.4 0-8-3.6-8-8v-16c0-4.4 3.6-8 8-8h240c4.4 0 8 3.6 8 8v16zm0-96c0 4.4-3.6 8-8 8H72c-4.4 0-8-3.6-8-8v-16c0-4.4 3.6-8 8-8h240c4.4 0 8 3.6 8 8v16z"
                        />
                      </div>
                      <div className="relative w-full grid-cols-1 gap-2 xl:grid">
                        <p className={MENU_LABEL}>Transactions</p>
                      </div>
                    </div>
                  </div>
                </Link>
                <Link aria-label="gamebets" href="/profile" onClick={() => setMenuOpen(false)}>
                  <div className={MENU_ITEM}>
                    <div className={MENU_INNER}>
                      <div className={MENU_ICON}>
                        <MenuIcon
                          viewBox="0 0 640 512"
                          d="M592 192H473.26c12.69 29.59 7.12 65.2-17 89.32L320 417.58V464c0 26.51 21.49 48 48 48h224c26.51 0 48-21.49 48-48V240c0-26.51-21.49-48-48-48zM480 376c-13.25 0-24-10.75-24-24 0-13.26 10.75-24 24-24s24 10.74 24 24c0 13.25-10.75 24-24 24zm-46.37-186.7L258.7 14.37c-19.16-19.16-50.23-19.16-69.39 0L14.37 189.3c-19.16 19.16-19.16 50.23 0 69.39L189.3 433.63c19.16 19.16 50.23 19.16 69.39 0L433.63 258.7c19.16-19.17 19.16-50.24 0-69.4zM96 248c-13.25 0-24-10.75-24-24 0-13.26 10.75-24 24-24s24 10.74 24 24c0 13.25-10.75 24-24 24zm128 128c-13.25 0-24-10.75-24-24 0-13.26 10.75-24 24-24s24 10.74 24 24c0 13.25-10.75 24-24 24zm0-128c-13.25 0-24-10.75-24-24 0-13.26 10.75-24 24-24s24 10.74 24 24c0 13.25-10.75 24-24 24zm0-128c-13.25 0-24-10.75-24-24 0-13.26 10.75-24 24-24s24 10.74 24 24c0 13.25-10.75 24-24 24zm128 128c-13.25 0-24-10.75-24-24 0-13.26 10.75-24 24-24s24 10.74 24 24c0 13.25-10.75 24-24 24z"
                        />
                      </div>
                      <div className="relative w-full grid-cols-1 gap-2 xl:grid">
                        <p className={MENU_LABEL}>Game bets</p>
                      </div>
                    </div>
                  </div>
                </Link>
                <Link aria-label="affiliates" href="/affiliate" onClick={() => setMenuOpen(false)}>
                  <div className={MENU_ITEM}>
                    <div className={MENU_INNER}>
                      <div className={MENU_ICON}>
                        <div className="flex items-center justify-center" style={{ width: 18, height: 18 }}>
                          <Icons.affiliate style={{ marginLeft: -1, scale: 0.9 }} />
                        </div>
                      </div>
                      <div className="relative w-full grid-cols-1 gap-2 xl:grid">
                        <p className={MENU_LABEL}>Affiliates</p>
                      </div>
                    </div>
                  </div>
                </Link>
                <Link aria-label="live_stats" href="/leaderboard" onClick={() => setMenuOpen(false)}>
                  <div className={MENU_ITEM}>
                    <div className={MENU_INNER}>
                      <div className={MENU_ICON}>
                        <MenuIcon
                          viewBox="0 0 512 512"
                          d="M496 384H64V80c0-8.84-7.16-16-16-16H16C7.16 64 0 71.16 0 80v336c0 17.67 14.33 32 32 32h464c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16zM464 96H345.94c-21.38 0-32.09 25.85-16.97 40.97l32.4 32.4L288 242.75l-73.37-73.37c-12.5-12.5-32.76-12.5-45.25 0l-68.69 68.69c-6.25 6.25-6.25 16.38 0 22.63l22.62 22.62c6.25 6.25 16.38 6.25 22.63 0L192 237.25l73.37 73.37c12.5 12.5 32.76 12.5 45.25 0l96-96 32.4 32.4c15.12 15.12 40.97 4.41 40.97-16.97V112c.01-8.84-7.15-16-15.99-16z"
                        />
                      </div>
                      <div className="relative w-full grid-cols-1 gap-2 xl:grid">
                        <p className={MENU_LABEL}>Live stats</p>
                      </div>
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  aria-label="redeem"
                  onClick={() => {
                    setMenuOpen(false);
                    openModal("deposit");
                  }}
                >
                  <div className={MENU_ITEM}>
                    <div className={MENU_INNER}>
                      <div className={MENU_ICON}>
                        <MenuIcon
                          viewBox="0 0 512 512"
                          d="M32 448c0 17.7 14.3 32 32 32h160V320H32v128zm256 32h160c17.7 0 32-14.3 32-32V320H288v160zm192-320h-42.1c6.2-12.1 10.1-25.5 10.1-40 0-48.5-39.5-88-88-88-41.6 0-68.5 21.3-103 68.3-34.5-47-61.4-68.3-103-68.3-48.5 0-88 39.5-88 88 0 14.5 3.8 27.9 10.1 40H32c-17.7 0-32 14.3-32 32v80c0 8.8 7.2 16 16 16h480c8.8 0 16-7.2 16-16v-80c0-17.7-14.3-32-32-32zm-326.1 0c-22.1 0-40-17.9-40-40s17.9-40 40-40c19.9 0 34.6 3.3 86.1 80h-86.1zm206.1 0h-86.1c51.4-76.5 65.7-80 86.1-80 22.1 0 40 17.9 40 40s-17.9 40-40 40z"
                        />
                      </div>
                      <div className="relative w-full grid-cols-1 gap-2 xl:grid">
                        <p className={MENU_LABEL}>Redeem code</p>
                      </div>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  aria-label="withdraw"
                  onClick={() => {
                    setMenuOpen(false);
                    openModal("deposit");
                  }}
                >
                  <div className={MENU_ITEM}>
                    <div className={MENU_INNER}>
                      <div className={MENU_ICON}>
                        <MenuIcon
                          viewBox="0 0 512 512"
                          d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM184 232l144 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-144 0c-13.3 0-24-10.7-24-24s10.7-24 24-24z"
                        />
                      </div>
                      <div className="relative w-full grid-cols-1 gap-2 xl:grid">
                        <p className={MENU_LABEL}>Withdraw</p>
                      </div>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  aria-label="support"
                  onClick={() => {
                    setMenuOpen(false);
                    openModal("support");
                  }}
                >
                  <div className={MENU_ITEM}>
                    <div className={MENU_INNER}>
                      <div className={MENU_ICON}>
                        <MenuIcon
                          viewBox="0 0 24 24"
                          d="M12 2C6.486 2 2 6.486 2 12v4.143C2 17.167 2.897 18 4 18h1a1 1 0 0 0 1-1v-5.143a1 1 0 0 0-1-1h-.908C4.648 6.987 7.978 4 12 4s7.352 2.987 7.908 6.857H19a1 1 0 0 0-1 1V18c0 1.103-.897 2-2 2h-2v-1h-4v3h6c2.206 0 4-1.794 4-4 1.103 0 2-.833 2-1.857V12c0-5.514-4.486-10-10-10z"
                        />
                      </div>
                      <div className="relative w-full grid-cols-1 gap-2 xl:grid">
                        <p className={MENU_LABEL}>Support</p>
                      </div>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  aria-label="logout"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                >
                  <div className={MENU_ITEM}>
                    <div className={MENU_INNER}>
                      <div className={MENU_ICON}>
                        <MenuIcon
                          viewBox="0 0 24 24"
                          d="M5 22C4.44772 22 4 21.5523 4 21V3C4 2.44772 4.44772 2 5 2H19C19.5523 2 20 2.44772 20 3V21C20 21.5523 19.5523 22 19 22H5ZM15 16L20 12L15 8V11H9V13H15V16Z"
                        />
                      </div>
                      <div className="relative w-full grid-cols-1 gap-2 xl:grid">
                        <p className={MENU_LABEL}>Logout</p>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid w-full grid-cols-2 gap-8">
            <GreenButton onClick={() => openModal("login")}>Login</GreenButton>
            <GreyButton onClick={() => openModal("register")}>Register</GreyButton>
          </div>
        )}
      </div>

      <div className="relative flex w-full flex-grow flex-col">
        <div className="absolute left-0 right-8 top-0 z-20">
          <div className="absolute inset-0 bg-grey-28 opacity-80" />
          <div className="absolute -bottom-40 left-0 right-0 z-10 h-40 bg-gradient-to-b from-grey-28 to-transparent opacity-80" />
          <div className="relative grid w-full grid-cols-1 gap-6 px-12 pt-12">
            <div className="relative w-full animate-show overflow-hidden rounded-8 bg-grey-39">
              <div className="group relative overflow-hidden rounded-6 bg-grey-39">
                <div className="absolute -right-1/3 -top-1/2 h-2/3 w-2/3 rounded-full bg-yellow blur-[50px]" />
                <div className="absolute bottom-0 left-0 top-0 w-[70%] bg-gradient-to-r from-green/10 to-transparent" />
                <div className="relative grid w-full grid-cols-1 gap-10 p-12 pb-14">
                  <div className="grid w-full grid-cols-1 gap-4 xs:grid-cols-[1fr_auto]">
                    <div className="grid w-full grid-cols-1 gap-4">
                      <div className="flex w-full items-center">
                        <div className="relative mr-6 h-14 w-14 rounded-full bg-green/20">
                          <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green" />
                        </div>
                        <h2 className="text-14 font-bold text-white">Rain pool</h2>
                      </div>
                      <div className="flex w-full items-center">
                        <div className="absolute bottom-0 left-0 z-10 h-3 w-full bg-green/20">
                          <div className="absolute bottom-0 left-0 top-0 bg-green transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex h-20 items-center rounded-3">
                          <Icons.clock className="mr-3 text-12 text-grey-190" />
                          <div className="mb-1 flex items-center">
                            <p className="min-w-[18px] text-center text-12 font-bold text-grey-28 text-grey-190">{mm}</p>
                            <p className="text-12 font-bold text-grey-190">:</p>
                            <p className="min-w-[18px] text-center text-12 font-bold text-grey-190">{ss}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="group grid h-40 grid-cols-[1fr_auto] items-center gap-12 rounded-8 bg-grey-28 py-4 pl-12 pr-4">
                      <Bux value={rain.amount} />
                      <button
                        type="button"
                        aria-label="button"
                        onClick={() => openModal(user ? "rain" : "login")}
                        className="group/button relative flex h-32 cursor-pointer items-start justify-center rounded-6 border-b-3 border-t-3 border-b-green-95 border-t-green-222 bg-green opacity-100 transition-all duration-200 active:border-green"
                      >
                        <div className="tr relative flex h-full w-32 items-center justify-center gap-4">
                          <div className="text-grey-28">
                            <Icons.plus className="text-20" />
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="absolute right-4 top-4 hidden">
                  <button type="button" aria-label="close_rain" className="group/close -my-4 flex h-24 items-center px-2">
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth="0"
                      className="text-purple transition-colors duration-200 group-hover/close:text-grey-39"
                      height="1em"
                      width="1em"
                      aria-hidden
                    >
                      <path fill="none" d="M0 0h24v24H0z" />
                      <path d="M19 13H5v-2h14v2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex flex-grow">
          <div className="scroll-y scrollbar-y absolute bottom-0 left-0 right-0 flex h-full flex-col-reverse overflow-y-scroll scroll-smooth pl-12 pr-8 pt-[70px] sm:pl-16 sm:pr-12">
            <div className="relative grid w-full grid-cols-1 gap-8">
              {chat.map((m) => (
                <div key={m.id} className="tr group relative grid w-full animate-chat grid-cols-1 gap-2 rounded-6 bg-grey-39 py-5 pl-6 pr-8">
                  <div className="absolute inset-0 rounded-6 bg-transparent" />
                  <div className="p font-chat relative w-full !select-text whitespace-pre-line break-words rounded-4 text-14" style={{ color: "rgb(190, 190, 190)" }}>
                    <div className="flex flex-wrap items-center gap-x-2">
                      <button type="button" aria-label="chat_profile" className="relative z-10 mr-4">
                        <div className="relative w-24">
                          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-grey-47">
                            <ChatAvatar src={m.avatar ? `https://cdn.rostake.com/avatars/${m.avatar}.webp` : undefined} size={24} />
                          </div>
                        </div>
                      </button>
                      <div className="pointer-events-none ml-2 mr-4">
                        <div className="flex items-center">
                          <RankBadge rank={m.rank} />
                        </div>
                      </div>
                      <button type="button" aria-label="chat_profile" className="relative z-10 truncate text-left text-14 text-white" style={{ color: m.color }}>
                        {m.user}
                      </button>
                      <div className="-translate-x-1 text-14 text-white">:</div>
                      <div className="select-text overflow-hidden whitespace-pre-wrap break-all rounded-4 align-middle text-14 leading-[22px] text-[#BEBEBE]">
                        <ChatText text={m.text} />
                      </div>
                    </div>
                  </div>
                  {m.time ? (
                    <div className="absolute right-0 top-0 z-10 hidden h-18 items-center rounded-bl-2 rounded-tr-2 bg-purple-96 pl-6 pr-8 group-hover:flex group-active:flex">
                      <span className="text-10 text-grey-142">{m.time}</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full p-12 sm:p-16">
        <div className="relative grid w-full grid-cols-1 gap-12">
          <div ref={emoteRef} className="relative z-20 h-40 w-full rounded-8 bg-grey-39">
            <div className="relative h-full w-full">
              <div className="relative grid h-full w-full rounded-5 border-2 border-grey-39 p-2 pl-12 transition-colors duration-200">
                <div className="grid w-full grid-cols-[1fr_auto] gap-8">
                  <form action="" className="hidden">
                    <input type="password" name="password" />
                  </form>
                  <input
                    aria-label="chat_message"
                    autoComplete="off"
                    className="font-chat h-32 w-full bg-grey-39 text-14 text-white outline-none"
                    placeholder="Enter your message..."
                    type="text"
                    maxLength={200}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        submit();
                      }
                    }}
                    name="chat_message_wildpvp"
                  />
                  <button
                    type="button"
                    aria-label="chat_send"
                    className="group flex h-32 w-32 items-center justify-center rounded-5 transition-colors hover:bg-grey-34 active:bg-grey-34"
                    onClick={() => setEmotesOpen((v) => !v)}
                  >
                    <Icons.smile
                      className={`text-22 transition-colors group-hover:text-white group-active:text-white ${
                        emotesOpen ? "text-white" : "text-grey-190"
                      }`}
                    />
                  </button>
                </div>
                {emotesOpen ? (
                  <div className="absolute -left-2 right-2 bottom-[50px] z-10 grid animate-show overflow-hidden rounded-8 bg-grey-34">
                    <div className="scrollbar-y max-h-[calc(100vh-308px)] w-full overflow-y-scroll p-12 md:max-h-[500px]">
                      <div className="grid w-full grid-cols-6 gap-4 md:grid-cols-6">
                        {EMOTES.map((name) => (
                          <button
                            key={name}
                            type="button"
                            aria-label="emote"
                            className="group relative flex items-center justify-center rounded-4 border-2 border-grey-39 p-4 transition-colors duration-200 hover:border-grey-142 active:border-grey-142"
                            onMouseEnter={() => setHoveredEmote(name)}
                            onClick={() => insertEmote(name)}
                          >
                            <div className="relative h-[27px] w-[27px]">
                              <img
                                className="h-full w-full object-contain"
                                alt=""
                                height={27}
                                width={27}
                                src={emoteSrc(name)}
                              />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="group w-full border-t-1 border-grey-47 p-12"
                      onClick={() => insertEmote(hoveredEmote)}
                    >
                      <div className="grid h-[27px] w-full grid-cols-[27px_1fr] items-center gap-10">
                        <img
                          className="h-full w-full object-contain"
                          alt=""
                          height={27}
                          width={27}
                          src={emoteSrc(hoveredEmote)}
                        />
                        <div className="grid w-full grid-cols-1">
                          <p className="text-left text-14 text-grey-142 transition-colors duration-200 group-hover:text-white group-active:text-white">
                            :{hoveredEmote}:
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="grid w-full grid-cols-[1fr_auto] items-center gap-10">
            <div className="flex w-full">
              <div className="relative mr-6 h-14 w-14 rounded-full bg-green/20">
                <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green" />
              </div>
              <p className="text-12 text-white">{online} online</p>
            </div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-8">
              <p className="text-14 text-white">
                {text.length}
                <span className="text-14 text-grey-190">/200</span>
              </p>
              <button
                type="button"
                aria-label="button"
                onClick={submit}
                className="group/button relative flex h-32 cursor-pointer items-start justify-center rounded-6 border-b-3 border-t-3 border-b-green-95 border-t-green-222 bg-green opacity-100 transition-all duration-200 active:border-green"
              >
                <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-6 @sm/page:px-10">
                  <p className="text-14 text-grey-28 transition-all duration-300">Send</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        aria-label="chat_toggle"
        onClick={toggleChat}
        className="group absolute bottom-16 left-0 z-30 flex h-40 w-40 translate-x-[-100%] items-center justify-center rounded-l-12 border-1 border-grey-47 bg-grey-28 transition-colors duration-200 hover:bg-grey-1 active:bg-grey-1"
      >
        <Icons.chat className="tr text-20 text-grey-142 group-hover:text-white group-active:text-white" />
      </button>
    </aside>
  );
}
