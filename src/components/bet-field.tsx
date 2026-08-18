"use client";

import { BuxIcon } from "./bux";

export function BetField({
  value,
  onChange,
  max = 0,
  label = "Bet amount",
  tone = "grey-39",
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  label?: string;
  tone?: "grey-39" | "grey-28";
}) {
  const well = tone === "grey-28";
  const bg = well ? "bg-grey-28" : "bg-grey-39";
  const border = well ? "border-grey-47 focus-within:border-grey-58" : "border-transparent";
  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-6">
      <h2 className="ui-label text-11 text-grey-142">{label}</h2>
      <div className={`relative flex h-36 w-full min-w-0 items-center rounded-8 border-2 py-4 pl-8 pr-8 ${bg} ${border}`}>
        <BuxIcon className="shrink-0 text-green" />
        <input
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent px-8 text-14 text-white outline-none"
          placeholder="Enter amount"
          type="number"
          value={Number.isFinite(value) ? value : ""}
          name="bet_amount"
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        />
      </div>
      <div className="grid grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onChange(Number((Math.max(0, value) / 2).toFixed(2)))}
          className="flex h-28 items-center justify-center rounded-6 bg-grey-39 text-11 text-grey-142 hover:bg-grey-47"
        >
          <span className="ui-btn-label">1/2</span>
        </button>
        <button
          type="button"
          onClick={() => onChange(Number((Math.max(0, value) * 2).toFixed(2)))}
          className="flex h-28 items-center justify-center rounded-6 bg-grey-39 text-11 text-grey-142 hover:bg-grey-47"
        >
          <span className="ui-btn-label">2x</span>
        </button>
        <button
          type="button"
          onClick={() => onChange(0)}
          className="flex h-28 items-center justify-center rounded-6 bg-grey-39 text-11 text-grey-142 hover:bg-grey-47"
        >
          <span className="ui-btn-label">Clear</span>
        </button>
        <button
          type="button"
          onClick={() => onChange(max)}
          className="flex h-28 items-center justify-center rounded-6 bg-grey-39 text-11 text-grey-142 hover:bg-grey-47"
        >
          <span className="ui-btn-label">Max</span>
        </button>
      </div>
    </div>
  );
}

export function ChoiceBar({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="z-10 grid w-full" style={{ gap: 0, gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o, i) => (
        <button
          key={o.id}
          type="button"
          aria-label="choice"
          onClick={() => onChange(o.id)}
          className={`group flex h-40 w-full items-start border-0 bg-grey-28 transition-opacity duration-200 ${
            i === 0 ? "rounded-l-8" : ""
          } ${i === options.length - 1 ? "rounded-r-8" : ""}`}
        >
          <div
            className={`tr @sm/page:gap-6 @sm/page:px-10 relative flex h-full min-w-[40px] w-full items-center justify-center gap-4 px-6 transition-colors ${
              i === 0 ? "rounded-l-8" : ""
            } ${i === options.length - 1 ? "rounded-r-8" : ""} ${
              value === o.id
                ? "bg-grey-58"
                : "border-grey-39 bg-grey-39 group-hover:bg-grey-47 group-active:bg-grey-47"
            }`}
          >
            <p className={`ui-btn-label text-12 transition-colors duration-300 ${value === o.id ? "text-white" : "text-grey-142"}`}>
              {o.label}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
