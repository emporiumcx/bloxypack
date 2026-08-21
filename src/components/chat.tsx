"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { EMOTES, EMOTE_SET, emoteSrc } from "@/lib/emotes";
import { Bux } from "./bux";
import { Icons } from "./icons";
import { UserAvatar } from "./user-avatar";
import { useStore } from "./providers";

const RAIN_DURATION_MS = 60 * 60 * 1000;
const RAIN_JOIN_WINDOW_MS = 5 * 60 * 1000;

function pad2(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function ChatRainPool() {
  const { rain, user, openModal, joinRain } = useStore();
  const [now, setNow] = useState<number | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const remain = now == null || rain.endsAt <= 0 ? RAIN_DURATION_MS : Math.max(0, rain.endsAt - now);
  const mm = pad2(Math.floor(remain / 60000));
  const ss = pad2(Math.floor((remain % 60000) / 1000));
  const pct = Math.round(Math.min(100, Math.max(0, (remain / RAIN_DURATION_MS) * 100)));
  const joined = Boolean(user && rain.participants?.includes(user.id));
  const joinOpen = remain > 0 && remain <= RAIN_JOIN_WINDOW_MS;

  async function onJoin() {
    if (!user) return openModal("login");
    if (joined || joining || !joinOpen) return;
    setJoining(true);
    setJoinError("");
    const err = await joinRain();
    if (err) setJoinError(err);
    setJoining(false);
  }

  return (
    <div className="absolute left-0 right-8 top-0 z-20">
      <div className="absolute inset-0 bg-grey-28 opacity-80" />
      <div className="absolute -bottom-40 left-0 right-0 z-10 h-40 bg-gradient-to-b from-grey-28 to-transparent opacity-80" />
      <div className="relative grid w-full grid-cols-1 gap-6 px-12 pt-12">
        <div className="relative w-full animate-show overflow-hidden rounded-8 bg-grey-39">
          <div className="group relative overflow-hidden rounded-6 bg-grey-39">
            <div className="pointer-events-none absolute -top-24 right-[-20%] h-80 w-80 rounded-full bg-green/30 blur-[50px]" />
            <div className="relative grid w-full grid-cols-[1fr_auto] items-center gap-10 p-12 pb-14">
              <div className="grid min-w-0 grid-cols-1 gap-4">
                <div className="flex w-full items-center">
                  <div className="relative mr-6 h-14 w-14 shrink-0 rounded-full bg-green/20">
                    <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green" />
                  </div>
                  <h2 className="truncate text-14 font-bold text-white">Rain pool</h2>
                </div>
                <div className="flex h-20 items-center">
                  <Icons.clock className="mr-3 text-12 text-grey-190" />
                  <div className="mb-1 flex items-center">
                    <p className="min-w-[18px] text-center text-12 font-bold text-grey-190">{mm}</p>
                    <p className="px-2 text-12 font-bold text-grey-190">:</p>
                    <p className="min-w-[18px] text-center text-12 font-bold text-grey-190">{ss}</p>
                  </div>
                  {joined || joinOpen ? (
                    <button
                      type="button"
                      onClick={onJoin}
                      disabled={joined || joining || !joinOpen}
                      className={`ml-8 shrink-0 rounded-6 px-8 py-4 text-10 font-bold uppercase tracking-wide ${
                        joined
                          ? "bg-green/15 text-green"
                          : "gold-fill text-grey-28 hover:brightness-110"
                      }`}
                    >
                      {joined ? "Joined" : joining ? "..." : "Join"}
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="grid h-40 shrink-0 grid-cols-[auto_auto] items-center gap-12 rounded-8 bg-grey-28 py-4 pl-12 pr-4">
                <Bux value={rain.amount} />
                <button
                  type="button"
                  aria-label="tip rain"
                  onClick={() => openModal(user ? "rain" : "login")}
                  className="relative flex h-32 w-32 cursor-pointer items-center justify-center rounded-6 bg-gradient-to-b from-green to-green-2 transition-all duration-200 hover:brightness-110 active:brightness-95"
                >
                  <Icons.plus className="text-20 text-grey-190" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 z-10 h-3 w-full bg-green/20">
                <div className="absolute bottom-0 left-0 top-0 bg-green transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
            {joinError ? <p className="px-12 pb-10 text-11 text-[#FF5562]">{joinError}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function LevelChip({ level }: { level?: number }) {
  return (
    <div className="flex h-18 min-w-22 items-center justify-center rounded-4 bg-purple-80 px-5">
      <p className="ui-num text-10 text-white">{level || 1}</p>
    </div>
  );
}

const EMOTE_TOKEN = /(:[a-z0-9_]+:)/i;

function ChatText({ text }: { text?: string | null }) {
  const parts = String(text ?? "").split(EMOTE_TOKEN);
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

export function ChatPanel() {
  const { chat, sendChat, user, openModal, chatOpen } = useStore();
  const [text, setText] = useState("");
  const [emotesOpen, setEmotesOpen] = useState(false);
  const [hoveredEmote, setHoveredEmote] = useState<string>(EMOTES[0]);
  const emoteRef = useRef<HTMLDivElement>(null);
  const online = useMemo(() => 110 + (chat.length % 12), [chat.length]);

  useEffect(() => {
    if (!emotesOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!emoteRef.current?.contains(e.target as Node)) setEmotesOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [emotesOpen]);

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
      className={`chat-drawer fixed inset-y-0 right-0 z-50 flex w-360 max-w-[90%] flex-col overflow-hidden border-l-1 border-grey-58 bg-grey-28 pt-56 transition-all duration-300 md:top-[var(--header-h)] md:z-40 md:w-280 md:max-w-none md:pt-0 2xl:w-320 ${
        chatOpen ? "" : "is-closed pointer-events-none"
      }`}
    >
      <div className="flex h-40 shrink-0 items-center justify-between gap-10 border-b-1 border-grey-58 px-12">
        <p className="text-11 font-semibold uppercase tracking-wide text-grey-142">English</p>
        <div className="flex items-center gap-6">
          <div className="relative h-10 w-10 rounded-full bg-success/20">
            <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-success" />
          </div>
          <p className="ui-num text-12 text-white">{online}</p>
        </div>
      </div>

      <div className="relative z-0 flex w-full flex-grow flex-col">
        <ChatRainPool />
        <div className="relative flex flex-grow">
          <div className="scroll-y scrollbar-y absolute bottom-0 left-0 right-0 flex h-full flex-col-reverse overflow-y-scroll scroll-smooth pl-12 pr-8 pt-[70px] sm:pl-16 sm:pr-12">
            <div className="relative grid w-full grid-cols-1 gap-8">
              {chat.map((m) => (
                <div key={m.id} className="tr group relative grid w-full animate-chat grid-cols-1 gap-4 rounded-8 bg-grey-39 px-8 py-8">
                  <div className="flex min-w-0 items-center gap-6">
                    <button type="button" aria-label="chat_profile" className="relative z-10 shrink-0">
                      <UserAvatar
                        avatar={m.avatar || (user?.username === m.user ? user.avatar : undefined)}
                        seed={m.user}
                        size={24}
                        level={m.level ?? (user?.username === m.user ? user.level : undefined)}
                        rank={m.rank}
                      />
                    </button>
                    <LevelChip level={m.level} />
                    <button
                      type="button"
                      aria-label="chat_profile"
                      className="relative z-10 min-w-0 truncate text-left text-13 font-bold"
                      style={{ color: m.color }}
                    >
                      {m.user}
                    </button>
                    {m.time ? <span className="ml-auto shrink-0 text-10 text-grey-142">{m.time}</span> : null}
                  </div>
                  <div className="select-text overflow-hidden whitespace-pre-wrap break-all pl-2 text-13 leading-[18px] text-grey-170">
                    <ChatText text={m.text} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full p-12 sm:p-16">
        <div className="relative grid w-full grid-cols-1 gap-10">
          <div ref={emoteRef} className="relative z-20 h-40 w-full rounded-6 bg-grey-39">
            <div className="relative h-full w-full">
              <div className="relative grid h-full w-full rounded-6 border-1 border-grey-58 p-2 pl-12 transition-colors duration-200">
                <div className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-4">
                  <input
                    aria-label="chat_message"
                    autoComplete="off"
                    className="h-32 w-full bg-grey-39 text-14 text-white outline-none"
                    placeholder={user ? "Type to chat here..." : "Login to chat..."}
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
                    name="chat_message_bloxywild"
                  />
                  <button
                    type="button"
                    aria-label="emotes"
                    className="group flex h-32 w-32 items-center justify-center rounded-5 transition-colors hover:bg-grey-34"
                    onClick={() => setEmotesOpen((v) => !v)}
                  >
                    <Icons.smile className={`text-22 ${emotesOpen ? "text-white" : "text-grey-190"}`} />
                  </button>
                  <button
                    type="button"
                    aria-label="send"
                    onClick={submit}
                    className="relative flex h-32 w-32 items-center justify-center rounded-6 bg-gradient-to-b from-green to-green-2 transition-all duration-200 hover:brightness-110 active:brightness-95"
                  >
                    <Icons.send className="text-16 text-grey-190" />
                  </button>
                </div>
                {emotesOpen ? (
                  <div className="absolute -left-2 right-2 bottom-[50px] z-10 grid animate-open-y overflow-hidden rounded-8 bg-grey-34">
                    <div className="scrollbar-y max-h-[calc(100vh-308px)] w-full overflow-y-scroll p-12 md:max-h-[500px]">
                      <div className="grid w-full grid-cols-6 gap-4">
                        {EMOTES.map((name) => (
                          <button
                            key={name}
                            type="button"
                            aria-label="emote"
                            className="group relative flex items-center justify-center rounded-4 border-2 border-grey-39 p-4 hover:border-grey-142"
                            onMouseEnter={() => setHoveredEmote(name)}
                            onClick={() => insertEmote(name)}
                          >
                            <img className="h-[27px] w-[27px] object-contain" alt="" src={emoteSrc(name)} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <button type="button" className="group w-full border-t-1 border-grey-47 p-12" onClick={() => insertEmote(hoveredEmote)}>
                      <div className="grid h-[27px] w-full grid-cols-[27px_1fr] items-center gap-10">
                        <img className="h-full w-full object-contain" alt="" src={emoteSrc(hoveredEmote)} />
                        <p className="text-left text-14 text-grey-142 group-hover:text-white">:{hoveredEmote}:</p>
                      </div>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-8">
            <Link href="/fairness" className="text-10 font-bold uppercase tracking-wide text-grey-142 hover:text-white">
              Chat Rules
            </Link>
            <p className="group relative flex w-max cursor-default items-center gap-6 text-grey-142">
              <Icons.clock className="text-12" />
              <span className="font-chat text-10 font-bold uppercase">Slowmode</span>
              <span className="pointer-events-none absolute bottom-[calc(100%+8px)] right-0 z-30 hidden whitespace-nowrap rounded-6 bg-grey-34 px-8 py-6 text-11 text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)] group-hover:block">
                1 message every 6 seconds
              </span>
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
