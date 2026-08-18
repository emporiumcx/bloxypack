import { Icons } from "./icons";
import { avatarSrc } from "@/lib/avatars";
import { rankIconFromLevel, rankLevelRange, rankRingFromLevel } from "@/lib/levels";

export function BattleSeat({
  name,
  filled,
  size = 40,
  src,
  level = 1,
}: {
  name?: string;
  filled: boolean;
  size?: number;
  src?: string;
  level?: number;
}) {
  const inner = Math.round(size * 0.925);
  const avatar = Math.round(size * 0.825);
  const lvl = Math.max(1, level || 1);
  const ring = filled ? rankRingFromLevel(lvl) : "var(--color-grey-58)";
  const rank = rankIconFromLevel(lvl);
  const range = rankLevelRange(lvl);
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
              src={src || avatarSrc(undefined, name)}
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
              <div className="absolute top-1/2 z-10 -right-8 flex h-20 -translate-y-1/2 translate-x-[100%] items-center rounded-4 bg-grey-190 px-6 opacity-0 scale-90 transition-all duration-150 group-hover/rank:opacity-100 group-hover/rank:scale-100">
                <div className="absolute top-1/2 left-0 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-1 bg-grey-190" />
                <p className="whitespace-nowrap text-12 text-grey-28">
                  Level {range.min}-{range.max}
                </p>
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

export function BattleModeIcons({
  jackpot,
  crazy,
  terminal,
}: {
  jackpot?: boolean;
  crazy?: boolean;
  terminal?: boolean;
}) {
  if (!jackpot && !crazy && !terminal) return null;
  return (
    <div className="flex items-center justify-center gap-6">
      {jackpot ? (
        <span className="text-[#FE963B]" title="Jackpot">
          <Icons.jackpot />
        </span>
      ) : null}
      {crazy ? (
        <span className="text-pink-231" title="Crazy">
          <Icons.wild />
        </span>
      ) : null}
      {terminal ? (
        <span className="text-red" title="Terminal">
          <Icons.terminal />
        </span>
      ) : null}
    </div>
  );
}
