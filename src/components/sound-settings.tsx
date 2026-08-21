"use client";

import { useEffect, useRef, useState } from "react";
import { Icons } from "./icons";
import { getSfxVolume, preloadSfx, previewSfxVolume, subscribeSfxVolume } from "@/lib/sfx";

const EXIT_MS = 220;

export function SoundSettings() {
  const [volume, setVolume] = useState(50);
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef(0);
  const on = volume > 0;
  const shown = open || leaving;

  useEffect(() => {
    setVolume(getSfxVolume());
    preloadSfx();
    return subscribeSfxVolume(setVolume);
  }, []);

  function close() {
    if (!open || leaving) return;
    setLeaving(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setOpen(false);
      setLeaving(false);
    }, EXIT_MS);
  }

  function toggle() {
    if (open && !leaving) return close();
    window.clearTimeout(timer.current);
    setLeaving(false);
    setOpen(true);
  }

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, leaving]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Sound settings"
        aria-expanded={open && !leaving}
        onClick={toggle}
        className={`flex h-32 w-32 items-center justify-center rounded-6 ${
          on ? "bg-gradient-to-b from-green to-green-2 text-white" : "text-icons-secondary hover:bg-grey-47 hover:text-white"
        }`}
      >
        <Icons.volume className="text-14" />
      </button>
      {shown ? (
        <div
          className={`absolute left-0 top-[calc(100%+8px)] z-50 w-240 rounded-8 border border-grey-58 bg-grey-28 p-8 shadow-[0_16px_40px_rgba(0,0,0,0.45)] ${
            leaving ? "pointer-events-none animate-close-y" : "animate-open-y"
          }`}
        >
          <div className="flex flex-col gap-8 rounded-6 border border-grey-58 bg-grey-39 p-8">
            <div className="flex items-center justify-between text-12 text-white">
              <span>Volume</span>
              <span>{volume}</span>
            </div>
            <input
              className="rs-range w-full"
              type="range"
              min={0}
              max={100}
              step={1}
              value={volume}
              aria-label="Volume"
              style={{
                background: `linear-gradient(to right, var(--color-green) ${volume}%, var(--color-grey-28) ${volume}%)`,
              }}
              onChange={(e) => previewSfxVolume(Number(e.target.value))}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
