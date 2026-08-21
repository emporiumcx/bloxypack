"use client";

import { useMemo, useState } from "react";
import { CaseCard } from "@/components/case-card";
import { ChoiceBar } from "@/components/bet-field";
import { Dropdown } from "@/components/dropdown";
import { FairnessControl } from "@/components/fairness";
import { Icons } from "@/components/icons";
import { CASES, caseVolatility } from "@/lib/catalog";

export default function CasesPage() {
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState("all");
  const [sort, setSort] = useState("high");

  const list = useMemo(() => {
    return CASES.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (risk !== "all" && caseVolatility(c.slug).label.toLowerCase() !== risk) return false;
      return true;
    }).sort((a, b) => (sort === "high" ? b.price - a.price : a.price - b.price));
  }, [q, risk, sort]);

  return (
    <div className="@xl/page:gap-32 @bt/page:gap-24 grid w-full grid-cols-1 gap-16">
      <div className="grid w-full grid-cols-1 gap-16">
        <div className="flex w-full items-center justify-between gap-12">
          <h1 className="@sm/page:text-20 @md/page:text-24 text-18 font-bold leading-[125%] text-white">Cases</h1>
          <FairnessControl game="Cases" userSeeds />
        </div>
        <div className="@lg/page:grid-cols-[auto_1fr_auto] @sm/page:grid-cols-[1fr_auto] @sm/page:gap-16 grid w-full grid-cols-1 items-center gap-10">
          <div className="@lg/page:col-span-1 @lg/page:w-[300px] @sm/page:col-span-2 col-span-1 w-full">
            <div className="relative flex h-40 w-full items-center rounded-8 border-2 border-transparent bg-grey-39 px-12 py-4">
              <Icons.search className="mr-2 text-20 text-grey-142" />
              <input
                autoComplete="off"
                className="flex h-full w-full items-center bg-grey-39 px-10 text-14 text-white outline-none placeholder:text-grey-112"
                placeholder="Search by case name"
                type="text"
                value={q}
                name="search"
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
          <div className="@sm/page:flex w-full">
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
          </div>
          <Dropdown
            value={sort}
            onChange={setSort}
            className="w-full"
            prefix="Sort by:"
            tone="58"
            options={[
              { id: "high", label: "Price High-Low" },
              { id: "low", label: "Price Low-High" },
            ]}
          />
        </div>
      </div>

      <div className="@sm/page:grid-cols-3 @md/page:grid-cols-4 @bt/page:grid-cols-5 @lg/page:grid-cols-6 @xl/page:grid-cols-7 grid w-full grid-cols-2 gap-10">
        {list.map((item, i) => (
          <CaseCard key={item.slug} item={item} index={i} href={`/cases/${item.slug}`} />
        ))}
      </div>
    </div>
  );
}
