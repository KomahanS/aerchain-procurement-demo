import type { ReactNode } from "react";

/** Intentional empty/unavailable state -- never a blank silent section. */
export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm dark:border-slate-700 dark:bg-slate-950">
      <p className="font-medium text-slate-700 dark:text-slate-300">{title}</p>
      {description && <p className="text-slate-500 dark:text-slate-400">{description}</p>}
      {action}
    </div>
  );
}
