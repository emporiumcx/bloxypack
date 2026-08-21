"use client";

import { useState, type ReactNode } from "react";
import { BuxIcon } from "./bux";
import { BetsTable } from "./bets-table";
import { FairnessControl, type FairField } from "@/components/fairness";
import { Icons } from "./icons";
import { SoundSettings } from "./sound-settings";

export function GameLayout({
  panel,
  board,
  fairness,
  fairFields,
  extraToolbar,
  howTo,
}: {
  panel: ReactNode;
  board: ReactNode;
  fairness?: string;
  fairFields?: FairField[];
  extraToolbar?: ReactNode;
  howTo?: { title?: string; body: ReactNode };
}) {
  const [help, setHelp] = useState(false);
  const [turbo, setTurbo] = useState(false);

  return (
    <>
      <div className="flex w-full flex-col gap-12">
        <div className="flex min-h-0 flex-col-reverse gap-12 lg:flex-row">
          <aside className="flex w-full min-w-0 shrink-0 flex-col gap-16 overflow-hidden self-start rounded-12 border border-grey-58 bg-grey-28 p-16 lg:w-320">
            {panel}
          </aside>
          <div className="relative min-w-0 flex-1">{board}</div>
        </div>
        <GameToolbar
          fairness={fairness}
          fairFields={fairFields}
          extra={extraToolbar}
          turbo={turbo}
          onTurbo={() => setTurbo((v) => !v)}
          onHowTo={howTo ? () => setHelp(true) : undefined}
        />
      </div>
      <BetsTable />
      {howTo ? (
        <HowToPlay open={help} title={howTo.title} onClose={() => setHelp(false)}>
          {howTo.body}
        </HowToPlay>
      ) : null}
    </>
  );
}

export function GameHeading({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-8">
      <div className="flex size-32 shrink-0 items-center justify-center rounded-6 bg-green/15 text-green">{icon}</div>
      <div className="flex min-w-0 flex-col gap-2">
        <span className="ui-label text-13 text-white">{title}</span>
        <span className="text-12 text-grey-142">{subtitle}</span>
      </div>
    </div>
  );
}

export function ModePills({
  value,
  onChange,
}: {
  value: "manual" | "auto";
  onChange: (id: "manual" | "auto") => void;
}) {
  return (
    <div className="flex w-full gap-4 rounded-8 border border-grey-58 bg-grey-39 p-4">
      {(["manual", "auto"] as const).map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`flex h-28 flex-1 items-center justify-center rounded-6 text-12 font-medium capitalize transition-colors ${
            value === id ? "bg-gradient-to-b from-green to-green-2 text-white" : "text-white hover:bg-white/5"
          }`}
        >
          {id === "auto" ? "Auto" : "Manual"}
        </button>
      ))}
    </div>
  );
}

export function Chip({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-32 shrink-0 items-center justify-center rounded-6 border border-grey-58 bg-grey-47 px-8 text-11 text-white hover:bg-green disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function BetValueField({
  value,
  onChange,
  max = 0,
  disabled,
  label = "Total Value",
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className="grid gap-6">
      <p className="text-11 text-grey-142">{label}</p>
      <div className="flex h-40 w-full min-w-0 items-center gap-4 rounded-6 border border-grey-58 bg-grey-39 py-4 pl-8 pr-4">
        <BuxIcon className="shrink-0 text-green" />
        <input
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent px-6 text-14 text-white outline-none"
          placeholder="0.00"
          inputMode="decimal"
          type="text"
          name="bet_amount"
          disabled={disabled}
          value={value === 0 ? "0.00" : String(value)}
          onChange={(e) => {
            const next = e.target.value.replace(/[^\d.]/g, "");
            onChange(next === "" ? 0 : Number(next));
          }}
        />
        <Chip disabled={disabled} onClick={() => onChange(Number((Math.max(0, value) / 2).toFixed(2)))}>
          1/2
        </Chip>
        <Chip disabled={disabled} onClick={() => onChange(Number((Math.max(0, value) * 2).toFixed(2)))}>
          x2
        </Chip>
        <Chip disabled={disabled} onClick={() => onChange(max)}>
          Max
        </Chip>
      </div>
    </div>
  );
}

export function GameField({
  label,
  children,
  suffix,
}: {
  label: string;
  children: ReactNode;
  suffix?: ReactNode;
}) {
  return (
    <div className="grid min-w-0 gap-6">
      <p className="text-11 text-grey-142">{label}</p>
      <div className="flex h-36 w-full min-w-0 items-center rounded-6 border border-grey-58 bg-grey-39 px-8">
        {children}
        {suffix}
      </div>
    </div>
  );
}

export function GameInput({
  value,
  onChange,
  name,
  placeholder,
  readOnly,
}: {
  value: number | string;
  onChange?: (v: string) => void;
  name: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <input
      autoComplete="off"
      className="h-full min-w-0 flex-1 bg-transparent text-14 text-white outline-none"
      placeholder={placeholder}
      type="text"
      inputMode="decimal"
      value={value}
      name={name}
      readOnly={readOnly}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
    />
  );
}

export function SideButton({
  children,
  onClick,
  disabled,
  icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-36 items-center justify-center gap-6 rounded-6 border border-grey-58 bg-grey-39 text-13 text-white transition-colors ${
        disabled ? "cursor-default opacity-40" : "hover:bg-grey-47"
      }`}
    >
      {children}
      {icon}
    </button>
  );
}

export function GameToolbar({
  fairness,
  fairFields,
  extra,
  turbo,
  onTurbo,
  onHowTo,
}: {
  fairness?: string;
  fairFields?: FairField[];
  extra?: ReactNode;
  turbo: boolean;
  onTurbo: () => void;
  onHowTo?: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-8 border border-grey-58 bg-grey-39 px-12 py-8">
      <div className="flex items-center gap-6">
        <SoundSettings />
        {onHowTo ? (
          <button
            type="button"
            aria-label="How to play"
            onClick={onHowTo}
            className="flex h-32 w-32 items-center justify-center rounded-6 text-icons-secondary hover:bg-grey-47 hover:text-white"
          >
            <span className="flex size-16 items-center justify-center rounded-full border border-current text-11 font-semibold">i</span>
          </button>
        ) : null}
        {extra}
      </div>
      <img alt="" src="/img/logo.png" className="h-28 w-auto opacity-70" />
      <div className="flex items-center gap-6">
        <button
          type="button"
          aria-label="Toggle turbo mode"
          aria-pressed={turbo}
          onClick={onTurbo}
          className={`flex h-32 w-32 items-center justify-center rounded-6 ${
            turbo ? "bg-gradient-to-b from-green to-green-2 text-white" : "text-icons-secondary hover:bg-grey-47 hover:text-white"
          }`}
        >
          <Icons.bolt className="text-14" />
        </button>
        {fairness ? <FairnessControl game={fairness} fields={fairFields} userSeeds={!fairFields} compact /> : null}
      </div>
    </div>
  );
}

export function HowToPlay({
  open,
  title = "How to play",
  onClose,
  children,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-16" onClick={onClose}>
      <div
        className="w-full max-w-420 rounded-12 border border-grey-58 bg-grey-39 p-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-12 flex items-center justify-between">
          <h2 className="ui-label text-14 text-white">{title}</h2>
          <button type="button" onClick={onClose} className="text-14 text-grey-142 hover:text-white">
            Close
          </button>
        </div>
        <div className="grid gap-10 text-13 leading-relaxed text-grey-142">{children}</div>
      </div>
    </div>
  );
}
