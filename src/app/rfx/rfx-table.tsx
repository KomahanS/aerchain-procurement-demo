"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { RFxStatus } from "@/domain";
import { STATUS_LABEL, STATUS_STYLE } from "./presentation";
import type { RfxListItem } from "./view-model";

function relativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const ALL_STATUSES: RFxStatus[] = ["draft", "sent", "responses_in_progress", "under_comparison", "awarded", "closed"];

export function RfxTable({ items }: { items: RfxListItem[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RFxStatus | "all">("all");

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter !== "all" && item.rfx.status !== statusFilter) return false;
      if (query.trim() && !`${item.rfx.title} ${item.rfx.category}`.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [items, query, statusFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title or category…"
          className="w-full max-w-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as RFxStatus | "all")}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="all">All statuses</option>
          {ALL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABEL[status]}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {filtered.length} of {items.length} RFx
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">RFx</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Vendors</th>
                <th className="px-5 py-3 font-medium">Lines</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Attention</th>
                <th className="px-5 py-3 font-medium">Updated</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.rfx.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-4">
                    <Link href={`/rfx/${item.rfx.id}`} className="font-medium text-slate-900 hover:text-indigo-600 hover:underline dark:text-slate-100 dark:hover:text-indigo-400">
                      {item.rfx.title}
                    </Link>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-400 dark:text-slate-600">{item.rfx.id}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{item.rfx.category}</td>
                  <td className="px-5 py-4 tabular-nums text-slate-700 dark:text-slate-300">
                    {item.vendorResponseCount > 0 ? item.vendorNames.join(", ") : "—"}
                  </td>
                  <td className="px-5 py-4 tabular-nums text-slate-700 dark:text-slate-300">{item.lineCount}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[item.rfx.status]}`}>
                      {STATUS_LABEL[item.rfx.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {item.openIssueCount > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800">
                        {item.openIssueCount} issue{item.openIssueCount === 1 ? "" : "s"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800">
                        Ready
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">{relativeDate(item.updatedAt)}</td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/rfx/${item.rfx.id}`} className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    No RFx match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
