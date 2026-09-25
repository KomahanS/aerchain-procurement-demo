import type { ExceptionStatus, ExceptionType, Id, ISODateString } from "./common";

export interface Exception {
  id: Id;
  tenantId: Id;
  rfxId: Id;
  vendorResponseLineId?: Id;
  /**
   * The VendorResponse this exception belongs to. Required when there is no
   * vendorResponseLineId to hang it off -- e.g. a vendor omitting an RFx
   * line entirely has no VendorResponseLine to reference, but the exception
   * must still be attributable to that vendor's response for grouping in
   * the UI (Needs Attention, Clarifications).
   */
  vendorResponseId?: Id;
  type: ExceptionType;
  description: string;
  status: ExceptionStatus;
  evidenceIds: Id[];
  createdAt: ISODateString;
}
