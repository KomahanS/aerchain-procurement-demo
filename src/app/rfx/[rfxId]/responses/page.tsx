import Link from "next/link";
import { notFound } from "next/navigation";
import { getRfxDetails } from "@/domain/seed/rfx-details";
import { getVendorResponseWorkspace } from "@/domain/seed/vendor-response-workspace";
import {
  EXCEPTION_SEVERITY,
  EXCEPTION_SEVERITY_STYLE,
  EXCEPTION_TYPE_LABEL,
  PROCESSING_STATUS_LABEL,
  PROCESSING_STATUS_STYLE,
  RESOLUTION_STATUS_LABEL,
  RESOLUTION_STATUS_STYLE,
  SOURCE_FORMAT_LABEL,
} from "./presentation";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMoney(value: number | undefined, currency: string | undefined) {
  if (value === undefined) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency ?? "USD", maximumFractionDigits: 4 }).format(
    value,
  );
}

export default async function RFxResponsesPage({
  params,
}: {
  params: Promise<{ rfxId: string }>;
}) {
  const { rfxId } = await params;
  const details = getRfxDetails(rfxId);
  if (!details) notFound();

  const responses = getVendorResponseWorkspace(rfxId);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Link href={`/rfx/${rfxId}`} className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">
              RFx Details
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-100">RFx Workspace · Responses</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{details.rfx.title}</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {responses.length} vendor response{responses.length === 1 ? "" : "s"} received for{" "}
              {details.lines.length} RFx lines.
            </p>
          </div>
        </header>

        {responses.length === 0 && (
          <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            No vendor responses have been received for this RFx yet.
          </p>
        )}

        {responses.map((response) => (
          <section
            key={response.vendorResponse.id}
            className="flex flex-col gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Vendor response header / status */}
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{response.vendor.name}</h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  Received {formatDateTime(response.vendorResponse.receivedAt)}
                  {response.vendor.contactEmail ? ` · ${response.vendor.contactEmail}` : ""}
                </p>
              </div>
              <span
                className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${PROCESSING_STATUS_STYLE[response.processingStatus]}`}
              >
                {PROCESSING_STATUS_LABEL[response.processingStatus]}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Lines received" value={String(response.stats.totalLines)} />
              <Stat label="Mapped to RFx lines" value={`${response.stats.mappedLines}/${response.stats.totalLines}`} />
              <Stat label="Normalized (clear)" value={`${response.stats.clearLines}/${response.stats.totalLines}`} />
              <Stat label="Open exceptions" value={String(response.stats.openExceptions)} />
            </div>

            {/* Source documents */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Source documents</h3>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {response.documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
                  >
                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {SOURCE_FORMAT_LABEL[doc.format] ?? doc.format}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500 dark:text-slate-400" title={doc.fileRef}>
                      {doc.fileRef}
                    </p>
                    <p className="mt-0.5 text-slate-500 dark:text-slate-400">{formatDateTime(doc.receivedAt)}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Extracted lines */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Extracted response lines</h3>
              {response.lines.map((line) => (
                <ResponseLineCard key={line.vendorResponseLine.id} line={line} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

function ResponseLineCard({
  line,
}: {
  line: ReturnType<typeof getVendorResponseWorkspace>[number]["lines"][number];
}) {
  const { vendorResponseLine, document, rfxLine, rfxLineProduct, price, priceBasisUnit, normalization, unitResolution, comparisonUnit, exceptions, evidenceItems } =
    line;

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {rfxLine ? `RFx Line ${rfxLine.lineNumber}` : "Unmapped line"}
          </p>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {rfxLineProduct ? rfxLineProduct.name : vendorResponseLine.rawProductDescription}
          </p>
        </div>
        {normalization && (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${RESOLUTION_STATUS_STYLE[normalization.status]}`}
          >
            {RESOLUTION_STATUS_LABEL[normalization.status]} · {Math.round(normalization.confidence * 100)}% confidence
          </span>
        )}
      </div>

      <div className="grid gap-4 px-4 py-4 sm:grid-cols-2">
        {/* As stated by vendor */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            As stated by vendor
          </h4>
          <dl className="mt-2 space-y-1.5 text-sm">
            <Row term="Description" value={vendorResponseLine.rawProductDescription} />
            <Row term="Quantity" value={vendorResponseLine.rawQuantity ?? "—"} />
            <Row term="Unit / basis" value={vendorResponseLine.rawUnit ?? "—"} />
            {price && (
              <>
                <Row term="Quoted price" value={`${formatMoney(price.quotedPrice, price.currency)} ${price.priceBasisRaw}`} />
                {price.packSize !== undefined && <Row term="Pack size" value={String(price.packSize)} />}
                {price.discountRaw && <Row term="Discount" value={price.discountRaw} />}
                {price.freightRaw && <Row term="Freight" value={price.freightRaw} />}
                {price.taxRaw && <Row term="Tax" value={price.taxRaw} />}
              </>
            )}
            {document && (
              <Row term="Source document" value={`${SOURCE_FORMAT_LABEL[document.format] ?? document.format} · ${document.fileRef}`} />
            )}
          </dl>
        </div>

        {/* Normalized */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Normalized
          </h4>
          {normalization ? (
            <div className="mt-2 space-y-2 text-sm">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {normalization.normalizedPrice !== undefined && comparisonUnit
                  ? `${formatMoney(normalization.normalizedPrice, price?.currency)} / ${comparisonUnit.symbol}`
                  : "Cannot normalize yet"}
              </p>
              {unitResolution && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Unit match: {unitResolution.matchedUnitId ? priceBasisUnit?.name ?? "resolved" : "unresolved"} ·{" "}
                  {RESOLUTION_STATUS_LABEL[unitResolution.status]} · {Math.round(unitResolution.confidence * 100)}%
                </p>
              )}
              <ol className="list-decimal space-y-1 pl-4 text-xs text-slate-600 dark:text-slate-300">
                {normalization.calculation.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Not yet normalized.</p>
          )}
        </div>
      </div>

      {/* Exceptions */}
      {exceptions.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Exceptions
          </h4>
          <ul className="mt-2 space-y-2">
            {exceptions.map((exception) => (
              <li key={exception.id} className="flex flex-col gap-1 rounded-md bg-slate-50 px-3 py-2 text-xs dark:bg-slate-950 sm:flex-row sm:items-start sm:gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 font-medium ring-1 ring-inset ${EXCEPTION_SEVERITY_STYLE[EXCEPTION_SEVERITY[exception.type]]}`}
                  >
                    {EXCEPTION_SEVERITY[exception.type]} severity
                  </span>
                  <span className="inline-flex items-center rounded bg-slate-200 px-1.5 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {EXCEPTION_TYPE_LABEL[exception.type]}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">{exception.status.replace(/_/g, " ")}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">{exception.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Evidence */}
      <details className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Evidence ({evidenceItems.length})
        </summary>
        <ul className="mt-2 space-y-2 text-xs">
          {evidenceItems.map(({ evidence, sourceDocument }) => (
            <li key={evidence.id} className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-950">
              <p className="text-slate-700 dark:text-slate-300">&ldquo;{evidence.excerpt}&rdquo;</p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                {sourceDocument ? `${SOURCE_FORMAT_LABEL[sourceDocument.format] ?? sourceDocument.format} · ` : ""}
                {evidence.location ?? evidence.sourceRef} · extracted by {evidence.extractedBy}
              </p>
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}

function Row({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 text-slate-500 dark:text-slate-400">{term}</dt>
      <dd className="text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  );
}
