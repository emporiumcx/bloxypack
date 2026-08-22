"use client";

import { CaseOpening } from "./case-opening";
import { getRewardCase } from "@/lib/rewards";
import type { RewardsInfo } from "@/lib/backend";

export function RewardCaseModal({
  slug,
  canOpen,
  onClose,
  onOpened,
}: {
  slug: string;
  canOpen: boolean;
  onClose: () => void;
  onOpened?: (rewards: RewardsInfo) => void;
}) {
  const box = getRewardCase(slug);
  if (!box) return null;
  return <CaseOpening item={box} variant="modal" canOpen={canOpen} onClose={onClose} onOpened={onOpened} />;
}
