import { notFound } from "next/navigation";
import { AnalystView } from "@/app/analyze-response/intelligence/analyst/analyst-view";
import { getVendorResponseWorkspace } from "@/domain/seed/vendor-response-workspace";

export default async function VendorAnalystPage({ params }: { params: Promise<{ rfxId: string; vendorId: string }> }) {
  const { rfxId, vendorId } = await params;
  const match = getVendorResponseWorkspace(rfxId).find((response) => response.vendor.id === vendorId);
  if (!match) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">AI Procurement Analyst</h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Ask about {match.vendor.name}&apos;s response on this RFx -- answers are sourced from verified data only.
        </p>
      </div>
      <AnalystView
        backHref={`/rfx/${rfxId}/responses/${vendorId}`}
        extraBody={{ rfxId, vendorResponseId: match.vendorResponse.id }}
        suggestedQuestions={[
          "Why can't I compare Line 5?",
          "Why is this line priced the way it is?",
          "What should I ask the vendor?",
          "Which prices can I safely compare?",
          "What issues remain unresolved?",
        ]}
      />
    </div>
  );
}
