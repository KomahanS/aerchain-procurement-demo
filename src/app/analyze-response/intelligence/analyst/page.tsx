import Link from "next/link";
import { AnalystView } from "./analyst-view";

export default function AnalystPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/analyze-response" className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">
              Analyze Vendor Response
            </Link>
            <span>/</span>
            <Link href="/analyze-response/intelligence" className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">
              Response Intelligence
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-100">AI Procurement Analyst</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">AI Procurement Analyst</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Ask questions about vendor responses, comparisons, exceptions and clarifications.
            </p>
          </div>
        </header>

        <AnalystView backHref="/analyze-response/intelligence" />
      </div>
    </main>
  );
}
