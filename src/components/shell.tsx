"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bux } from "./bux";
import { ChatPanel } from "./chat";
import { SiteFooter } from "./footer";
import { Icons } from "./icons";
import { Modals } from "./modals";
import { useStore } from "./providers";
import { Sidebar } from "./sidebar";

function HeaderBalance({ value }: { value: number }) {
  const prev = useRef(value);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    setTick((n) => n + 1);
  }, [value]);
  return (
    <div key={tick} className={tick ? "animate-pop" : undefined}>
      <Bux value={value} />
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, chatOpen, user, openModal } = useStore();
  const pathname = usePathname();

  return (
    <div className="light relative min-h-full w-full min-w-[330px] bg-grey-28">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center opacity-[0.28]"
        style={{ backgroundImage: "url(/img/landscape.webp)" }}
      />
      <div className="relative z-10 w-full">
        <div
          className={`sticky top-0 z-30 flex h-64 w-full items-center justify-center border-b-1 border-grey-47 bg-grey-34 ${
            user ? "" : "hidden sm:flex"
          }`}
        >
          {user ? (
            <div className="grid items-center gap-10">
              <div className="group relative grid h-40 grid-cols-[auto_auto] items-center gap-12 rounded-8 bg-grey-28 py-4 pl-12 pr-4">
                <HeaderBalance value={user.balance} />
                <button
                  type="button"
                  onClick={() => openModal("deposit")}
                  className="group/button relative flex h-32 cursor-pointer items-start justify-center rounded-6 border-b-3 border-t-3 border-b-green-95 border-t-green-222 bg-green transition-all duration-200 active:border-green"
                >
                  <div className="tr relative flex h-full w-full items-center justify-center gap-4 px-10">
                    <div className="-ml-2 text-grey-28">
                      <Icons.plus className="text-18" />
                    </div>
                    <p className="transition-all duration-300 text-14 text-grey-28">Deposit</p>
                  </div>
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <Sidebar />
        <ChatPanel />
        <div className={`relative ${sidebarOpen ? "md:pl-64 xl:pl-300" : ""} ${chatOpen ? "xl:pr-300" : ""}`}>
          <div className="@container/page relative w-full overflow-x-hidden overflow-y-visible">
            <div className="relative flex min-h-[calc(100vh-64px)] w-full justify-center">
              <div className="flex w-full justify-center p-16 sm:p-20 md:p-24 lg:p-32">
                <div key={pathname} className="grid w-full max-w-screen-xl animate-page-in grid-cols-1 items-start gap-20 sm:gap-30 md:gap-40">
                  {children}
                </div>
              </div>
            </div>
            <SiteFooter />
          </div>
        </div>
      </div>
      <Modals />
    </div>
  );
}
