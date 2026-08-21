"use client";

import Link from "next/link";
import { Bux } from "./bux";
import { TICKER } from "@/lib/catalog";

function splitName(name: string) {
  const pipe = name.split(" | ");
  if (pipe.length > 1) return { head: pipe[0], rest: pipe.slice(1).join(" | ") };
  const colon = name.split(": ");
  if (colon.length > 1) return { head: colon[0], rest: colon.slice(1).join(": ") };
  const parts = name.split(" ");
  if (parts.length > 2) return { head: parts.slice(0, 2).join(" "), rest: parts.slice(2).join(" ") };
  return { head: name, rest: "" };
}

export function LiveDrops() {
  return (
    <section aria-label="Live drops feed" className="flex items-center gap-8">
      <div className="flex h-56 w-28 shrink-0 items-center justify-center">
        <div className="flex -rotate-90 items-center gap-6 rounded-4 bg-[#0aff7c]/10 px-10 py-4 backdrop-blur-xl">
          <span className="relative flex h-8 w-8 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0aff7c]/60" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-[#0aff7c]" />
          </span>
          <span className="text-10 font-bold uppercase tracking-wide text-[#0aff7c]">Live</span>
        </div>
      </div>
      <div className="relative min-w-0 flex-1">
        <ul className="no-scrollbar flex items-center gap-8 overflow-x-auto">
          {TICKER.map((item, i) => {
            const { head, rest } = splitName(item.name);
            return (
              <li key={`${item.id}-${i}`} className="h-56 w-192 shrink-0 animate-live-drop-in" style={{ animationDelay: `${i * 40}ms` }}>
                <Link
                  href="/cases"
                  className="relative flex h-full w-full items-center gap-12 overflow-hidden rounded-8 bg-grey-39 py-6 pr-12 pl-6 transition-[filter] hover:brightness-125"
                >
                  <span className="absolute top-1/2 left-0 h-28 w-2 -translate-y-1/2 rounded-r-4" style={{ background: item.glow }} />
                  <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
                    <span className="absolute inset-0 rounded-full opacity-40 blur-[16px]" style={{ background: item.glow }} />
                    <img
                      alt=""
                      width={36}
                      height={36}
                      className="relative h-36 w-36 object-contain"
                      src={`https://cdn.rostake.com/items_centered/${item.id}.webp`}
                      onError={(e) => {
                        e.currentTarget.src = `/cdn/items/${item.id}.webp`;
                      }}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-4">
                    <div className="flex min-w-0 items-center gap-4 text-12">
                      <span className="shrink-0 text-white">{head}</span>
                      {rest ? (
                        <>
                          <span className="shrink-0 text-grey-142">|</span>
                          <span className="truncate text-grey-142">{rest}</span>
                        </>
                      ) : null}
                    </div>
                    <Bux value={item.value} size="xs" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
