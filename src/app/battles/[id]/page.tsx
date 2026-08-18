"use client";

import { use } from "react";
import { BattleLive } from "@/components/battle-live";

export default function BattleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <BattleLive id={id} />;
}
