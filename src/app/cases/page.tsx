"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bux } from "@/components/bux";
import { ChoiceBar } from "@/components/bet-field";
import { Dropdown } from "@/components/dropdown";
import { Icons } from "@/components/icons";
import { ItemBg } from "@/components/item-bg";
import { CASES } from "@/lib/catalog";

export default function CasesPage() {
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState("all");
  const [sort, setSort] = useState("high");

  const list = useMemo(() => {
    return CASES.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (risk !== "all" && c.risk !== risk) return false;
      return true;
    }).sort((a, b) => (sort === "high" ? b.price - a.price : a.price - b.price));
  }, [q, risk, sort]);

  return (
    <div className="@xl/page:gap-32 @bt/page:gap-24 grid w-full grid-cols-1 gap-16">
      <div className="grid w-full grid-cols-1 gap-16">
        <h1 className="@sm/page:text-20 @md/page:text-24 w-full text-18 font-bold leading-[125%] text-white">Cases</h1>
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
                { id: "high", label: "High Risk" },
                { id: "low", label: "Low Risk" },
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
          <Link
            key={item.slug}
            href={`/cases/${item.slug}`}
            className="@sm/page:rounded-12 group relative w-full overflow-hidden rounded-8 bg-grey-39 p-16 transition-transform duration-300 hover:-translate-y-4 hover:scale-[1.02] active:-translate-y-4 active:scale-[1.02] animate-show"
            style={{ animationDelay: `${(i % 20) * 20}ms` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-grey-39" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-green/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-active:opacity-100" />
            <div className="relative grid w-full grid-cols-1 gap-16">
              <div className="relative flex w-full pt-[81%]">
                <ItemBg className="inset-[8%] opacity-40" />
                <img
                  className="absolute inset-0 w-full scale-100 object-contain transition-transform duration-300 group-hover:rotate-[5deg] group-hover:scale-[1.1] group-active:rotate-[5deg] group-active:scale-[1.1]"
                  alt=""
                  src={`/cdn/cases/${item.imageId}.webp`}
                />
              </div>
              <div className="grid w-full grid-cols-1 gap-8">
                <p className="truncate text-center text-14 text-grey-190">{item.name}</p>
                <div className="flex w-full justify-center">
                  <Bux value={item.price} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
