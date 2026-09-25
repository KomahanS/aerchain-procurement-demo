import Link from "next/link";
import { notFound } from "next/navigation";
import type { RFxStatus } from "@/domain/types";
import { getRfxDetails } from "@/domain/seed/rfx-details";

const STATUS_LABEL: Record<RFxStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  responses_in_progress: "Responses in progress",
  under_comparison: "Under comparison",
  awarded: "Awarded",
  closed: "Closed",
};

const STATUS_STYLE: Record<RFxStatus, string> = {
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

const CREATED_VIA_LABEL: Record<string, string> = {
  manual: "Manual",
  import: "Import",
  ai_suggested: "AI Suggested",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function RFxDetailsPage({
  params,
}: {
  params: Promise<{ rfxId: string }>;
}) {
  const { rfxId } = await params;
  const details = getRfxDetails(rfxId);
  if (!details) notFound();

  const { rfx, lines, totalRequestedQuantity, requiredUnitSymbols } = details;

  const technicalLines = lines.filter((l) => l.line.technicalRequirements);
  const deliveryLines = lines.filter((l) => l.line.deliveryRequirements);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                RFx Details
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">{rfx.title}</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{rfx.category}</p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span
                className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[rfx.status]}`}
              >
                {STATUS_LABEL[rfx.status]}
              </span>
              <Link
                href={`/rfx/${rfx.id}/responses`}
                className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                View vendor responses →
              </Link>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm dark:border-slate-800 sm:grid-cols-4">
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Created via</dt>
              <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
                {CREATED_VIA_LABEL[rfx.createdVia] ?? rfx.createdVia}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Created</dt>
              <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{formatDate(rfx.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Approved</dt>
              <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">
                {rfx.approvedAt ? formatDate(rfx.approvedAt) : "Not yet approved"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">RFx ID</dt>
              <dd className="mt-0.5 font-mono text-xs font-medium text-slate-900 dark:text-slate-100">{rfx.id}</dd>
            </div>
          </dl>
        </header>

        {/* Summary */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryStat label="RFx lines" value={String(lines.length)} />
          <SummaryStat label="Total requested quantity" value={totalRequestedQuantity.toLocaleString("en-US")} />
          <SummaryStat label="Required comparison unit(s)" value={requiredUnitSymbols.join(", ")} />
          <SummaryStat label="Lines with technical requirements" value={String(technicalLines.length)} />
        </section>

        {/* RFx lines table */}
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">RFx lines</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Buyer&apos;s requested specification for each line, as snapshotted on this RFx. Highlighted entries
              differ from the current product master.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-6 py-3 font-medium">Line</th>
                  <th className="px-6 py-3 font-medium">Product</th>
                  <th className="px-6 py-3 font-medium">Requested specification</th>
                  <th className="px-6 py-3 font-medium">Quantity</th>
                  <th className="px-6 py-3 font-medium">Required unit</th>
                </tr>
              </thead>
              <tbody>
                {lines.map(({ line, product, requiredUnit, specEntries }) => (
                  <tr
                    key={line.id}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="px-6 py-4 align-top font-medium text-slate-900 dark:text-slate-100">
                      {line.lineNumber}
                    </td>
                    <td className="px-6 py-4 align-top text-slate-700 dark:text-slate-300">{product.name}</td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {specEntries.map((entry) => (
                          <span
                            key={entry.key}
                            title={
                              entry.divergesFromProductMaster
                                ? "Buyer-specific requirement for this RFx; not on the product master"
                                : undefined
                            }
                            className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                              entry.divergesFromProductMaster
                                ? "bg-amber-50 text-amber-800 ring-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800"
                                : "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
                            }`}
                          >
                            {entry.key}: {entry.value}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top text-slate-700 dark:text-slate-300">
                      {line.requestedQuantity.toLocaleString("en-US")}
                    </td>
                    <td className="px-6 py-4 align-top text-slate-700 dark:text-slate-300">
                      {requiredUnit ? `${requiredUnit.name} (${requiredUnit.symbol})` : "Unresolved"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Technical requirements */}
        <RequirementSection
          title="Technical requirements"
          description="Line-level technical requirements the buyer has stated on this RFx."
          entries={technicalLines.map(({ line, product }) => ({
            id: line.id,
            label: `Line ${line.lineNumber} — ${product.name}`,
            value: line.technicalRequirements!,
          }))}
          emptyMessage="No lines on this RFx carry an explicit technical requirement."
        />

        {/* Commercial requirements */}
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Commercial requirements</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              The quantity and comparison unit vendors must price against for each line.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-6 py-3 font-medium">Line</th>
                  <th className="px-6 py-3 font-medium">Product</th>
                  <th className="px-6 py-3 font-medium">Requested quantity</th>
                  <th className="px-6 py-3 font-medium">Required pricing unit</th>
                </tr>
              </thead>
              <tbody>
                {lines.map(({ line, product, requiredUnit }) => (
                  <tr key={line.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-100">{line.lineNumber}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{product.name}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      {line.requestedQuantity.toLocaleString("en-US")}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      {requiredUnit ? `${requiredUnit.name} (${requiredUnit.symbol})` : "Unresolved"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Delivery / terms */}
        <RequirementSection
          title="Delivery / terms"
          description="Line-level delivery requirements the buyer has stated on this RFx."
          entries={deliveryLines.map(({ line, product }) => ({
            id: line.id,
            label: `Line ${line.lineNumber} — ${product.name}`,
            value: line.deliveryRequirements!,
          }))}
          emptyMessage="No lines on this RFx carry an explicit delivery requirement."
        />
      </div>
    </main>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">{value}</p>
    </div>
  );
}

function RequirementSection({
  title,
  description,
  entries,
  emptyMessage,
}: {
  title: string;
  description: string;
  entries: { id: string; label: string; value: string }[];
  emptyMessage: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <div className="px-6 py-4">
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {entries.map((entry) => (
              <li key={entry.id} className="text-sm">
                <span className="font-medium text-slate-900 dark:text-slate-100">{entry.label}: </span>
                <span className="text-slate-600 dark:text-slate-300">{entry.value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
