"use client";

import { useEffect, useRef, useState } from "react";
import { Icons } from "./icons";

export function Dropdown({
  value,
  options,
  onChange,
  className = "",
  prefix,
  tone = "39",
}: {
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
  className?: string;
  prefix?: string;
  tone?: "39" | "58";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.id === value)?.label ?? options[0]?.label;
  const surface = tone === "58" ? "bg-grey-58 border-grey-58" : "bg-grey-39 border-grey-39";

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className={`relative w-full ${className}`}>
      <button
        type="button"
        aria-label="dropdown"
        onClick={() => setOpen((v) => !v)}
        className={`group/dropdown relative flex h-40 w-full items-start rounded-8 ${tone === "58" ? "bg-grey-58" : "bg-grey-39"}`}
      >
        <div className={`tr group-hover/dropdown:border-grey-47 group-hover/dropdown:bg-purple-80 relative grid h-full w-full grid-cols-[1fr_auto] items-center gap-8 rounded-8 border-2 px-14 ${surface}`}>
          <div className="flex items-center">
            {prefix ? (
              <div className="mr-6">
                <span className="text-14 text-grey-142">{prefix}</span>
              </div>
            ) : null}
            <p className="text-14 text-white">{current}</p>
          </div>
          <div className="bg-purple-96 flex h-16 w-18 items-center justify-center rounded-8">
            <Icons.chevron className={`tr text-18 text-grey-142 ${open ? "rotate-180" : ""}`} />
          </div>
        </div>
      </button>
      {open ? (
        <div className="scrollbar-y @container absolute top-46 z-30 w-full rounded-8 bg-grey-28 p-8">
          <div className="grid max-h-[300px] w-full grid-cols-1 gap-6 overflow-y-scroll pt-3">
            {options.map((o) => (
              <div key={o.id} className="@lg/page:w-auto group grid h-36 w-full grid-cols-1 overflow-hidden rounded-5 bg-grey-28">
                <button
                  type="button"
                  aria-label="toggle"
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                  }}
                  className={`tr @lg/page:justify-center @lg/page:gap-8 relative flex h-full w-full items-center justify-start gap-6 px-12 transition-colors ${
                    value === o.id ? "bg-green" : "bg-grey-58"
                  }`}
                >
                  <p
                    className={`w-full truncate overflow-ellipsis text-center text-14 font-bold capitalize transition-colors duration-200 ${
                      value === o.id ? "text-grey-28" : "text-white"
                    }`}
                  >
                    {o.label}
                  </p>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ModeTabs({
  value = "manual",
  onChange,
}: {
  value?: "manual" | "auto";
  onChange?: (id: "manual" | "auto") => void;
}) {
  return (
    <div className="grid w-full grid-cols-2 items-center gap-8">
      <button
        type="button"
        aria-label="button"
        onClick={() => onChange?.("manual")}
        className={`group/button relative flex h-40 cursor-pointer items-start justify-center rounded-6 border-1 opacity-100 transition-all duration-200 ${
          value === "manual"
            ? "border-transparent bg-grey-58 hover:bg-grey-70 active:bg-grey-70"
            : "border-grey-58 bg-grey-28"
        }`}
      >
        <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-16">
          <p className={`transition-all duration-300 text-14 ${value === "manual" ? "text-white" : "text-grey-142"}`}>Manual</p>
        </div>
      </button>
      <button
        type="button"
        aria-label="button"
        onClick={() => onChange?.("auto")}
        className={`group/button relative flex h-40 cursor-pointer items-start justify-center rounded-6 border-1 opacity-100 transition-all duration-200 ${
          value === "auto"
            ? "border-transparent bg-grey-58 hover:bg-grey-70 active:bg-grey-70"
            : "border-grey-58 bg-grey-28"
        }`}
      >
        <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-16">
          <p className={`transition-all duration-300 text-14 ${value === "auto" ? "text-white" : "text-grey-142"}`}>Autobet</p>
        </div>
      </button>
    </div>
  );
}
