"use client";

import { BuxIcon } from "./bux";

export function BetField({
  value,
  onChange,
  max = 0,
  label = "Bet amount",
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  label?: string;
}) {
  return (
    <div className="grid w-full grid-cols-1 gap-8">
      <h2 className="text-14 text-grey-142">{label}</h2>
      <div className="relative flex h-40 w-full items-center rounded-8 border-2 border-transparent bg-grey-39 py-4 pl-6 pr-4">
        <BuxIcon className="text-green" />
        <input
          autoComplete="off"
          className="flex h-full w-full items-center bg-grey-39 px-10 text-14 text-white outline-none"
          placeholder="Enter amount"
          type="number"
          value={value}
          name="bet_amount"
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <div className="ml-4 grid grid-cols-[auto_auto] gap-4">
          <button
            type="button"
            onClick={() => onChange(0)}
            className="flex h-32 items-center justify-center rounded-6 border-2 border-grey-58 bg-grey-39 px-6 text-14 text-grey-142 hover:bg-grey-47 active:bg-grey-47 sm:px-10"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => onChange(max || value)}
            className="flex h-32 items-center justify-center rounded-6 border-2 border-grey-58 bg-grey-39 px-6 text-14 text-grey-142 hover:bg-grey-47 active:bg-grey-47 sm:px-10"
          >
            Max
          </button>
        </div>
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
            <p className={`text-14 transition-colors duration-300 ${value === o.id ? "text-white" : "text-grey-142"}`}>
              {o.label}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
