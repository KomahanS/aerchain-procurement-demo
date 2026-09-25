import type { Id, ResolutionStatus } from "./common";

/**
 * The commercial figures for one vendor response line, preserving the
 * vendor's original values alongside the deterministic calculation chain:
 * quoted price -> discount -> net product price -> freight/other charges
 * -> tax -> landed cost.
 */
export interface Price {
  id: Id;
  vendorResponseLineId: Id;
  quotedPrice: number;
  currency: string;
  /** Exactly as the vendor stated it, e.g. "per pallet". */
  priceBasisRaw: string;
  /** The resolved Unit this price is quoted per. Absent until matched -- never invented. */
  priceBasisUnitId?: Id;
  /** Units per pack, when the vendor quotes per pack. */
  packSize?: number;
  discountRaw?: string;
  discountPercent?: number;
  freightRaw?: string;
  freightAmount?: number;
  taxRaw?: string;
  taxPercent?: number;
  /** quotedPrice after discount. */
  netProductPrice?: number;
  /** netProductPrice + freight/other charges + tax. */
  landedCost?: number;
  evidenceIds: Id[];
}

/**
 * Derived separately from Price: converts the landed cost into the
 * comparison unit so vendors can be compared like-for-like. Never
 * overwrites Price; always traceable back to Evidence. References the
 * UnitResolution that decided how the price basis/unit was matched, so
 * the matching decision and the final calculated value stay distinct.
 */
export interface NormalizationResult {
  id: Id;
  priceId: Id;
  /** The unit-matching decision this normalization was built on. */
  unitResolutionId?: Id;
  conversionFactorApplied?: number;
  fromUnitId?: Id;
  toUnitId?: Id;
  /** landedCost expressed per comparisonUnitId. */
  normalizedPrice?: number;
  comparisonUnitId?: Id;
  /** Ordered, human-readable calculation steps for the AI Analyst to explain. */
  calculation: string[];
  /** 0..1 */
  confidence: number;
  status: ResolutionStatus;
  evidenceIds: Id[];
}
