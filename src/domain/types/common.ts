export type Id = string;
export type ISODateString = string;

/**
 * Resolution state for anything the system extracted or derived.
 * Drives the "detect uncertainty -> explain -> ask -> record" flow.
 */
export type ResolutionStatus =
  | "clear"
  | "ambiguous"
  | "missing"
  | "contradictory"
  | "resolved";

export type SourceFormat = "excel" | "pdf" | "docx" | "image" | "email" | "manual";

export type ExtractedBy = "ai" | "human";

export type ExceptionType =
  | "missing"
  | "ambiguous"
  | "contradictory"
  | "unknown_unit"
  | "price_basis_mismatch"
  | "technical_compliance";

export type ExceptionStatus = "open" | "clarification_requested" | "resolved";

export type ClarificationStatus =
  | "draft"
  | "pending_buyer_approval"
  | "approved"
  | "sent"
  | "answered";

export type RFxCreationMethod = "manual" | "import" | "ai_suggested";
