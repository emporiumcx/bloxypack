export const ITEM_BG = "/img/item-bg.png";

export function ItemBg({
  className = "inset-0 h-full w-full opacity-45",
  color,
}: {
  className?: string;
  color?: string;
}) {
  return (
    <>
      <img
        alt=""
        src={ITEM_BG}
        className={`pointer-events-none absolute object-contain ${className}`}
      />
      {color ? (
        <div
          className={`pointer-events-none absolute ${className}`}
          style={{
            background: color,
            WebkitMaskImage: `url(${ITEM_BG})`,
            maskImage: `url(${ITEM_BG})`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            opacity: 0.4,
          }}
        />
      ) : null}
    </>
  );
}
