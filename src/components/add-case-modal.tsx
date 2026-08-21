"use client";

import { useMemo, useState } from "react";
import { ChoiceBar } from "./bet-field";
import { Dropdown } from "./dropdown";
import { Icons } from "./icons";
import { CASES, caseVolatility, type CaseItem } from "@/lib/catalog";
import { CaseCard } from "@/components/case-card";

const MODAL_EXIT_MS = 220;

export function AddCaseModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (item: CaseItem) => void;
}) {
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState("all");
  const [sort, setSort] = useState("high");
  const [leaving, setLeaving] = useState(false);

  const list = useMemo(() => {
    return CASES.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (risk !== "all" && caseVolatility(c.slug).label.toLowerCase() !== risk) return false;
      return true;
    }).sort((a, b) => (sort === "high" ? b.price - a.price : a.price - b.price));
  }, [q, risk, sort]);

  const requestClose = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(onClose, MODAL_EXIT_MS);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-12 sm:p-24 ${leaving ? "pointer-events-none" : ""}`}>
      <button type="button" aria-label="close overlay" className={`${leaving ? "animate-overlay-out" : "animate-overlay-in"} absolute inset-0 bg-black/70`} onClick={leaving ? undefined : requestClose} />
      <div className={`relative z-10 flex h-[min(860px,calc(100vh-48px))] w-full max-w-[1100px] ${leaving ? "animate-modal-out" : "animate-modal-in"} flex-col overflow-hidden rounded-12 bg-grey-34 shadow-[0_24px_80px_rgba(0,0,0,0.55)]`}>
        <div className="flex items-center justify-between border-b-1 border-grey-47 px-16 py-14 sm:px-24">
          <div>
            <p className="text-18 font-bold text-white sm:text-20">Add case</p>
            <p className="mt-4 text-13 text-grey-142">{list.length} cases</p>
          </div>
          <button
            type="button"
            aria-label="close"
            onClick={requestClose}
            className="flex h-36 w-36 items-center justify-center rounded-8 bg-grey-28 text-grey-142 hover:bg-grey-47 hover:text-white"
          >
            <Icons.close className="text-18" />
          </button>
        </div>

        <div className="grid shrink-0 grid-cols-1 gap-10 border-b-1 border-grey-47 px-16 py-14 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-24">
          <div className="relative flex h-40 w-full items-center rounded-8 border-2 border-transparent bg-grey-28 px-12">
            <Icons.search className="mr-2 text-20 text-grey-142" />
            <input
              autoComplete="off"
              className="h-full w-full bg-transparent px-8 text-14 text-white outline-none placeholder:text-grey-112"
              placeholder="Search by case name"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <ChoiceBar
            value={risk}
            onChange={setRisk}
            options={[
              { id: "all", label: "All" },
              { id: "low", label: "Low" },
              { id: "medium", label: "Medium" },
              { id: "high", label: "High" },
            ]}
          />
          <Dropdown
            value={sort}
            onChange={setSort}
            prefix="Sort by:"
            tone="58"
            className="w-full sm:w-[220px]"
            options={[
              { id: "high", label: "Price High-Low" },
              { id: "low", label: "Price Low-High" },
            ]}
          />
        </div>

        <div className="scrollbar-y min-h-0 flex-1 overflow-y-auto bg-grey-28 p-12 sm:p-16">
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {list.map((item, i) => (
              <CaseCard
                key={item.slug}
                item={item}
                index={i}
                onSelect={() => onAdd(item)}
                footer={
                  <div className="flex h-32 items-center justify-center rounded-6 bg-gradient-to-b from-green to-green-2">
                    <span className="ui-btn-label text-12 text-grey-190">Add case</span>
                  </div>
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
