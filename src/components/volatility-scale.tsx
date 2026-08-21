const TICKS = ["#3dd68c", "#9ae66e", "#f5d547", "#f59e3b", "#ef4444"] as const;

export function VolatilityScale({
  level,
  label,
  className = "",
}: {
  level: number;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center gap-3 ${className}`}
      title={label ? `${label} volatility` : "Volatility"}
    >
      {TICKS.map((color, i) => (
        <span
          key={color}
          className="h-5 w-16 rounded-2"
          style={{ background: i < level ? color : "rgba(255,255,255,0.12)" }}
        />
      ))}
    </div>
  );
}
