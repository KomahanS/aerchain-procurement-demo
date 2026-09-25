import type { ClarificationStatus, Id, ISODateString } from "./common";

/**
 * An AI-drafted (or human-written) question sent to a vendor to resolve
 * one or more Exceptions. Kept as its own entity, separate from Exception:
 * one Clarification can bundle several Exceptions into a single outbound
 * message, and a given Exception is considered resolved once the
 * Clarification addressing it is answered. The buyer must approve before
 * it is sent.
 */
export interface Clarification {
  id: Id;
  rfxId: Id;
  vendorId: Id;
  exceptionIds: Id[];
  question: string;
  draftedBy: "ai" | "human";
  status: ClarificationStatus;
  approvedBy?: Id;
  approvedAt?: ISODateString;
  answer?: string;
  answeredAt?: ISODateString;
}
