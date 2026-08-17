import { io, type Socket } from "socket.io-client";
import { rankNameFromLevel, xpToLevel } from "./levels";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";
const TOKEN_KEY = "wildpvp-token";

export type ServerUser = {
  _id: string;
  username: string;
  avatar?: string;
  rank: string;
  balance: number;
  xp: number;
  local?: { email?: string };
  stats?: { bet?: number; won?: number; deposit?: number; withdraw?: number };
};

export type AppUser = {
  id: string;
  username: string;
  email: string;
  balance: number;
  xp: number;
  level: number;
  rank: string;
  stats: { bet: number; won: number; deposit: number; withdraw: number };
};

export function token() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(value: string | null) {
  if (value) localStorage.setItem(TOKEN_KEY, value);
  else localStorage.removeItem(TOKEN_KEY);
}

export function mapUser(raw: ServerUser): AppUser {
  const level = Math.max(1, xpToLevel(raw.xp));
  return {
    id: String(raw._id || ""),
    username: raw.username || "",
    email: raw.local?.email || "",
    balance: (raw.balance || 0) / 1000,
    xp: raw.xp || 0,
    level,
    rank: rankNameFromLevel(level),
    stats: {
      bet: (raw.stats?.bet || 0) / 1000,
      won: (raw.stats?.won || 0) / 1000,
      deposit: (raw.stats?.deposit || 0) / 1000,
      withdraw: (raw.stats?.withdraw || 0) / 1000,
    },
  };
}

export function mergeUser(prev: AppUser | null, raw: ServerUser | null | undefined): AppUser | null {
  if (!raw || typeof raw !== "object") return prev;
  const mapped = mapUser(raw);
  if (!prev) return mapped.id || mapped.username ? mapped : prev;
  return {
    ...prev,
    id: mapped.id || prev.id,
    username: mapped.username || prev.username,
    email: mapped.email || prev.email,
    balance: raw.balance != null ? mapped.balance : prev.balance,
    xp: raw.xp != null ? mapped.xp : prev.xp,
    level: raw.xp != null ? mapped.level : prev.level,
    rank: mapped.username ? mapped.rank : prev.rank,
    stats: raw.stats ? mapped.stats : prev.stats,
  };
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  const t = token();
  if (t) headers["x-auth-token"] = t;
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body.error?.message || body.message || "Request failed");
  }
  return body as T;
}

export async function loginRequest(loginInfo: string, password: string) {
  const body = await api<{ token: string; user: ServerUser }>("/auth/credentials", {
    method: "POST",
    body: JSON.stringify({ loginInfo, password, captcha: "dev" }),
  });
  setToken(body.token);
  return mapUser(body.user);
}

export async function registerRequest(username: string, email: string, password: string) {
  const body = await api<{ token: string; user: ServerUser }>("/auth/credentials/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password, captcha: "dev" }),
  });
  setToken(body.token);
  return mapUser(body.user);
}

export async function meRequest() {
  const t = token();
  if (!t) return null;
  try {
    const body = await api<{ user: ServerUser }>("/auth/me");
    return mapUser(body.user);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (/authori/i.test(msg)) setToken(null);
    return null;
  }
}

type Ack<T> = { success: true } & T | { success: false; error: { message: string } };

function emit<T>(socket: Socket, event: string, data: unknown) {
  return new Promise<T>((resolve, reject) => {
    socket.timeout(15000).emit(event, data, (err: Error | null, res: Ack<T>) => {
      if (err) return reject(err);
      if (!res || res.success === false) return reject(new Error(res?.error?.message || "Action failed"));
      resolve(res as T);
    });
  });
}

let general: Socket | null = null;
let mines: Socket | null = null;
let towers: Socket | null = null;
let dice: Socket | null = null;
let unbox: Socket | null = null;
let battles: Socket | null = null;
let blackjack: Socket | null = null;

export type BattleBox = { _id: string; slug: string; name: string; amount: number };
export type BattleGame = {
  _id: string;
  amount: number;
  playerCount: number;
  mode: "standard" | "team" | "group";
  state: string;
  boxes: { box: { _id: string; slug: string; name: string; amount: number; items?: { name: string; image: string; amountFixed: number; color?: string; dropId?: number }[] }; count: number }[];
  bets: { slot: number; bot: boolean; payout?: number; outcomes?: number[]; user?: { username?: string; _id?: string; level?: number } }[];
  options?: { private?: boolean; cursed?: boolean; terminal?: boolean; funding?: number };
};

type BattleState = { boxes: BattleBox[]; games: BattleGame[] };
let battleState: BattleState = { boxes: [], games: [] };
const battleSubs = new Set<(state: BattleState) => void>();

function setBattleState(next: Partial<BattleState>) {
  battleState = { ...battleState, ...next };
  battleSubs.forEach((fn) => fn(battleState));
}

function upsertBattle(game: BattleGame) {
  const games = battleState.games.filter((g) => g._id !== game._id);
  setBattleState({ games: [game, ...games] });
}

export function subscribeBattles(fn: (state: BattleState) => void) {
  battleSubs.add(fn);
  fn(battleState);
  return () => {
    battleSubs.delete(fn);
  };
}

function ns(name: string) {
  return io(`${API_URL}${name}`, {
    auth: { token: token() || "" },
    transports: ["websocket", "polling"],
    withCredentials: true,
  });
}

export function connectSockets(handlers: {
  onUser?: (user: ServerUser) => void;
  onChat?: (msg: { id: string; user: string; text: string; rank: string; level: number; time?: string }) => void;
  onChatHistory?: (msgs: { id: string; user: string; text: string; rank: string; level: number }[]) => void;
  onRain?: (amount: number) => void;
}) {
  disconnectSockets();
  general = ns("/general");
  mines = ns("/mines");
  towers = ns("/towers");
  dice = ns("/dice");
  unbox = ns("/unbox");
  battles = ns("/battles");
  blackjack = ns("/blackjack");

  general.on("user", (payload: { user: ServerUser }) => {
    if (payload?.user) handlers.onUser?.(payload.user);
  });
  general.on("chatMessage", (payload: { message: { _id: string; message: string; user?: { username: string; level?: number; rank?: string }; type: string } }) => {
    const m = payload?.message;
    if (!m || m.type === "system") return;
    handlers.onChat?.({
      id: String(m._id),
      user: m.user?.username || "User",
      text: m.message,
      rank: m.user?.rank === "admin" ? "staff" : m.user?.level && m.user.level >= 41 ? "gold" : m.user?.level && m.user.level >= 21 ? "silver" : "bronze",
      level: m.user?.level || 1,
    });
  });
  general.on("rain", (payload: { rain?: { amount?: number } }) => {
    if (payload?.rain?.amount != null) handlers.onRain?.(payload.rain.amount / 1000);
  });
  general.on("init", (payload: { rains?: { site?: { amount?: number } } }) => {
    if (payload?.rains?.site?.amount != null) handlers.onRain?.(payload.rains.site.amount / 1000);
    general?.emit("getChatMessages", { room: "en" }, (res: Ack<{ messages: { _id: string; message: string; user?: { username: string; level?: number; rank?: string }; type: string }[] }>) => {
      if (!res || res.success === false) return;
      const msgs = (res.messages || [])
        .filter((m) => m.type !== "system")
        .map((m) => ({
          id: String(m._id),
          user: m.user?.username || "User",
          text: m.message,
          rank: m.user?.rank === "admin" ? "staff" : m.user?.level && m.user.level >= 41 ? "gold" : m.user?.level && m.user.level >= 21 ? "silver" : "bronze",
          level: m.user?.level || 1,
        }));
      handlers.onChatHistory?.(msgs);
    });
  });

  battles.on("init", (payload: { boxes?: BattleBox[]; games?: BattleGame[] }) => {
    setBattleState({ boxes: payload.boxes || [], games: payload.games || [] });
  });
  battles.on("game", (payload: { game?: BattleGame }) => {
    if (payload?.game) upsertBattle(payload.game);
  });
}

export function disconnectSockets() {
  for (const s of [general, mines, towers, dice, unbox, battles, blackjack]) s?.disconnect();
  general = mines = towers = dice = unbox = battles = blackjack = null;
}

export async function sendChatMessage(message: string) {
  if (!general) throw new Error("Chat is not connected.");
  await emit(general, "sendChatMessage", { message });
}

export async function minesBet(amount: number, minesCount: number, grid: number) {
  if (!mines) throw new Error("Not connected.");
  return emit<{ user: ServerUser; game: { _id: string } }>(mines, "sendBet", {
    amount: Math.round(amount * 1000),
    minesCount,
    grid,
  });
}

export async function minesReveal(tile: number) {
  if (!mines) throw new Error("Not connected.");
  return emit<{ user: ServerUser; game: { revealed: { tile: number; value: string }[]; state: string; payout?: number; deck?: string[] } }>(
    mines,
    "sendReveal",
    { tile },
  );
}

export async function minesCashout() {
  if (!mines) throw new Error("Not connected.");
  return emit<{ user: ServerUser; game: { payout: number; state: string } }>(mines, "sendCashout", {});
}

export async function towersBet(amount: number, risk: string) {
  if (!towers) throw new Error("Not connected.");
  return emit<{ user: ServerUser; game: { _id: string } }>(towers, "sendBet", {
    amount: Math.round(amount * 1000),
    risk,
  });
}

export async function towersReveal(tile: number) {
  if (!towers) throw new Error("Not connected.");
  return emit<{ user: ServerUser; game: { revealed: { tile: number; row: string[] }[]; state: string; payout?: number; deck?: string[][] } }>(
    towers,
    "sendReveal",
    { tile },
  );
}

export async function towersCashout() {
  if (!towers) throw new Error("Not connected.");
  return emit<{ user: ServerUser; game: { payout: number; state: string } }>(towers, "sendCashout", {});
}

export async function diceBet(amount: number, target: number, rollOver: boolean) {
  if (!dice) throw new Error("Not connected.");
  return emit<{ user: ServerUser; game: { roll: number; won: boolean; payout: number; multiplier: number } }>(dice, "sendBet", {
    amount: Math.round(amount * 1000),
    target,
    rollOver,
  });
}

export async function unboxBet(slug: string, unboxCount: number) {
  if (!unbox) throw new Error("Not connected.");
  return emit<{
    user: ServerUser;
    games: {
      ticket: number;
      item: { name: string; image: string; amountFixed: number; color: string; dropId: number };
    }[];
  }>(unbox, "sendBet", { slug, unboxCount });
}

export async function battlesCreate(data: {
  playerCount: number;
  mode: "standard" | "team" | "group";
  boxes: { _id: string; count: number }[];
  levelMin?: number;
  funding?: number;
  private?: boolean;
  affiliateOnly?: boolean;
  cursed?: boolean;
  terminal?: boolean;
}) {
  if (!battles) throw new Error("Not connected.");
  const res = await emit<{ user?: ServerUser; game: BattleGame }>(battles, "sendCreate", {
    playerCount: data.playerCount,
    mode: data.mode,
    boxes: data.boxes,
    levelMin: data.levelMin ?? 0,
    funding: data.funding ?? 0,
    private: data.private ?? false,
    affiliateOnly: data.affiliateOnly ?? false,
    cursed: data.cursed ?? false,
    terminal: data.terminal ?? false,
  });
  upsertBattle(res.game);
  return res;
}

export async function battlesJoin(gameId: string, slot: number) {
  if (!battles) throw new Error("Not connected.");
  return emit<{ user?: ServerUser }>(battles, "sendJoin", { gameId, slot });
}

export async function battlesBot(gameId: string) {
  if (!battles) throw new Error("Not connected.");
  return emit<Record<string, never>>(battles, "sendBot", { gameId });
}

export async function battlesGame(gameId: string) {
  if (!battles) throw new Error("Not connected.");
  const res = await emit<{ game: BattleGame }>(battles, "getGameData", { gameId });
  upsertBattle(res.game);
  return res;
}

export type BjCard = { rank: string; suit?: string; hidden?: boolean };

export async function blackjackStart(amount: number) {
  if (!blackjack) throw new Error("Not connected.");
  return emit<{ user: ServerUser; game: { player: BjCard[]; dealer: BjCard[]; state: string; payout?: number } }>(
    blackjack,
    "sendSoloBet",
    { amount: Math.round(amount * 1000) },
  );
}

export async function blackjackHit() {
  if (!blackjack) throw new Error("Not connected.");
  return emit<{ user: ServerUser; game: { player: BjCard[]; dealer: BjCard[]; state: string; payout?: number } }>(
    blackjack,
    "sendSoloHit",
    {},
  );
}

export async function blackjackStand() {
  if (!blackjack) throw new Error("Not connected.");
  return emit<{ user: ServerUser; game: { player: BjCard[]; dealer: BjCard[]; state: string; payout?: number } }>(
    blackjack,
    "sendSoloStand",
    {},
  );
}

export async function blackjackDouble() {
  if (!blackjack) throw new Error("Not connected.");
  return emit<{ user: ServerUser; game: { player: BjCard[]; dealer: BjCard[]; state: string; payout?: number } }>(
    blackjack,
    "sendSoloDouble",
    {},
  );
}
