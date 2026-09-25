import type { RFxStatus } from "@/domain/types";

// Duplicated (deliberately small) from src/app/rfx/[rfxId]/page.tsx's local
// consts, which aren't exported -- kept here rather than editing that page.

export const STATUS_LABEL: Record<RFxStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  responses_in_progress: "Responses in progress",
  under_comparison: "Under comparison",
  awarded: "Awarded",
  closed: "Closed",
};

export const STATUS_STYLE: Record<RFxStatus, string> = {
  draft: "bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600",
  sent: "bg-blue-50 text-blue-700 ring-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800",
  responses_in_progress:
    "bg-amber-50 text-amber-800 ring-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
  under_comparison:
    "bg-indigo-50 text-indigo-700 ring-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:ring-indigo-800",
  awarded:
    "bg-emerald-50 text-emerald-700 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
  closed: "bg-slate-100 text-slate-500 ring-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-600",
};
