"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icons } from "@/components/icons";
import { getUserSeed, type UserSeedInfo } from "@/lib/backend";

export type FairField = {
  label: string;
  value?: string | number | null;
  placeholder?: string;
};

const EXIT_MS = 220;

export function FairnessButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-40 shrink-0 items-center justify-center gap-6 rounded-8 bg-[#202D57] px-10 text-[#8BA4FF] transition-colors hover:bg-[#2D3D73] sm:px-12"
    >
      <Icons.scale className="text-16" />
      <span className="ui-btn-label text-13">Fairness</span>
    </button>
  );
}

function CopyField({ label, value, placeholder }: FairField) {
  const text = value != null && String(value).length ? String(value) : "";
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="grid gap-6">
      <p className="ui-label text-11 text-grey-142">{label}</p>
      <div className="flex min-h-44 items-center gap-8 rounded-8 bg-grey-28 px-12 py-8">
        <p className={`min-w-0 flex-1 break-all text-13 ${text ? "text-white" : "text-grey-112"}`}>
          {text || placeholder || "—"}
        </p>
        <button
          type="button"
          aria-label="copy"
          disabled={!text}
          onClick={copy}
          className="flex h-28 w-28 shrink-0 items-center justify-center rounded-6 text-grey-142 transition-colors hover:bg-grey-39 hover:text-white disabled:opacity-30"
        >
          {copied ? <Icons.check className="text-16 text-green" /> : <Icons.copy className="text-16" />}
        </button>
      </div>
    </div>
  );
}

function FairnessModal({
  game,
  fields,
  onClose,
  leaving,
}: {
  game: string;
  fields: FairField[];
  onClose: () => void;
  leaving: boolean;
}) {
  const [help, setHelp] = useState(true);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const overlay = (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-16 ${leaving ? "pointer-events-none" : ""}`}>
      <button
        type="button"
        aria-label="close overlay"
        className={`${leaving ? "animate-overlay-out" : "animate-overlay-in"} absolute inset-0 bg-black/60 backdrop-blur-sm`}
        onClick={leaving ? undefined : onClose}
      />
      <div
        className={`relative z-10 flex w-full max-w-[560px] flex-col overflow-hidden rounded-16 bg-grey-34 shadow-[0_24px_80px_rgba(0,0,0,0.55)] ${
          leaving ? "animate-modal-out" : "animate-modal-in"
        }`}
      >
        <div className="flex items-center justify-between gap-12 px-20 pt-20 sm:px-24 sm:pt-24">
          <div className="flex min-w-0 items-center gap-10">
            <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-8 bg-[#202D57] text-[#8BA4FF]">
              <Icons.scale className="text-18" />
            </div>
            <h2 className="truncate text-16 font-semibold uppercase tracking-wide text-white">
              {game} Provably Fair
            </h2>
          </div>
          <button type="button" aria-label="close" onClick={onClose} className="flex h-28 w-28 items-center justify-center text-grey-142 hover:text-white">
            <Icons.close className="text-20" />
          </button>
        </div>
        <div className="grid max-h-[calc(100vh-120px)] gap-16 overflow-y-auto p-20 sm:p-24">
          {fields.map((field) => (
            <CopyField key={field.label} {...field} />
          ))}
          <div className="overflow-hidden rounded-12 bg-grey-28">
            <button
              type="button"
              onClick={() => setHelp((v) => !v)}
              className="flex h-44 w-full items-center justify-between px-14 text-left"
            >
              <span className="text-13 font-medium text-white">What is Provably Fairness?</span>
              <Icons.chevron className={`text-18 text-grey-142 transition-transform ${help ? "rotate-180" : ""}`} />
            </button>
            {help ? (
              <div className="grid gap-10 px-14 pb-14 text-13 leading-6 text-grey-142">
                <p>
                  Before a round, the house commits to a hidden server seed and shows you its SHA-256 hash. Your public
                  or client seed is mixed in with HMAC-SHA256 so the result cannot be changed after you bet.
                </p>
                <p>
                  After the round the server seed is revealed. Hash it yourself and recompute the outcome to verify the
                  game.
                </p>
                <Link href="/fairness" className="text-[#8BA4FF] hover:underline" onClick={onClose}>
                  Read the full fairness docs
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return overlay;
  return createPortal(overlay, document.body);
}

function userFields(seed?: UserSeedInfo | null): FairField[] {
  return [
    { label: "Server Seed", value: seed?.seedServer, placeholder: "Revealed after you rotate your seed pair" },
    { label: "Server Seed (Hashed)", value: seed?.hash, placeholder: "Sign in to view your seeds" },
    { label: "Client Seed", value: seed?.seedClient, placeholder: "Sign in to view your seeds" },
    { label: "Nonce", value: seed?.nonce != null ? String(seed.nonce) : undefined, placeholder: "0" },
  ];
}

export function FairnessControl({
  game,
  fields,
  userSeeds = false,
}: {
  game: string;
  fields?: FairField[];
  userSeeds?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [seed, setSeed] = useState<UserSeedInfo | null>(null);

  useEffect(() => {
    if (!open || !userSeeds) return;
    getUserSeed()
      .then((res) => setSeed(res.seed))
      .catch(() => setSeed(null));
  }, [open, userSeeds]);

  function close() {
    setLeaving(true);
    window.setTimeout(() => {
      setLeaving(false);
      setOpen(false);
    }, EXIT_MS);
  }

  const rows = fields ?? (userSeeds ? userFields(seed) : []);

  return (
    <>
      <FairnessButton onClick={() => setOpen(true)} />
      {open ? <FairnessModal game={game} fields={rows} onClose={close} leaving={leaving} /> : null}
    </>
  );
}
