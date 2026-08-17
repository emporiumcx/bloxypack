"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { EMOTES, EMOTE_SET, emoteSrc } from "@/lib/emotes";
import { Icons } from "./icons";
import { UserAvatar } from "./user-avatar";
import { useStore } from "./providers";

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
  const { chat, sendChat, user, openModal, chatOpen, toggleChat } = useStore();
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
      className={`chat-drawer fixed bottom-0 left-0 top-0 z-50 flex w-[300px] flex-col overflow-visible border-r-1 border-grey-47 bg-grey-28 ${
        chatOpen ? "" : "is-closed pointer-events-none"
      }`}
    >
      <div className="relative z-50 flex h-100 w-full shrink-0 items-center justify-center overflow-hidden border-b-2 border-green">
        <img alt="" src="/img/chat-banner.png" className="absolute inset-0 h-full w-full scale-110 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45" />
        <Link href="/" aria-label="home" className="relative z-10 flex h-full w-full items-center justify-center px-16">
          <img alt="WildPVP" className="h-42 w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.75)]" src="/img/logo.png" />
        </Link>
      </div>
      <div className="flex h-44 shrink-0 items-center justify-between gap-10 border-b-1 border-grey-47 px-12">
        <p className="ui-label text-11 text-grey-142">English</p>
        <div className="flex items-center gap-6">
          <div className="relative h-10 w-10 rounded-full bg-green/20">
            <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green" />
          </div>
          <p className="ui-num text-12 text-white">{online}</p>
        </div>
      </div>

      <div className="relative z-0 flex w-full flex-grow flex-col">
        <div className="relative flex flex-grow">
          <div className="scroll-y scrollbar-y absolute bottom-0 left-0 right-0 flex h-full flex-col-reverse overflow-y-scroll scroll-smooth pl-12 pr-8 pt-12 sm:pl-16 sm:pr-12">
            <div className="relative grid w-full grid-cols-1 gap-8">
              {chat.map((m) => (
                <div key={m.id} className="tr group relative grid w-full animate-chat grid-cols-1 gap-4 rounded-8 bg-grey-39 px-8 py-8">
                  <div className="flex min-w-0 items-center gap-6">
                    <button type="button" aria-label="chat_profile" className="relative z-10 shrink-0">
                      <UserAvatar
                        avatar={m.avatar || (user?.username === m.user ? user.avatar : undefined)}
                        seed={m.user}
                        size={24}
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
        <div className="relative grid w-full grid-cols-1 gap-12">
          <div ref={emoteRef} className="relative z-20 h-40 w-full rounded-10 bg-grey-39">
            <div className="relative h-full w-full">
              <div className="relative grid h-full w-full rounded-10 border-2 border-grey-39 p-2 pl-12 transition-colors duration-200">
                <div className="grid w-full grid-cols-[1fr_auto] gap-8">
                  <input
                    aria-label="chat_message"
                    autoComplete="off"
                    className="h-32 w-full bg-grey-39 text-14 text-white outline-none"
                    placeholder={user ? "Enter your message..." : "Login to chat..."}
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
                    aria-label="emotes"
                    className="group flex h-32 w-32 items-center justify-center rounded-5 transition-colors hover:bg-grey-34"
                    onClick={() => setEmotesOpen((v) => !v)}
                  >
                    <Icons.smile className={`text-22 ${emotesOpen ? "text-white" : "text-grey-190"}`} />
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
          <div className="grid w-full grid-cols-[1fr_auto] items-center gap-10">
            <p className="text-14 text-white">
              {text.length}
              <span className="text-14 text-grey-190">/200</span>
            </p>
            <button
              type="button"
              onClick={submit}
              className="group/button relative flex h-32 cursor-pointer items-center justify-center rounded-8 border-b-3 border-t-3 border-b-green-95 border-t-green-222 bg-green px-12 shadow-[0_2px_0_rgba(0,0,0,0.25)]"
            >
              <p className="ui-btn-label text-12 text-grey-28">Send</p>
            </button>
          </div>
        </div>
      </div>

      {chatOpen ? (
        <button
          type="button"
          aria-label="chat_toggle"
          onClick={toggleChat}
          className="group absolute bottom-16 right-0 z-30 flex h-40 w-40 translate-x-[100%] items-center justify-center rounded-r-12 border-1 border-grey-47 bg-grey-28 hover:bg-grey-1"
        >
          <Icons.chat className="text-20 text-grey-142 group-hover:text-white" />
        </button>
      ) : null}
    </aside>
  );
}
