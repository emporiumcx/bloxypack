import { Icons } from "./icons";

const AVATARS = ["/cdn/avatars/default.webp", "/img/icon.webp"];
const RANKS = ["/img/rank/23.svg", "/img/rank/7.svg", "/img/rank/11.svg", "/img/rank/13.svg"];
const RINGS = [
  "var(--color-rank-diamond)",
  "var(--color-rank-gold)",
  "var(--color-rank-platinum)",
  "var(--color-rank-silver)",
];

export function BattleSeat({
  name,
  filled,
  size = 40,
}: {
  name?: string;
  filled: boolean;
  size?: number;
}) {
  const inner = Math.round(size * 0.925);
  const avatar = Math.round(size * 0.825);
  const ring = name ? RINGS[name.length % RINGS.length] : "var(--color-grey-58)";
  const rank = name ? RANKS[name.length % RANKS.length] : "/img/rank/7.svg";
  return (
    <div
      className="group relative h-40 w-40 rounded-full p-2 transition-opacity duration-200"
      style={{
        width: size,
        height: size,
        backgroundColor: filled ? ring : "var(--color-grey-58)",
      }}
    >
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-grey-39"
        style={{ width: inner, height: inner }}
      >
        <div
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full bg-grey-58"
          style={{ width: avatar, height: avatar }}
        >
          {filled ? (
            <img
              alt=""
              className="h-full w-full rounded-2 object-cover"
              src={AVATARS[name ? name.length % AVATARS.length : 0]}
            />
          ) : (
            <Icons.seat className="text-18 text-grey-190" />
          )}
        </div>
      </div>
      {filled ? (
        <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: ring }}>
          <div className="absolute -bottom-0 -left-0">
            <div className="group/rank relative" style={{ width: 13.5, height: 15 }}>
              <img alt="" className="absolute left-1/2 top-0 max-w-none -translate-x-1/2" src={rank} style={{ height: 15 }} />
              <div className="absolute top-1/2 z-10 hidden h-20 -translate-y-1/2 items-center rounded-4 bg-grey-190 px-6 group-hover/rank:flex -right-8 translate-x-[100%]">
                <div className="absolute top-1/2 left-0 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-1 bg-grey-190" />
                <p className="whitespace-nowrap text-12 text-grey-28">Level 89-998</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <button type="button" className="absolute inset-0" />
    </div>
  );
}

export function BattleVs() {
  return (
    <div className="@[540px]:w-10 @[700px]:w-14 relative z-[5] w-8">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex items-center justify-center" style={{ width: 20, height: 20 }}>
          <Icons.battles className="text-grey-142" style={{ marginLeft: 0, scale: 1 }} />
        </div>
      </div>
    </div>
  );
}
