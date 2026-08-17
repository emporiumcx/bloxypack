"use client";

import { BattleSeat } from "@/components/battle-seat";
import { GreenButton } from "@/components/green-button";
import { useStore } from "@/components/providers";
import { rankIdFromLevel, xpProgress } from "@/lib/levels";

export default function ProfilePage() {
  const { user, openModal, logout } = useStore();

  if (!user) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <GreenButton onClick={() => openModal("login")}>Login to view profile</GreenButton>
      </div>
    );
  }

  return (
    <div className="grid gap-16 md:grid-cols-[200px_1fr]">
      <aside className="grid h-fit gap-4 rounded-12 bg-grey-28 p-8 text-14">
        {["Settings", "Security", "Bets & Transactions", "Fairness"].map((t, i) => (
          <div key={t} className={`rounded-6 px-10 py-10 ${i === 0 ? "bg-grey-39 text-green" : "text-grey-190"}`}>
            {t}
          </div>
        ))}
      </aside>
      <section className="rounded-12 bg-grey-28 p-20">
        <div className="flex items-center gap-14">
          <BattleSeat name={user.username} filled />
          <div>
            <p className="text-18 font-bold">{user.username}</p>
            <p className="text-13 text-grey-142">
              {user.rank} · Level {user.level}
            </p>
          </div>
        </div>
        <div className="mt-16 h-8 overflow-hidden rounded-full bg-grey-39">
          <div className="h-full rounded-full bg-green" style={{ width: `${xpProgress(user.xp)}%` }} />
        </div>
        <p className="mt-6 text-12 text-grey-142">
          Level {user.level} · {xpProgress(user.xp)}% to next · rank icon{" "}
          <img alt="" src={`/img/rank/${rankIdFromLevel(user.level)}.svg`} className="ml-4 inline h-16" />
        </p>
        <div className="mt-16 grid grid-cols-2 gap-10 md:grid-cols-4">
          {[
            ["Total bets", String(Math.round(user.stats.bet))],
            ["Total won", String(Math.round(user.stats.won))],
            ["Total deposited", String(Math.round(user.stats.deposit))],
            ["XP", String(user.xp)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-8 bg-grey-34 p-12">
              <p className="text-12 text-grey-142">{k}</p>
              <p className="mt-6 text-16 font-bold">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-20 grid gap-12">
          <label className="flex items-center justify-between text-14">
            Private profile
            <input type="checkbox" />
          </label>
          <label className="flex items-center justify-between text-14">
            Incognito mode
            <input type="checkbox" />
          </label>
        </div>
        <div className="mt-16 flex gap-8">
          <input defaultValue={user.email} className="h-40 flex-1 rounded-8 bg-grey-39 px-12 text-13 outline-none" />
          <GreenButton>Save</GreenButton>
        </div>
        <button onClick={logout} className="mt-16 text-13 text-grey-142 hover:text-white">
          Log out
        </button>
      </section>
    </div>
  );
}
