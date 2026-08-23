"use client";

import { usePathname } from "next/navigation";
import { ChatPanel } from "./chat";
import { SiteFooter } from "./footer";
import { Icons } from "./icons";
import { Modals } from "./modals";
import { Toasts } from "./toasts";
import { useStore } from "./providers";
import { Sidebar } from "./sidebar";
import { SiteHeader } from "./site-header";

export function Shell({ children }: { children: React.ReactNode }) {
  const { chatOpen, toggleChat, openModal, sidebarOpen } = useStore();
  const pathname = usePathname();

  return (
    <div className="light relative min-h-full w-full min-w-[330px] bg-grey-28">
      <SiteHeader />
      <Sidebar />
      <ChatPanel />
      <div className={`page-shift relative z-10 min-h-dvh pt-[var(--header-h)] ${sidebarOpen ? "md:pl-208" : "md:pl-64"} ${chatOpen ? "lg:pr-280 2xl:pr-320" : ""}`}>
        <div className="@container/page relative w-full overflow-x-hidden overflow-y-visible">
          <div className="relative flex min-h-[calc(100dvh-var(--header-h))] w-full justify-center">
            <div className="mx-auto flex w-full max-w-340 justify-center px-8 pb-80 transition-all duration-400 ease-in-out sm:pb-0 md:px-40 md:pt-20 md:pb-0">
              <div key={pathname} className="grid w-full animate-page-in grid-cols-1 items-start">
                {children}
              </div>
            </div>
          </div>
          <SiteFooter />
        </div>
      </div>

      <div
        className={`fixed bottom-16 z-50 hidden flex-col gap-8 transition-[right] duration-400 md:flex ${
          chatOpen ? "right-16 lg:right-296 2xl:right-336" : "right-16"
        }`}
      >
        <button
          type="button"
          aria-label="Toggle chat"
          onClick={toggleChat}
          className="flex h-40 w-40 items-center justify-center rounded-6 border-1 border-grey-190/10 bg-grey-39 bg-gradient-to-b from-grey-190/5 to-grey-190/10 p-10 text-grey-190 transition-colors duration-400 hover:from-grey-190/10 hover:to-grey-190/20"
        >
          <Icons.chat className="text-20" />
        </button>
        <button
          type="button"
          aria-label="Toggle live support"
          onClick={() => openModal("support")}
          className="flex h-40 w-40 items-center justify-center rounded-6 border-1 border-green-2 bg-gradient-to-b from-green to-green-2 p-10 text-grey-190 transition-all duration-400 hover:brightness-110 active:brightness-95"
        >
          <Icons.support className="text-20" />
        </button>
      </div>

      <Modals />
      <Toasts />
    </div>
  );
}
