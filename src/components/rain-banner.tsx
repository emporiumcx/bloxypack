"use client";

import { Bux } from "./bux";
import { GreenButton } from "./green-button";

export function RainBanner({
  minutes,
  seconds,
  amount,
  onJoin,
}: {
  minutes: string;
  seconds: string;
  amount: number;
  onJoin: () => void;
}) {
  return (
    <div className="panel-outline relative flex min-h-[100px] w-full items-center overflow-hidden rounded-16 bg-grey-34">
      <div className="pointer-events-none absolute -left-24 top-1/2 h-[220px] w-[220px] -translate-y-1/2 rounded-full bg-blue/20 blur-[70px]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[42%] bg-gradient-to-r from-blue/10 to-transparent" />
      <div className="relative z-10 flex min-w-0 flex-1 items-center justify-between gap-16 px-16 py-16 sm:px-20">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-10">
            <h2 className="text-20 font-semibold text-white">Rain</h2>
            <div className="flex h-24 items-center rounded-6 bg-blue/15 px-8">
              <p className="ui-num text-13 text-blue">
                {minutes}:{seconds}
              </p>
            </div>
          </div>
          <p className="mt-6 truncate text-13 text-grey-142">Join the rain to claim a share of the pot.</p>
        </div>
        <div className="flex shrink-0 items-center gap-10 rounded-12 bg-grey-28 py-6 pl-14 pr-6">
          <Bux value={amount} />
          <GreenButton size="sm" wide={false} className="w-72" onClick={onJoin}>
            Join
          </GreenButton>
        </div>
      </div>
    </div>
  );
}
