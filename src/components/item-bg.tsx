export const ITEM_BG = "/img/theme/item-pattern.svg";

export function ItemBg({ className = "inset-0 h-full w-full opacity-45" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute bg-item-net ${className}`}
    />
  );
}
