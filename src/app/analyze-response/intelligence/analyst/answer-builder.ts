import { corrugatedSeed } from "@/domain/seed/corrugated-seed";
import { MISSING_INFO_BY_EXCEPTION_TYPE } from "../presentation";
import {
  generateClarificationDraft,
  type ExceptionGroup,
  type ResponseIntelligenceLine,
  type ResponseIntelligenceViewModel,
} from "../view-model";
import type { ParsedIntent } from "./intent";
import { NOT_ENOUGH_INFO, type AnalystAnswer, type AnalystEvidenceRef, type AnalystFact, type QuestionIntent } from "./types";

function formatMoney(value: number | undefined, currency: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency ?? "USD",
    maximumFractionDigits: 4,
  }).format(value);
}

function evidenceRefs(line: ResponseIntelligenceLine): AnalystEvidenceRef[] {
  return line.evidenceItems.map(({ evidence, sourceDocument }) => ({
    excerpt: evidence.excerpt,
    source: sourceDocument
      ? `${sourceDocument.format} · ${evidence.location ?? evidence.sourceRef}`
      : (evidence.location ?? evidence.sourceRef),
  }));
}

function findLine(intelligence: ResponseIntelligenceViewModel, lineNumber: number | undefined) {
  if (lineNumber === undefined) return undefined;
  return intelligence.lines.find((line) => line.rfxLine?.lineNumber === lineNumber);
}

function requiredUnitSymbol(line: ResponseIntelligenceLine): string | undefined {
  const unit = line.rfxLine ? corrugatedSeed.units.find((u) => u.id === line.rfxLine!.requiredUnitId) : undefined;
  return unit?.symbol;
}

function missingInfoFor(line: ResponseIntelligenceLine): string[] {
  return Array.from(new Set(line.exceptions.map((exception) => MISSING_INFO_BY_EXCEPTION_TYPE[exception.type])));
}

function base(intent: QuestionIntent, answer: string, keyFacts: AnalystFact[] = [], evidence: AnalystEvidenceRef[] = []): AnalystAnswer {
  return { intent, answer, usedAi: false, aiUnavailable: false, keyFacts, evidence };
}

/** Vendor price / basis / RFx comparison basis / missing info / why normalization is unsafe -- for one blocked line. */
function explainBlockedLine(line: ResponseIntelligenceLine, intent: QuestionIntent): AnalystAnswer {
  const vendorPrice = line.price
    ? `${formatMoney(line.price.quotedPrice, line.price.currency)} ${line.price.priceBasisRaw}`
    : "not clearly stated";
  const vendorBasis = line.price?.priceBasisRaw ?? line.vendorResponseLine.rawUnit ?? "not stated";
  const reqUnit = requiredUnitSymbol(line);
  const missing = missingInfoFor(line);
  const whyUnsafe =
    line.unitResolution?.notes ?? line.normalization?.calculation.at(-1) ?? "The price basis could not be matched to a known unit.";

  const keyFacts: AnalystFact[] = [
    { label: "Vendor price", value: vendorPrice },
    { label: "Vendor price basis", value: vendorBasis },
    { label: "RFx comparison basis", value: reqUnit ? `per ${reqUnit}` : "Not resolved" },
    ...missing.map((info, i) => ({ label: missing.length > 1 ? `Missing information ${i + 1}` : "Missing information", value: info })),
  ];

  const missingClause = missing
    .map((info) => info.replace(/\.$/, ""))
    .map((info) => info.charAt(0).toLowerCase() + info.slice(1))
    .join("; ");

  const answer =
    `Line ${line.rfxLine?.lineNumber} can't be compared yet: the vendor quoted ${vendorPrice}, but the RFx needs a price ` +
    `${reqUnit ? `per ${reqUnit}` : "in a specific comparison unit"}, and ${missingClause || "required information"} ` +
    `${missing.length > 1 ? "are" : "is"} missing. ${whyUnsafe} Normalizing without it would mean guessing a conversion, which Aerchain does not do.`;

  return {
    intent,
    answer,
    usedAi: false,
    aiUnavailable: false,
    keyFacts,
    evidence: evidenceRefs(line),
    relatedException: line.exceptions[0] ? { type: line.exceptions[0].type, description: line.exceptions[0].description } : undefined,
  };
}

function buildWhyCantCompare(intelligence: ResponseIntelligenceViewModel, lineNumber: number | undefined): AnalystAnswer {
  if (lineNumber !== undefined) {
    const line = findLine(intelligence, lineNumber);
    if (!line) return base("why_cant_compare", NOT_ENOUGH_INFO);
    if (line.bucket === "safely_comparable") {
      return base(
        "why_cant_compare",
        `Line ${line.rfxLine?.lineNumber} is actually safely comparable -- there's no blocking issue on this line.`,
        [
          {
            label: "Normalized price",
            value:
              line.normalization?.normalizedPrice !== undefined && line.comparisonUnit
                ? `${formatMoney(line.normalization.normalizedPrice, line.price?.currency)} / ${line.comparisonUnit.symbol}`
                : "Not yet comparable",
          },
        ],
        evidenceRefs(line),
      );
    }
    return explainBlockedLine(line, "why_cant_compare");
  }

  // No line specified -- summarize every blocked line for this vendor.
  const blocked = intelligence.lines.filter((line) => line.bucket !== "safely_comparable");
  if (blocked.length === 0) {
    return base("why_cant_compare", "Every line from this vendor is currently safely comparable -- nothing is blocking comparison right now.", [
      { label: "Blocked lines", value: "0" },
    ]);
  }
  const keyFacts = blocked.map((line) => ({
    label: `Line ${line.rfxLine?.lineNumber ?? "?"}`,
    value: line.unitResolution?.notes ?? line.normalization?.calculation.at(-1) ?? "Cannot be compared yet.",
  }));
  const answer = `${blocked.length} line(s) from ${intelligence.vendorResponse.vendor.name} cannot currently be compared: ${blocked
    .map((line) => `Line ${line.rfxLine?.lineNumber}`)
    .join(", ")}.`;
  return base("why_cant_compare", answer, keyFacts, blocked.flatMap(evidenceRefs));
}

function buildWhyPrice(intelligence: ResponseIntelligenceViewModel, lineNumber: number | undefined): AnalystAnswer {
  const line = findLine(intelligence, lineNumber);
  if (!line) return base("why_price", NOT_ENOUGH_INFO);

  if (!line.normalization || line.normalization.normalizedPrice === undefined) {
    return explainBlockedLine(line, "why_price");
  }

  const steps = line.normalization.calculation;
  const finalPrice = line.comparisonUnit
    ? `${formatMoney(line.normalization.normalizedPrice, line.price?.currency)} / ${line.comparisonUnit.symbol}`
    : (formatMoney(line.normalization.normalizedPrice, line.price?.currency) ?? "unknown");

  const keyFacts: AnalystFact[] = steps.map((step, i) => ({ label: `Step ${i + 1}`, value: step }));
  const answer = `Line ${line.rfxLine?.lineNumber} normalizes to ${finalPrice}. ${steps.join(" ")}`;

  return base("why_price", answer, keyFacts, evidenceRefs(line));
}

function buildWhatToRequest(
  intelligence: ResponseIntelligenceViewModel,
  lineNumber: number | undefined,
  vendorName: string,
): AnalystAnswer {
  const groups: ExceptionGroup[] =
    lineNumber !== undefined
      ? intelligence.exceptionGroups.filter((group) => group.line.rfxLine?.lineNumber === lineNumber)
      : intelligence.exceptionGroups;

  if (groups.length === 0) {
    return base(
      "what_to_request",
      lineNumber !== undefined
        ? `Line ${lineNumber} has no open exceptions -- there's nothing to request from the vendor for this line.`
        : "There are no open exceptions right now -- nothing needs to be requested from the vendor.",
    );
  }

  const keyFacts: AnalystFact[] = groups.flatMap((group) =>
    missingInfoFor(group.line).map((info) => ({ label: `Line ${group.line.rfxLine?.lineNumber ?? "?"}`, value: info })),
  );
  const lineList = groups.map((group) => `Line ${group.line.rfxLine?.lineNumber}`).join(", ");
  const answer = `To move ${lineList} forward, ask the vendor for: ${keyFacts.map((fact) => fact.value.replace(/\.$/, "").toLowerCase()).join("; ")}.`;

  const primary = groups[0];
  const draft = generateClarificationDraft(primary, vendorName);

  return {
    intent: "what_to_request",
    answer,
    usedAi: false,
    aiUnavailable: false,
    keyFacts,
    evidence: groups.flatMap((group) => evidenceRefs(group.line)),
    relatedClarification: { question: primary.clarification?.question ?? draft.message },
  };
}

/** Which prices can I safely compare -- purely deterministic bucket data, the LLM is never asked to compute this. */
function buildSafelyComparable(intelligence: ResponseIntelligenceViewModel): AnalystAnswer {
  const comparable = intelligence.lines.filter((line) => line.bucket === "safely_comparable");

  if (comparable.length === 0) {
    return base("safely_comparable", "No lines from this vendor are safely comparable yet.", [
      { label: "Safely comparable", value: "0" },
    ]);
  }

  const keyFacts: AnalystFact[] = comparable.map((line) => ({
    label: `Line ${line.rfxLine?.lineNumber}`,
    value:
      line.normalization?.normalizedPrice !== undefined && line.comparisonUnit
        ? `${formatMoney(line.normalization.normalizedPrice, line.price?.currency)} / ${line.comparisonUnit.symbol}`
        : "—",
  }));

  const answer = `${comparable.length} of ${intelligence.lines.length} line(s) are safely comparable right now: ${keyFacts
    .map((fact) => `${fact.label} at ${fact.value}`)
    .join(", ")}.`;

  return base("safely_comparable", answer, keyFacts, comparable.flatMap(evidenceRefs));
}

function buildUnresolvedIssues(intelligence: ResponseIntelligenceViewModel): AnalystAnswer {
  const groups = intelligence.exceptionGroups;
  if (groups.length === 0) {
    return base("unresolved_issues", "There are no unresolved issues right now.", [{ label: "Open exceptions", value: "0" }]);
  }

  const keyFacts: AnalystFact[] = groups.flatMap((group) =>
    group.line.exceptions.map((exception) => ({
      label: `Line ${group.line.rfxLine?.lineNumber ?? "?"} · ${exception.type}`,
      value: exception.description,
    })),
  );
  const totalExceptions = groups.reduce((sum, group) => sum + group.line.exceptions.length, 0);
  const answer = `${totalExceptions} open exception(s) across ${groups.length} line(s): ${groups
    .map((group) => `Line ${group.line.rfxLine?.lineNumber}`)
    .join(", ")}.`;

  const onlyException = groups.length === 1 && groups[0].line.exceptions.length === 1 ? groups[0].line.exceptions[0] : undefined;

  return {
    intent: "unresolved_issues",
    answer,
    usedAi: false,
    aiUnavailable: false,
    keyFacts,
    evidence: groups.flatMap((group) => evidenceRefs(group.line)),
    relatedException: onlyException ? { type: onlyException.type, description: onlyException.description } : undefined,
  };
}

/**
 * Retrieves/calculates the answer to a classified question purely from
 * existing deterministic intelligence data (NormalizationResult,
 * UnitResolution, Exception, Clarification). No LLM call happens in this
 * function -- it is safe to call even when Gemini is unavailable.
 */
export function buildDeterministicAnswer(parsed: ParsedIntent, intelligence: ResponseIntelligenceViewModel): AnalystAnswer {
  const vendorName = intelligence.vendorResponse.vendor.name;
  switch (parsed.intent) {
    case "why_cant_compare":
      return buildWhyCantCompare(intelligence, parsed.lineNumber);
    case "why_price":
      return buildWhyPrice(intelligence, parsed.lineNumber);
    case "what_to_request":
      return buildWhatToRequest(intelligence, parsed.lineNumber, vendorName);
    case "safely_comparable":
      return buildSafelyComparable(intelligence);
    case "unresolved_issues":
      return buildUnresolvedIssues(intelligence);
  }
}
