"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type User = {
  username: string;
  email: string;
  password: string;
  balance: number;
  level: number;
  rank: string;
};

type Modal = "login" | "register" | "deposit" | "support" | "welcome" | "rain" | null;

type ChatMsg = {
  id: number;
  user: string;
  text: string;
  color: string;
  rank: string;
  avatar?: string;
  time?: string;
};

type Store = {
  user: User | null;
  login: (username: string, password: string) => string | null;
  logout: () => void;
  register: (username: string, email: string, password: string) => string | null;
  addBalance: (n: number) => void;
  spend: (n: number) => boolean;
  modal: Modal;
  openModal: (m: Modal) => void;
  closeModal: () => void;
  chat: ChatMsg[];
  sendChat: (text: string) => void;
  rain: { amount: number; endsAt: number };
  addRain: (n: number) => void;
  sidebarOpen: boolean;
  chatOpen: boolean;
  toggleSidebar: () => void;
  toggleChat: () => void;
};

const Ctx = createContext<Store | null>(null);

const SAMPLE_CHAT: ChatMsg[] = [
  { id: 1, user: "pibble", text: "Deposits are back online — older pending ones are being processed.", color: "#88FF55", rank: "staff", time: "17:50" },
  { id: 2, user: "Joris67", text: "gl on the wager lb everyone", color: "#89A0FF", rank: "gold", avatar: "e2bfcfda-06a7-43e0-b008-90b2f0cc87b4_0", time: "17:48" },
  { id: 3, user: "monarch", text: "anyone down for a 1v1 battle?", color: "#D778FF", rank: "gold", avatar: "a2904fc6-6659-452c-a224-c13f0a6f5d21_0", time: "17:41" },
  { id: 4, user: "voids", text: "daily rakeback looking decent today", color: "#52B5FF", rank: "gold", avatar: "98f1b331-c849-43ae-af20-f1bf6a5dff03_6", time: "17:38" },
  { id: 5, user: "Alpha_mil0", text: "towers medium is printing", color: "#F7931A", rank: "silver", time: "17:22" },
  { id: 6, user: "OMEGA51", text: "rain soon?", color: "#BEBEBE", rank: "bronze", time: "17:09" },
];

type Accounts = Record<string, User>;

function loadAccounts(): Accounts {
  try {
    return JSON.parse(localStorage.getItem("wildpvp-accounts") || "{}") as Accounts;
  } catch {
    return {};
  }
}

function saveAccounts(accounts: Accounts) {
  localStorage.setItem("wildpvp-accounts", JSON.stringify(accounts));
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [modal, setModal] = useState<Modal>("welcome");
  const [chat, setChat] = useState<ChatMsg[]>(SAMPLE_CHAT);
  const [rain, setRain] = useState({ amount: 2139, endsAt: Date.now() + 17 * 60 * 1000 });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("wildpvp-user");
    if (raw) {
      setUser(JSON.parse(raw) as User);
      setModal(null);
    }
    const seen = localStorage.getItem("wildpvp-welcome");
    if (seen && !raw) setModal(null);
    const savedChat = localStorage.getItem("wildpvp-chat");
    if (savedChat) setChat(JSON.parse(savedChat) as ChatMsg[]);
  }, []);

  const persist = (u: User | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem("wildpvp-user", JSON.stringify(u));
      const accounts = loadAccounts();
      accounts[u.username.toLowerCase()] = u;
      saveAccounts(accounts);
    } else {
      localStorage.removeItem("wildpvp-user");
    }
  };

  const login = useCallback((username: string, password: string) => {
    const name = username.trim();
    if (!name || !password) return "Enter a username and password.";
    const accounts = loadAccounts();
    const key = name.toLowerCase();
    const existing =
      accounts[key] ??
      Object.values(accounts).find((a) => a.email.toLowerCase() === key);
    if (!existing) return "No account with that username.";
    if (existing.password !== password) return "Wrong password.";
    persist(existing);
    setModal(null);
    return null;
  }, []);

  const register = useCallback((username: string, email: string, password: string) => {
    const name = username.trim();
    if (name.length < 3) return "Username must be at least 3 characters.";
    if (!email.includes("@")) return "Enter a valid email.";
    if (password.length < 4) return "Password must be at least 4 characters.";
    const accounts = loadAccounts();
    if (accounts[name.toLowerCase()]) return "That username is taken.";
    const next: User = {
      username: name,
      email,
      password,
      balance: 500,
      level: 1,
      rank: "Bronze I",
    };
    accounts[name.toLowerCase()] = next;
    saveAccounts(accounts);
    persist(next);
    setModal(null);
    return null;
  }, []);

  const logout = useCallback(() => persist(null), []);

  const addBalance = useCallback((n: number) => {
    setUser((u) => {
      if (!u) return u;
      const next = { ...u, balance: u.balance + n };
      localStorage.setItem("wildpvp-user", JSON.stringify(next));
      const accounts = loadAccounts();
      accounts[next.username.toLowerCase()] = next;
      saveAccounts(accounts);
      return next;
    });
  }, []);

  const spend = useCallback((n: number) => {
    let ok = false;
    setUser((u) => {
      if (!u || u.balance < n) return u;
      ok = true;
      const next = { ...u, balance: u.balance - n };
      localStorage.setItem("wildpvp-user", JSON.stringify(next));
      const accounts = loadAccounts();
      accounts[next.username.toLowerCase()] = next;
      saveAccounts(accounts);
      return next;
    });
    return ok;
  }, []);

  const sendChat = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setChat((c) => {
      const next = [
        ...c,
        {
          id: Date.now(),
          user: user?.username ?? "Guest",
          text: t.slice(0, 200),
          color: "#88FF55",
          rank: user ? "gold" : "bronze",
          time,
        },
      ].slice(-80);
      localStorage.setItem("wildpvp-chat", JSON.stringify(next));
      return next;
    });
  }, [user]);

  const addRain = useCallback((n: number) => {
    setRain((r) => ({ ...r, amount: r.amount + n }));
  }, []);

  const openModal = useCallback((m: Modal) => {
    if (m === null) localStorage.setItem("wildpvp-welcome", "1");
    setModal(m);
  }, []);

  const closeModal = useCallback(() => {
    localStorage.setItem("wildpvp-welcome", "1");
    setModal(null);
  }, []);

  const value = useMemo<Store>(
    () => ({
      user,
      login,
      logout,
      register,
      addBalance,
      spend,
      modal,
      openModal,
      closeModal,
      chat,
      sendChat,
      rain,
      addRain,
      sidebarOpen,
      chatOpen,
      toggleSidebar: () => setSidebarOpen((s) => !s),
      toggleChat: () => setChatOpen((s) => !s),
    }),
    [user, login, logout, register, addBalance, spend, modal, openModal, closeModal, chat, sendChat, rain, addRain, sidebarOpen, chatOpen],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore outside Providers");
  return ctx;
}
