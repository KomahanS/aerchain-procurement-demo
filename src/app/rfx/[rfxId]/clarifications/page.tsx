import { notFound } from "next/navigation";
import { corrugatedSeed } from "@/domain/seed/corrugated-seed";
import { getRfxDetails } from "@/domain/seed/rfx-details";
import { EmptyState } from "@/components/ui/empty-state";
import { EXCEPTION_TYPE_LABEL } from "@/app/rfx/[rfxId]/responses/presentation";
import { ClarificationCard } from "./clarification-card";

/**
 * Best-effort fallback for a "missing line" exception, which has no
 * vendorResponseLineId to look up (the vendor never submitted that line at
 * all) -- every such exception's description names the line explicitly
 * (e.g. "did not include Line 5"), so this recovers it from the text
 * rather than under-reporting which lines a clarification actually covers.
 */
function lineNumberFromDescription(description: string): number | undefined {
  const match = description.match(/\bLine\s+(\d+)\b/i);
  return match ? Number(match[1]) : undefined;
}

function subjectFor(exceptionTypes: string[]): string {
  if (exceptionTypes.includes("unknown_unit") || exceptionTypes.includes("price_basis_mismatch")) return "Clarification required — pricing basis";
  if (exceptionTypes.includes("technical_compliance")) return "Clarification required — compliance documentation";
  if (exceptionTypes.includes("contradictory")) return "Clarification required — conflicting terms";
  if (exceptionTypes.includes("missing")) return "Clarification required — missing pricing";
  return "Clarification required";
}

export default async function ClarificationsPage({ params }: { params: Promise<{ rfxId: string }> }) {
  const { rfxId } = await params;
  const details = getRfxDetails(rfxId);
  if (!details) notFound();

  const vendorsById = new Map(corrugatedSeed.vendors.map((v) => [v.id, v]));
  const exceptionsById = new Map(corrugatedSeed.exceptions.map((e) => [e.id, e]));
  const vrlById = new Map(corrugatedSeed.vendorResponseLines.map((l) => [l.id, l]));
  const rfxLinesById = new Map(corrugatedSeed.rfxLines.map((l) => [l.id, l]));

  const clarifications = corrugatedSeed.clarifications.filter((c) => c.rfxId === rfxId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Clarifications</h2>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Every open question Aerchain has drafted to resolve missing, ambiguous or contradictory vendor information. Nothing is sent without your approval.
        </p>
      </div>

      {clarifications.length === 0 ? (
        <EmptyState title="No clarifications needed" description="Aerchain will draft a clarification whenever a vendor response has an exception it can't safely resolve on its own." />
      ) : (
        <div className="flex flex-col gap-4">
          {clarifications.map((clarification) => {
            const vendor = vendorsById.get(clarification.vendorId);
            const exceptions = clarification.exceptionIds.map((id) => exceptionsById.get(id)).filter((e) => !!e);
            const lineNumbers = Array.from(
              new Set(
                exceptions
                  .map((e) => {
                    const rfxLineId = e!.vendorResponseLineId ? vrlById.get(e!.vendorResponseLineId)?.rfxLineId : undefined;
                    const fromLine = rfxLineId ? rfxLinesById.get(rfxLineId)?.lineNumber : undefined;
                    return fromLine ?? lineNumberFromDescription(e!.description);
                  })
                  .filter((n): n is number => n !== undefined),
              ),
            ).sort((a, b) => a - b);
            const affectedLines = lineNumbers.length > 0 ? `Line${lineNumbers.length > 1 ? "s" : ""} ${lineNumbers.join(", ")}` : "General";
            const subject = subjectFor(exceptions.map((e) => e!.type));

            return (
              <ClarificationCard
                key={clarification.id}
                vendorName={vendor?.name ?? "Unknown vendor"}
                subject={subject}
                question={clarification.question}
                affectedLines={`${affectedLines} · ${exceptions.map((e) => EXCEPTION_TYPE_LABEL[e!.type]).join(", ")}`}
                alreadySent={clarification.status === "sent" || clarification.status === "answered"}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
