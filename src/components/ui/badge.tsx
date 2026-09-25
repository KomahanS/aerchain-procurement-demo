import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "info" | "amber" | "emerald" | "rose" | "indigo";

const TONE_STYLE: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600",
  info: "bg-blue-50 text-blue-700 ring-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800",
  amber: "bg-amber-50 text-amber-800 ring-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
  emerald:
    "bg-emerald-50 text-emerald-700 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
  rose: "bg-rose-50 text-rose-700 ring-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-800",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:ring-indigo-800",
};

/** Standard status pill. Tone communicates state; always paired with text, never color alone. */
export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONE_STYLE[tone]}`}
    >
      {children}
    </span>
  );
}
