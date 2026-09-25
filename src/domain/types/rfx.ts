import type { Id, ISODateString, RFxCreationMethod } from "./common";

export type RFxStatus =
  | "draft"
  | "sent"
  | "responses_in_progress"
  | "under_comparison"
  | "awarded"
  | "closed";

/**
 * The canonical, auditable RFx (RFx Details: "what was asked").
 * Manual, Import, and AI Suggested creation all produce this same shape.
 */
export interface RFx {
  id: Id;
  tenantId: Id;
  title: string;
  category: string;
  createdVia: RFxCreationMethod;
  status: RFxStatus;
  createdAt: ISODateString;
  approvedAt?: ISODateString;
}

/**
 * The buyer's requested specification for a single line: what, how much,
 * in what unit, and any delivery/technical requirements. Distinct from
 * VendorResponseLine, which holds what a vendor actually said.
 *
 * `specification` is a snapshot taken at RFx creation/edit time, not a
 * live reference to Product.specification: it may be edited or extended
 * independently of the Product master (e.g. an extra buyer requirement
 * for this RFx only), and later changes to the Product master must never
 * retroactively change what was asked on an already-sent RFx.
 */
export interface RFxLine {
  id: Id;
  rfxId: Id;
  lineNumber: number;
  productId: Id;
  /** Snapshot of the buyer's requested spec; may diverge from Product.specification. */
  specification: Record<string, string | number>;
  requestedQuantity: number;
  /** The unit the buyer wants pricing expressed and compared in. */
  requiredUnitId: Id;
  deliveryRequirements?: string;
  technicalRequirements?: string;
}
