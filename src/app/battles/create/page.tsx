"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AddCaseModal } from "@/components/add-case-modal";
import { Bux } from "@/components/bux";
import { GreenButton } from "@/components/green-button";
import { Icons } from "@/components/icons";
import { useStore } from "@/components/providers";
import { subscribeBattles } from "@/lib/backend";
import { type CaseItem } from "@/lib/catalog";

const NORMAL = [
  { id: "1v1", label: "1V1", slots: 2, teams: "1v1" },
  { id: "1v1v1", label: "1V1V1", slots: 3, teams: "1v1v1" },
  { id: "1v1v1v1", label: "1V1V1V1", slots: 4, teams: "1v1v1v1" },
];
const TEAM = [
  { id: "2v2", label: "2V2", slots: 4, teams: "2v2 Team" },
];
const GROUP = [
  { id: "2p", label: "2P", slots: 2, teams: "2P Group" },
  { id: "3p", label: "3P", slots: 3, teams: "3P Group" },
  { id: "4p", label: "4P", slots: 4, teams: "4P Group" },
];
const ALL = [...NORMAL, ...TEAM, ...GROUP];

function Switch({
  on,
  onClick,
  icon,
  label,
}: {
  on: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label?: React.ReactNode;
}) {
  return (
    <div className="flex w-full justify-start">
      <div className="group/toggle relative flex cursor-pointer items-start">
        <div className="tr flex h-full w-full items-center justify-center rounded-8">
          {icon}
          {label}
          <div className="ml-8">
            <div
              className={`relative flex h-20 w-36 items-center justify-center rounded-full transition-colors duration-200 ${
                on ? "bg-green" : "bg-grey-39"
              }`}
            >
              <div
                className={`tr absolute top-2 h-16 w-16 rounded-full ${
                  on ? "left-18 bg-grey-34" : "left-2 bg-grey-58"
                }`}
              />
            </div>
          </div>
          <button type="button" aria-label="toggle" className="absolute inset-0" onClick={onClick} />
        </div>
      </div>
    </div>
  );
}

function ModeChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mr-8 h-36 rounded-8 border-2 border-grey-58 px-10 last:mr-0 ${active ? "bg-grey-58" : "bg-grey-39"}`}
    >
      <p className={`text-14 ${active ? "text-white" : "text-grey-190"}`}>{label}</p>
    </button>
  );
}

export default function CreateBattlePage() {
  const router = useRouter();
  const { user, openModal, applyUser, battlesCreate } = useStore();
  const [picked, setPicked] = useState<CaseItem[]>([]);
  const [boxIds, setBoxIds] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [jackpot, setJackpot] = useState(false);
  const [crazy, setCrazy] = useState(false);
  const [terminal, setTerminal] = useState(false);
  const [priv, setPriv] = useState(false);
  const [fast, setFast] = useState(false);
  const [loop, setLoop] = useState(true);
  const [borrow, setBorrow] = useState(false);
  const [borrowPct, setBorrowPct] = useState(80);
  const [layoutId, setLayoutId] = useState("1v1");
  const [creating, setCreating] = useState(false);
  const layout = ALL.find((l) => l.id === layoutId) ?? ALL[0];
  const cost = picked.reduce((s, c) => s + c.price, 0);
  const funding = borrow ? Math.min(80, Math.max(0, Math.round(borrowPct))) : 0;
  const createCost = cost + (cost * layout.slots * funding) / 100;
  const joinCost = cost * (1 - funding / 100);

  useEffect(() => {
    return subscribeBattles((state) => {
      const next: Record<string, string> = {};
      for (const box of state.boxes) next[box.slug] = box._id;
      setBoxIds(next);
    });
  }, []);

  const create = async () => {
    if (!user) return openModal("login");
    if (!picked.length) return;
    if (user.balance < createCost) return openModal("deposit");
    const boxes = picked.map((c) => {
      const id = boxIds[c.slug];
      if (!id) throw new Error(`Case ${c.name} is not seeded on the server.`);
      return { _id: id, count: 1 };
    });
    const mode = TEAM.some((m) => m.id === layoutId) ? "team" : GROUP.some((m) => m.id === layoutId) ? "group" : "standard";
    setCreating(true);
    try {
      const res = await battlesCreate({
        playerCount: layout.slots,
        mode,
        boxes,
        funding,
        private: priv,
        cursed: crazy,
        terminal,
        jackpot,
        affiliateOnly: false,
        levelMin: 0,
      });
      if (res.user) applyUser(res.user);
      router.push(`/battles/${res.game._id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not create battle.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex w-full justify-center">
      <div className="@xl/page:gap-32 @bt/page:gap-24 grid w-full max-w-screen-lg grid-cols-1 gap-16">
        <div className="grid w-full grid-cols-1 gap-24">
          <div className="flex w-full">
            <Link
              href="/battles"
              aria-label="link"
              className="group/button relative flex h-32 items-center justify-center rounded-6 bg-grey-39 opacity-100 transition-all duration-200 hover:bg-grey-47 active:bg-grey-47"
            >
              <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-10">
                <div className="-ml-2 text-grey-142">
                  <Icons.chevronLeft className="text-18" />
                </div>
                <p className="transition-all duration-300 text-14 text-grey-142">Back to battles</p>
              </div>
            </Link>
          </div>

          <div className="@lg/page:grid-cols-[1fr_auto] grid w-full grid-cols-1 items-center gap-10">
            <h1 className="@sm/page:text-20 @md/page:text-24 font-display w-full text-28 uppercase leading-[125%] text-cream transition-colors duration-200">
              Create battle
            </h1>
            <div className="@sm/page:grid-cols-[repeat(6,auto)] @sm/page:gap-16 grid grid-cols-2 items-center justify-start gap-10">
              <Switch
                on={jackpot}
                onClick={() => setJackpot((v) => !v)}
                icon={
                  <div className="text-18 text-[#FE963B]">
                    <Icons.jackpot />
                  </div>
                }
                label={<p className="ml-6 text-14 text-grey-190">Jackpot</p>}
              />
              <Switch
                on={crazy}
                onClick={() => setCrazy((v) => !v)}
                icon={
                  <div className="text-18 text-pink-231">
                    <Icons.wild />
                  </div>
                }
                label={<p className="ml-6 text-14 text-grey-190">Crazy</p>}
              />
              <Switch
                on={terminal}
                onClick={() => setTerminal((v) => !v)}
                icon={
                  <div className="text-18 text-red">
                    <Icons.terminal />
                  </div>
                }
                label={<p className="ml-6 text-14 text-grey-190">Terminal</p>}
              />
              <Switch
                on={priv}
                onClick={() => setPriv((v) => !v)}
                icon={
                  <div className="text-18 text-grey-190">
                    <Icons.shield />
                  </div>
                }
                label={<p className="ml-6 text-14 text-grey-190">Private</p>}
              />
              <Switch
                on={fast}
                onClick={() => setFast((v) => !v)}
                icon={
                  <div className="text-18 text-green">
                    <Icons.bolt />
                  </div>
                }
              />
              <Switch
                on={loop}
                onClick={() => setLoop((v) => !v)}
                icon={
                  <div className="text-18 text-green">
                    <Icons.loop />
                  </div>
                }
              />
            </div>
          </div>
        </div>

        <div className="w-full border-b-1 border-grey-47 transition-colors duration-200" />

        <div className="grid w-full grid-cols-1 gap-16">
          <div className="grid w-full grid-cols-1 gap-4">
            <p className="text-16 text-white">Battle configuration</p>
            <p className="text-14 text-grey-190">Select game modes and amount of players</p>
          </div>
          <div className="@bt/page:grid-cols-3 grid w-full grid-cols-1 gap-12">
            <section className="relative grid w-full grid-cols-1 gap-12 rounded-12 bg-grey-39 p-16">
              <div className="grid w-full grid-cols-[auto_1fr] items-center gap-6">
                <div className="flex items-center justify-center" style={{ width: 20, height: 20 }}>
                  <Icons.battles className="text-grey-190" style={{ marginLeft: 0, scale: 1 }} />
                </div>
                <p className="text-14 uppercase text-white">Normal mode</p>
              </div>
              <div className="flex w-full flex-wrap">
                {NORMAL.map((m) => (
                  <ModeChip key={m.id} active={layoutId === m.id} label={m.label} onClick={() => setLayoutId(m.id)} />
                ))}
              </div>
            </section>
            <section className="relative grid w-full grid-cols-1 gap-12 rounded-12 bg-grey-39 p-16">
              <div className="grid w-full grid-cols-[auto_1fr] items-center gap-6">
                <Icons.users className="text-20 text-blue" />
                <p className="text-14 uppercase text-white">Team mode</p>
              </div>
              <div className="flex w-full flex-wrap">
                {TEAM.map((m) => (
                  <ModeChip key={m.id} active={layoutId === m.id} label={m.label} onClick={() => setLayoutId(m.id)} />
                ))}
              </div>
            </section>
            <section className="relative grid w-full grid-cols-1 gap-12 rounded-12 bg-grey-39 p-16">
              <div className="grid w-full grid-cols-[auto_1fr] items-center gap-6">
                <Icons.people className="text-20 text-green" />
                <p className="text-14 uppercase text-white">Group mode</p>
              </div>
              <div className="flex w-full flex-wrap">
                {GROUP.map((m) => (
                  <ModeChip key={m.id} active={layoutId === m.id} label={m.label} onClick={() => setLayoutId(m.id)} />
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-16">
          <div className="grid w-full grid-cols-1 gap-4">
            <p className="text-16 text-white">Add cases</p>
            <p className="text-14 text-grey-190">Add cases to your battle</p>
          </div>
          <div className="w-full">
            <div className="@bt/page:grid-cols-4 @sm/page:grid-cols-2 @md/page:grid-cols-3 @lg/page:grid-cols-4 @xl/page:grid-cols-5 relative grid w-full grid-cols-2 gap-12">
              {picked.map((c, i) => (
                <div
                  key={`${c.slug}-${i}`}
                  className="group relative flex h-full min-h-[270.8px] w-full flex-col items-center justify-center rounded-12 bg-grey-39 p-16 transition-colors hover:bg-grey-47 active:bg-grey-47 animate-show"
                >
                  <img
                    alt=""
                    src={c.image ?? `/cdn/cases/${c.imageId}.webp`}
                    className="h-[140px] w-[140px] object-contain transition-transform duration-300 group-hover:scale-110"
                  />
                  <p className="mt-12 truncate text-center text-14 text-grey-190">{c.name}</p>
                  <div className="mt-8">
                    <Bux value={c.price} />
                  </div>
                  <button
                    type="button"
                    aria-label="remove"
                    onClick={() => setPicked((p) => p.filter((_, j) => j !== i))}
                    className="absolute right-10 top-10 hidden h-24 w-24 items-center justify-center rounded-4 bg-grey-28 text-grey-142 group-hover:flex hover:text-white"
                  >
                    <Icons.close className="h-16 w-16" />
                  </button>
                </div>
              ))}
              <div className="group relative flex h-full min-h-[270.8px] w-full items-center justify-center rounded-12 bg-grey-39 transition-colors hover:bg-grey-47 active:bg-grey-47">
                <div className="grid grid-cols-1 gap-12">
                  <div className="flex w-full justify-center">
                    <div className="flex h-48 w-48 items-center justify-center rounded-full border-2 border-grey-58">
                      <Icons.plus className="text-32 text-grey-190 transition-colors group-hover:text-white group-active:text-white" />
                    </div>
                  </div>
                  <p className="text-center text-14 text-grey-190">Add case</p>
                </div>
                <button type="button" aria-label="select" className="absolute inset-0" onClick={() => setAdding(true)} />
              </div>
            </div>
          </div>
        </div>

        <div className="@sm/page:grid-cols-[1fr_auto] relative grid w-full grid-cols-1 gap-12 rounded-12 bg-grey-39 p-16 transition-colors hover:bg-grey-47 active:bg-grey-47">
          <div className="@sm/page:flex w-full">
            <div className="@sm/page:w-auto grid w-full grid-cols-[auto_auto_1fr]">
              <div className="grid grid-cols-1 gap-6">
                <p className="text-12 text-grey-142">Battle cost</p>
                <div className="flex">
                  <Bux value={cost} />
                </div>
              </div>
              <div className="mx-16 h-full border-l-1 border-grey-47" />
              <div className="grid grid-cols-1 gap-6">
                <p className="text-12 text-grey-142">{funding > 0 ? "Your cost" : "Case amount"}</p>
                {funding > 0 ? (
                  <Bux value={createCost} />
                ) : (
                  <p className="text-14 text-white">{picked.length}</p>
                )}
              </div>
              {funding > 0 ? (
                <>
                  <div className="mx-16 h-full border-l-1 border-grey-47" />
                  <div className="grid grid-cols-1 gap-6">
                    <p className="text-12 text-grey-142">Join cost</p>
                    <Bux value={joinCost} />
                  </div>
                </>
              ) : null}
            </div>
          </div>
          <div className="grid w-full grid-cols-1 items-center gap-12 sm:grid-cols-[auto_auto]">
            <div className="grid grid-cols-1 gap-8">
              <div className="group relative flex h-40 min-w-[200px] justify-center rounded-6 border-2 border-grey-47 bg-grey-47 px-12 transition-colors hover:border-grey-190 hover:bg-grey-58 active:border-grey-190 active:bg-grey-58">
                <Switch
                  on={borrow}
                  onClick={() => {
                    setBorrow((v) => {
                      if (!v) setBorrowPct((p) => (p <= 0 ? 80 : Math.min(80, p)));
                      return !v;
                    });
                  }}
                  icon={<div className="text-18 text-green" />}
                  label={
                    <p className="text-14 text-grey-190">
                      Borrow Mode <span className="text-14 text-grey-190">{funding}%</span>
                    </p>
                  }
                />
              </div>
              {borrow ? (
                <div className="animate-open px-4">
                  <input
                    className="rs-range w-full"
                    type="range"
                    min={1}
                    max={80}
                    step={1}
                    value={funding}
                    onChange={(e) => setBorrowPct(Math.min(80, Math.max(1, Number(e.target.value))))}
                  />
                </div>
              ) : null}
            </div>
            <GreenButton onClick={create} disabled={!picked.length || creating} icon={<Icons.plus className="text-18" />}>
              {creating ? "Creating..." : "Create battle"}
            </GreenButton>
          </div>
        </div>
        <div className="@md/page:hidden h-50 w-full" />
      </div>

      {adding ? (
        <AddCaseModal
          onClose={() => setAdding(false)}
          onAdd={(item) => setPicked((p) => [...p, item])}
        />
      ) : null}
    </div>
  );
}
