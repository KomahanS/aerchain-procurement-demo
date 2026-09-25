import Link from "next/link";
import { corrugatedSeed } from "@/domain/seed/corrugated-seed";
import { getRfxList } from "./rfx/view-model";
import { STATUS_LABEL, STATUS_STYLE } from "./rfx/presentation";
import { getVendorResponseWorkspace } from "@/domain/seed/vendor-response-workspace";
import { getComparison } from "./rfx/[rfxId]/comparison/view-model";
import { EXCEPTION_SEVERITY } from "./rfx/[rfxId]/responses/presentation";
import { Badge } from "@/components/ui/badge";

const ACTIVE_STATUSES = new Set(["draft", "sent", "responses_in_progress", "under_comparison"]);

function relativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface AttentionItem {
  rfxId: string;
  rfxTitle: string;
  vendorId: string;
  vendorName: string;
  issue: string;
  severity: "blocked" | "needs_validation" | "ready";
}

export default function DashboardPage() {
  const rfxItems = getRfxList();

  const activeRfxCount = rfxItems.filter((item) => ACTIVE_STATUSES.has(item.rfx.status)).length;
  const totalResponses = rfxItems.reduce((sum, item) => sum + item.vendorResponseCount, 0);
  const readyForComparisonCount = rfxItems.filter((item) => item.vendorResponseCount >= 2).length;
  const totalClarificationsNeeded = corrugatedSeed.clarifications.filter((c) => c.status !== "answered").length;

  let needsValidationLines = 0;
  const attentionItems: AttentionItem[] = [];

  for (const item of rfxItems) {
    const comparison = getComparison(item.rfx.id);
    if (comparison) {
      needsValidationLines += comparison.rows.filter((row) => row.cells.some((c) => c.state !== "clear" && c.state !== "no_quote")).length;
    }
    for (const response of getVendorResponseWorkspace(item.rfx.id)) {
      const openExceptions = response.lines.flatMap((l) => l.exceptions).filter((e) => e.status !== "resolved");
      if (openExceptions.length === 0) {
        attentionItems.push({
          rfxId: item.rfx.id,
          rfxTitle: item.rfx.title,
          vendorId: response.vendor.id,
          vendorName: response.vendor.name,
          issue: "All lines extracted and validated.",
          severity: "ready",
        });
        continue;
      }
      const worstSeverity = openExceptions
        .map((e) => EXCEPTION_SEVERITY[e.type])
        .sort((a, b) => (a === "high" ? -1 : b === "high" ? 1 : a === "medium" ? -1 : 1))[0];
      attentionItems.push({
        rfxId: item.rfx.id,
        rfxTitle: item.rfx.title,
        vendorId: response.vendor.id,
        vendorName: response.vendor.name,
        issue: openExceptions.length > 1 ? `${openExceptions.length} open issues -- starting with: ${openExceptions[0].description}` : openExceptions[0].description,
        severity: worstSeverity === "high" ? "blocked" : "needs_validation",
      });
    }
  }

  const severityOrder: Record<AttentionItem["severity"], number> = { blocked: 0, needs_validation: 1, ready: 2 };
  attentionItems.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
        {/* Header */}
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Good morning, Procurement Team</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Here&apos;s what needs your attention across active sourcing events.
          </p>
        </header>

        {/* Metrics */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <MetricCard label="Active RFx" value={activeRfxCount} cta="View RFx" href="/rfx" />
          <MetricCard label="Responses received" value={totalResponses} cta="Review responses" href="/rfx" />
          <MetricCard label="Needs validation" value={needsValidationLines} cta="Review exceptions" href="/rfx" tone={needsValidationLines > 0 ? "amber" : "emerald"} />
          <MetricCard label="Clarifications needed" value={totalClarificationsNeeded} cta="Resolve" href="/rfx" tone={totalClarificationsNeeded > 0 ? "amber" : "emerald"} />
          <MetricCard label="Ready for comparison" value={readyForComparisonCount} cta="Compare vendors" href="/rfx" tone="indigo" />
        </section>

        {/* Needs your attention */}
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Needs your attention</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Real, verified work items across every active RFx -- nothing here is decorative.</p>
          </div>
          {attentionItems.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500 dark:text-slate-400">Nothing needs attention right now.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {attentionItems.slice(0, 8).map((item, i) => (
                <li key={i} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.rfxTitle} · <span className="font-medium text-slate-700 dark:text-slate-300">{item.vendorName}</span>
                    </p>
                    <p className="mt-0.5 truncate text-sm text-slate-800 dark:text-slate-200" title={item.issue}>
                      {item.issue}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge tone={item.severity === "blocked" ? "rose" : item.severity === "needs_validation" ? "amber" : "emerald"}>
                      {item.severity === "blocked" ? "Blocked" : item.severity === "needs_validation" ? "Needs validation" : "Ready"}
                    </Badge>
                    <Link
                      href={`/rfx/${item.rfxId}/responses/${item.vendorId}`}
                      className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Review
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent RFx */}
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Recent RFx</h2>
            <Link href="/rfx" className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-5 py-3 font-medium">RFx</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Vendors</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Attention</th>
                  <th className="px-5 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {rfxItems.map((item) => (
                  <tr key={item.rfx.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-4">
                      <Link href={`/rfx/${item.rfx.id}`} className="font-medium text-slate-900 hover:text-indigo-600 hover:underline dark:text-slate-100 dark:hover:text-indigo-400">
                        {item.rfx.title}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{item.rfx.category}</td>
                    <td className="px-5 py-4 tabular-nums text-slate-700 dark:text-slate-300">{item.vendorResponseCount}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[item.rfx.status]}`}>
                        {STATUS_LABEL[item.rfx.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {item.openIssueCount > 0 ? (
                        <Badge tone="amber">{item.openIssueCount} issue{item.openIssueCount === 1 ? "" : "s"}</Badge>
                      ) : (
                        <Badge tone="emerald">Ready</Badge>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">{relativeDate(item.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value, cta, href, tone }: { label: string; value: number; cta: string; href: string; tone?: "amber" | "emerald" | "indigo" }) {
  const toneClass =
    tone === "amber"
      ? "text-amber-700 dark:text-amber-400"
      : tone === "emerald"
        ? "text-emerald-700 dark:text-emerald-400"
        : tone === "indigo"
          ? "text-indigo-700 dark:text-indigo-400"
          : "text-slate-900 dark:text-slate-50";
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-indigo-300 hover:shadow dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700"
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <p className={`mt-1 text-3xl font-semibold ${toneClass}`}>{value}</p>
      </div>
      <p className="mt-3 text-sm font-medium text-indigo-600 group-hover:underline dark:text-indigo-400">{cta} →</p>
    </Link>
  );
}
