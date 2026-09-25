import Link from "next/link";
import { notFound } from "next/navigation";
import { getRfxDetails } from "@/domain/seed/rfx-details";
import { getVendorResponseWorkspace } from "@/domain/seed/vendor-response-workspace";
import { corrugatedSeed } from "@/domain/seed/corrugated-seed";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PROCESSING_STATUS_LABEL, SOURCE_FORMAT_LABEL } from "./presentation";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default async function RFxResponsesPage({ params }: { params: Promise<{ rfxId: string }> }) {
  const { rfxId } = await params;
  const details = getRfxDetails(rfxId);
  if (!details) notFound();

  const responses = getVendorResponseWorkspace(rfxId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Vendor responses</h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          {responses.length} response{responses.length === 1 ? "" : "s"} received for {details.lines.length} line
          item{details.lines.length === 1 ? "" : "s"}. Open a vendor to see the full Response Intelligence view.
        </p>
      </div>

      {responses.length === 0 ? (
        <EmptyState title="No vendor responses yet" description="Responses will appear here as vendors submit their quotes." />
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-5 py-3 font-medium">Vendor</th>
                  <th className="px-5 py-3 font-medium">Format(s)</th>
                  <th className="px-5 py-3 font-medium">Lines</th>
                  <th className="px-5 py-3 font-medium">Validation</th>
                  <th className="px-5 py-3 font-medium">Clarifications</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Updated</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {responses.map((response) => {
                  const clarificationCount = corrugatedSeed.clarifications.filter(
                    (c) => c.rfxId === rfxId && c.vendorId === response.vendor.id,
                  ).length;
                  const formats = Array.from(new Set(response.documents.map((d) => SOURCE_FORMAT_LABEL[d.format] ?? d.format)));
                  return (
                    <tr key={response.vendorResponse.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-4">
                        <Link
                          href={`/rfx/${rfxId}/responses/${response.vendor.id}`}
                          className="font-medium text-slate-900 hover:text-indigo-600 hover:underline dark:text-slate-100 dark:hover:text-indigo-400"
                        >
                          {response.vendor.name}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{formats.join(", ")}</td>
                      <td className="px-5 py-4 tabular-nums text-slate-700 dark:text-slate-300">
                        {response.stats.mappedLines}/{details.lines.length}
                      </td>
                      <td className="px-5 py-4">
                        {response.stats.openExceptions > 0 ? (
                          <Badge tone="amber">
                            {response.stats.openExceptions} issue{response.stats.openExceptions === 1 ? "" : "s"}
                          </Badge>
                        ) : (
                          <Badge tone="emerald">Clear</Badge>
                        )}
                      </td>
                      <td className="px-5 py-4 tabular-nums text-slate-700 dark:text-slate-300">{clarificationCount}</td>
                      <td className="px-5 py-4">
                        <Badge tone={response.processingStatus === "needs_clarification" ? "amber" : response.processingStatus === "fully_processed" ? "emerald" : "info"}>
                          {PROCESSING_STATUS_LABEL[response.processingStatus]}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">{formatDateTime(response.vendorResponse.receivedAt)}</td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/rfx/${rfxId}/responses/${response.vendor.id}`}
                          className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          Open →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
