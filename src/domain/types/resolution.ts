import type { Id, ResolutionStatus } from "./common";

/**
 * Records the decision of matching a vendor's stated price basis/unit
 * text to a known Unit (or a product-specific PackagingConversion). Kept
 * separate from NormalizationResult so the matching step itself carries
 * its own status, evidence and confidence, independent of -- and prior
 * to -- the final calculated/normalized value.
 */
export interface UnitResolution {
  id: Id;
  priceId: Id;
  /** The vendor's literal basis/unit text being resolved, e.g. "per pallet". */
  rawUnitText: string;
  /** The tenant's generic Unit this resolved to, if any. */
  matchedUnitId?: Id;
  /** The product-specific PackagingConversion used to resolve this, if any. */
  matchedPackagingConversionId?: Id;
  status: ResolutionStatus;
  /** 0..1 */
  confidence: number;
  evidenceIds: Id[];
  notes?: string;
}
