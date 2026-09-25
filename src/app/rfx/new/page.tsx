import Link from "next/link";

/** Placeholder destination for "Create RFx" until RFx creation (Manual/Import/AI Suggested) is built. */
export default function CreateRfxPlaceholderPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/rfx" className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">
              RFx
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-100">Create RFx</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Create RFx</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              RFx creation (Manual / Import / AI Suggested) is not built yet.
            </p>
          </div>
        </header>

        <section className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Nothing to show here yet.{" "}
          <Link href="/rfx" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            View the RFx list
          </Link>
          .
        </section>
      </div>
    </main>
  );
}
