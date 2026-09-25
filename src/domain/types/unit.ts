import type { Id } from "./common";

/**
 * A measurable dimension in the tenant's standard unit catalog
 * (e.g. "Count", "Weight", "Area"). Category-agnostic: the same
 * Dimension/Unit tables work for any product line, not just packaging.
 */
export interface Dimension {
  id: Id;
  tenantId: Id;
  name: string;
  /** The Unit all other Units in this dimension convert to/from. */
  baseUnitId: Id;
  /** The Unit used when comparing vendor prices across this dimension. */
  preferredComparisonUnitId: Id;
}

/**
 * A unit within a Dimension. `conversionFactorToBase` is the tenant's
 * generic, product-independent conversion (e.g. Dozen -> Piece = 12).
 * Product-specific packaging/selling-unit ratios (e.g. "this vendor's
 * bundle = 50 pieces") do NOT belong here -- see PackagingConversion.
 */
export interface Unit {
  id: Id;
  tenantId: Id;
  dimensionId: Id;
  name: string;
  symbol: string;
  isBaseUnit: boolean;
  /** Multiply a value in this unit by this factor to get the base unit value. */
  conversionFactorToBase: number;
}
