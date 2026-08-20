"use client";

import { BetsTable } from "./bets-table";
import { FairnessControl } from "@/components/fairness";

export function GameShell({
  sidebar,
  board,
  boardClassName = "@lg/page:p-40 @sm/page:p-30 relative w-full p-20",
  tall = false,
  fairness,
}: {
  sidebar: React.ReactNode;
  board: React.ReactNode;
  boardClassName?: string;
  tall?: boolean;
  fairness?: string;
}) {
  const frame = (
    <div
      className={`@md/page:grid-cols-[260px_1fr] @sm/page:rounded-16 panel-outline relative grid w-full grid-cols-1 rounded-12 bg-grey-39 ${
        tall ? "@md/page:h-[720px]" : ""
      }`}
    >
      <div className="@md/page:row-start-1 @md/page:rounded-l-16 @md/page:rounded-br-none @sm/page:p-16 relative row-start-2 flex w-full flex-col gap-12 rounded-b-12 bg-grey-28 p-12">
        {sidebar}
      </div>
      <div className={`relative isolate ${boardClassName}`}>
        <img
          alt=""
          src="/img/lion_shadow.png"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[52%] w-auto max-w-[52%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-30"
        />
        {board}
      </div>
    </div>
  );
  return (
    <>
      {fairness ? (
        <div className="mb-12 flex w-full justify-end">
          <FairnessControl game={fairness} userSeeds />
        </div>
      ) : null}
      {tall ? (
        <div className="flex flex-col gap-10 sm:gap-20">
          {frame}
        </div>
      ) : (
        frame
      )}
      <BetsTable />
    </>
  );
}

export function GameSidebar({
  children,
  action,
}: {
  children: React.ReactNode;
  action: React.ReactNode;
}) {
  return (
    <>
      <div className="grid w-full grid-cols-1 gap-12">{children}</div>
      <div className="mt-auto grid w-full grid-cols-1 items-center">{action}</div>
    </>
  );
}

export function FieldBox({
  label,
  children,
  pad = "pl-6 pr-4",
  tone = "grey-39",
}: {
  label: string;
  children: React.ReactNode;
  pad?: string;
  tone?: "grey-39" | "grey-28";
}) {
  const bg = tone === "grey-28" ? "bg-grey-28" : "bg-grey-39";
  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-6">
      <h2 className="ui-label text-11 text-grey-142 transition-colors duration-200">{label}</h2>
      <div className={`relative flex h-36 w-full min-w-0 items-center rounded-8 border-2 border-transparent py-4 transition-colors duration-200 ${bg} ${pad}`}>
        {children}
      </div>
    </div>
  );
}

export function FieldInput({
  value,
  onChange,
  name,
  placeholder,
  readOnly,
  tone = "grey-39",
}: {
  value: number | string;
  onChange?: (v: string) => void;
  name: string;
  placeholder: string;
  readOnly?: boolean;
  tone?: "grey-39" | "grey-28";
}) {
  const bg = tone === "grey-28" ? "bg-grey-28" : "bg-grey-39";
  return (
    <input
      autoComplete="off"
      className={`h-full min-w-0 flex-1 bg-transparent px-6 text-14 text-white outline-none ${bg}`}
      placeholder={placeholder}
      type="number"
      value={value}
      name={name}
      readOnly={readOnly}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
    />
  );
}

export function AutobetFields() {
  return (
    <div className="grid w-full grid-cols-1 gap-10">
      <FieldBox label="Number of bets">
        <FieldInput value={0} name="bets" placeholder="0 = ∞" />
      </FieldBox>
      <div className="grid grid-cols-2 gap-10">
        <FieldBox label="On win" pad="pl-6 pr-2">
          <FieldInput value={0} name="on_win" placeholder="%" />
          <span className="mr-6 shrink-0 text-12 font-bold text-grey-190">%</span>
        </FieldBox>
        <FieldBox label="On loss" pad="pl-6 pr-2">
          <FieldInput value={0} name="on_loss" placeholder="%" />
          <span className="mr-6 shrink-0 text-12 font-bold text-grey-190">%</span>
        </FieldBox>
      </div>
    </div>
  );
}
