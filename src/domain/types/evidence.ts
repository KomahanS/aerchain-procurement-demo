import type { ExtractedBy, Id, ISODateString } from "./common";

/**
 * Links a single extracted value or calculation input back to its source.
 * A fact or calculation that draws on several source locations (e.g. a
 * price in one document and a discount footnote in another) cites several
 * Evidence records via an `evidenceIds: Id[]` field on that fact, rather
 * than this type trying to hold more than one location itself.
 */
export interface Evidence {
  id: Id;
  /** The ResponseDocument this excerpt came from, when there is one. */
  documentId?: Id;
  /** File path, email id, or "manual-entry"; kept even when documentId is set. */
  sourceRef: string;
  /** The raw text/cell/paragraph the value was taken from. */
  excerpt: string;
  /** e.g. "Sheet1!C14", "page 2, paragraph 3". */
  location?: string;
  extractedBy: ExtractedBy;
  extractedAt: ISODateString;
}
