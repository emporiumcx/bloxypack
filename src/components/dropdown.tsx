"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icons } from "./icons";

export const DROP_EXIT_MS = 220;

export function useDrop() {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef(0);
  const shown = open || leaving;

  function close() {
    if (!open || leaving) return;
    setLeaving(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setOpen(false);
      setLeaving(false);
    }, DROP_EXIT_MS);
  }

  function toggle() {
    if (open && !leaving) return close();
    window.clearTimeout(timer.current);
    setLeaving(false);
    setOpen(true);
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { open, leaving, shown, close, toggle };
}

export function DropPanel({
  shown,
  leaving,
  className = "",
  children,
}: {
  shown: boolean;
  leaving: boolean;
  className?: string;
  children: ReactNode;
}) {
  if (!shown) return null;
  return (
    <div
      className={`z-50 origin-top rounded-8 border border-grey-58 bg-grey-28 p-6 shadow-[0_16px_40px_rgba(0,0,0,0.45)] ${
        leaving ? "pointer-events-none animate-close-y" : "animate-open-y"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Dropdown({
  value,
  options,
  onChange,
  className = "",
  prefix,
  tone = "39",
  size = "md",
}: {
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
  className?: string;
  prefix?: string;
  tone?: "39" | "58";
  size?: "sm" | "md";
}) {
  const { open, leaving, shown, close, toggle } = useDrop();
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.id === value)?.label ?? options[0]?.label;
  const compact = size === "sm";
  const surface = compact
    ? "border-grey-58 bg-grey-39"
    : tone === "58"
      ? "bg-grey-58 border-grey-58"
      : "bg-grey-39 border-grey-39";

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, leaving]);

  return (
    <div ref={ref} className={`relative w-full ${className}`}>
      <button
        type="button"
        aria-label="dropdown"
        aria-expanded={open && !leaving}
        onClick={toggle}
        className={`group/dropdown relative flex w-full items-start ${compact ? "h-35 rounded-6" : `h-40 rounded-8 ${tone === "58" ? "bg-grey-58" : "bg-grey-39"}`}`}
      >
        <div className={`tr relative grid h-full w-full grid-cols-[1fr_auto] items-center gap-8 ${compact ? "rounded-6 border px-12" : "rounded-8 border-2 px-14 group-hover/dropdown:border-grey-47 group-hover/dropdown:bg-grey-47"} ${surface}`}>
          <div className="flex min-w-0 items-center">
            {prefix ? (
              <div className="mr-6">
                <span className="text-14 text-grey-142">{prefix}</span>
              </div>
            ) : null}
            <p className={`truncate ${compact ? "text-[13.125px] leading-[15.3125px] text-white" : "text-14 text-white"}`}>{current}</p>
          </div>
          <div className={`flex items-center justify-center ${compact ? "" : "h-16 w-18 rounded-8 bg-grey-58"}`}>
            <Icons.chevron className={`text-grey-142 transition-transform duration-200 ${compact ? "text-14" : "text-18"} ${open && !leaving ? "rotate-180" : ""}`} />
          </div>
        </div>
      </button>
      {shown ? (
        <div
          className={`scrollbar-y @container absolute z-50 w-full origin-top rounded-8 bg-grey-28 p-8 ${compact ? "top-39" : "top-46"} ${
            leaving ? "pointer-events-none animate-close-y" : "animate-open-y"
          }`}
        >
          <div className="grid max-h-[300px] w-full grid-cols-1 gap-6 overflow-y-scroll pt-3">
            {options.map((o, i) => (
              <div
                key={o.id}
                className="@lg/page:w-auto group grid h-36 w-full grid-cols-1 overflow-hidden rounded-5 bg-grey-28"
                style={leaving ? undefined : { animation: "open-y 0.28s cubic-bezier(0.22, 1, 0.36, 1) both", animationDelay: `${i * 28}ms` }}
              >
                <button
                  type="button"
                  aria-label="toggle"
                  onClick={() => {
                    onChange(o.id);
                    close();
                  }}
                  className={`tr @lg/page:justify-center @lg/page:gap-8 relative flex h-full w-full items-center justify-start gap-6 px-12 transition-colors duration-200 ${
                    value === o.id ? "bg-green" : "bg-grey-58 hover:bg-grey-70"
                  }`}
                >
                  <p
                    className={`w-full truncate overflow-ellipsis text-center transition-colors duration-200 ${
                      compact ? "text-[13.125px] leading-[15.3125px]" : "text-14 font-bold capitalize"
                    } ${value === o.id ? "text-grey-28" : "text-white"}`}
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
        className={`group/button relative flex h-36 cursor-pointer items-start justify-center rounded-8 border-1 opacity-100 transition-all duration-200 ${
          value === "manual"
            ? "border-transparent bg-grey-58 hover:bg-grey-70 active:bg-grey-70"
            : "border-grey-58 bg-grey-28"
        }`}
      >
        <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-16">
          <p className={`ui-btn-label text-13 transition-all duration-300 ${value === "manual" ? "text-white" : "text-grey-142"}`}>Manual</p>
        </div>
      </button>
      <button
        type="button"
        aria-label="button"
        onClick={() => onChange?.("auto")}
        className={`group/button relative flex h-36 cursor-pointer items-start justify-center rounded-8 border-1 opacity-100 transition-all duration-200 ${
          value === "auto"
            ? "border-transparent bg-grey-58 hover:bg-grey-70 active:bg-grey-70"
            : "border-grey-58 bg-grey-28"
        }`}
      >
        <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-16">
          <p className={`ui-btn-label text-13 transition-all duration-300 ${value === "auto" ? "text-white" : "text-grey-142"}`}>Autobet</p>
        </div>
      </button>
    </div>
  );
}
