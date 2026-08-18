"use client";

import { usePathname } from "next/navigation";
import { ChatPanel } from "./chat";
import { SiteFooter } from "./footer";
import { Icons } from "./icons";
import { Modals } from "./modals";
import { useStore } from "./providers";
import { SiteHeader } from "./site-header";

export function Shell({ children }: { children: React.ReactNode }) {
  const { chatOpen, toggleChat, openModal } = useStore();
  const pathname = usePathname();

  return (
    <div className="light relative min-h-full w-full min-w-[330px] bg-grey-28">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center opacity-[0.28]"
        style={{ backgroundImage: "url(/img/landscape.webp)" }}
      />
      <ChatPanel />
      <div className={`page-shift relative z-10 min-h-full ${chatOpen ? "lg:pl-[300px]" : ""}`}>
        <SiteHeader />
        <div className="@container/page relative w-full overflow-x-hidden overflow-y-visible">
          <div className="relative flex min-h-[calc(100vh-100px)] w-full justify-center">
            <div className="flex w-full justify-center p-16 sm:p-20 md:p-24 lg:p-32">
              <div key={pathname} className="grid w-full max-w-screen-xl animate-page-in grid-cols-1 items-start gap-20 sm:gap-30 md:gap-40">
                {children}
              </div>
            </div>
          </div>
          <SiteFooter />
        </div>
      </div>

      {!chatOpen ? (
        <button
          type="button"
          aria-label="open chat"
          onClick={toggleChat}
          className="fixed bottom-16 left-16 z-50 flex h-48 w-48 items-center justify-center rounded-12 border-1 border-grey-47 bg-grey-34 text-grey-142 shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-colors hover:bg-grey-39 hover:text-white"
        >
          <Icons.chat className="text-22" />
        </button>
      ) : null}

      <button
        type="button"
        aria-label="support"
        onClick={() => openModal("support")}
        className="fixed bottom-16 right-16 z-50 flex h-48 w-48 items-center justify-center rounded-full border-1 border-grey-47 bg-grey-34 text-grey-142 shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-colors hover:bg-grey-39 hover:text-white"
      >
        <Icons.support className="text-20" />
      </button>

      <Modals />
    </div>
  );
}
