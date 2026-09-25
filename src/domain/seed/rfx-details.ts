import type { Product, RFx, RFxLine, Unit } from "../types";
import { corrugatedSeed } from "./corrugated-seed";

export interface RFxLineSpecEntry {
  key: string;
  value: string | number;
  /** True when this key/value is not present on the Product master as-is. */
  divergesFromProductMaster: boolean;
}

export interface RFxLineViewModel {
  line: RFxLine;
  product: Product;
  requiredUnit: Unit | undefined;
  specEntries: RFxLineSpecEntry[];
}

export interface RFxDetailsViewModel {
  rfx: RFx;
  lines: RFxLineViewModel[];
  totalRequestedQuantity: number;
  requiredUnitSymbols: string[];
}

/**
 * Assembles the RFx Details view model from the seeded domain data only.
 * Deliberately reads RFxLine.specification (the buyer's snapshot) for the
 * spec shown per line; Product.specification is used only to detect which
 * spec entries diverge from the current product master.
 */
export function getRfxDetails(rfxId: string): RFxDetailsViewModel | undefined {
  const rfxRecord = corrugatedSeed.rfxList.find((candidate) => candidate.id === rfxId);
  if (!rfxRecord) return undefined;

  const productsById = new Map(corrugatedSeed.products.map((product) => [product.id, product]));
  const unitsById = new Map(corrugatedSeed.units.map((unit) => [unit.id, unit]));

  const lines: RFxLineViewModel[] = corrugatedSeed.rfxLines
    .filter((line) => line.rfxId === rfxId)
    .sort((a, b) => a.lineNumber - b.lineNumber)
    .map((line) => {
      const product = productsById.get(line.productId);
      if (!product) {
        throw new Error(`Seed data error: no Product found for RFxLine ${line.id}`);
      }
      const specEntries: RFxLineSpecEntry[] = Object.entries(line.specification).map(
        ([key, value]) => ({
          key,
          value,
          divergesFromProductMaster: product.specification[key] !== value,
        }),
      );
      return {
        line,
        product,
        requiredUnit: unitsById.get(line.requiredUnitId),
        specEntries,
      };
    });

  const totalRequestedQuantity = lines.reduce((sum, l) => sum + l.line.requestedQuantity, 0);
  const requiredUnitSymbols = Array.from(
    new Set(lines.map((l) => l.requiredUnit?.symbol ?? "unresolved unit")),
  );

  return { rfx: rfxRecord, lines, totalRequestedQuantity, requiredUnitSymbols };
}
