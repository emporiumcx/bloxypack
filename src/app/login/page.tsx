"use client";

import { useEffect } from "react";
import { useStore } from "@/components/providers";

export default function LoginPage() {
  const { openModal } = useStore();
  useEffect(() => {
    openModal("login");
  }, [openModal]);
  return <div className="grid min-h-[40vh] place-items-center text-grey-112">Auth</div>;
}
