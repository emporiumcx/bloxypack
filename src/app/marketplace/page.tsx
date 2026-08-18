"use client";

import { Icons } from "@/components/icons";

export default function MarketplacePage() {
  return (
    <div className="@xl/page:gap-32 @bt/page:gap-24 grid w-full grid-cols-1 gap-16">
      <h1 className="@sm/page:text-20 @md/page:text-24 w-full text-18 font-bold text-white">Marketplace</h1>
      <div className="relative flex h-40 w-full max-w-[420px] items-center rounded-8 border-2 border-transparent bg-grey-39 px-12">
        <Icons.search className="mr-2 text-20 text-grey-142" />
        <input
          className="h-full w-full bg-transparent text-14 text-white outline-none placeholder:text-grey-112"
          placeholder="Search items"
        />
      </div>
      <div className="grid min-h-[240px] place-items-center rounded-12 bg-grey-39 p-32">
        <p className="text-14 text-grey-142">No listings yet. Marketplace is coming soon.</p>
      </div>
    </div>
  );
}
