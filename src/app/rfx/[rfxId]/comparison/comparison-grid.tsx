"use client";

import { useState } from "react";
import Link from "next/link";
import { Drawer } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { ComparisonCell, ComparisonViewModel } from "./view-model";

function formatMoney(value: number | undefined, currency: string | undefined) {
  if (value === undefined) return undefined;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency ?? "USD", maximumFractionDigits: 4 }).format(value);
}

const CELL_STYLE: Record<ComparisonCell["state"], string> = {
  clear: "bg-emerald-50/60 hover:bg-emerald-50 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50",
  needs_validation: "bg-amber-50/60 hover:bg-amber-50 dark:bg-amber-950/30 dark:hover:bg-amber-950/50",
  blocked: "bg-rose-50/60 hover:bg-rose-50 dark:bg-rose-950/30 dark:hover:bg-rose-950/50",
  non_compliant: "bg-rose-50/60 hover:bg-rose-50 dark:bg-rose-950/30 dark:hover:bg-rose-950/50",
  no_quote: "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800",
};

function CellContent({ cell }: { cell: ComparisonCell }) {
  if (cell.state === "no_quote") {
    return <span className="text-xs text-slate-400 dark:text-slate-600">No quote</span>;
  }
  if (cell.state === "blocked") {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-400">Blocked</p>
        <p className="mt-0.5 line-clamp-2 text-[11px] text-rose-600 dark:text-rose-400">{cell.reason}</p>
      </div>
    );
  }
  if (cell.state === "non_compliant") {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-400">Non-compliant</p>
        {cell.normalizedPrice !== undefined && (
          <p className="mt-0.5 text-sm font-medium text-slate-500 line-through dark:text-slate-500">
            {formatMoney(cell.normalizedPrice, cell.currency)}
            {cell.comparisonUnitSymbol ? ` / ${cell.comparisonUnitSymbol}` : ""}
          </p>
        )}
        <p className="mt-0.5 line-clamp-2 text-[11px] text-rose-600 dark:text-rose-400">{cell.reason}</p>
      </div>
    );
  }
  return (
    <div>
      <p className={`text-sm font-semibold tabular-nums ${cell.state === "needs_validation" ? "text-amber-800 dark:text-amber-300" : "text-slate-900 dark:text-slate-100"}`}>
        {formatMoney(cell.normalizedPrice, cell.currency)}
        {cell.comparisonUnitSymbol ? <span className="ml-0.5 font-normal text-slate-500 dark:text-slate-400">/{cell.comparisonUnitSymbol}</span> : null}
      </p>
      {cell.state === "needs_validation" && <p className="mt-0.5 line-clamp-2 text-[11px] text-amber-700 dark:text-amber-400">Needs validation</p>}
    </div>
  );
}

export function ComparisonGrid({ comparison, rfxId }: { comparison: ComparisonViewModel; rfxId: string }) {
  const [selected, setSelected] = useState<{ cell: ComparisonCell; lineLabel: string } | null>(null);

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Vendor comparison</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Normalized per-unit prices only. Comparability considers unit, basis, quantity, and technical compliance -- not price alone.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <SummaryStat label="Vendors" value={String(comparison.summary.vendorCount)} />
            <SummaryStat label="Comparable lines" value={`${comparison.summary.comparableLines}/${comparison.rows.length}`} />
            <SummaryStat label="Blocked lines" value={String(comparison.summary.blockedLines)} tone={comparison.summary.blockedLines > 0 ? "rose" : undefined} />
            <SummaryStat label="Open clarifications" value={String(comparison.summary.openClarifications)} tone={comparison.summary.openClarifications > 0 ? "amber" : undefined} />
            <SummaryStat label="Currency" value={comparison.summary.currency} />
          </div>
        </div>
      </section>

      {comparison.vendors.length === 0 ? (
        <EmptyState title="No vendor responses to compare yet" description="The comparison grid will populate once vendors submit their quotes." />
      ) : (
        <>
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <LegendItem tone="emerald" label="Clear" />
            <LegendItem tone="amber" label="Needs validation" />
            <LegendItem tone="rose" label="Blocked / non-compliant" />
            <LegendItem tone="neutral" label="No quote" />
          </div>

          {/* Grid */}
          <section className="overflow-hidden rounded-lg border border-slate-200 shadow-sm dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                    <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 font-medium dark:bg-slate-950">Line item</th>
                    {comparison.vendors.map((vendor) => (
                      <th key={vendor.id} className="min-w-[150px] px-4 py-3 font-medium">
                        {vendor.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparison.rows.map((row) => (
                    <tr key={row.rfxLine.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                      <td className="sticky left-0 z-10 bg-white px-4 py-3 align-top dark:bg-slate-900">
                        <p className="font-medium text-slate-900 dark:text-slate-100">Line {row.rfxLine.lineNumber}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{row.product.name}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">{row.rfxLine.requestedQuantity.toLocaleString("en-US")} pcs</p>
                      </td>
                      {row.cells.map((cell) => (
                        <td key={cell.vendorId} className="px-1 py-1 align-top">
                          <button
                            type="button"
                            disabled={cell.state === "no_quote"}
                            onClick={() => setSelected({ cell, lineLabel: `Line ${row.rfxLine.lineNumber} — ${row.product.name}` })}
                            className={`h-full w-full rounded-md px-3 py-2.5 text-left transition-colors disabled:cursor-default ${CELL_STYLE[cell.state]}`}
                          >
                            <CellContent cell={cell} />
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? selected.cell.vendorName : ""}
        subtitle={selected?.lineLabel}
      >
        {selected && <CellDetail cell={selected.cell} rfxId={rfxId} />}
      </Drawer>
    </div>
  );
}

function CellDetail({ cell, rfxId }: { cell: ComparisonCell; rfxId: string }) {
  const stateLabel: Record<ComparisonCell["state"], string> = {
    clear: "Clear -- safely comparable",
    needs_validation: "Needs validation",
    blocked: "Comparison blocked",
    non_compliant: "Non-compliant",
    no_quote: "No quote provided",
  };
  const stateTone: Record<ComparisonCell["state"], "emerald" | "amber" | "rose" | "neutral"> = {
    clear: "emerald",
    needs_validation: "amber",
    blocked: "rose",
    non_compliant: "rose",
    no_quote: "neutral",
  };

  return (
    <div className="flex flex-col gap-5 text-sm">
      <Badge tone={stateTone[cell.state]}>{stateLabel[cell.state]}</Badge>

      {cell.line ? (
        <>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Vendor quoted</h3>
            <p className="mt-1 text-slate-800 dark:text-slate-200">
              {cell.line.price ? `${formatMoney(cell.line.price.quotedPrice, cell.line.price.currency)} ${cell.line.price.priceBasisRaw}` : "Not stated"}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Landed cost</h3>
            <p className="mt-1 text-slate-800 dark:text-slate-200">
              {cell.line.price?.landedCost !== undefined ? `${formatMoney(cell.line.price.landedCost, cell.line.price.currency)} ${cell.line.price.priceBasisRaw}` : "Not finalized"}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Normalized unit price</h3>
            <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
              {cell.normalizedPrice !== undefined ? `${formatMoney(cell.normalizedPrice, cell.currency)} / ${cell.comparisonUnitSymbol ?? "unit"}` : "Not comparable yet"}
            </p>
            {cell.line.normalization && cell.line.normalization.calculation.length > 0 && (
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-slate-600 dark:text-slate-400">
                {cell.line.normalization.calculation.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            )}
          </div>

          {cell.reason && (
            <div className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:bg-rose-950 dark:text-rose-300">
              <p className="font-medium uppercase tracking-wide text-[10px]">Why</p>
              <p className="mt-1">{cell.reason}</p>
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Evidence ({cell.line.evidenceItems.length})
            </h3>
            <ul className="mt-2 space-y-2 text-xs">
              {cell.line.evidenceItems.map(({ evidence, sourceDocument }) => (
                <li key={evidence.id} className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-950">
                  <p className="text-slate-700 dark:text-slate-300">&ldquo;{evidence.excerpt}&rdquo;</p>
                  <p className="mt-1 text-slate-500 dark:text-slate-400">
                    {sourceDocument ? `${sourceDocument.format} · ` : ""}
                    {evidence.location ?? evidence.sourceRef}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href={`/rfx/${rfxId}/responses/${cell.vendorId}`}
            className="inline-flex w-fit items-center justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Open in Response Intelligence →
          </Link>
        </>
      ) : (
        <p className="text-slate-500 dark:text-slate-400">This vendor did not provide a quote for this line.</p>
      )}
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone?: "rose" | "amber" }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`text-base font-semibold ${tone === "rose" ? "text-rose-700 dark:text-rose-400" : tone === "amber" ? "text-amber-700 dark:text-amber-400" : "text-slate-900 dark:text-slate-100"}`}>
        {value}
      </p>
    </div>
  );
}

function LegendItem({ tone, label }: { tone: "emerald" | "amber" | "rose" | "neutral"; label: string }) {
  const dot: Record<typeof tone, string> = {
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
    rose: "bg-rose-400",
    neutral: "bg-slate-300 dark:bg-slate-600",
  };
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${dot[tone]}`} />
      {label}
    </span>
  );
}
