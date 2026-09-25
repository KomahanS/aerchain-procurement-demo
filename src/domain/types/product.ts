import type { Id } from "./common";

/**
 * Category-agnostic product record. `category` and `specification` are
 * free-form so the same shape works for corrugated packaging today and
 * any other RFx category later.
 */
export interface Product {
  id: Id;
  tenantId: Id;
  name: string;
  category: string;
  specification: Record<string, string | number>;
  /** The Dimension this product is normally compared in (e.g. Count). */
  dimensionId: Id;
  /** The Unit one sellable "piece" of this product is measured in. */
  baseSellingUnitId: Id;
}

/**
 * Product-specific packaging/selling-unit conversion (e.g. "Bundle of 50"
 * for this product only). Kept separate from the tenant's generic Unit
 * conversion table per the locked unit model: never inferred, never shared
 * across products.
 */
export interface PackagingConversion {
  id: Id;
  tenantId: Id;
  productId: Id;
  fromUnitId: Id;
  toUnitId: Id;
  /** Multiply a value in fromUnit by this factor to get toUnit. */
  conversionFactor: number;
  notes?: string;
  evidenceIds?: Id[];
}
