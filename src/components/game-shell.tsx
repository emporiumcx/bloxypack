"use client";

import { BetsTable } from "./bets-table";

export function GameShell({
  sidebar,
  board,
  boardClassName = "@lg/page:p-40 @sm/page:p-30 relative w-full p-20",
  tall = false,
}: {
  sidebar: React.ReactNode;
  board: React.ReactNode;
  boardClassName?: string;
  tall?: boolean;
}) {
  const frame = (
    <div
      className={`@lg/page:grid-cols-[324px_1fr] @sm/page:rounded-16 relative grid w-full grid-cols-1 overflow-hidden rounded-12 border-1 border-grey-58 bg-grey-39 ${
        tall ? "@lg/page:h-[720px]" : ""
      }`}
    >
      <div className={`@lg/page:row-start-1 @lg/page:rounded-l-16 @lg/page:rounded-br-none @sm/page:p-20 relative row-start-2 flex w-full flex-col gap-16 rounded-b-12 bg-grey-28 p-16 ${
        tall ? "" : "@lg/page:gap-40"
      }`}>
        {sidebar}
      </div>
      <div className={boardClassName}>{board}</div>
    </div>
  );
  return (
    <>
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
      <div className="flex w-full flex-grow items-start">
        <div className="@sm/page:gap-20 grid w-full grid-cols-1 gap-16">{children}</div>
      </div>
      <div className="@lg/page:mt-10 grid w-full grid-cols-1 items-center gap-8">{action}</div>
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
    <div className="grid w-full grid-cols-1 gap-8">
      <h2 className="ui-label text-12 text-grey-142 transition-colors duration-200">{label}</h2>
      <div className={`relative flex h-40 w-full items-center rounded-8 border-2 border-transparent py-4 transition-colors duration-200 ${bg} ${pad}`}>
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
      className={`flex h-full w-full items-center px-10 text-14 text-white outline-none ${bg}`}
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
    <div className="grid w-full grid-cols-1 gap-12">
      <FieldBox label="Number of bets">
        <FieldInput value={0} name="bets" placeholder="0 = ∞" />
      </FieldBox>
      <FieldBox label="On win">
        <FieldInput value={0} name="on_win" placeholder="Increase by %" />
        <div className="ml-4 px-8 text-14 font-bold text-grey-190">%</div>
      </FieldBox>
      <FieldBox label="On loss">
        <FieldInput value={0} name="on_loss" placeholder="Increase by %" />
        <div className="ml-4 px-8 text-14 font-bold text-grey-190">%</div>
      </FieldBox>
    </div>
  );
}
