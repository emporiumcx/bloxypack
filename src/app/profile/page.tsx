"use client";

import { useEffect, useMemo, useState } from "react";
import { Bux } from "@/components/bux";
import { GreenButton, GreyButton } from "@/components/green-button";
import { Icons } from "@/components/icons";
import { useStore } from "@/components/providers";
import { UserAvatar } from "@/components/user-avatar";
import { ARCTIC_AVATARS, avatarName } from "@/lib/avatars";
import {
  changeUserPassword,
  getUserBets,
  getUserSeed,
  getUserTransactions,
  sendUserAnonymous,
  sendUserSeed,
  updateUserAvatar,
  type ProfileBet,
  type ProfileTransaction,
  type UserSeedInfo,
} from "@/lib/backend";
import { rankIconFromLevel, rankNameFromLevel, xpProgress } from "@/lib/levels";

const TABS = [
  { id: "settings", label: "Settings", icon: "person" },
  { id: "security", label: "Security", icon: "lock" },
  { id: "history", label: "Bets & Transactions", icon: "swap" },
  { id: "fairness", label: "Fairness", icon: "scale" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const GAME_LABEL: Record<string, string> = {
  unbox: "Cases",
  battles: "Battles",
  duels: "Battles",
  mines: "Mines",
  towers: "Towers",
  blackjack: "Blackjack",
  roll: "Dice",
  crash: "Crash",
  roulette: "Roulette",
};

function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-24 w-44 shrink-0 rounded-full transition-colors ${on ? "bg-green" : "bg-grey-47"}`}
    >
      <span
        className={`absolute top-2 h-20 w-20 rounded-full bg-white shadow-sm transition-[left] ${on ? "left-22" : "left-2"}`}
      />
    </button>
  );
}

function CopyRow({ label, value, placeholder }: { label: string; value?: string; placeholder?: string }) {
  const text = value || "";
  const [copied, setCopied] = useState(false);
  return (
    <div className="grid gap-6">
      <p className="ui-label text-11 text-grey-142">{label}</p>
      <div className="flex min-h-44 items-center gap-8 rounded-8 bg-grey-28 px-12">
        <p className={`min-w-0 flex-1 truncate text-13 ${text ? "text-white" : "text-grey-112"}`}>
          {text || placeholder || "—"}
        </p>
        <button
          type="button"
          disabled={!text}
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          }}
          className="flex h-28 w-28 items-center justify-center rounded-6 text-grey-142 hover:bg-grey-39 hover:text-white disabled:opacity-30"
        >
          {copied ? <Icons.check className="text-16 text-green" /> : <Icons.copy className="text-16" />}
        </button>
      </div>
    </div>
  );
}

function when(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ProfilePage() {
  const { user, openModal, logout, applyUser } = useStore();
  const [tab, setTab] = useState<TabId>("settings");
  const [incognito, setIncognito] = useState(false);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [privacyError, setPrivacyError] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [nextPw, setNextPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwOk, setPwOk] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [historyKind, setHistoryKind] = useState<"bets" | "tx">("bets");
  const [page, setPage] = useState(1);
  const [bets, setBets] = useState<ProfileBet[]>([]);
  const [txs, setTxs] = useState<ProfileTransaction[]>([]);
  const [betCount, setBetCount] = useState(0);
  const [txCount, setTxCount] = useState(0);
  const [historyBusy, setHistoryBusy] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [seed, setSeed] = useState<UserSeedInfo | null>(null);
  const [seedNext, setSeedNext] = useState<UserSeedInfo | null>(null);
  const [clientSeed, setClientSeed] = useState("");
  const [seedBusy, setSeedBusy] = useState(false);
  const [seedError, setSeedError] = useState("");

  useEffect(() => {
    if (!user) return;
    setIncognito(user.anonymous);
    const stored = window.localStorage.getItem(`bloxywild-private-${me.id}`);
    setPrivateProfile(stored === "1");
  }, [user]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("tab");
    if (q === "security" || q === "history" || q === "fairness" || q === "settings") setTab(q);
  }, []);

  useEffect(() => {
    if (!user || tab !== "history") return;
    let cancelled = false;
    setHistoryBusy(true);
    setHistoryError("");
    const load =
      historyKind === "bets"
        ? getUserBets(page).then((res) => {
            if (cancelled) return;
            setBets(res.bets || []);
            setBetCount(res.count || 0);
          })
        : getUserTransactions(page).then((res) => {
            if (cancelled) return;
            setTxs(res.transactions || []);
            setTxCount(res.count || 0);
          });
    load
      .catch((err: Error) => {
        if (!cancelled) setHistoryError(err.message || "Could not load history.");
      })
      .finally(() => {
        if (!cancelled) setHistoryBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, tab, historyKind, page]);

  useEffect(() => {
    if (!user || tab !== "fairness") return;
    getUserSeed()
      .then((res) => {
        setSeed(res.seed || null);
        setSeedNext(res.seedNext || null);
        setClientSeed(res.seedNext?.seedClient || res.seed?.seedClient || "");
      })
      .catch(() => {
        setSeed(null);
        setSeedNext(null);
      });
  }, [user, tab]);

  const selectedAvatar = useMemo(() => (user ? avatarName(user.avatar, user.id || user.username) : "pink"), [user]);
  const xpPct = user ? xpProgress(user.xp) : 0;
  const pages = Math.max(1, Math.ceil((historyKind === "bets" ? betCount : txCount) / 8));

  if (!user) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-center">
        <div className="grid max-w-[420px] justify-items-center gap-12">
          <div className="flex h-64 w-64 items-center justify-center rounded-full bg-grey-34">
            <Icons.person className="text-28 text-grey-142" />
          </div>
          <h1 className="text-24 font-bold text-white">Your profile</h1>
          <p className="text-14 text-grey-190">Sign in to change your avatar, review bets, and rotate fairness seeds.</p>
          <GreenButton onClick={() => openModal("login")} className="w-180">
            Login to continue
          </GreenButton>
        </div>
      </div>
    );
  }

  const me = user;

  async function pickAvatar(name: string) {
    setAvatarBusy(true);
    setPrivacyError("");
    try {
      applyUser(await updateUserAvatar(name));
    } catch (err) {
      setPrivacyError(err instanceof Error ? err.message : "Could not update avatar.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function toggleIncognito(next: boolean) {
    setIncognito(next);
    setPrivacyError("");
    try {
      await sendUserAnonymous(next);
      applyUser({ anonymous: next, username: me.username, _id: me.id });
    } catch (err) {
      setIncognito(!next);
      setPrivacyError(err instanceof Error ? err.message : "Could not update incognito.");
    }
  }

  function togglePrivate(next: boolean) {
    setPrivateProfile(next);
    window.localStorage.setItem(`bloxywild-private-${me.id}`, next ? "1" : "0");
  }

  async function savePassword() {
    setPwError("");
    setPwOk("");
    if (nextPw.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    if (nextPw !== confirmPw) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwBusy(true);
    try {
      await changeUserPassword(currentPw, nextPw);
      setCurrentPw("");
      setNextPw("");
      setConfirmPw("");
      setPwOk("Password updated.");
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setPwBusy(false);
    }
  }

  async function rotateSeed() {
    setSeedBusy(true);
    setSeedError("");
    try {
      const res = await sendUserSeed(clientSeed.trim() || `seed-${Date.now()}`);
      setSeed(res.seed || null);
      setSeedNext(res.seedNext || null);
      setClientSeed(res.seedNext?.seedClient || "");
    } catch (err) {
      setSeedError(err instanceof Error ? err.message : "Could not rotate seed.");
    } finally {
      setSeedBusy(false);
    }
  }

  return (
    <div className="grid w-full grid-cols-1 gap-16 lg:grid-cols-[220px_1fr]">
      <aside className="h-fit overflow-hidden rounded-12 bg-grey-34 p-8">
        {TABS.map((item) => {
          const Icon = Icons[item.icon];
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                setPage(1);
              }}
              className={`flex h-44 w-full items-center gap-10 rounded-8 px-12 text-left transition-colors ${
                active ? "bg-grey-39 text-green" : "text-grey-190 hover:bg-grey-39 hover:text-white"
              }`}
            >
              <Icon className="text-18" />
              <span className="text-14 font-semibold">{item.label}</span>
            </button>
          );
        })}
      </aside>

      <section className="overflow-hidden rounded-12 bg-grey-34">
        {tab === "settings" ? (
          <div className="grid gap-20 p-16 sm:p-24">
            <div className="relative overflow-hidden rounded-12 bg-grey-28 p-16 sm:p-20">
              <div className="pointer-events-none absolute -left-40 -top-40 h-160 w-160 rounded-full bg-green/10 blur-[70px]" />
              <div className="relative flex flex-wrap items-center gap-16">
                <UserAvatar avatar={user.avatar} seed={user.id || user.username} size={72} level={user.level} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-10">
                    <h1 className="truncate text-24 font-bold text-white">{user.username}</h1>
                    <img alt="" src={rankIconFromLevel(user.level)} className="h-22" />
                    <span className="rounded-6 bg-grey-39 px-8 py-4 text-12 text-grey-190">{rankNameFromLevel(user.level)}</span>
                  </div>
                  <p className="mt-4 text-13 text-grey-142">Level {user.level}</p>
                  <div className="mt-10 grid grid-cols-[1fr_auto] items-center gap-10">
                    <div className="relative h-8 overflow-hidden rounded-full bg-grey-39">
                      <div className="absolute inset-y-0 left-0 rounded-full bg-green" style={{ width: `${xpPct}%` }} />
                    </div>
                    <p className="text-12 text-grey-142">{xpPct}% XP</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
              {[
                ["Wagered", user.stats.bet],
                ["Won", user.stats.won],
                ["Deposited", user.stats.deposit],
                ["Withdrawn", user.stats.withdraw],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-12 bg-grey-28 p-14">
                  <p className="text-12 text-grey-142">{label}</p>
                  <div className="mt-8">
                    <Bux value={Number(value)} />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-12">
              <h2 className="text-16 font-semibold text-white">Avatar</h2>
              <div className="flex flex-wrap gap-10">
                {ARCTIC_AVATARS.map((name) => {
                  const selected = selectedAvatar === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      disabled={avatarBusy}
                      onClick={() => pickAvatar(name)}
                      className="rounded-full p-2 transition-transform hover:-translate-y-2 disabled:opacity-50"
                      style={{ boxShadow: selected ? "0 0 0 2px var(--color-green)" : "0 0 0 2px var(--color-grey-47)" }}
                    >
                      <img alt={name} src={`/img/avatars/${name}.png`} className="h-44 w-44 rounded-full object-cover" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-12">
              <h2 className="text-16 font-semibold text-white">Account</h2>
              <label className="grid gap-6">
                <span className="ui-label text-11 text-grey-142">Username</span>
                <input readOnly value={user.username} className="h-44 rounded-8 bg-grey-28 px-12 text-14 text-grey-190 outline-none" />
              </label>
              <label className="grid gap-6">
                <span className="ui-label text-11 text-grey-142">Email</span>
                <input readOnly value={user.email || "No email on file"} className="h-44 rounded-8 bg-grey-28 px-12 text-14 text-grey-190 outline-none" />
              </label>
            </div>

            <div className="grid gap-12">
              <h2 className="text-16 font-semibold text-white">Privacy</h2>
              <div className="flex items-center justify-between gap-12 rounded-12 bg-grey-28 px-14 py-12">
                <div>
                  <p className="text-14 font-semibold text-white">Private profile</p>
                  <p className="mt-2 text-12 text-grey-142">Hide your stats from other players.</p>
                </div>
                <Switch on={privateProfile} onChange={togglePrivate} />
              </div>
              <div className="flex items-center justify-between gap-12 rounded-12 bg-grey-28 px-14 py-12">
                <div>
                  <p className="text-14 font-semibold text-white">Incognito</p>
                  <p className="mt-2 text-12 text-grey-142">Hide your username on the live bets feed.</p>
                </div>
                <Switch on={incognito} onChange={toggleIncognito} />
              </div>
              {privacyError ? <p className="text-13 text-red">{privacyError}</p> : null}
            </div>

            <div className="flex flex-wrap gap-10">
              <GreyButton onClick={logout} className="w-140">
                Log out
              </GreyButton>
            </div>
          </div>
        ) : null}

        {tab === "security" ? (
          <div className="grid gap-20 p-16 sm:p-24">
            <div>
              <h2 className="text-18 font-bold text-white">Password</h2>
              <p className="mt-6 text-13 text-grey-142">Change the password used to sign in to this account.</p>
            </div>
            <label className="grid gap-6">
              <span className="ui-label text-11 text-grey-142">Current password</span>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="h-44 rounded-8 bg-grey-28 px-12 text-14 text-white outline-none"
              />
            </label>
            <label className="grid gap-6">
              <span className="ui-label text-11 text-grey-142">New password</span>
              <input
                type="password"
                value={nextPw}
                onChange={(e) => setNextPw(e.target.value)}
                className="h-44 rounded-8 bg-grey-28 px-12 text-14 text-white outline-none"
              />
            </label>
            <label className="grid gap-6">
              <span className="ui-label text-11 text-grey-142">Confirm new password</span>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="h-44 rounded-8 bg-grey-28 px-12 text-14 text-white outline-none"
              />
            </label>
            {pwError ? <p className="text-13 text-red">{pwError}</p> : null}
            {pwOk ? <p className="text-13 text-green">{pwOk}</p> : null}
            <GreenButton onClick={savePassword} loading={pwBusy} className="w-180">
              Update password
            </GreenButton>
          </div>
        ) : null}

        {tab === "history" ? (
          <div className="grid gap-16 p-16 sm:p-24">
            <div className="flex flex-wrap items-center justify-between gap-12">
              <h2 className="text-18 font-bold text-white">History</h2>
              <div className="flex overflow-hidden rounded-8 bg-grey-28 p-4">
                {(["bets", "tx"] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => {
                      setHistoryKind(kind);
                      setPage(1);
                    }}
                    className={`h-32 rounded-6 px-12 text-13 font-semibold ${
                      historyKind === kind ? "bg-grey-39 text-white" : "text-grey-142"
                    }`}
                  >
                    {kind === "bets" ? "Bets" : "Transactions"}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-12 bg-grey-28">
              <div className="grid grid-cols-[1.2fr_1fr_1fr_1.2fr] gap-8 border-b-1 border-grey-47 px-14 py-10 text-12 text-grey-142">
                <p>{historyKind === "bets" ? "Game" : "Method"}</p>
                <p>{historyKind === "bets" ? "Bet" : "Amount"}</p>
                <p>{historyKind === "bets" ? "Payout" : "Type"}</p>
                <p>Date</p>
              </div>
              {historyBusy ? (
                <p className="px-14 py-24 text-13 text-grey-142">Loading…</p>
              ) : historyError ? (
                <p className="px-14 py-24 text-13 text-red">{historyError}</p>
              ) : historyKind === "bets" && bets.length === 0 ? (
                <p className="px-14 py-24 text-13 text-grey-142">No bets yet. Play a game and it will show up here.</p>
              ) : historyKind === "tx" && txs.length === 0 ? (
                <p className="px-14 py-24 text-13 text-grey-142">No transactions yet.</p>
              ) : historyKind === "bets" ? (
                bets.map((bet) => {
                  const payout = (bet.payout || 0) / 1000;
                  const amount = (bet.amount || 0) / 1000;
                  const win = payout > amount;
                  return (
                    <div key={bet._id} className="grid grid-cols-[1.2fr_1fr_1fr_1.2fr] items-center gap-8 border-t-1 border-grey-47 px-14 py-12">
                      <p className="text-13 font-semibold text-white">{GAME_LABEL[bet.method] || bet.method}</p>
                      <Bux value={amount} size="sm" />
                      <span className={win ? "text-green" : "text-grey-190"}>
                        <Bux value={payout} size="sm" amount={win ? "green" : "white"} />
                      </span>
                      <p className="text-12 text-grey-142">{when(bet.createdAt)}</p>
                    </div>
                  );
                })
              ) : (
                txs.map((tx) => (
                  <div key={tx._id} className="grid grid-cols-[1.2fr_1fr_1fr_1.2fr] items-center gap-8 border-t-1 border-grey-47 px-14 py-12">
                    <p className="text-13 font-semibold capitalize text-white">{tx.method}</p>
                    <Bux value={(tx.amount || 0) / 1000} size="sm" />
                    <p className="text-13 capitalize text-grey-190">{tx.type || tx.state || "completed"}</p>
                    <p className="text-12 text-grey-142">{when(tx.createdAt)}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-12 text-grey-142">
                Page {page} of {pages}
              </p>
              <div className="flex gap-8">
                <GreyButton className="w-88" onClick={() => setPage((n) => Math.max(1, n - 1))}>
                  Prev
                </GreyButton>
                <GreyButton className="w-88" onClick={() => setPage((n) => Math.min(pages, n + 1))}>
                  Next
                </GreyButton>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "fairness" ? (
          <div className="grid gap-16 p-16 sm:p-24">
            <div>
              <h2 className="text-18 font-bold text-white">Provably fair</h2>
              <p className="mt-6 max-w-[520px] text-13 leading-6 text-grey-142">
                The house commits to a hashed server seed before you play. Rotate your client seed to reveal the previous
                server seed and verify past rounds.
              </p>
            </div>
            <CopyRow label="Active client seed" value={seed?.seedClient} placeholder="Play a game to generate seeds" />
            <CopyRow label="Active server seed (hashed)" value={seed?.hash} placeholder="Unavailable until you play" />
            <CopyRow label="Nonce" value={seed?.nonce != null ? String(seed.nonce) : ""} placeholder="0" />
            <CopyRow label="Next server seed (hashed)" value={seedNext?.hash} placeholder="Generated on rotate" />
            <label className="grid gap-6">
              <span className="ui-label text-11 text-grey-142">New client seed</span>
              <input
                value={clientSeed}
                onChange={(e) => setClientSeed(e.target.value.slice(0, 64))}
                className="h-44 rounded-8 bg-grey-28 px-12 text-14 text-white outline-none"
                placeholder="Enter a custom client seed"
              />
            </label>
            {seedError ? <p className="text-13 text-red">{seedError}</p> : null}
            <GreenButton onClick={rotateSeed} loading={seedBusy} className="w-200">
              Rotate seed pair
            </GreenButton>
          </div>
        ) : null}
      </section>
    </div>
  );
}
