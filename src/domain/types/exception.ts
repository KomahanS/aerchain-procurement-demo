import type { ExceptionStatus, ExceptionType, Id, ISODateString } from "./common";

export interface Exception {
  id: Id;
  tenantId: Id;
  rfxId: Id;
  vendorResponseLineId?: Id;
  type: ExceptionType;
  description: string;
  status: ExceptionStatus;
  evidenceIds: Id[];
  createdAt: ISODateString;
}
