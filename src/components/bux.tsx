import { formatBux } from "@/lib/format";
import { BuxGlyph } from "./icons";

export function BuxIcon({ className = "text-green" }: { className?: string }) {
  return (
    <div className="flex items-center justify-center" style={{ width: 20, height: 20 }}>
      <BuxGlyph className={className} style={{ marginLeft: 0, scale: 1 }} />
    </div>
  );
}

const TONE = {
  green: "text-green",
  gold: "text-gold",
  silver: "text-silver",
  bronze: "text-bronze",
  muted: "text-grey-142",
  onGreen: "text-grey-28",
} as const;

export function Bux({
  value,
  className = "",
  tone = "green",
  size = "md",
  amount = "white",
}: {
  value: number;
  className?: string;
  tone?: keyof typeof TONE;
  size?: "md" | "sm";
  amount?: "white" | "green" | "muted" | "onGreen";
}) {
  const sm = size === "sm";
  const amountClass =
    amount === "muted" || tone === "muted"
      ? "text-grey-142"
      : amount === "onGreen" || tone === "onGreen"
        ? "text-grey-28"
        : amount === "green"
          ? "text-green"
          : "text-white";
  return (
    <div className={`group grid grid-cols-[auto_1fr] items-center ${className}`}>
      <div className="mr-6 flex justify-center" style={{ marginTop: 0 }}>
        <div
          className="flex items-center justify-center"
          style={
            sm
              ? { marginLeft: -3.2, marginRight: -3.2, width: 19.2, height: 16 }
              : { marginLeft: -3.6, marginRight: -3.6, width: 21.6, height: 18 }
          }
        >
          <BuxGlyph className={TONE[tone]} style={{ transform: sm ? "scale(0.8)" : "scale(0.9)" }} />
        </div>
      </div>
      <div className={`relative flex items-center ${amountClass}`}>
        <p className={`font-semibold ${sm ? "text-12" : "text-14"}`}>{formatBux(value)}</p>
      </div>
    </div>
  );
}
