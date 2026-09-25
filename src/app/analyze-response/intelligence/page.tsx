import Link from "next/link";
import { ResponseIntelligenceView } from "./intelligence-view";
import { getResponseIntelligence } from "./view-model";

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
            <span className="text-slate-900 dark:text-slate-100">Response Intelligence</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Response Intelligence</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{intelligence.rfx.title}</p>
          </div>
        </header>

        <ResponseIntelligenceView intelligence={intelligence} analystHref="/analyze-response/intelligence/analyst" />
      </div>
    </main>
  );
}
