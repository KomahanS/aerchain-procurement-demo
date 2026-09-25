import type { ExceptionType, ResolutionStatus } from "@/domain/types";
import type { ProcessingStatus } from "@/domain/seed/vendor-response-workspace";

// Presentation-only mappings (labels, colors, severity). None of these are
// stored on the domain model; they derive a display from existing enum
// values so the UI stays legible without adding new domain fields.

export const PROCESSING_STATUS_LABEL: Record<ProcessingStatus, string> = {
  needs_clarification: "Needs clarification",
  fully_processed: "Fully processed",
  processing: "Processing",
};

export const PROCESSING_STATUS_STYLE: Record<ProcessingStatus, string> = {
  needs_clarification:
    "bg-rose-50 text-rose-700 ring-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-800",
  fully_processed:
    "bg-emerald-50 text-emerald-700 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
  processing: "bg-amber-50 text-amber-800 ring-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
};

export const RESOLUTION_STATUS_LABEL: Record<ResolutionStatus, string> = {
  clear: "Clear",
  ambiguous: "Ambiguous",
  missing: "Missing",
  contradictory: "Contradictory",
  resolved: "Resolved",
};

export const RESOLUTION_STATUS_STYLE: Record<ResolutionStatus, string> = {
  clear: "bg-emerald-50 text-emerald-700 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
  ambiguous: "bg-amber-50 text-amber-800 ring-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
  missing: "bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600",
  contradictory: "bg-rose-50 text-rose-700 ring-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-800",
  resolved: "bg-blue-50 text-blue-700 ring-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800",
};

export const EXCEPTION_TYPE_LABEL: Record<ExceptionType, string> = {
  missing: "Missing",
  ambiguous: "Ambiguous",
  contradictory: "Contradictory",
  unknown_unit: "Unknown unit",
  price_basis_mismatch: "Price basis mismatch",
  technical_compliance: "Technical / compliance",
};

/** Severity is not a stored Exception field; it's inferred from `type` for display only. */
export const EXCEPTION_SEVERITY: Record<ExceptionType, "high" | "medium" | "low"> = {
  contradictory: "high",
  unknown_unit: "high",
  price_basis_mismatch: "high",
  technical_compliance: "medium",
  ambiguous: "medium",
  missing: "low",
};

export const EXCEPTION_SEVERITY_STYLE: Record<"high" | "medium" | "low", string> = {
  high: "bg-rose-50 text-rose-700 ring-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-800",
  medium: "bg-amber-50 text-amber-800 ring-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
  low: "bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600",
};

export const SOURCE_FORMAT_LABEL: Record<string, string> = {
  excel: "Excel",
  pdf: "PDF",
  docx: "Word (DOCX)",
  image: "Photographed rate card",
  email: "Email",
  manual: "Manual entry",
};
