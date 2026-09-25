import type { Clarification, Exception, RFx } from "@/domain";
import { corrugatedSeed } from "@/domain/seed/corrugated-seed";
import { getRfxDetails } from "@/domain/seed/rfx-details";
import {
  getVendorResponseWorkspace,
  type VendorResponseLineViewModel,
  type VendorResponseViewModel,
} from "@/domain/seed/vendor-response-workspace";

/**
 * Buyer-facing comparability bucket for one vendor response line. Derived
 * entirely from the existing NormalizationResult/Exception data already on
 * the workspace view model -- not a new stored field, just how this page
 * groups the same facts the Responses page already shows.
 */
export type ComparabilityBucket = "safely_comparable" | "needs_attention" | "unresolved";

export interface ResponseIntelligenceLine extends VendorResponseLineViewModel {
  bucket: ComparabilityBucket;
}

export interface ExceptionGroup {
  line: ResponseIntelligenceLine;
  /** The existing seeded Clarification covering this line's exception(s), if one has been drafted. */
  clarification: Clarification | undefined;
}

export interface ResponseIntelligenceViewModel {
  rfx: RFx;
  vendorResponse: VendorResponseViewModel;
  lines: ResponseIntelligenceLine[];
  comparability: {
    safelyComparable: number;
    needsAttention: number;
    unresolved: number;
  };
  exceptionGroups: ExceptionGroup[];
}

function bucketForLine(line: VendorResponseLineViewModel): ComparabilityBucket {
  const hasOpenException = line.exceptions.some((exception) => exception.status !== "resolved");
  const hasNormalizedPrice = line.normalization?.normalizedPrice !== undefined;

  if (!hasNormalizedPrice) return "unresolved";
  if (line.normalization?.status === "clear" && !hasOpenException) return "safely_comparable";
  return "needs_attention";
}

/**
 * Assembles the Response Intelligence view purely from existing seed data:
 * getRfxDetails/getVendorResponseWorkspace for the workspace facts, plus a
 * direct read of corrugatedSeed.clarifications (no dedicated accessor
 * exists yet) to attach the already-drafted clarification for each
 * exception. No new/mock domain data is introduced.
 */
export function getResponseIntelligence(): ResponseIntelligenceViewModel | undefined {
  const rfxId = corrugatedSeed.rfx.id;
  const rfxDetails = getRfxDetails(rfxId);
  const vendorResponse = getVendorResponseWorkspace(rfxId)[0];
  if (!rfxDetails || !vendorResponse) return undefined;

  const lines: ResponseIntelligenceLine[] = vendorResponse.lines.map((line) => ({
    ...line,
    bucket: bucketForLine(line),
  }));

  const comparability = {
    safelyComparable: lines.filter((line) => line.bucket === "safely_comparable").length,
    needsAttention: lines.filter((line) => line.bucket === "needs_attention").length,
    unresolved: lines.filter((line) => line.bucket === "unresolved").length,
  };

  const exceptionGroups: ExceptionGroup[] = lines
    .filter((line) => line.exceptions.length > 0)
    .map((line) => ({
      line,
      clarification: corrugatedSeed.clarifications.find((clarification) =>
        line.exceptions.some((exception) => clarification.exceptionIds.includes(exception.id)),
      ),
    }));

  return { rfx: rfxDetails.rfx, vendorResponse, lines, comparability, exceptionGroups };
}

// --- Clarification drafting --------------------------------------------

export interface ClarificationDraft {
  subject: string;
  message: string;
}

function priceLineText(line: ResponseIntelligenceLine): string {
  if (line.price) {
    const amount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: line.price.currency,
      maximumFractionDigits: 4,
    }).format(line.price.quotedPrice);
    return `${amount} ${line.price.priceBasisRaw}`;
  }
  if (line.vendorResponseLine.rawUnit) return `stated as "${line.vendorResponseLine.rawUnit}"`;
  return "not clearly stated";
}

function subjectFor(exceptions: Exception[], lineNumber: number | undefined): string {
  const types = new Set(exceptions.map((exception) => exception.type));
  if (types.has("unknown_unit") || types.has("price_basis_mismatch")) return "Clarification required – pricing basis";
  if (types.has("technical_compliance")) return "Clarification required – compliance documentation";
  return `Clarification required – Line ${lineNumber ?? "response"}`;
}

/**
 * Generic, per-exception-type questions -- keyed off Exception.type, the
 * same field EXCEPTION_TYPE_LABEL already keys off. Works for any line with
 * these exception types, not just this seed's pallet-quantity example.
 */
function genericQuestionsFor(exceptions: Exception[], priceBasisRaw: string | undefined): string[] {
  const basisNoun = priceBasisRaw?.replace(/^per\s+/i, "") || "pack";
  const questions: string[] = [];

  for (const exception of exceptions) {
    switch (exception.type) {
      case "unknown_unit":
      case "price_basis_mismatch":
        questions.push(`Number of pieces (or units) included per ${basisNoun}.`);
        questions.push("Equivalent price per piece, if available.");
        break;
      case "technical_compliance":
        questions.push("The required technical/compliance documentation for this line.");
        break;
      case "missing":
      case "ambiguous":
      case "contradictory":
        questions.push(`Clarification on: ${exception.description}`);
        break;
    }
  }
  questions.push("Whether the quoted price includes freight and applicable taxes.");

  return Array.from(new Set(questions));
}

/**
 * Builds an editable clarification draft for one exception group. Prefers
 * the existing seeded Clarification.question (real drafted content) when
 * one is available for this line; otherwise synthesizes numbered questions
 * purely from the line's Exception records, so this also works for a line
 * that has no pre-drafted Clarification yet.
 */
export function generateClarificationDraft(group: ExceptionGroup, vendorName: string): ClarificationDraft {
  const { line, clarification } = group;
  const subject = subjectFor(line.exceptions, line.rfxLine?.lineNumber);
  const intro = `Hi ${vendorName},\n\nThank you for your quotation. We noticed that the quoted price for this line is ${priceLineText(line)}.\n\n`;
  const body = clarification
    ? `Could you please confirm the following:\n\n${clarification.question}`
    : `Could you please confirm:\n${genericQuestionsFor(line.exceptions, line.price?.priceBasisRaw)
        .map((question, i) => `${i + 1}. ${question}`)
        .join("\n")}`;
  const signoff = "\n\nThanks,\nProcurement Team";

  return { subject, message: `${intro}${body}${signoff}` };
}
