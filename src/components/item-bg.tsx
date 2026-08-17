export const ITEM_BG = "/img/item-bg.png";

export function ItemBg({ className = "inset-0 h-full w-full opacity-45" }: { className?: string }) {
  return (
    <img
      alt=""
      src={ITEM_BG}
      className={`pointer-events-none absolute object-contain ${className}`}
    />
  );
}
