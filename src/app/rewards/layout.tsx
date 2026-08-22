import { RewardsNav } from "@/components/rewards-nav";

export default function RewardsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid w-full grid-cols-1 gap-20 @md/page:gap-24">
      <RewardsNav />
      {children}
    </div>
  );
}
