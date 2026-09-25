"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface WorkspaceTab {
  key: string;
  label: string;
  href: string;
  /** Small numeric badge, e.g. open issue count. Omitted when 0/undefined. */
  count?: number;
  countTone?: "amber" | "rose";
}

/** Tab nav for the RFx workspace (Overview/Requirements/Responses/Comparison/Clarifications). Active tab is exact-match on pathname. */
export function WorkspaceTabs({ tabs }: { tabs: WorkspaceTab[] }) {
  const pathname = usePathname();

  return (
    <nav className="-mb-px flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800" aria-label="RFx workspace sections">
      {tabs.map((tab) => {
        const active = tab.key === "overview" ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {tab.label}
            {!!tab.count && (
              <span
                className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                  tab.countTone === "rose"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
