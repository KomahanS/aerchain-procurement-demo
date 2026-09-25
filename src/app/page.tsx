import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Aerchain</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Buyer creates an RFx, vendors respond in messy formats, AI extracts and understands their responses.
          </p>
        </header>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">RFx</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Create a new RFx or open one you&apos;ve already sent.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/rfx/new"
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
            >
              Create RFx
            </Link>
            <Link
              href="/rfx"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              View RFx list
            </Link>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Vendor responses</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Upload a vendor&apos;s response document and see it move through extraction and AI interpretation.
          </p>
          <Link
            href="/analyze-response"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            Analyze Vendor Response
          </Link>
        </section>
      </div>
    </main>
  );
}
