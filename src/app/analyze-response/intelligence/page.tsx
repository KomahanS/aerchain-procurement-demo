import Link from "next/link";
import {
  EXCEPTION_SEVERITY,
  EXCEPTION_SEVERITY_STYLE,
  EXCEPTION_TYPE_LABEL,
  PROCESSING_STATUS_LABEL,
  PROCESSING_STATUS_STYLE,
  SOURCE_FORMAT_LABEL,
} from "@/app/rfx/[rfxId]/responses/presentation";
import { ClarificationAction } from "./clarification-action";
import { BUCKET_LABEL, BUCKET_STYLE, MISSING_INFO_BY_EXCEPTION_TYPE } from "./presentation";
import { getResponseIntelligence, type ResponseIntelligenceLine } from "./view-model";

function formatMoney(value: number | undefined, currency: string | undefined) {
  if (value === undefined) return undefined;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "USD",
    maximumFractionDigits: 4,
  }).format(value);
}

function normalizedPriceLabel(line: ResponseIntelligenceLine): string {
  if (line.normalization?.normalizedPrice !== undefined && line.comparisonUnit) {
    return `${formatMoney(line.normalization.normalizedPrice, line.price?.currency)} / ${line.comparisonUnit.symbol}`;
  }
  return "Not yet comparable";
}

function whyLabel(line: ResponseIntelligenceLine): string {
  if (line.bucket === "safely_comparable") {
    return line.normalization?.calculation.at(-1) ?? "Fully normalized.";
  }
  return line.unitResolution?.notes ?? line.normalization?.calculation.at(-1) ?? "Cannot yet be compared.";
}

export default function ResponseIntelligencePage() {
  const intelligence = getResponseIntelligence();

  if (!intelligence) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-4xl rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          No vendor response data is available yet.{" "}
          <Link href="/analyze-response" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Analyze a response
          </Link>
          .
        </div>
      </main>
    );
  }

  const { rfx, vendorResponse, lines, comparability, exceptionGroups } = intelligence;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">
              Dashboard
            </Link>
            <span>/</span>
            <Link
              href="/analyze-response"
              className="hover:text-slate-900 hover:underline dark:hover:text-slate-100"
            >
              Analyze Vendor Response
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-100">Response Intelligence</span>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Response Intelligence</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{rfx.title}</p>
            </div>
            <Link
              href="/analyze-response/intelligence/analyst"
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
            >
              Ask the AI Procurement Analyst
            </Link>
          </div>
        </header>

        {/* Vendor response summary */}
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{vendorResponse.vendor.name}</h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {vendorResponse.documents.length} source document{vendorResponse.documents.length === 1 ? "" : "s"}
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${PROCESSING_STATUS_STYLE[vendorResponse.processingStatus]}`}
            >
              {PROCESSING_STATUS_LABEL[vendorResponse.processingStatus]}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Extracted lines" value={String(vendorResponse.stats.totalLines)} />
            <Stat label="Open exceptions" value={String(vendorResponse.stats.openExceptions)} />
            <Stat label="Mapped to RFx lines" value={`${vendorResponse.stats.mappedLines}/${vendorResponse.stats.totalLines}`} />
            <Stat label="Fully normalized" value={`${vendorResponse.stats.clearLines}/${vendorResponse.stats.totalLines}`} />
          </div>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {vendorResponse.documents.map((doc) => (
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
              </li>
            ))}
          </ul>
        </section>

        {/* Exception summary */}
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Comparability</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            How each line stands right now -- no value here has been guessed.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(["safely_comparable", "needs_attention", "unresolved"] as const).map((bucket) => (
              <div
                key={bucket}
                className={`rounded-lg px-4 py-3 ring-1 ring-inset ${BUCKET_STYLE[bucket]}`}
              >
                <p className="text-xs font-medium uppercase tracking-wide">{BUCKET_LABEL[bucket]}</p>
                <p className="mt-1 text-2xl font-semibold">{comparability[toCountKey(bucket)]}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Lines */}
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Lines</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-6 py-3 font-medium">Line</th>
                  <th className="px-6 py-3 font-medium">Vendor stated</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Normalized</th>
                  <th className="px-6 py-3 font-medium">Why</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.vendorResponseLine.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
                    <td className="px-6 py-4 align-top">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {line.rfxLine ? `Line ${line.rfxLine.lineNumber}` : "Unmapped"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {line.rfxLineProduct?.name ?? line.vendorResponseLine.rawProductDescription}
                      </p>
                    </td>
                    <td className="px-6 py-4 align-top text-slate-700 dark:text-slate-300">
                      {line.price ? `${formatMoney(line.price.quotedPrice, line.price.currency)} ${line.price.priceBasisRaw}` : "—"}
                      {line.vendorResponseLine.rawQuantity && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Qty: {line.vendorResponseLine.rawQuantity}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${BUCKET_STYLE[line.bucket]}`}
                      >
                        {BUCKET_LABEL[line.bucket]}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top font-medium text-slate-900 dark:text-slate-100">
                      {normalizedPriceLabel(line)}
                    </td>
                    <td className="px-6 py-4 align-top text-xs text-slate-600 dark:text-slate-300">{whyLabel(line)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Exception detail */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Exceptions</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              What the vendor said, what Aerchain understood, and why comparison is blocked -- with evidence and a
              proposed next step for each.
            </p>
          </div>

          {exceptionGroups.length === 0 && (
            <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              No open exceptions for this vendor response.
            </p>
          )}

          {exceptionGroups.map(({ line, clarification }) => (
            <article
              key={line.vendorResponseLine.id}
              className="overflow-hidden rounded-lg border border-slate-200 shadow-sm dark:border-slate-800"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {line.rfxLine ? `RFx Line ${line.rfxLine.lineNumber}` : "Unmapped line"}
                  </p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {line.rfxLineProduct?.name ?? line.vendorResponseLine.rawProductDescription}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${BUCKET_STYLE[line.bucket]}`}
                >
                  {BUCKET_LABEL[line.bucket]}
                </span>
              </div>

              <div className="grid gap-4 bg-white px-4 py-4 dark:bg-slate-900 sm:grid-cols-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    What the vendor said
                  </h3>
                  <dl className="mt-2 space-y-1.5 text-sm">
                    <Row term="Description" value={line.vendorResponseLine.rawProductDescription} />
                    <Row term="Quantity" value={line.vendorResponseLine.rawQuantity ?? "—"} />
                    <Row term="Unit / basis" value={line.vendorResponseLine.rawUnit ?? "—"} />
                    {line.price && (
                      <Row
                        term="Quoted price"
                        value={`${formatMoney(line.price.quotedPrice, line.price.currency)} ${line.price.priceBasisRaw}`}
                      />
                    )}
                  </dl>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    What Aerchain understood
                  </h3>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                    {line.unitResolution?.notes ?? "Could not be matched to a known unit."}
                  </p>
                  {line.normalization && line.normalization.calculation.length > 0 && (
                    <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-slate-600 dark:text-slate-400">
                      {line.normalization.calculation.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>

              {/* Why comparison is blocked */}
              <div className="border-t border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Why comparison is blocked
                </h3>
                <ul className="mt-2 space-y-2">
                  {line.exceptions.map((exception) => (
                    <li
                      key={exception.id}
                      className="flex flex-col gap-1 rounded-md bg-slate-50 px-3 py-2 text-xs dark:bg-slate-950 sm:flex-row sm:items-start sm:gap-3"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center rounded px-1.5 py-0.5 font-medium ring-1 ring-inset ${EXCEPTION_SEVERITY_STYLE[EXCEPTION_SEVERITY[exception.type]]}`}
                        >
                          {EXCEPTION_SEVERITY[exception.type]} severity
                        </span>
                        <span className="inline-flex items-center rounded bg-slate-200 px-1.5 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {EXCEPTION_TYPE_LABEL[exception.type]}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{exception.description}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Missing information */}
              <div className="border-t border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Missing information
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600 dark:text-slate-300">
                  {Array.from(new Set(line.exceptions.map((exception) => MISSING_INFO_BY_EXCEPTION_TYPE[exception.type]))).map(
                    (info) => (
                      <li key={info}>{info}</li>
                    ),
                  )}
                </ul>
              </div>

              {/* Recommended action */}
              <div className="border-t border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Recommended action
                </h3>
                {clarification && (
                  <p className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                    <span className="font-medium text-slate-700 dark:text-slate-200">Existing clarification on file:</span>{" "}
                    &ldquo;{clarification.question}&rdquo;
                  </p>
                )}
                <div className="mt-2">
                  <ClarificationAction group={{ line, clarification }} vendorName={vendorResponse.vendor.name} />
                </div>
              </div>

              {/* Evidence */}
              <details className="border-t border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Evidence ({line.evidenceItems.length})
                </summary>
                <ul className="mt-2 space-y-2 text-xs">
                  {line.evidenceItems.map(({ evidence, sourceDocument }) => (
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
          ))}
        </section>
      </div>
    </main>
  );
}

function toCountKey(bucket: "safely_comparable" | "needs_attention" | "unresolved") {
  return bucket === "safely_comparable" ? "safelyComparable" : bucket === "needs_attention" ? "needsAttention" : "unresolved";
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
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
