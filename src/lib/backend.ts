import { io, type Socket } from "socket.io-client";
import { rankNameFromLevel, xpToLevel } from "./levels";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";
const TOKEN_KEY = "bloxywild-token";

export type ServerUser = {
  _id?: string;
  id?: string;
  username?: string;
  avatar?: string;
  rank?: string;
  balance?: number;
  xp?: number;
  anonymous?: boolean;
  local?: { email?: string };
  stats?: { bet?: number; won?: number; deposit?: number; withdraw?: number };
  rakeback?: { available?: number; earned?: number };
  rewards?: { bonusXp?: number; dailyDate?: string; dailyOpened?: string[]; rankKeys?: Record<string, number> };
};

export type AppUser = {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  balance: number;
  xp: number;
  level: number;
  rank: string;
  anonymous: boolean;
  stats: { bet: number; won: number; deposit: number; withdraw: number };
  rakebackAvailable: number;
  bonusXp: number;
};

export function token() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(value: string | null) {
  if (value) localStorage.setItem(TOKEN_KEY, value);
  else localStorage.removeItem(TOKEN_KEY);
}

function rawUserId(raw: ServerUser) {
  const id = raw._id ?? raw.id;
  if (id && typeof id === "object" && id !== null && "$oid" in id) return String((id as { $oid: string }).$oid);
  return id != null ? String(id) : "";
}

export function mapUser(raw: ServerUser): AppUser {
  const level = Math.max(1, xpToLevel(raw.xp || 0));
  return {
    id: rawUserId(raw),
    username: raw.username || "",
    email: raw.local?.email || "",
    avatar: raw.avatar || "",
    balance: (raw.balance || 0) / 1000,
    xp: raw.xp || 0,
    level,
    rank: rankNameFromLevel(level),
    anonymous: Boolean(raw.anonymous),
    stats: {
      bet: (raw.stats?.bet || 0) / 1000,
      won: (raw.stats?.won || 0) / 1000,
      deposit: (raw.stats?.deposit || 0) / 1000,
      withdraw: (raw.stats?.withdraw || 0) / 1000,
    },
    rakebackAvailable: (raw.rakeback?.available || 0) / 1000,
    bonusXp: Math.floor((raw.rewards?.bonusXp || 0) / 1000),
  };
}

export function mergeUser(prev: AppUser | null, raw: ServerUser | null | undefined): AppUser | null {
  if (!raw || typeof raw !== "object") return prev;
  const mapped = mapUser(raw);
  // Balance-only socket payloads omit username. Never replace a logged-in
  // session with a blank profile, and never create one from incomplete data.
  if (!mapped.username) {
    if (!prev) return prev;
    if (mapped.id && prev.id && mapped.id !== prev.id) return prev;
    return {
      ...prev,
      balance: raw.balance != null ? mapped.balance : prev.balance,
      xp: raw.xp != null ? mapped.xp : prev.xp,
      level: raw.xp != null ? mapped.level : prev.level,
      stats: raw.stats ? mapped.stats : prev.stats,
      anonymous: raw.anonymous != null ? mapped.anonymous : prev.anonymous,
      rakebackAvailable: raw.rakeback?.available != null ? mapped.rakebackAvailable : prev.rakebackAvailable,
      bonusXp: raw.rewards?.bonusXp != null ? mapped.bonusXp : prev.bonusXp,
    };
  }
  if (!prev) return mapped.id ? mapped : prev;
  if (mapped.id && prev.id && mapped.id !== prev.id) return prev;
  return {
    ...prev,
    id: mapped.id || prev.id,
    username: mapped.username || prev.username,
    email: mapped.email || prev.email,
    avatar: mapped.avatar || prev.avatar,
    balance: raw.balance != null ? mapped.balance : prev.balance,
    xp: raw.xp != null ? mapped.xp : prev.xp,
    level: raw.xp != null ? mapped.level : prev.level,
    rank: mapped.username ? mapped.rank : prev.rank,
    stats: raw.stats ? mapped.stats : prev.stats,
    anonymous: raw.anonymous != null ? mapped.anonymous : prev.anonymous,
    rakebackAvailable: raw.rakeback?.available != null ? mapped.rakebackAvailable : prev.rakebackAvailable,
    bonusXp: raw.rewards?.bonusXp != null ? mapped.bonusXp : prev.bonusXp,
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
let roulette: Socket | null = null;
let cashier: Socket | null = null;

export type BattleBox = { _id: string; slug: string; name: string; amount: number };
export type BattleItem = {
  name?: string;
  image?: string;
  amountFixed?: number;
  color?: string;
  dropId?: number;
  minTicket?: number;
  maxTicket?: number;
  tickets?: number;
  item?: { name?: string; image?: string; amountFixed?: number; color?: string };
};

export type BattleGame = {
  _id: string;
  amount: number;
  playerCount: number;
  mode: "standard" | "team" | "group";
  state: string;
  createdAt?: number | string;
  updatedAt?: number | string;
  boxes: {
    box: {
      _id?: string;
      slug: string;
      name: string;
      amount: number;
      items?: BattleItem[];
    };
    count: number;
  }[];
  bets: {
    slot: number;
    bot: boolean;
    payout?: number;
    amount?: number;
    outcomes?: number[];
    user?: { username?: string; _id?: string; level?: number; avatar?: string };
  }[];
  options?: { private?: boolean; cursed?: boolean; terminal?: boolean; jackpot?: boolean; funding?: number; teams?: string };
  fair?: { hash?: string; seedServer?: string; seedPublic?: string; blockId?: string | number };
};

type BattleState = { boxes: BattleBox[]; games: BattleGame[]; history: BattleGame[] };
let battleState: BattleState = { boxes: [], games: [], history: [] };
const battleSubs = new Set<(state: BattleState) => void>();

function setBattleState(next: Partial<BattleState>) {
  battleState = { ...battleState, ...next };
  battleSubs.forEach((fn) => fn(battleState));
}

function mergeBattleGame(prev: BattleGame | undefined, next: BattleGame): BattleGame {
  if (!prev) return next;
  const boxes = (next.boxes || []).map((box, i) => {
    const prevBox = prev.boxes?.[i];
    const items = box.box?.items?.length ? box.box.items : prevBox?.box?.items;
    return { ...box, box: { ...prevBox?.box, ...box.box, items: items || box.box?.items || [] } };
  });
  const bets = (next.bets || []).map((bet) => {
    const prevBet = prev.bets?.find((b) => b.slot === bet.slot);
    const user = bet.user && Object.keys(bet.user).length ? { ...prevBet?.user, ...bet.user } : prevBet?.user;
    return {
      ...prevBet,
      ...bet,
      user,
      outcomes: bet.outcomes?.length ? bet.outcomes : prevBet?.outcomes,
    };
  });
  return { ...prev, ...next, boxes: boxes.length ? boxes : prev.boxes, bets: bets.length ? bets : prev.bets };
}

function upsertBattle(game: BattleGame) {
  if (game.state === "cancelled" || game.state === "canceled") {
    setBattleState({
      games: battleState.games.filter((g) => g._id !== game._id),
      history: battleState.history.filter((g) => g._id !== game._id),
    });
    return;
  }
  const prev = battleState.games.find((g) => g._id === game._id) || battleState.history.find((g) => g._id === game._id);
  const merged = mergeBattleGame(prev, game);
  if (merged.state === "completed") {
    const history = [merged, ...battleState.history.filter((g) => g._id !== merged._id)]
      .filter((g) => !g.options?.private)
      .sort((a, b) => (b.amount || 0) - (a.amount || 0))
      .slice(0, 12);
    setBattleState({
      games: battleState.games.filter((g) => g._id !== merged._id),
      history,
    });
    return;
  }
  setBattleState({ games: [merged, ...battleState.games.filter((g) => g._id !== game._id)] });
}

export function subscribeBattles(fn: (state: BattleState) => void) {
  battleSubs.add(fn);
  fn(battleState);
  return () => {
    battleSubs.delete(fn);
  };
}

export type RouletteColor = "red" | "black" | "green";

export type RouletteGame = {
  _id: string;
  state: "created" | "rolling" | "completed";
  createdAt?: string;
  endsAt?: number;
  outcome?: number;
  color?: RouletteColor;
  fair?: { hash?: string; seedPublic?: string; seedServer?: string };
};

export type RouletteBetRow = {
  _id: string;
  amount: number;
  payout?: number;
  color: RouletteColor;
  multiplier: number;
  user: { _id?: string; username?: string; avatar?: string; rank?: string; level?: number };
};

export type RouletteState = {
  game: RouletteGame | null;
  bets: RouletteBetRow[];
  history: { _id?: string; outcome: number; color: RouletteColor }[];
};

let rouletteState: RouletteState = { game: null, bets: [], history: [] };
const rouletteSubs = new Set<(state: RouletteState) => void>();

function setRouletteState(next: Partial<RouletteState>) {
  rouletteState = { ...rouletteState, ...next };
  rouletteSubs.forEach((fn) => fn(rouletteState));
}

export function subscribeRoulette(fn: (state: RouletteState) => void) {
  rouletteSubs.add(fn);
  fn(rouletteState);
  return () => {
    rouletteSubs.delete(fn);
  };
}

function ns(name: string) {
  return io(`${API_URL}${name}`, {
    auth: (cb: (data: { token?: string }) => void) => {
      const t = token();
      cb(t ? { token: t } : {});
    },
    transports: ["websocket", "polling"],
    withCredentials: true,
  });
}

export type ServerRain = {
  _id?: string;
  amount?: number;
  endsAt?: number;
  updatedAt?: string | number;
  type?: string;
  state?: string;
  participants?: { user?: string | { _id?: string } }[];
};

export type RainInfo = {
  amount: number;
  endsAt: number;
  participants: string[];
};

const RAIN_SITE_MS = 60 * 60 * 1000;

function participantId(user: string | { _id?: string } | undefined) {
  if (!user) return "";
  if (typeof user === "string") return user;
  return user._id ? String(user._id) : "";
}

export function parseRain(raw?: ServerRain | null): RainInfo | null {
  if (!raw || raw.amount == null) return null;
  const duration = raw.type === "user" ? 2 * 60 * 1000 : RAIN_SITE_MS;
  const start = raw.updatedAt != null ? Date.parse(String(raw.updatedAt)) : 0;
  const endsAt = raw.endsAt || (start ? start + duration : 0);
  return {
    amount: raw.amount / 1000,
    endsAt,
    participants: (raw.participants || []).map((p) => participantId(p.user)).filter(Boolean),
  };
}

export function connectSockets(handlers: {
  onUser?: (user: ServerUser) => void;
  onChat?: (msg: { id: string; user: string; text: string; rank: string; level: number; avatar?: string; time?: string }) => void;
  onChatHistory?: (msgs: { id: string; user: string; text: string; rank: string; level: number; avatar?: string }[]) => void;
  onRain?: (rain: RainInfo) => void;
}) {
  disconnectSockets();
  general = ns("/general");
  mines = ns("/mines");
  towers = ns("/towers");
  dice = ns("/dice");
  unbox = ns("/unbox");
  battles = ns("/battles");
  blackjack = ns("/blackjack");
  roulette = ns("/roulette");
  cashier = ns("/cashier");

  general.on("user", (payload: { user?: ServerUser } | ServerUser) => {
    const raw = payload && typeof payload === "object" && "user" in payload ? payload.user : payload;
    if (raw && typeof raw === "object") handlers.onUser?.(raw as ServerUser);
  });
  general.on("chatMessage", (payload: { message: { _id: string; message: string; user?: { username: string; level?: number; rank?: string; avatar?: string }; type: string } }) => {
    const m = payload?.message;
    if (!m || m.type !== "user" || !m.user?.username || !String(m.message || "").trim()) return;
    handlers.onChat?.({
      id: String(m._id),
      user: m.user.username,
      text: m.message || "",
      rank: m.user?.rank === "admin" ? "staff" : m.user?.level && m.user.level >= 41 ? "gold" : m.user?.level && m.user.level >= 21 ? "silver" : "bronze",
      level: m.user?.level || 1,
      avatar: m.user?.avatar,
    });
  });
  general.on("rain", (payload: { rain?: ServerRain }) => {
    if (payload?.rain?.type === "user") return;
    const parsed = parseRain(payload?.rain);
    if (parsed) handlers.onRain?.(parsed);
  });
  general.on("init", (payload: { rains?: { site?: ServerRain } }) => {
    const parsed = parseRain(payload?.rains?.site);
    if (parsed) handlers.onRain?.(parsed);
    general?.emit("getChatMessages", { room: "en" }, (res: Ack<{ messages: { _id: string; message: string; user?: { username: string; level?: number; rank?: string; avatar?: string }; type: string }[] }>) => {
      if (!res || res.success === false) return;
      const msgs = (res.messages || [])
        .filter((m) => m.type === "user" && m.user?.username && String(m.message || "").trim())
        .map((m) => ({
          id: String(m._id),
          user: m.user!.username,
          text: m.message || "",
          rank: m.user?.rank === "admin" ? "staff" : m.user?.level && m.user.level >= 41 ? "gold" : m.user?.level && m.user.level >= 21 ? "silver" : "bronze",
          level: m.user?.level || 1,
          avatar: m.user?.avatar,
        }));
      handlers.onChatHistory?.(msgs);
    });
  });

  battles.on("init", (payload: { boxes?: BattleBox[]; games?: BattleGame[]; history?: BattleGame[] }) => {
    setBattleState({
      boxes: payload.boxes || [],
      games: (payload.games || []).filter((g) => g.state !== "completed" && g.state !== "cancelled" && g.state !== "canceled"),
      history: payload.history || [],
    });
  });
  battles.on("game", (payload: { game?: BattleGame }) => {
    if (payload?.game) upsertBattle(payload.game);
  });

  roulette.on("init", (payload: RouletteState) => setRouletteState(payload));
  roulette.on("game", (payload: Partial<RouletteState>) => {
    setRouletteState({
      game: payload.game ?? rouletteState.game,
      bets: payload.bets ?? (payload.game && payload.game.state === "created" ? [] : rouletteState.bets),
      history: payload.history ?? rouletteState.history,
    });
  });
  roulette.on("bet", (payload: { bet?: RouletteBetRow }) => {
    if (payload?.bet) setRouletteState({ bets: [...rouletteState.bets.filter((b) => b._id !== payload.bet!._id), payload.bet] });
  });
}

export function disconnectSockets() {
  for (const s of [general, mines, towers, dice, unbox, battles, blackjack, roulette, cashier]) s?.disconnect();
  general = mines = towers = dice = unbox = battles = blackjack = roulette = cashier = null;
}

export async function getCryptoData() {
  if (!cashier) throw new Error("Cashier is not connected.");
  return emit<{ addresses: Record<string, string>; prices: Record<string, { price: number; fee: number }> }>(cashier, "getCryptoData", {});
}

export async function sendCryptoWithdraw(currency: "sol" | "usdc", address: string, amountCoins: number) {
  if (!cashier) throw new Error("Cashier is not connected.");
  return emit<{ user: ServerUser }>(cashier, "sendCryptoWithdraw", {
    currency,
    address: address.trim(),
    amount: Math.round(amountCoins * 1000),
  });
}

export async function sendChatMessage(message: string) {
  if (!general) throw new Error("Chat is not connected.");
  await emit(general, "sendChatMessage", { message });
}

export async function sendRainTip(amount: number) {
  if (!general) throw new Error("Not connected.");
  return emit(general, "sendRainTip", { amount: Math.round(amount * 1000) });
}

export async function sendRainJoin() {
  if (!general) throw new Error("Not connected.");
  return emit(general, "sendRainJoin", {});
}

export async function claimAffiliateCode(code: string) {
  if (!general) throw new Error("Not connected.");
  return emit<{ user: ServerUser }>(general, "sendAffiliateClaimCode", {
    code: code.trim(),
    captcha: "dev",
  });
}

export async function claimPromoCode(code: string) {
  if (!general) throw new Error("Not connected.");
  return emit(general, "sendPromoClaim", {
    code: code.trim(),
    captcha: "dev",
  });
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

export type RewardsInfo = {
  bonusXp: number;
  dailyDate: string;
  dailyOpened: string[];
  rankKeys: Record<string, number>;
  rakeback: number;
};

export type GiveawayLive = {
  entries: number;
  deposited: number;
  tickets: number;
  eligible: boolean;
};

export type GiveawayClaim = {
  id: string;
  kind: "daily" | "weekly" | "monthly";
  slug: string;
  name: string;
  image: string;
  expiresAt: number;
};

export async function getGiveawayData() {
  if (!general) throw new Error("Not connected.");
  return emit<{ giveaways: Record<"daily" | "weekly" | "monthly", GiveawayLive>; claims: GiveawayClaim[] }>(
    general,
    "getGiveawayData",
    {},
  );
}

export async function sendGiveawayOpen(winId: string) {
  if (!general) throw new Error("Not connected.");
  return emit<{
    user: ServerUser;
    games: {
      ticket: number;
      item: { name: string; image: string; amountFixed: number; color: string; dropId: number };
    }[];
  }>(general, "sendGiveawayOpen", { winId });
}

export async function getRewardsData() {
  if (!general) throw new Error("Not connected.");
  return emit<{ user?: ServerUser; rewards: RewardsInfo }>(general, "getRewardsData", {});
}

export async function sendRewardOpen(slug: string) {
  if (!general) throw new Error("Not connected.");
  return emit<{
    user: ServerUser;
    rewards: RewardsInfo;
    games: {
      ticket: number;
      item: { name: string; image: string; amountFixed: number; color: string; dropId: number };
    }[];
  }>(general, "sendRewardOpen", { slug });
}

export async function sendRakebackClaim() {
  if (!general) throw new Error("Not connected.");
  return emit<{ user: ServerUser }>(general, "sendRakebackClaim", {});
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
  jackpot?: boolean;
  teams?: string;
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
    jackpot: data.jackpot ?? false,
    teams: data.teams ?? "",
  });
  upsertBattle(res.game);
  return res;
}

export async function battlesJoin(gameId: string, slot: number) {
  if (!battles) throw new Error("Not connected.");
  const res = await emit<{ user?: ServerUser; game?: BattleGame }>(battles, "sendJoin", { gameId, slot });
  if (res.game) upsertBattle(res.game);
  return res;
}

export async function battlesBot(gameId: string) {
  if (!battles) throw new Error("Not connected.");
  return emit<Record<string, never>>(battles, "sendBot", { gameId });
}

export async function battlesCancel(gameId: string) {
  if (!battles) throw new Error("Not connected.");
  const res = await emit<{ user?: ServerUser; game?: BattleGame }>(battles, "sendCancel", { gameId });
  if (res.game) upsertBattle(res.game);
  return res;
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

export async function rouletteBet(amount: number, color: RouletteColor) {
  if (!roulette) throw new Error("Not connected.");
  return emit<{ user: ServerUser }>(roulette, "sendBet", {
    amount: Math.round(amount * 1000),
    color,
  });
}

export type UserSeedInfo = {
  seedClient?: string;
  hash?: string;
  nonce?: number;
  seedServer?: string;
};

export async function getUserSeed() {
  if (!general) throw new Error("Not connected.");
  return emit<{ seed: UserSeedInfo; seedNext: UserSeedInfo }>(general, "getUserSeed", {});
}

export async function sendUserSeed(seedClient: string) {
  if (!general) throw new Error("Not connected.");
  return emit<{ seed: UserSeedInfo; seedNext: UserSeedInfo }>(general, "sendUserSeed", { seedClient });
}

export async function sendUserAnonymous(anonymous: boolean) {
  if (!general) throw new Error("Not connected.");
  return emit<{ anonymous: boolean }>(general, "sendUserAnonymous", { anonymous });
}

export type ProfileBet = {
  _id: string;
  method: string;
  amount: number;
  payout?: number;
  multiplier?: number;
  createdAt?: string;
};

export type ProfileTransaction = {
  _id: string;
  method: string;
  amount: number;
  type?: string;
  state?: string;
  createdAt?: string;
};

export async function getUserBets(page = 1) {
  if (!general) throw new Error("Not connected.");
  return emit<{ count: number; bets: ProfileBet[] }>(general, "getUserBets", { page });
}

export async function getUserTransactions(page = 1) {
  if (!general) throw new Error("Not connected.");
  return emit<{ count: number; transactions: ProfileTransaction[] }>(general, "getUserTransactions", { page });
}

export async function updateUserAvatar(avatar: string) {
  const body = await api<{ user: ServerUser }>("/auth/credentials/avatar", {
    method: "POST",
    body: JSON.stringify({ avatar }),
  });
  return body.user;
}

export async function changeUserPassword(current: string, password: string) {
  await api("/auth/credentials/password", {
    method: "POST",
    body: JSON.stringify({ current, password }),
  });
}
