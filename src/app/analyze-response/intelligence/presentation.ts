import type { ExceptionType } from "@/domain";
import type { ComparabilityBucket } from "./view-model";

// Presentation-only mappings, in the same spirit as
// src/app/rfx/[rfxId]/responses/presentation.ts: labels/colors derived from
// existing data, nothing stored on the domain model.

export const BUCKET_LABEL: Record<ComparabilityBucket, string> = {
  safely_comparable: "Safely comparable",
  needs_attention: "Needs attention",
  unresolved: "Unresolved / missing",
};

export const BUCKET_STYLE: Record<ComparabilityBucket, string> = {
  safely_comparable:
    "bg-emerald-50 text-emerald-700 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
  needs_attention: "bg-amber-50 text-amber-800 ring-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
  unresolved: "bg-rose-50 text-rose-700 ring-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-800",
};

/** What's actually missing for each ExceptionType -- generic, not tied to any one line. */
export const MISSING_INFO_BY_EXCEPTION_TYPE: Record<ExceptionType, string> = {
  missing: "A required value the vendor did not state.",
  ambiguous: "A single, unambiguous reading of the vendor's wording.",
  contradictory: "Which of the vendor's conflicting statements is correct.",
  unknown_unit: "The pack size / units per pallet needed to convert this to a comparable per-piece price.",
  price_basis_mismatch: "A price basis that matches the RFx's required comparison unit.",
  technical_compliance: "The required technical/compliance document or confirmation.",
};
