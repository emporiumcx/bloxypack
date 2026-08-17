"use client";

import { useEffect } from "react";
import { useStore } from "@/components/providers";

export default function RegisterPage() {
  const { openModal } = useStore();
  useEffect(() => {
    openModal("register");
  }, [openModal]);
  return <div className="grid min-h-[40vh] place-items-center text-grey-112">Auth</div>;
}
