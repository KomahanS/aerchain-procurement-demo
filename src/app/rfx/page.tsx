import Link from "next/link";
import { STATUS_LABEL, STATUS_STYLE } from "./presentation";
import { getRfxList } from "./view-model";

export default function RfxListPage() {
  const items = getRfxList();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-100">RFx</span>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">RFx</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">All RFx records for this tenant.</p>
            </div>
            <Link
              href="/rfx/new"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Create RFx
            </Link>
          </div>
        </header>

        <div className="flex flex-col gap-4">
          {items.map(({ rfx, lineCount, vendorResponseCount, vendorNames }) => (
            <div
              key={rfx.id}
              className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{rfx.title}</h2>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[rfx.status]}`}
                  >
                    {STATUS_LABEL[rfx.status]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {rfx.id} · {lineCount} line{lineCount === 1 ? "" : "s"} ·{" "}
                  {vendorResponseCount > 0
                    ? `${vendorResponseCount} vendor response${vendorResponseCount === 1 ? "" : "s"} (${vendorNames.join(", ")})`
                    : "No vendor responses yet"}
                </p>
              </div>
              <Link
                href={`/rfx/${rfx.id}`}
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
              >
                Open RFx
              </Link>
            </div>
          ))}

          {items.length === 0 && (
            <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              No RFx records yet.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
