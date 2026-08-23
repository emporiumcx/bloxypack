"use client";

import { useEffect, useState } from "react";
import { playSfx } from "@/lib/sfx";

export type ToastTone = "error" | "success" | "info";

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

const listeners = new Set<(items: ToastItem[]) => void>();
let items: ToastItem[] = [];
let seq = 1;

function emit() {
  listeners.forEach((fn) => fn(items));
}

export function dismissToast(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

export function notify(message: string, tone: ToastTone = "error") {
  const text = String(message || "").trim();
  if (!text) return;
  const id = seq++;
  items = [...items.slice(-4), { id, message: text, tone }];
  emit();
  playSfx(tone === "success" ? "notice" : "notice_error");
  window.setTimeout(() => dismissToast(id), 4800);
}

export function notifyError(err: unknown, fallback: string) {
  notify(err instanceof Error ? err.message : fallback, "error");
}

export function Toasts() {
  const [list, setList] = useState<ToastItem[]>(items);

  useEffect(() => {
    listeners.add(setList);
    setList(items);
    return () => {
      listeners.delete(setList);
    };
  }, []);

  if (!list.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-24 right-16 z-[80] flex w-[min(calc(100%-32px),360px)] flex-col gap-8 sm:bottom-80">
      {list.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-10 rounded-8 border px-12 py-12 shadow-[0_12px_40px_rgba(0,0,0,0.45)] animate-toast-in ${
            t.tone === "error"
              ? "border-red/40 bg-grey-39"
              : t.tone === "success"
                ? "border-green/40 bg-grey-39"
                : "border-grey-58 bg-grey-39"
          }`}
        >
          <span
            className={`mt-4 size-8 shrink-0 rounded-full ${
              t.tone === "error" ? "bg-red" : t.tone === "success" ? "bg-green" : "bg-[#5b8cff]"
            }`}
          />
          <p className="min-w-0 flex-1 text-13 leading-snug text-white">{t.message}</p>
          <button
            type="button"
            aria-label="Dismiss"
            className="shrink-0 text-12 text-grey-142 hover:text-white"
            onClick={() => dismissToast(t.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
