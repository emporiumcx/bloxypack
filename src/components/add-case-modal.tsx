"use client";

import { useMemo, useState } from "react";
import { Bux } from "./bux";
import { ChoiceBar } from "./bet-field";
import { Dropdown } from "./dropdown";
import { GreenButton } from "./green-button";
import { Icons } from "./icons";
import { CASES, type CaseItem } from "@/lib/catalog";

export function AddCaseModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (item: CaseItem) => void;
}) {
  const [risk, setRisk] = useState("all");
  const [sort, setSort] = useState("high");

  const list = useMemo(() => {
    return CASES.filter((c) => (risk === "all" ? true : c.risk === risk)).sort((a, b) =>
      sort === "high" ? b.price - a.price : a.price - b.price,
    );
  }, [risk, sort]);

  return (
    <div className="fixed inset-0 z-50 flex w-full min-w-[330px] items-center overflow-hidden p-10 sm:p-20 md:p-24 lg:p-30">
      <button type="button" aria-label="close overlay" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative flex max-h-full w-full overflow-y-auto rounded-4 sm:rounded-4">
        <div className="animate-open relative left-1/2 top-0 bottom-0 w-full max-w-[800px] -translate-x-1/2 xs:w-auto">
          <div className="relative z-50 grid !max-w-full rounded-8 bg-grey-39 @sm/page:rounded-12">
            <div className="bg-purple-46 relative flex h-full w-full flex-col overflow-y-auto rounded-8 @sm/page:h-auto @sm/page:rounded-12">
              <div className="grid w-full grid-cols-1 gap-16 p-16 sm:gap-24 sm:p-24">
                <div className="grid w-full grid-cols-1 items-center gap-10 @sm/page:grid-cols-[1fr_auto]">
                  <ChoiceBar
                    value={risk}
                    onChange={setRisk}
                    options={[
                      { id: "all", label: "All" },
                      { id: "high", label: "High Risk" },
                      { id: "low", label: "Low Risk" },
                    ]}
                  />
                  <Dropdown
                    value={sort}
                    onChange={setSort}
                    prefix="Sort by:"
                    tone="58"
                    className="w-full @sm/page:w-[220px]"
                    options={[
                      { id: "high", label: "Price High-Low" },
                      { id: "low", label: "Price Low-High" },
                    ]}
                  />
                </div>
                <div className="scrollbar-y grid max-h-[408px] w-full grid-cols-2 gap-10 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
                  {list.map((item, i) => (
                    <div
                      key={item.slug}
                      className="@sm/page:rounded-12 group relative w-full overflow-hidden rounded-8 bg-grey-39 p-16 animate-show"
                      style={{ animationDelay: `${(i % 16) * 20}ms` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-grey-39" />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-green/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-active:opacity-100" />
                      <div className="relative grid w-full grid-cols-1 gap-12">
                        <div className="relative flex w-full pt-[81%]">
                          <img
                            className="absolute inset-0 w-full scale-100 object-contain transition-transform duration-300 group-hover:rotate-[5deg] group-hover:scale-[1.1] group-active:rotate-[5deg] group-active:scale-[1.1]"
                            alt=""
                            src={item.image ?? `/cdn/cases/${item.imageId}.webp`}
                          />
                        </div>
                        <p className="truncate text-center text-14 text-grey-190">{item.name}</p>
                        <div className="flex w-full justify-center">
                          <Bux value={item.price} />
                        </div>
                        <GreenButton size="sm" onClick={() => onAdd(item)}>
                          Add case
                        </GreenButton>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  aria-label="close"
                  onClick={onClose}
                  className="absolute right-16 top-16 flex h-32 w-32 items-center justify-center rounded-6 bg-grey-28 text-grey-142 hover:text-white"
                >
                  <Icons.close className="text-18" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
