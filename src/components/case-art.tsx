import type { CaseItem } from "@/lib/catalog";

export function CaseArt({ item, className = "" }: { item: CaseItem; className?: string }) {
  const src = item.imageId ? `/cdn/cases/${item.imageId}.webp` : item.image ?? "";
  return (
    <div className={`relative overflow-hidden rounded-8 bg-grey-28 ${className}`}>
      {src ? (
        <img src={src} alt={item.name} className="h-full w-full object-contain p-8" />
      ) : (
        <div
          className="h-full w-full"
          style={{
            background: `radial-gradient(circle at 50% 30%, hsl(${item.hue} 70% 42%), #0d1013 70%)`,
          }}
        />
      )}
    </div>
  );
}
