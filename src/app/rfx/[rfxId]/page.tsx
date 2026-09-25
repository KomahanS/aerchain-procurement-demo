import Link from "next/link";
import { notFound } from "next/navigation";
import { getRfxDetails } from "@/domain/seed/rfx-details";
import { getVendorResponseWorkspace } from "@/domain/seed/vendor-response-workspace";
import { getComparison } from "./comparison/view-model";
import { corrugatedSeed } from "@/domain/seed/corrugated-seed";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function RfxOverviewPage({ params }: { params: Promise<{ rfxId: string }> }) {
  const { rfxId } = await params;
  const details = getRfxDetails(rfxId);
  if (!details) notFound();

  const responses = getVendorResponseWorkspace(rfxId);
  const comparison = getComparison(rfxId);
  const clarifications = corrugatedSeed.clarifications.filter((c) => c.rfxId === rfxId);
  const openClarifications = clarifications.filter((c) => c.status !== "answered");
  const needsValidationLines = comparison
    ? comparison.rows.filter((row) => row.cells.some((c) => c.state === "needs_validation" || c.state === "blocked" || c.state === "non_compliant")).length
    : 0;

  const technicalRequirements = Array.from(
    new Set(details.lines.map((l) => l.line.technicalRequirements).filter((v): v is string => Boolean(v))),
  );
  const deliveryRequirements = Array.from(
    new Set(details.lines.map((l) => l.line.deliveryRequirements).filter((v): v is string => Boolean(v))),
  );

  const activity = [
    ...responses.map((r) => ({ at: r.vendorResponse.receivedAt, text: `${r.vendor.name} submitted a response (${r.documents.length} document${r.documents.length === 1 ? "" : "s"})` })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));

  const nextAction = getNextAction({
    rfxId,
    responseCount: responses.length,
    openClarifications: openClarifications.length,
    blockedLines: comparison?.summary.blockedLines ?? 0,
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Key metrics */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <MetricTile label="Line items" value={String(details.lines.length)} />
        <MetricTile label="Vendor responses" value={String(responses.length)} />
        <MetricTile
          label="Needs validation"
          value={String(needsValidationLines)}
          tone={needsValidationLines > 0 ? "amber" : "emerald"}
        />
        <MetricTile
          label="Open clarifications"
          value={String(openClarifications.length)}
          tone={openClarifications.length > 0 ? "amber" : "emerald"}
        />
        <MetricTile label="Comparable lines" value={comparison ? `${comparison.summary.comparableLines}/${comparison.rows.length}` : "—"} />
        <MetricTile label="Blocked lines" value={String(comparison?.summary.blockedLines ?? 0)} tone={(comparison?.summary.blockedLines ?? 0) > 0 ? "rose" : "emerald"} />
      </section>

      {/* Next action */}
      {nextAction && (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-5 py-4 dark:border-indigo-900 dark:bg-indigo-950">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-400">Next action</p>
            <p className="mt-0.5 text-sm text-indigo-900 dark:text-indigo-200">{nextAction.text}</p>
          </div>
          <Link
            href={nextAction.href}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            {nextAction.cta}
          </Link>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Requirements summary */}
        <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Key requirements</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              A summary of what was asked. Full detail is on the Requirements tab.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Technical</h3>
            {technicalRequirements.length === 0 ? (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">No explicit technical requirements stated.</p>
            ) : (
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-slate-700 dark:text-slate-300">
                {technicalRequirements.map((req) => (
                  <li key={req}>{req}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Delivery</h3>
            {deliveryRequirements.length === 0 ? (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">No explicit delivery requirements stated.</p>
            ) : (
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-slate-700 dark:text-slate-300">
                {deliveryRequirements.map((req) => (
                  <li key={req}>{req}</li>
                ))}
              </ul>
            )}
          </div>
          <Link
            href={`/rfx/${rfxId}/requirements`}
            className="w-fit text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            View full requirements →
          </Link>
        </section>

        {/* Recent activity */}
        <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Recent activity</h2>
          {activity.length === 0 ? (
            <EmptyState title="No activity yet" description="Vendor responses will appear here as they're submitted." />
          ) : (
            <ul className="flex flex-col gap-3">
              {activity.map((item, i) => (
                <li key={i} className="text-sm">
                  <p className="text-slate-800 dark:text-slate-200">{item.text}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(item.at)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Vendor snapshot */}
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Vendor responses</h2>
          <Link href={`/rfx/${rfxId}/responses`} className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            View all →
          </Link>
        </div>
        {responses.length === 0 ? (
          <div className="px-5 py-4">
            <EmptyState title="No vendor responses yet" description="Responses will appear here as vendors submit their quotes." />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {responses.map((r) => (
              <li key={r.vendorResponse.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{r.vendor.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {r.stats.mappedLines}/{r.stats.totalLines} lines mapped · {r.stats.openExceptions} open issue{r.stats.openExceptions === 1 ? "" : "s"}
                  </p>
                </div>
                <Badge tone={r.processingStatus === "needs_clarification" ? "amber" : r.processingStatus === "fully_processed" ? "emerald" : "info"}>
                  {r.processingStatus === "needs_clarification" ? "Needs review" : r.processingStatus === "fully_processed" ? "Validated" : "Processing"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function getNextAction({
  rfxId,
  responseCount,
  openClarifications,
  blockedLines,
}: {
  rfxId: string;
  responseCount: number;
  openClarifications: number;
  blockedLines: number;
}): { text: string; cta: string; href: string } | undefined {
  if (responseCount === 0) return undefined;
  if (openClarifications > 0) {
    return {
      text: `${openClarifications} clarification${openClarifications === 1 ? "" : "s"} ${openClarifications === 1 ? "is" : "are"} still open. Resolve them before finalizing the comparison.`,
      cta: "Review clarifications",
      href: `/rfx/${rfxId}/clarifications`,
    };
  }
  if (blockedLines > 0) {
    return {
      text: `${blockedLines} line${blockedLines === 1 ? "" : "s"} cannot currently be compared. Review what's blocking them.`,
      cta: "Review comparison",
      href: `/rfx/${rfxId}/comparison`,
    };
  }
  return { text: "All received lines are validated and ready to compare.", cta: "Compare vendors", href: `/rfx/${rfxId}/comparison` };
}

function MetricTile({ label, value, tone }: { label: string; value: string; tone?: "amber" | "rose" | "emerald" }) {
  const toneClass =
    tone === "amber"
      ? "text-amber-700 dark:text-amber-400"
      : tone === "rose"
        ? "text-rose-700 dark:text-rose-400"
        : tone === "emerald"
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-slate-900 dark:text-slate-50";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
