"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AddCaseModal } from "@/components/add-case-modal";
import { ModeIcon, MODE_META } from "@/components/battle-modes";
import { Bux } from "@/components/bux";
import { Dropdown } from "@/components/dropdown";
import { GreenButton } from "@/components/green-button";
import { GotQuestions } from "@/components/home-faq";
import { Icons } from "@/components/icons";
import { useStore } from "@/components/providers";
import { subscribeBattles } from "@/lib/backend";
import { caseImage, type CaseItem } from "@/lib/catalog";

const SINGLE = [
  { id: "1v1", label: "1vs1", slots: 2, teams: "1v1", api: "standard" as const },
  { id: "3way", label: "3-way", slots: 3, teams: "1v1v1", api: "standard" as const },
  { id: "4way", label: "4-way", slots: 4, teams: "1v1v1v1", api: "standard" as const },
  { id: "6way", label: "6-way", slots: 6, teams: "1v1v1v1v1v1", api: "standard" as const },
];
const TEAM = [
  { id: "2v2", label: "2vs2", slots: 4, teams: "2v2 Team", api: "team" as const },
  { id: "2v2v2", label: "2vs2vs2", slots: 6, teams: "2v2v2 Team", api: "team" as const },
  { id: "3v3", label: "3vs3", slots: 6, teams: "3v3 Team", api: "team" as const },
];
const ALL = [...SINGLE, ...TEAM];

const FAQS = [
  {
    q: "What is a Case Battle?",
    a: "A Case Battle is a player-versus-player game where everyone opens the same set of cases at the same time. The drops are compared and, depending on the mode, the player or team with the highest (or lowest) total value wins the entire pot.",
  },
  {
    q: "How do I create a battle?",
    a: "Pick a battle type, choose how many players, add the cases you want to open, then press Create Battle. You’ll be taken into the lobby as soon as it is live.",
  },
  {
    q: "What player formats can I play?",
    a: "Play 1vs1, 3-way, 4-way or 6-way as a free-for-all, or team up in 2vs2, 2vs2vs2 and 3vs3.",
  },
  {
    q: "What game modes are available?",
    a: "Normal awards the highest total. Jackpot draws a winner from each player’s share of the pot. Group splits the winnings equally. Crazy inverts the ranking, and Terminal only counts the last case.",
  },
  {
    q: "What is Borrow mode?",
    a: "Borrow lets the host cover part of every seat. Joiners pay a reduced cost, and you pay the difference up front.",
  },
  {
    q: "What happens in a draw?",
    a: "If two or more sides finish with the same total, the pot is split between them.",
  },
  {
    q: "Are case battles provably fair?",
    a: "Yes. Each battle is tied to a hashed server seed and a public EOS block hash, so anyone can verify the rolls after the game ends.",
  },
];

function GhostBtn({
  children,
  href,
  onClick,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const cls = `inline-flex h-32 shrink-0 items-center justify-center gap-8 rounded-6 border border-white/10 bg-gradient-to-b from-white/5 to-white/10 px-12 text-12 font-medium text-white transition-colors hover:from-white/10 hover:to-white/20 ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

function Toggle({
  on,
  onClick,
  disabled,
}: {
  on: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onClick}
      className={`relative ml-auto inline-flex h-20 w-35 shrink-0 items-center rounded-full border px-2 transition-colors disabled:opacity-40 ${
        on ? "border-green bg-green" : "border-grey-58 bg-grey-28"
      }`}
    >
      <span className={`block size-14 rounded-full transition-transform ${on ? "translate-x-14 bg-white" : "translate-x-0 bg-grey-112"}`} />
    </button>
  );
}

function FormatChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-32 shrink-0 items-center rounded-6 border px-16 text-12 font-medium transition-colors ${
        active ? "border-green bg-green text-white" : "border-grey-58 bg-grey-28 text-grey-142 hover:bg-green/80 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

export default function CreateBattlePage() {
  const router = useRouter();
  const { user, openModal, applyUser, battlesCreate } = useStore();
  const [kind, setKind] = useState<"normal" | "jackpot" | "group">("normal");
  const [picked, setPicked] = useState<CaseItem[]>([]);
  const [boxIds, setBoxIds] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [crazy, setCrazy] = useState(false);
  const [terminal, setTerminal] = useState(false);
  const [priv, setPriv] = useState(false);
  const [fast, setFast] = useState(false);
  const [borrow, setBorrow] = useState(false);
  const [borrowPct, setBorrowPct] = useState(50);
  const [layoutId, setLayoutId] = useState("1v1");
  const [creating, setCreating] = useState(false);
  const [sort, setSort] = useState("manual");
  const layout = ALL.find((l) => l.id === layoutId) ?? ALL[0];
  const cost = picked.reduce((s, c) => s + c.price, 0);
  const funding = borrow ? Math.min(80, Math.max(0, borrowPct)) : 0;
  const creatorCost = cost + (cost * layout.slots * funding) / 100;

  useEffect(() => {
    return subscribeBattles((state) => {
      const next: Record<string, string> = {};
      for (const box of state.boxes) next[box.slug] = box._id;
      setBoxIds(next);
    });
  }, []);

  const sortedPicked = useMemo(() => {
    if (sort === "high") return [...picked].sort((a, b) => b.price - a.price);
    if (sort === "low") return [...picked].sort((a, b) => a.price - b.price);
    if (sort === "name") return [...picked].sort((a, b) => a.name.localeCompare(b.name));
    return picked;
  }, [picked, sort]);

  const create = async () => {
    if (!user) return openModal("login");
    if (!picked.length) return;
    if (user.balance < creatorCost) return openModal("deposit");
    setCreating(true);
    try {
      const boxes = picked.map((c) => {
        const id = boxIds[c.slug];
        if (!id) throw new Error(`Case ${c.name} is not seeded on the server.`);
        return { _id: id, count: 1 };
      });
      const mode = kind === "group" ? "group" : layout.api;
      const res = await battlesCreate({
        playerCount: layout.slots,
        mode,
        boxes,
        funding,
        private: priv,
        cursed: crazy,
        terminal,
        jackpot: kind === "jackpot",
        affiliateOnly: false,
        levelMin: 0,
      });
      if (res.user) applyUser(res.user);
      if (!res.game?._id) throw new Error("Battle was created but no game id was returned.");
      router.push(`/battles/${res.game._id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not create battle.");
    } finally {
      setCreating(false);
    }
  };

  const moveCase = (from: number, to: number) => {
    setSort("manual");
    setPicked((list) => {
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  return (
    <div className="w-full max-w-full">
      <div className="flex w-full flex-col gap-8">
        <div className="flex w-full items-center justify-between">
          <GhostBtn href="/battles">
            <Icons.chevronLeft className="text-12" />
            To All Battles
          </GhostBtn>
        </div>

        <div className="flex w-full flex-wrap gap-8">
          {(["normal", "jackpot", "group"] as const).map((id) => {
            const meta = MODE_META[id];
            const on = kind === id;
            const glow =
              id === "normal" ? "bg-battle-normal" : id === "jackpot" ? "bg-battle-jackpot" : "bg-battle-group";
            return (
              <button
                key={id}
                type="button"
                onClick={() => setKind(id)}
                className={`relative flex min-w-240 flex-1 cursor-pointer flex-col items-start overflow-hidden rounded-6 border bg-grey-39 p-8 text-left transition-colors md:p-16 ${
                  on
                    ? id === "jackpot"
                      ? "border-battle-jackpot/50 hover:border-battle-jackpot/70"
                      : id === "group"
                        ? "border-battle-group/50 hover:border-battle-group/70"
                        : "border-battle-normal/50 hover:border-battle-normal/70"
                    : id === "jackpot"
                      ? "border-transparent hover:border-battle-jackpot/70"
                      : id === "group"
                        ? "border-transparent hover:border-battle-group/70"
                        : "border-transparent hover:border-battle-normal/70"
                }`}
              >
                <div className={`absolute top-0 left-0 h-80 w-80 -translate-x-1/2 -translate-y-1/2 blur-2xl ${glow} ${on ? "opacity-100" : "opacity-0"}`} />
                <div className="relative z-1 mb-8 inline-flex items-start gap-8">
                  <ModeIcon kind={id} className="size-20" />
                  <span className="ui-label text-14 text-white md:text-16">{meta.title}</span>
                </div>
                <p className="relative z-1 hidden text-left text-12 text-grey-142 md:block">{meta.copy}</p>
              </button>
            );
          })}
        </div>

        <div className="flex w-full flex-col gap-8 md:flex-row">
          <div className="flex w-full flex-col gap-8 rounded-6 bg-grey-39 p-8 px-12 md:w-auto md:flex-row md:items-center md:gap-16">
            <div className="text-12 font-medium text-white">Single</div>
            <div className="flex items-center justify-start gap-8">
              {SINGLE.map((m) => (
                <FormatChip key={m.id} active={layoutId === m.id} label={m.label} onClick={() => setLayoutId(m.id)} />
              ))}
            </div>
          </div>
          <div className="flex w-full flex-col gap-8 rounded-6 bg-grey-39 p-8 px-12 md:w-auto md:flex-row md:items-center md:gap-16">
            <div className="text-12 font-medium text-white">Team</div>
            <div className="flex items-center justify-start gap-8">
              {TEAM.map((m) => (
                <FormatChip key={m.id} active={layoutId === m.id} label={m.label} onClick={() => setLayoutId(m.id)} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 rounded-12 bg-grey-39 p-12 md:flex-row md:flex-wrap md:items-center md:gap-12">
          <div className="flex flex-wrap gap-8">
            <label className="flex cursor-pointer items-center gap-8 rounded-6 bg-grey-28 px-16 py-8">
              <ModeIcon kind="crazy" className="size-16" />
              <span className="text-13 text-white">Crazy</span>
              <Toggle on={crazy} onClick={() => setCrazy((v) => !v)} />
            </label>
            <label className="flex cursor-pointer items-center gap-8 rounded-6 bg-grey-28 px-16 py-8">
              <ModeIcon kind="terminal" className="size-16" />
              <span className="text-13 text-white">Terminal</span>
              <Toggle on={terminal} onClick={() => setTerminal((v) => !v)} />
            </label>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-8">
            <button
              type="button"
              onClick={() => setBorrow((v) => !v)}
              className={`flex items-center gap-8 rounded-6 bg-grey-28 px-16 py-8 text-13 ${borrow ? "text-white" : "text-grey-142"}`}
            >
              Borrow{borrow ? ` ${funding}%` : ""}
            </button>
            <label className="flex cursor-pointer items-center gap-8 rounded-6 bg-grey-28 px-16 py-8">
              <Icons.lock className="text-16 text-grey-142" />
              <span className="text-13 text-white">Private Battle</span>
              <Toggle on={priv} onClick={() => setPriv((v) => !v)} />
            </label>
            <label className="flex cursor-pointer items-center gap-8 rounded-6 bg-grey-28 px-16 py-8">
              <Icons.bolt className="text-16 text-green" />
              <span className="text-13 text-white">Fast Mode</span>
              <Toggle on={fast} onClick={() => setFast((v) => !v)} />
            </label>
          </div>
          {borrow ? (
            <div className="w-full px-8">
              <input
                className="rs-range w-full"
                type="range"
                min={0}
                max={80}
                step={1}
                value={Math.min(80, borrowPct)}
                onChange={(e) => setBorrowPct(Math.min(80, Number(e.target.value)))}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-16 flex min-h-[70vh] flex-col md:mt-24">
        <div className="flex items-center justify-start gap-8">
          <div className="mr-auto flex items-center gap-8">
            <div className="flex size-32 shrink-0 items-center justify-center rounded-6 bg-green/15 text-green">
              <Icons.cases className="text-12" />
            </div>
            <div className="flex min-w-0 flex-col gap-2">
              <h2 className="ui-label text-16 text-white">Cases</h2>
              <span className="text-12 text-grey-142">Drag to reorder, sort and arrange your selected cases</span>
            </div>
          </div>
          <GhostBtn onClick={() => setPicked([])}>
            <svg viewBox="0 0 16 16" className="h-14 w-14 fill-current" aria-hidden>
              <path d="M6.5 1.5h3l.5 1H14v1H2v-1h4l.5-1ZM3.5 5h9l-.6 8.2A1.5 1.5 0 0 1 10.4 14.5H5.6a1.5 1.5 0 0 1-1.5-1.3L3.5 5Z" />
            </svg>
            Clear
          </GhostBtn>
          <div className="w-148">
            <Dropdown
              value={sort}
              size="sm"
              onChange={setSort}
              options={[
                { id: "manual", label: "Sort Cases" },
                { id: "high", label: "Price High-Low" },
                { id: "low", label: "Price Low-High" },
                { id: "name", label: "Name A-Z" },
              ]}
            />
          </div>
        </div>

        <div className="relative mt-16 md:mt-24">
          <div className="grid grid-cols-2 gap-12 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {sortedPicked.map((c, i) => (
              <div
                key={`${c.slug}-${i}`}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", String(i))}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  moveCase(Number(e.dataTransfer.getData("text/plain")), i);
                }}
                className="group relative flex aspect-[200/280] cursor-grab flex-col items-center justify-center gap-8 overflow-hidden rounded-8 bg-grey-39 p-12 transition hover:bg-grey-47"
              >
                <img alt="" src={caseImage(c)} className="h-120 w-120 object-contain transition-transform duration-300 group-hover:scale-110" />
                <p className="truncate text-center text-13 text-grey-142">{c.name}</p>
                <Bux value={c.price} size="sm" />
                <button
                  type="button"
                  aria-label="remove"
                  onClick={() => setPicked((p) => p.filter((_, j) => j !== i))}
                  className="absolute right-8 top-8 hidden h-24 w-24 items-center justify-center rounded-4 bg-grey-28 text-grey-142 group-hover:flex hover:text-white"
                >
                  <Icons.close className="h-14 w-14" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="group relative flex aspect-[200/280] flex-col items-center justify-center gap-8 overflow-hidden rounded-8 bg-grey-39 transition hover:bg-grey-47"
            >
              <div className="pointer-events-none absolute top-0 left-1/2 h-120 w-120 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green/10 blur-2xl" />
              <div className="flex h-48 w-48 items-center justify-center rounded-full border-2 border-grey-58">
                <Icons.plus className="text-28 text-grey-142 group-hover:text-white" />
              </div>
              <p className="text-13 text-grey-142">Add Case</p>
            </button>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center gap-16 rounded-8 bg-grey-39 p-12">
          <div className="text-13 text-grey-142">
            Cases <span className="text-white">{picked.length}</span>
          </div>
          <div className="flex items-center gap-8">
            <span className="text-13 text-grey-142">Battle Cost</span>
            <Bux value={creatorCost} />
          </div>
          <GreenButton className="ml-auto" size="sm" disabled={!picked.length || creating} onClick={create} icon={<Icons.plus className="text-14" />}>
            {creating ? "Creating..." : "Create Battle"}
          </GreenButton>
        </div>
      </div>

      <GotQuestions items={FAQS} subtitle="Find answers to the most common questions about battles" className="mt-40 w-full" />

      {adding ? (
        <AddCaseModal
          onClose={() => setAdding(false)}
          onAdd={(item) => {
            setSort("manual");
            setPicked((p) => [...p, item]);
          }}
        />
      ) : null}
    </div>
  );
}
