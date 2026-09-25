import { notFound } from "next/navigation";
import { getRfxDetails } from "@/domain/seed/rfx-details";
import { Badge } from "@/components/ui/badge";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const CREATED_VIA_LABEL: Record<string, string> = { manual: "Manual", import: "Import", ai_suggested: "AI Suggested" };

export default async function RequirementsPage({ params }: { params: Promise<{ rfxId: string }> }) {
  const { rfxId } = await params;
  const details = getRfxDetails(rfxId);
  if (!details) notFound();

  const { rfx, lines, totalRequestedQuantity, requiredUnitSymbols } = details;
  const technicalLines = lines.filter((l) => l.line.technicalRequirements);
  const deliveryLines = lines.filter((l) => l.line.deliveryRequirements);

  return (
    <div className="flex flex-col gap-6">
      {/* RFx metadata */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Category</dt>
            <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{rfx.category}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Created via</dt>
            <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{CREATED_VIA_LABEL[rfx.createdVia] ?? rfx.createdVia}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Created</dt>
            <dd className="mt-0.5 font-medium text-slate-900 dark:text-slate-100">{formatDate(rfx.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">RFx ID</dt>
            <dd className="mt-0.5 font-mono text-xs font-medium text-slate-900 dark:text-slate-100">{rfx.id}</dd>
          </div>
        </dl>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryStat label="Line items" value={String(lines.length)} />
        <SummaryStat label="Total requested quantity" value={totalRequestedQuantity.toLocaleString("en-US")} />
        <SummaryStat label="Comparison unit(s)" value={requiredUnitSymbols.join(", ")} />
        <SummaryStat label="Lines with technical requirements" value={String(technicalLines.length)} />
      </section>

      {/* RFx lines table */}
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Line items</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            What the buyer asked for, as sent to vendors. Highlighted specs differ from the current product master.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="px-5 py-3 font-medium">Line</th>
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-5 py-3 font-medium">Specification</th>
                <th className="px-5 py-3 text-right font-medium">Quantity</th>
                <th className="px-5 py-3 font-medium">Comparison unit</th>
              </tr>
            </thead>
            <tbody>
              {lines.map(({ line, product, requiredUnit, specEntries }) => (
                <tr key={line.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-4 align-top font-medium text-slate-900 dark:text-slate-100">{line.lineNumber}</td>
                  <td className="px-5 py-4 align-top text-slate-700 dark:text-slate-300">{product.name}</td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-wrap gap-1.5">
                      {specEntries.map((entry) => (
                        <span
                          key={entry.key}
                          title={entry.divergesFromProductMaster ? "Buyer-specific requirement for this RFx; not on the product master" : undefined}
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
                  <td className="px-5 py-4 align-top text-right tabular-nums text-slate-700 dark:text-slate-300">
                    {line.requestedQuantity.toLocaleString("en-US")}
                  </td>
                  <td className="px-5 py-4 align-top text-slate-700 dark:text-slate-300">
                    {requiredUnit ? (
                      `${requiredUnit.name} (${requiredUnit.symbol})`
                    ) : (
                      <Badge tone="amber">Unresolved</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <RequirementSection
        title="Technical requirements"
        description="Line-level technical requirements the buyer has stated on this RFx."
        entries={technicalLines.map(({ line, product }) => ({ id: line.id, label: `Line ${line.lineNumber} — ${product.name}`, value: line.technicalRequirements! }))}
        emptyMessage="No lines on this RFx carry an explicit technical requirement."
      />

      <RequirementSection
        title="Delivery / terms"
        description="Line-level delivery requirements the buyer has stated on this RFx."
        entries={deliveryLines.map(({ line, product }) => ({ id: line.id, label: `Line ${line.lineNumber} — ${product.name}`, value: line.deliveryRequirements! }))}
        emptyMessage="No lines on this RFx carry an explicit delivery requirement."
      />
    </div>
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
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <div className="px-5 py-4">
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
