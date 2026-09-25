import type {
  Evidence,
  Exception,
  NormalizationResult,
  Price,
  Product,
  ResponseDocument,
  RFxLine,
  Unit,
  UnitResolution,
  Vendor,
  VendorResponse,
  VendorResponseLine,
} from "../types";
import { corrugatedSeed } from "./corrugated-seed";

export type ProcessingStatus = "needs_clarification" | "fully_processed" | "processing";

export interface EvidenceItem {
  evidence: Evidence;
  sourceDocument: ResponseDocument | undefined;
}

export interface VendorResponseLineViewModel {
  vendorResponseLine: VendorResponseLine;
  document: ResponseDocument | undefined;
  rfxLine: RFxLine | undefined;
  rfxLineProduct: Product | undefined;
  price: Price | undefined;
  priceBasisUnit: Unit | undefined;
  normalization: NormalizationResult | undefined;
  unitResolution: UnitResolution | undefined;
  fromUnit: Unit | undefined;
  comparisonUnit: Unit | undefined;
  exceptions: Exception[];
  evidenceItems: EvidenceItem[];
}

export interface VendorResponseViewModel {
  vendorResponse: VendorResponse;
  vendor: Vendor;
  documents: ResponseDocument[];
  lines: VendorResponseLineViewModel[];
  processingStatus: ProcessingStatus;
  stats: {
    totalLines: number;
    mappedLines: number;
    clearLines: number;
    openExceptions: number;
  };
}

/**
 * Assembles the "RFx Workspace -> Responses" view model purely from the
 * seeded domain data (VendorResponse, ResponseDocument, VendorResponseLine,
 * Price, NormalizationResult, UnitResolution, Exception, Evidence). No
 * mock/duplicate UI data is introduced; `processingStatus` is the only
 * derived (non-stored) field, computed from existing normalization and
 * exception statuses.
 */
export function getVendorResponseWorkspace(rfxId: string): VendorResponseViewModel[] {
  const seed = corrugatedSeed;
  if (seed.rfx.id !== rfxId) return [];

  const vendorsById = new Map(seed.vendors.map((v) => [v.id, v]));
  const productsById = new Map(seed.products.map((p) => [p.id, p]));
  const unitsById = new Map(seed.units.map((u) => [u.id, u]));
  const rfxLinesById = new Map(seed.rfxLines.map((l) => [l.id, l]));
  const documentsById = new Map(seed.responseDocuments.map((d) => [d.id, d]));
  const evidenceById = new Map(seed.evidence.map((e) => [e.id, e]));
  const pricesByLineId = new Map(seed.prices.map((p) => [p.vendorResponseLineId, p]));
  const normalizationsByPriceId = new Map(seed.normalizationResults.map((n) => [n.priceId, n]));
  const unitResolutionsByPriceId = new Map(seed.unitResolutions.map((u) => [u.priceId, u]));

  const documentsByResponseId = new Map<string, ResponseDocument[]>();
  for (const doc of seed.responseDocuments) {
    const list = documentsByResponseId.get(doc.vendorResponseId) ?? [];
    list.push(doc);
    documentsByResponseId.set(doc.vendorResponseId, list);
  }

  const exceptionsByLineId = new Map<string, Exception[]>();
  for (const exception of seed.exceptions) {
    if (!exception.vendorResponseLineId) continue;
    const list = exceptionsByLineId.get(exception.vendorResponseLineId) ?? [];
    list.push(exception);
    exceptionsByLineId.set(exception.vendorResponseLineId, list);
  }

  return seed.vendorResponses
    .filter((vr) => vr.rfxId === rfxId)
    .map((vendorResponse) => {
      const vendor = vendorsById.get(vendorResponse.vendorId);
      if (!vendor) throw new Error(`Seed data error: no Vendor for response ${vendorResponse.id}`);

      const lines: VendorResponseLineViewModel[] = seed.vendorResponseLines
        .filter((line) => line.vendorResponseId === vendorResponse.id)
        .map((vendorResponseLine) => {
          const price = pricesByLineId.get(vendorResponseLine.id);
          const normalization = price ? normalizationsByPriceId.get(price.id) : undefined;
          const unitResolution = price ? unitResolutionsByPriceId.get(price.id) : undefined;
          const exceptions = exceptionsByLineId.get(vendorResponseLine.id) ?? [];
          const rfxLine = vendorResponseLine.rfxLineId ? rfxLinesById.get(vendorResponseLine.rfxLineId) : undefined;

          const evidenceIds = new Set<string>([
            ...vendorResponseLine.evidenceIds,
            ...(price?.evidenceIds ?? []),
            ...(normalization?.evidenceIds ?? []),
            ...(unitResolution?.evidenceIds ?? []),
            ...exceptions.flatMap((exception) => exception.evidenceIds),
          ]);

          const evidenceItems: EvidenceItem[] = Array.from(evidenceIds)
            .map((id) => evidenceById.get(id))
            .filter((item): item is Evidence => Boolean(item))
            .map((item) => ({
              evidence: item,
              sourceDocument: item.documentId ? documentsById.get(item.documentId) : undefined,
            }));

          return {
            vendorResponseLine,
            document: documentsById.get(vendorResponseLine.documentId),
            rfxLine,
            rfxLineProduct: rfxLine ? productsById.get(rfxLine.productId) : undefined,
            price,
            priceBasisUnit: price?.priceBasisUnitId ? unitsById.get(price.priceBasisUnitId) : undefined,
            normalization,
            unitResolution,
            fromUnit: normalization?.fromUnitId ? unitsById.get(normalization.fromUnitId) : undefined,
            comparisonUnit: normalization?.comparisonUnitId
              ? unitsById.get(normalization.comparisonUnitId)
              : undefined,
            exceptions,
            evidenceItems,
          };
        });

      const mappedLines = lines.filter((l) => l.rfxLine).length;
      const clearLines = lines.filter((l) => l.normalization?.status === "clear").length;
      const openExceptions = lines.reduce(
        (sum, l) => sum + l.exceptions.filter((exception) => exception.status !== "resolved").length,
        0,
      );

      const processingStatus: ProcessingStatus =
        openExceptions > 0 ? "needs_clarification" : clearLines === lines.length ? "fully_processed" : "processing";

      return {
        vendorResponse,
        vendor,
        documents: documentsByResponseId.get(vendorResponse.id) ?? [],
        lines,
        processingStatus,
        stats: { totalLines: lines.length, mappedLines, clearLines, openExceptions },
      };
    });
}
