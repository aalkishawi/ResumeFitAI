import React from "react";
import { Badge, Card } from "../ui";

type Tone = "brand" | "green" | "amber" | "red" | "slate";

/** A titled card block used across tabs. */
export function Block({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h3>
        {right}
      </div>
      {children}
    </Card>
  );
}

/** Render a list of short strings as chips; shows a muted note when empty. */
export function ChipList({
  items,
  tone = "slate",
  empty = "None identified.",
}: {
  items: string[];
  tone?: Tone;
  empty?: string;
}) {
  if (!items.length) return <p className="text-sm text-slate-400">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <Badge key={i} tone={tone}>
          {item}
        </Badge>
      ))}
    </div>
  );
}

/** Render a list of strings as bullet points. */
export function BulletList({
  items,
  empty = "None identified.",
}: {
  items: string[];
  empty?: string;
}) {
  if (!items.length) return <p className="text-sm text-slate-400">{empty}</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-slate-700">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="text-sm text-slate-800">{value || "—"}</span>
    </div>
  );
}
