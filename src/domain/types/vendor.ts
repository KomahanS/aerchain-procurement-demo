import type { Id, ISODateString, SourceFormat } from "./common";

export interface Vendor {
  id: Id;
  tenantId: Id;
  name: string;
  contactEmail?: string;
}

/**
 * A vendor's overall response to an RFx. A response commonly arrives as
 * several separate documents/messages (a price sheet, a terms PDF, a
 * follow-up email, a photographed rate card) -- see ResponseDocument.
 */
export interface VendorResponse {
  id: Id;
  rfxId: Id;
  vendorId: Id;
  receivedAt: ISODateString;
}

/**
 * One physical document or message that is part of a VendorResponse.
 * A single VendorResponse can hold several ResponseDocuments of different
 * formats (Excel, PDF, DOCX, photographed rate card, email).
 */
export interface ResponseDocument {
  id: Id;
  vendorResponseId: Id;
  format: SourceFormat;
  /** Pointer to the original file/email. The source itself is never mutated. */
  fileRef: string;
  receivedAt: ISODateString;
  /** Raw extracted text/content, preserved as received. */
  rawContentExcerpt?: string;
}

/**
 * What the vendor actually said for one line, verbatim. Raw fields are
 * never overwritten by extraction or normalization -- corrections live in
 * Price / NormalizationResult, which reference this line instead.
 */
export interface VendorResponseLine {
  id: Id;
  vendorResponseId: Id;
  /** The specific document/message this line was extracted from. */
  documentId: Id;
  /** The matched RFxLine, if resolved. Undefined until mapped. */
  rfxLineId?: Id;
  rawProductDescription: string;
  rawQuantity?: string;
  /** The vendor's literal unit text, e.g. "bundle of 50", "pallet". */
  rawUnit?: string;
  evidenceIds: Id[];
}
