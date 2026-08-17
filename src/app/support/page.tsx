"use client";

import { GreenButton } from "@/components/green-button";
import { useStore } from "@/components/providers";

export default function SupportPage() {
  const { openModal } = useStore();
  return (
    <div className="mx-auto grid max-w-[520px] gap-12 py-24">
      <h1 className="text-24 text-white">Support</h1>
      <p className="text-14 leading-7 text-grey-190">
        Need help with deposits, withdrawals, or a game result? Open a ticket or reach us on Discord.
      </p>
      <div className="flex flex-wrap gap-10">
        <GreenButton onClick={() => openModal("support")}>Open ticket</GreenButton>
        <a
          href="https://discord.gg/rostake"
          target="_blank"
          rel="noreferrer"
          className="flex h-40 items-center rounded-6 bg-grey-39 px-16 text-14 text-grey-142"
        >
          Discord
        </a>
      </div>
    </div>
  );
}
