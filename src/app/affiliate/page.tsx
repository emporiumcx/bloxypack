"use client";

import { GreenButton } from "@/components/green-button";
import { useStore } from "@/components/providers";

export default function AffiliatePage() {
  const { user, openModal } = useStore();

  if (!user) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-center">
        <div>
          <h1 className="@sm/page:text-20 @md/page:text-24 text-18 font-bold leading-[125%]">Affiliate</h1>
          <p className="mt-8 max-w-[420px] text-14 text-grey-190">
            Sign in to get your referral code, track wagered users, and claim affiliate earnings.
          </p>
          <div className="mt-16 flex justify-center">
            <GreenButton onClick={() => openModal("login")}>Login to continue</GreenButton>
          </div>
        </div>
      </div>
    );
  }

  const code = `${user.username.toLowerCase()}`;
  const link = `https://bloxywild.com/r/${code}`;

  return (
    <div className="grid w-full grid-cols-1 gap-16">
      <h1 className="@sm/page:text-20 @md/page:text-24 text-18 font-bold leading-[125%]">Affiliate</h1>
      <div className="grid gap-10 md:grid-cols-3">
        {[
          ["Your code", code],
          ["Users referred", "0"],
          ["Available earnings", "0"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-12 bg-grey-28 p-16">
            <p className="text-12 text-grey-142">{k}</p>
            <p className="mt-8 text-18 font-bold">{v}</p>
          </div>
        ))}
      </div>
      <div className="rounded-12 bg-grey-28 p-16">
        <p className="mb-8 text-13 text-grey-142">Referral link</p>
        <div className="flex gap-8">
          <input readOnly value={link} className="h-40 flex-1 rounded-8 bg-grey-39 px-12 text-13 outline-none" />
          <GreenButton onClick={() => navigator.clipboard.writeText(link)}>Copy</GreenButton>
        </div>
      </div>
    </div>
  );
}
