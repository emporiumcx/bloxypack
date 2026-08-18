"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  connectSockets,
  diceBet,
  disconnectSockets,
  loginRequest,
  mergeUser,
  meRequest,
  minesBet,
  minesCashout,
  minesReveal,
  registerRequest,
  sendChatMessage,
  setToken,
  token,
  towersBet,
  towersCashout,
  towersReveal,
  unboxBet,
  battlesCreate,
  battlesJoin,
  battlesBot,
  battlesGame,
  blackjackStart,
  blackjackHit,
  blackjackStand,
  blackjackDouble,
  type AppUser,
  type ServerUser,
} from "@/lib/backend";
import { rankKeyFromLevel } from "@/lib/levels";

export type User = AppUser;

type Modal = "login" | "register" | "deposit" | "withdraw" | "support" | "welcome" | "rain" | "affiliate" | "promo" | null;

type ChatMsg = {
  id: number | string;
  user: string;
  text: string;
  color: string;
  rank: string;
  level?: number;
  avatar?: string;
  time?: string;
};

type Store = {
  user: User | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  register: (username: string, email: string, password: string) => Promise<string | null>;
  applyUser: (raw?: ServerUser | null) => void;
  holdUser: () => void;
  flushUser: () => void;
  addBalance: (n: number) => void;
  spend: (n: number) => boolean;
  modal: Modal;
  openModal: (m: Modal) => void;
  closeModal: () => void;
  dismissWelcome: () => void;
  chat: ChatMsg[];
  sendChat: (text: string) => void;
  rain: { amount: number; endsAt: number };
  addRain: (n: number) => void;
  sidebarOpen: boolean;
  chatOpen: boolean;
  toggleSidebar: () => void;
  toggleChat: () => void;
  minesBet: typeof minesBet;
  minesReveal: typeof minesReveal;
  minesCashout: typeof minesCashout;
  towersBet: typeof towersBet;
  towersReveal: typeof towersReveal;
  towersCashout: typeof towersCashout;
  diceBet: typeof diceBet;
  unboxBet: typeof unboxBet;
  battlesCreate: typeof battlesCreate;
  battlesJoin: typeof battlesJoin;
  battlesBot: typeof battlesBot;
  battlesGame: typeof battlesGame;
  blackjackStart: typeof blackjackStart;
  blackjackHit: typeof blackjackHit;
  blackjackStand: typeof blackjackStand;
  blackjackDouble: typeof blackjackDouble;
};

const Ctx = createContext<Store | null>(null);

const WELCOME_SESSION_KEY = "wildpvp-welcome-session";
const WELCOME_UNTIL_KEY = "wildpvp-welcome-until";
const WELCOME_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function storageGet(storage: Storage, key: string) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    /* ignore quota / private mode */
  }
}

function markWelcomeSession() {
  storageSet(sessionStorage, WELCOME_SESSION_KEY, "1");
}

function dismissWelcomeCooldown() {
  markWelcomeSession();
  storageSet(localStorage, WELCOME_UNTIL_KEY, String(Date.now() + WELCOME_COOLDOWN_MS));
}

function shouldShowWelcome() {
  if (typeof window === "undefined") return false;
  if (storageGet(sessionStorage, WELCOME_SESSION_KEY)) return false;
  const until = Number(storageGet(localStorage, WELCOME_UNTIL_KEY) || 0);
  if (until > Date.now()) {
    markWelcomeSession();
    return false;
  }
  return true;
}

function colorForRank(rank: string) {
  if (rank === "staff") return "#88FF55";
  if (rank === "gold") return "#F1C947";
  if (rank === "silver") return "#B0B3D6";
  return "#BEBEBE";
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [rain, setRain] = useState({ amount: 0, endsAt: Date.now() + 17 * 60 * 1000 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const holdRef = useRef(0);
  const pendingUserRef = useRef<ServerUser | null>(null);

  const applyUserNow = useCallback((raw?: ServerUser | null) => {
    if (!raw || typeof raw !== "object" || !("_id" in raw)) return;
    if (holdRef.current > 0) {
      pendingUserRef.current = raw;
      return;
    }
    setUser((prev) => mergeUser(prev, raw));
  }, []);

  const holdUser = useCallback(() => {
    holdRef.current += 1;
  }, []);

  const flushUser = useCallback(() => {
    holdRef.current = Math.max(0, holdRef.current - 1);
    if (holdRef.current > 0) return;
    const pending = pendingUserRef.current;
    pendingUserRef.current = null;
    if (pending) setUser((prev) => mergeUser(prev, pending));
  }, []);

  const bootSockets = useCallback((mapped: User | null) => {
    connectSockets({
      onUser: (raw) => applyUserNow(raw),
      onChat: (m) =>
        setChat((c) =>
          [
            ...c,
            {
              id: m.id,
              user: m.user,
              text: m.text,
              color: colorForRank(m.rank),
              rank: m.rank,
              level: m.level,
            },
          ].slice(-80),
        ),
      onChatHistory: (msgs) =>
        setChat(
          msgs.map((m) => ({
            id: m.id,
            user: m.user,
            text: m.text,
            color: colorForRank(m.rank),
            rank: m.rank,
            level: m.level,
          })),
        ),
      onRain: (amount) => setRain((r) => ({ ...r, amount })),
    });
  }, [applyUserNow]);

  useEffect(() => {
    const loggedIn = Boolean(token());
    if (!loggedIn && shouldShowWelcome()) {
      markWelcomeSession();
      setModal("welcome");
    }
    bootSockets(null);
    meRequest()
      .then((u) => {
        if (u) {
          setUser(u);
          setModal(null);
          markWelcomeSession();
          bootSockets(u);
        }
      })
      .finally(() => setReady(true));
    return () => disconnectSockets();
  }, [bootSockets]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      if (!username.trim() || !password) return "Enter a username and password.";
      const u = await loginRequest(username.trim(), password);
      setUser(u);
      bootSockets(u);
      dismissWelcomeCooldown();
      setModal(null);
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Login failed.";
    }
  }, [bootSockets]);

  const register = useCallback(async (username: string, email: string, password: string) => {
    try {
      if (username.trim().length < 3) return "Username must be at least 3 characters.";
      if (!email.includes("@")) return "Enter a valid email.";
      if (password.length < 4) return "Password must be at least 4 characters.";
      const u = await registerRequest(username.trim(), email, password);
      setUser(u);
      bootSockets(u);
      dismissWelcomeCooldown();
      setModal(null);
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Register failed.";
    }
  }, [bootSockets]);

  const logout = useCallback(() => {
    setToken(null);
    disconnectSockets();
    setUser(null);
  }, []);

  const addBalance = useCallback((n: number) => {
    setUser((u) => (u ? { ...u, balance: u.balance + n } : u));
  }, []);

  const spend = useCallback((n: number) => {
    if (!user || user.balance < n) return false;
    return true;
  }, [user]);

  const sendChat = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    sendChatMessage(t).catch((err) => {
      setChat((c) =>
        [
          ...c,
          {
            id: Date.now(),
            user: "system",
            text: err instanceof Error ? err.message : "Could not send message.",
            color: "#FF5562",
            rank: "staff",
          },
        ].slice(-80),
      );
    });
  }, []);

  const addRain = useCallback((n: number) => {
    setRain((r) => ({ ...r, amount: r.amount + n }));
  }, []);

  const openModal = useCallback((m: Modal) => {
    setModal(m);
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  const dismissWelcome = useCallback(() => {
    dismissWelcomeCooldown();
    setModal(null);
  }, []);

  const value = useMemo<Store>(
    () => ({
      user,
      ready,
      login,
      logout,
      register,
      applyUser: applyUserNow,
      holdUser,
      flushUser,
      addBalance,
      spend,
      modal,
      openModal,
      closeModal,
      dismissWelcome,
      chat,
      sendChat,
      rain,
      addRain,
      sidebarOpen,
      chatOpen,
      toggleSidebar: () => setSidebarOpen((s) => !s),
      toggleChat: () => setChatOpen((s) => !s),
      minesBet,
      minesReveal,
      minesCashout,
      towersBet,
      towersReveal,
      towersCashout,
      diceBet,
      unboxBet,
      battlesCreate,
      battlesJoin,
      battlesBot,
      battlesGame,
      blackjackStart,
      blackjackHit,
      blackjackStand,
      blackjackDouble,
    }),
    [user, ready, login, logout, register, applyUserNow, holdUser, flushUser, addBalance, spend, modal, openModal, closeModal, dismissWelcome, chat, sendChat, rain, addRain, sidebarOpen, chatOpen],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore outside Providers");
  return ctx;
}

export function useBalanceHold() {
  const { holdUser, flushUser } = useStore();
  const held = useRef(false);

  const end = useCallback(() => {
    if (!held.current) return;
    held.current = false;
    flushUser();
  }, [flushUser]);

  const begin = useCallback(() => {
    if (held.current) return;
    held.current = true;
    holdUser();
  }, [holdUser]);

  useEffect(() => () => end(), [end]);

  return { begin, end };
}

export { rankKeyFromLevel };
