import type { Product, RFx, RFxLine, Vendor } from "@/domain";
import { corrugatedSeed } from "@/domain/seed/corrugated-seed";
import { getRfxDetails } from "@/domain/seed/rfx-details";
import {
  getVendorResponseWorkspace,
  type VendorResponseLineViewModel,
  type VendorResponseViewModel,
} from "@/domain/seed/vendor-response-workspace";

export type ComparisonCellState = "clear" | "needs_validation" | "blocked" | "non_compliant" | "no_quote";

export interface ComparisonCell {
  vendorId: string;
  vendorName: string;
  state: ComparisonCellState;
  normalizedPrice?: number;
  currency?: string;
  comparisonUnitSymbol?: string;
  /** Short, buyer-facing reason shown under a blocked/needs-validation/non-compliant cell. */
  reason?: string;
  /** Full underlying data for the evidence drawer -- undefined only for a true no_quote cell. */
  line?: VendorResponseLineViewModel;
}

export interface ComparisonRow {
  rfxLine: RFxLine;
  product: Product;
  cells: ComparisonCell[];
}

export interface ComparisonViewModel {
  rfx: RFx;
  vendors: Vendor[];
  rows: ComparisonRow[];
  summary: {
    vendorCount: number;
    comparableLines: number;
    blockedLines: number;
    openClarifications: number;
    currency: string;
  };
}

function reasonFor(line: VendorResponseLineViewModel, state: ComparisonCellState): string | undefined {
  if (state === "clear") return undefined;
  const openException = line.exceptions.find((exception) => exception.status !== "resolved");
  if (state === "non_compliant") {
    return openException?.description ?? "Does not meet the RFx's technical requirement for this line.";
  }
  return line.unitResolution?.notes ?? openException?.description ?? line.normalization?.calculation.at(-1);
}

function cellStateFor(line: VendorResponseLineViewModel): ComparisonCellState {
  // No usable price at all is the more fundamental blocker -- surface that
  // before a separate technical-compliance issue, even when a line carries
  // both (e.g. a missing pallet size AND a missing compliance certificate).
  const normalizedPrice = line.normalization?.normalizedPrice;
  if (normalizedPrice === undefined) return "blocked";

  const hasOpenTechnicalException = line.exceptions.some(
    (exception) => exception.type === "technical_compliance" && exception.status !== "resolved",
  );
  if (hasOpenTechnicalException) return "non_compliant";

  if (line.normalization?.status === "clear" && !line.exceptions.some((e) => e.status !== "resolved")) return "clear";
  return "needs_validation";
}

/**
 * Builds the line x vendor comparison grid for one RFx, purely from
 * getVendorResponseWorkspace's existing per-vendor line data -- no new
 * calculation logic. A line counts as "comparable" once at least one
 * vendor's cell is fully clear for it; otherwise it's "blocked", meaning no
 * vendor's price on that line can currently be trusted without validation.
 */
export function getComparison(rfxId: string): ComparisonViewModel | undefined {
  const details = getRfxDetails(rfxId);
  const responses = getVendorResponseWorkspace(rfxId);
  if (!details) return undefined;

  const vendors = responses.map((r) => r.vendor);
  const productsById = new Map(corrugatedSeed.products.map((p) => [p.id, p]));

  const responsesByVendorLine = (response: VendorResponseViewModel, rfxLineId: string) =>
    response.lines.find((line) => line.rfxLine?.id === rfxLineId);

  const rows: ComparisonRow[] = details.lines.map(({ line, product }) => {
    const cells: ComparisonCell[] = responses.map((response) => {
      const matched = responsesByVendorLine(response, line.id);
      if (!matched) {
        return { vendorId: response.vendor.id, vendorName: response.vendor.name, state: "no_quote" as const };
      }
      const state = cellStateFor(matched);
      return {
        vendorId: response.vendor.id,
        vendorName: response.vendor.name,
        state,
        normalizedPrice: matched.normalization?.normalizedPrice,
        currency: matched.price?.currency,
        comparisonUnitSymbol: matched.comparisonUnit?.symbol,
        reason: reasonFor(matched, state),
        line: matched,
      };
    });
    return { rfxLine: line, product: productsById.get(product.id) ?? product, cells };
  });

  const comparableLines = rows.filter((row) => row.cells.some((cell) => cell.state === "clear")).length;
  const blockedLines = rows.length - comparableLines;
  const currency = rows.flatMap((row) => row.cells.map((c) => c.currency)).find((c): c is string => Boolean(c)) ?? "USD";
  const openClarifications = corrugatedSeed.clarifications.filter(
    (c) => c.rfxId === rfxId && c.status !== "answered",
  ).length;

  return {
    rfx: details.rfx,
    vendors,
    rows,
    summary: { vendorCount: vendors.length, comparableLines, blockedLines, openClarifications, currency },
  };
}
