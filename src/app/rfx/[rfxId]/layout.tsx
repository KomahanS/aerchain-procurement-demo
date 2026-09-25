import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRfxDetails } from "@/domain/seed/rfx-details";
import { getVendorResponseWorkspace } from "@/domain/seed/vendor-response-workspace";
import { corrugatedSeed } from "@/domain/seed/corrugated-seed";
import { STATUS_LABEL } from "../presentation";
import { Badge } from "@/components/ui/badge";
import { WorkspaceTabs, type WorkspaceTab } from "./workspace-tabs";

export default async function RfxWorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ rfxId: string }>;
}) {
  const { rfxId } = await params;
  const details = getRfxDetails(rfxId);
  if (!details) notFound();

  const responses = getVendorResponseWorkspace(rfxId);
  const openExceptions = responses.reduce((sum, r) => sum + r.stats.openExceptions, 0);
  const responsesNeedingReview = responses.filter((r) => r.processingStatus === "needs_clarification").length;
  const openClarifications = corrugatedSeed.clarifications.filter(
    (c) => c.rfxId === rfxId && c.status !== "answered",
  ).length;

  const tabs: WorkspaceTab[] = [
    { key: "overview", label: "Overview", href: `/rfx/${rfxId}` },
    { key: "requirements", label: "Requirements", href: `/rfx/${rfxId}/requirements` },
    {
      key: "responses",
      label: "Responses",
      href: `/rfx/${rfxId}/responses`,
      count: responsesNeedingReview || undefined,
      countTone: "amber",
    },
    { key: "comparison", label: "Comparison", href: `/rfx/${rfxId}/comparison` },
    {
      key: "clarifications",
      label: "Clarifications",
      href: `/rfx/${rfxId}/clarifications`,
      count: openClarifications || undefined,
      countTone: "amber",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-10">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">
              Dashboard
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <Link href="/rfx" className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">
              RFx
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-slate-900 dark:text-slate-100">{details.rfx.title}</span>
          </nav>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  {details.rfx.title}
                </h1>
                <Badge tone={statusTone(details.rfx.status)}>{STATUS_LABEL[details.rfx.status]}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {details.lines.length} line item{details.lines.length === 1 ? "" : "s"} · {responses.length} vendor
                response{responses.length === 1 ? "" : "s"}
                {openExceptions > 0 && (
                  <>
                    {" "}
                    · <span className="font-medium text-amber-700 dark:text-amber-400">{openExceptions} open issue{openExceptions === 1 ? "" : "s"}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <WorkspaceTabs tabs={tabs} />
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10">{children}</div>
    </main>
  );
}

function statusTone(status: string): "neutral" | "info" | "amber" | "emerald" | "indigo" {
  switch (status) {
    case "draft":
      return "neutral";
    case "sent":
      return "info";
    case "responses_in_progress":
      return "amber";
    case "under_comparison":
      return "indigo";
    case "awarded":
      return "emerald";
    default:
      return "neutral";
  }
}
