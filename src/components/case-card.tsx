import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Bux } from "@/components/bux";
import { VolatilityScale } from "@/components/volatility-scale";
import { caseImage, caseVolatility, packGlow, type CaseItem } from "@/lib/catalog";

const SPARKS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export function CaseCard({
  item,
  index,
  href,
  footer,
  onSelect,
}: {
  item: CaseItem;
  index?: number;
  href?: string;
  footer?: ReactNode;
  onSelect?: () => void;
}) {
  const glow = packGlow(item.hue);
  const vol = caseVolatility(item.slug);
  const style = { "--case-i": index ?? 0, "--pack-glow": glow } as CSSProperties;

  const inner = (
    <div className="panel-outline @sm/page:rounded-12 relative z-1 w-full overflow-hidden rounded-8 bg-grey-39 p-16">
      <div className="case-card-dots" />
      <div className="relative flex w-full pt-[112%]">
        <div
          className="pointer-events-none absolute left-1/2 top-[44%] h-[62%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 blur-[28px] transition-opacity duration-300 group-hover:opacity-95"
          style={{ background: glow }}
        />
        <img
          className="absolute inset-0 z-1 m-auto h-[82%] w-[82%] object-contain transition-transform duration-300 group-hover:rotate-[4deg] group-hover:scale-[1.06] group-active:rotate-[4deg] group-active:scale-[1.06]"
          alt=""
          src={caseImage(item)}
        />
      </div>
      <div className="relative z-1 grid w-full grid-cols-1 gap-8">
        <p className="truncate text-center text-14 text-grey-190">{item.name}</p>
        <VolatilityScale level={vol.level} label={vol.label} />
        <div className="flex w-full justify-center">
          <Bux value={item.price} />
        </div>
        {footer}
      </div>
    </div>
  );

  const sparks = (
    <>
      <div className="case-card-aura" />
      <div className="pointer-events-none absolute inset-[-8px] z-2 overflow-visible">
        {SPARKS.map((i) => (
          <span key={i} className="case-spark" />
        ))}
      </div>
    </>
  );

  const className =
    "group relative block w-full overflow-visible text-left transition-transform duration-300 hover:-translate-y-4 hover:scale-[1.02] active:-translate-y-4 active:scale-[1.02] animate-case-in";

  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} className={className} style={style}>
        {inner}
        {sparks}
      </button>
    );
  }

  if (!href) {
    return (
      <div className={className} style={style}>
        {inner}
        {sparks}
      </div>
    );
  }

  return (
    <Link href={href} className={className} style={style}>
      {inner}
      {sparks}
    </Link>
  );
}
