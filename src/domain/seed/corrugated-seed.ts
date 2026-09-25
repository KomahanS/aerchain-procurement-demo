import type {
  Clarification,
  Dimension,
  Evidence,
  Exception,
  NormalizationResult,
  PackagingConversion,
  Price,
  Product,
  QualityResponse,
  ResponseDocument,
  RFx,
  RFxLine,
  Tenant,
  Unit,
  UnitResolution,
  Vendor,
  VendorResponse,
  VendorResponseLine,
} from "../types";

/**
 * Small, hand-built dataset (1 tenant, 1 vendor, 5 RFx lines) used only to
 * validate that the domain model can represent the required scenarios:
 * normal per-piece pricing, 5-ply, 7-ply, pack-size conversion, and a
 * price-basis mismatch -- plus multi-document vendor responses, multi-
 * source evidence, an explicit unit-resolution step, and a clarification
 * that bundles two exceptions. Not the full 30-line/5-vendor demo dataset.
 */

const now = "2026-09-25T00:00:00.000Z";

const tenant: Tenant = {
  id: "tenant-1",
  name: "Acme Buyer Co",
  createdAt: now,
};

// --- Standard unit catalog (tenant-level, category-agnostic) -----------

const dimensionCount: Dimension = {
  id: "dim-count",
  tenantId: tenant.id,
  name: "Count",
  baseUnitId: "unit-piece",
  preferredComparisonUnitId: "unit-piece",
};

const unitPiece: Unit = {
  id: "unit-piece",
  tenantId: tenant.id,
  dimensionId: dimensionCount.id,
  name: "Piece",
  symbol: "pc",
  isBaseUnit: true,
  conversionFactorToBase: 1,
};

// Product-specific packaging unit: only meaningful via the
// PackagingConversion below, never a generic tenant-wide ratio.
const unitBundle50: Unit = {
  id: "unit-bundle-50",
  tenantId: tenant.id,
  dimensionId: dimensionCount.id,
  name: "Bundle of 50",
  symbol: "bundle-50",
  isBaseUnit: false,
  conversionFactorToBase: 50,
};

// Deliberately NOT defined: a "Pallet" unit. The price-basis-mismatch line
// below quotes "per pallet" with no registered unit and no stated pallet
// size -- this must surface as an exception, not an invented conversion.

const units: Unit[] = [unitPiece, unitBundle50];
const dimensions: Dimension[] = [dimensionCount];

// --- Products (category-agnostic; corrugated specs live in `specification`) --

const productNormal: Product = {
  id: "product-1",
  tenantId: tenant.id,
  name: "RSC Box 24x18x12in",
  category: "Corrugated Packaging",
  specification: { ply: 3, length_mm: 610, width_mm: 457, height_mm: 305 },
  dimensionId: dimensionCount.id,
  baseSellingUnitId: unitPiece.id,
};

const product5Ply: Product = {
  id: "product-2",
  tenantId: tenant.id,
  name: "RSC Box 24x18x12in, 5-Ply",
  category: "Corrugated Packaging",
  specification: { ply: 5, length_mm: 610, width_mm: 457, height_mm: 305 },
  dimensionId: dimensionCount.id,
  baseSellingUnitId: unitPiece.id,
};

const product7Ply: Product = {
  id: "product-3",
  tenantId: tenant.id,
  name: "Heavy Duty Box 36x24x24in, 7-Ply",
  category: "Corrugated Packaging",
  specification: { ply: 7, length_mm: 914, width_mm: 610, height_mm: 610 },
  dimensionId: dimensionCount.id,
  baseSellingUnitId: unitPiece.id,
};

const productPackSize: Product = {
  id: "product-4",
  tenantId: tenant.id,
  name: "Mailer Box 12x9x6in, 5-Ply",
  category: "Corrugated Packaging",
  specification: { ply: 5, length_mm: 305, width_mm: 229, height_mm: 152 },
  dimensionId: dimensionCount.id,
  baseSellingUnitId: unitPiece.id,
};

const productBasisMismatch: Product = {
  id: "product-5",
  tenantId: tenant.id,
  name: "Divider Insert, 3-Ply",
  category: "Corrugated Packaging",
  specification: { ply: 3, length_mm: 590, width_mm: 440 },
  dimensionId: dimensionCount.id,
  baseSellingUnitId: unitPiece.id,
};

const products: Product[] = [
  productNormal,
  product5Ply,
  product7Ply,
  productPackSize,
  productBasisMismatch,
];

const packagingConversions: PackagingConversion[] = [
  {
    id: "pack-conv-1",
    tenantId: tenant.id,
    productId: productPackSize.id,
    fromUnitId: unitBundle50.id,
    toUnitId: unitPiece.id,
    conversionFactor: 50,
    notes: "Vendor A sells this SKU only in shrink-wrapped bundles of 50.",
    evidenceIds: ["evidence-4"],
  },
];

// --- RFx ------------------------------------------------------------------

const rfx: RFx = {
  id: "rfx-1",
  tenantId: tenant.id,
  title: "RFx-2026-CORR-001 Corrugated Packaging",
  category: "Corrugated Packaging",
  createdVia: "manual",
  status: "under_comparison",
  createdAt: now,
};

// Each line's `specification` is its own object literal (a snapshot taken
// at RFx creation time), never a shared reference to Product.specification.
// Line 2 shows a buyer requirement that diverges from the Product master
// (moisture_resistant_required is not part of product-2's specification).
const rfxLines: RFxLine[] = [
  {
    id: "rfx-line-1",
    rfxId: rfx.id,
    lineNumber: 1,
    productId: productNormal.id,
    specification: { ply: 3, length_mm: 610, width_mm: 457, height_mm: 305 },
    requestedQuantity: 5000,
    requiredUnitId: unitPiece.id,
    deliveryRequirements: "FOB destination, 4-week lead time",
  },
  {
    id: "rfx-line-2",
    rfxId: rfx.id,
    lineNumber: 2,
    productId: product5Ply.id,
    specification: {
      ply: 5,
      length_mm: 610,
      width_mm: 457,
      height_mm: 305,
      // Buyer-specific addition for this RFx only; not part of the
      // Product master and must not retroactively change it.
      moisture_resistant_required: 1,
    },
    requestedQuantity: 3000,
    requiredUnitId: unitPiece.id,
    deliveryRequirements: "FOB destination, 4-week lead time",
  },
  {
    id: "rfx-line-3",
    rfxId: rfx.id,
    lineNumber: 3,
    productId: product7Ply.id,
    specification: { ply: 7, length_mm: 914, width_mm: 610, height_mm: 610 },
    requestedQuantity: 1200,
    requiredUnitId: unitPiece.id,
    technicalRequirements: "Must pass 48-hr edge crush test at 32 ECT",
  },
  {
    id: "rfx-line-4",
    rfxId: rfx.id,
    lineNumber: 4,
    productId: productPackSize.id,
    specification: { ply: 5, length_mm: 305, width_mm: 229, height_mm: 152 },
    requestedQuantity: 10000,
    requiredUnitId: unitPiece.id,
  },
  {
    id: "rfx-line-5",
    rfxId: rfx.id,
    lineNumber: 5,
    productId: productBasisMismatch.id,
    specification: { ply: 3, length_mm: 590, width_mm: 440 },
    requestedQuantity: 2000,
    requiredUnitId: unitPiece.id,
  },
];

// --- Vendor + response ------------------------------------------------------

const vendor: Vendor = {
  id: "vendor-1",
  tenantId: tenant.id,
  name: "Vendor A Packaging Co",
  contactEmail: "sales@vendora.example",
};

// One VendorResponse, spanning three separate documents/messages: the main
// Excel price sheet, a PDF terms sheet (holding a discount footnote), and
// a follow-up email (the ambiguous, basis-mismatched line).
const vendorResponse: VendorResponse = {
  id: "vendor-response-1",
  rfxId: rfx.id,
  vendorId: vendor.id,
  receivedAt: now,
};

const responseDocuments: ResponseDocument[] = [
  {
    id: "doc-1",
    vendorResponseId: vendorResponse.id,
    format: "excel",
    fileRef: "inbound/vendor-a/rfx-2026-corr-001-quote.xlsx",
    receivedAt: now,
    rawContentExcerpt: "Sheet1: Line 1-4 pricing table as submitted by Vendor A.",
  },
  {
    id: "doc-2",
    vendorResponseId: vendorResponse.id,
    format: "pdf",
    fileRef: "inbound/vendor-a/rfx-2026-corr-001-terms.pdf",
    receivedAt: now,
    rawContentExcerpt: "Payment & discount terms, including the footnote 3 volume-discount clause.",
  },
  {
    id: "doc-3",
    vendorResponseId: vendorResponse.id,
    format: "email",
    fileRef: "inbound/vendor-a/line5-follow-up-email.eml",
    receivedAt: now,
    rawContentExcerpt: "Follow-up email with Line 5 pricing, sent separately from the main quote.",
  },
];

const vendorResponseLines: VendorResponseLine[] = [
  {
    id: "vrl-1",
    vendorResponseId: vendorResponse.id,
    documentId: "doc-1",
    rfxLineId: rfxLines[0].id,
    rawProductDescription: "RSC Box 24x18x12, 3 ply",
    rawQuantity: "5000",
    rawUnit: "piece",
    evidenceIds: ["evidence-1"],
  },
  {
    id: "vrl-2",
    vendorResponseId: vendorResponse.id,
    documentId: "doc-1",
    rfxLineId: rfxLines[1].id,
    rawProductDescription: "RSC Box 24x18x12, 5 ply",
    rawQuantity: "3000",
    rawUnit: "piece",
    evidenceIds: ["evidence-2"],
  },
  {
    id: "vrl-3",
    vendorResponseId: vendorResponse.id,
    documentId: "doc-1",
    rfxLineId: rfxLines[2].id,
    rawProductDescription: "Heavy Duty Box 36x24x24, 7 ply",
    rawQuantity: "1200",
    rawUnit: "piece",
    evidenceIds: ["evidence-3"],
  },
  {
    id: "vrl-4",
    vendorResponseId: vendorResponse.id,
    documentId: "doc-1",
    rfxLineId: rfxLines[3].id,
    rawProductDescription: "Mailer Box 12x9x6, 5 ply",
    rawQuantity: "200 bundles",
    rawUnit: "bundle of 50",
    evidenceIds: ["evidence-4"],
  },
  {
    id: "vrl-5",
    vendorResponseId: vendorResponse.id,
    documentId: "doc-3",
    rfxLineId: rfxLines[4].id,
    rawProductDescription: "Divider Insert 3 ply",
    rawQuantity: "unspecified",
    rawUnit: "pallet",
    evidenceIds: ["evidence-5"],
  },
];

// --- Evidence ---------------------------------------------------------------

const evidence: Evidence[] = [
  {
    id: "evidence-1",
    documentId: "doc-1",
    sourceRef: "inbound/vendor-a/rfx-2026-corr-001-quote.xlsx",
    excerpt: "Line 1 | RSC Box 24x18x12, 3 ply | 5000 | $1.25 / piece",
    location: "Sheet1!A2:D2",
    extractedBy: "ai",
    extractedAt: now,
  },
  {
    id: "evidence-2",
    documentId: "doc-1",
    sourceRef: "inbound/vendor-a/rfx-2026-corr-001-quote.xlsx",
    excerpt: "Line 2 | RSC Box 24x18x12, 5 ply | 3000 | $1.60 / piece* | +$0.05/unit freight | +8% tax",
    location: "Sheet1!A3:D3",
    extractedBy: "ai",
    extractedAt: now,
  },
  {
    // Second source location for the same Price-2 discount fact: the "*"
    // in evidence-2 is only explained by this separate PDF document.
    id: "evidence-2b",
    documentId: "doc-2",
    sourceRef: "inbound/vendor-a/rfx-2026-corr-001-terms.pdf",
    excerpt: "Footnote 3: 5% discount on orders over 2000 units, applies to SKU ABC-5PLY.",
    location: "Terms PDF, page 2, footnote 3",
    extractedBy: "ai",
    extractedAt: now,
  },
  {
    id: "evidence-3",
    documentId: "doc-1",
    sourceRef: "inbound/vendor-a/rfx-2026-corr-001-quote.xlsx",
    excerpt: "Line 3 | Heavy Duty Box 36x24x24, 7 ply | 1200 | $3.10 / piece, freight included",
    location: "Sheet1!A4:D4",
    extractedBy: "ai",
    extractedAt: now,
  },
  {
    id: "evidence-4",
    documentId: "doc-1",
    sourceRef: "inbound/vendor-a/rfx-2026-corr-001-quote.xlsx",
    excerpt: "Line 4 | Mailer Box 12x9x6, 5 ply | 200 bundles (50/bundle) | $45.00 / bundle",
    location: "Sheet1!A5:D5",
    extractedBy: "ai",
    extractedAt: now,
  },
  {
    id: "evidence-5",
    documentId: "doc-3",
    sourceRef: "inbound/vendor-a/line5-follow-up-email.eml",
    excerpt: "Re: Line 5 pricing -- $620.00 per pallet, Divider Insert 3 ply.",
    location: "Email body, paragraph 2",
    extractedBy: "ai",
    extractedAt: now,
  },
];

// --- Prices -------------------------------------------------------------

const prices: Price[] = [
  {
    id: "price-1",
    vendorResponseLineId: vendorResponseLines[0].id,
    quotedPrice: 1.25,
    currency: "USD",
    priceBasisRaw: "per piece",
    priceBasisUnitId: unitPiece.id,
    netProductPrice: 1.25,
    landedCost: 1.25,
    evidenceIds: ["evidence-1"],
  },
  {
    id: "price-2",
    vendorResponseLineId: vendorResponseLines[1].id,
    quotedPrice: 1.6,
    currency: "USD",
    priceBasisRaw: "per piece",
    priceBasisUnitId: unitPiece.id,
    discountRaw: "5% off orders over 2000 units (see terms PDF footnote 3)",
    discountPercent: 5,
    freightRaw: "$0.05/unit freight",
    freightAmount: 0.05,
    taxRaw: "8% tax",
    taxPercent: 8,
    netProductPrice: 1.52, // 1.60 * (1 - 0.05)
    landedCost: 1.6956, // (1.52 + 0.05) * 1.08
    // Discount fact spans two documents: the Excel "*" and the PDF footnote.
    evidenceIds: ["evidence-2", "evidence-2b"],
  },
  {
    id: "price-3",
    vendorResponseLineId: vendorResponseLines[2].id,
    quotedPrice: 3.1,
    currency: "USD",
    priceBasisRaw: "per piece",
    priceBasisUnitId: unitPiece.id,
    freightRaw: "included",
    freightAmount: 0,
    netProductPrice: 3.1,
    landedCost: 3.1,
    evidenceIds: ["evidence-3"],
  },
  {
    id: "price-4",
    vendorResponseLineId: vendorResponseLines[3].id,
    quotedPrice: 45.0,
    currency: "USD",
    priceBasisRaw: "per bundle of 50",
    priceBasisUnitId: unitBundle50.id,
    packSize: 50,
    netProductPrice: 45.0,
    landedCost: 45.0,
    evidenceIds: ["evidence-4"],
  },
  {
    id: "price-5",
    vendorResponseLineId: vendorResponseLines[4].id,
    quotedPrice: 620.0,
    currency: "USD",
    priceBasisRaw: "per pallet",
    // priceBasisUnitId intentionally omitted: no "pallet" unit registered
    // and the vendor never stated pieces-per-pallet -- must not be guessed.
    evidenceIds: ["evidence-5"],
  },
];

// --- Unit resolution steps (matching decision, separate from the final ---
// --- normalized value) -------------------------------------------------

const unitResolutions: UnitResolution[] = [
  {
    id: "unit-res-1",
    priceId: "price-1",
    rawUnitText: "per piece",
    matchedUnitId: unitPiece.id,
    status: "clear",
    confidence: 1,
    evidenceIds: ["evidence-1"],
  },
  {
    id: "unit-res-2",
    priceId: "price-2",
    rawUnitText: "per piece",
    matchedUnitId: unitPiece.id,
    status: "clear",
    confidence: 1,
    evidenceIds: ["evidence-2"],
  },
  {
    id: "unit-res-3",
    priceId: "price-3",
    rawUnitText: "per piece",
    matchedUnitId: unitPiece.id,
    status: "clear",
    confidence: 1,
    evidenceIds: ["evidence-3"],
  },
  {
    id: "unit-res-4",
    priceId: "price-4",
    rawUnitText: "per bundle of 50",
    matchedUnitId: unitBundle50.id,
    matchedPackagingConversionId: "pack-conv-1",
    status: "clear",
    confidence: 0.95,
    evidenceIds: ["evidence-4"],
  },
  {
    id: "unit-res-5",
    priceId: "price-5",
    rawUnitText: "per pallet",
    // matchedUnitId intentionally omitted: unresolved.
    status: "ambiguous",
    confidence: 0.15,
    evidenceIds: ["evidence-5"],
    notes: "No \"pallet\" unit registered for this tenant/product, and the vendor did not state pieces-per-pallet.",
  },
];

// --- Normalization results --------------------------------------------------

const normalizationResults: NormalizationResult[] = [
  {
    id: "norm-1",
    priceId: "price-1",
    unitResolutionId: "unit-res-1",
    conversionFactorApplied: 1,
    fromUnitId: unitPiece.id,
    toUnitId: unitPiece.id,
    normalizedPrice: 1.25,
    comparisonUnitId: unitPiece.id,
    calculation: ["quoted $1.25/piece", "no discount/freight/tax stated", "normalized = $1.25/piece"],
    confidence: 0.98,
    status: "clear",
    evidenceIds: ["evidence-1"],
  },
  {
    id: "norm-2",
    priceId: "price-2",
    unitResolutionId: "unit-res-2",
    conversionFactorApplied: 1,
    fromUnitId: unitPiece.id,
    toUnitId: unitPiece.id,
    normalizedPrice: 1.6956,
    comparisonUnitId: unitPiece.id,
    calculation: [
      "quoted $1.60/piece",
      "less 5% discount (terms PDF footnote 3) -> net $1.52/piece",
      "plus $0.05/unit freight -> $1.57/piece",
      "plus 8% tax -> normalized = $1.6956/piece",
    ],
    confidence: 0.9,
    status: "clear",
    evidenceIds: ["evidence-2", "evidence-2b"],
  },
  {
    id: "norm-3",
    priceId: "price-3",
    unitResolutionId: "unit-res-3",
    conversionFactorApplied: 1,
    fromUnitId: unitPiece.id,
    toUnitId: unitPiece.id,
    normalizedPrice: 3.1,
    comparisonUnitId: unitPiece.id,
    calculation: ["quoted $3.10/piece, freight included", "no discount/tax stated", "normalized = $3.10/piece"],
    confidence: 0.95,
    status: "clear",
    evidenceIds: ["evidence-3"],
  },
  {
    id: "norm-4",
    priceId: "price-4",
    unitResolutionId: "unit-res-4",
    conversionFactorApplied: 50,
    fromUnitId: unitBundle50.id,
    toUnitId: unitPiece.id,
    normalizedPrice: 0.9,
    comparisonUnitId: unitPiece.id,
    calculation: [
      "quoted $45.00 per bundle of 50",
      "bundle -> piece conversion factor 50 (PackagingConversion pack-conv-1, product-4 only)",
      "normalized = 45.00 / 50 = $0.90/piece",
    ],
    confidence: 0.95,
    status: "clear",
    evidenceIds: ["evidence-4"],
  },
  {
    id: "norm-5",
    priceId: "price-5",
    unitResolutionId: "unit-res-5",
    // no conversionFactorApplied / fromUnitId / normalizedPrice: cannot
    // normalize a "per pallet" price with no known pallet size.
    toUnitId: unitPiece.id,
    comparisonUnitId: unitPiece.id,
    calculation: [
      "quoted $620.00 per pallet",
      "no \"pallet\" unit in tenant catalog and vendor did not state pieces-per-pallet",
      "cannot normalize to per-piece comparison unit",
    ],
    confidence: 0.15,
    status: "ambiguous",
    evidenceIds: ["evidence-5"],
  },
];

// --- Exceptions + clarification ---------------------------------------------

// Two distinct exceptions on the same line, bundled into a single
// clarification below -- demonstrates Clarification addressing multiple
// Exceptions in one outbound message.
const exceptions: Exception[] = [
  {
    id: "exception-1",
    tenantId: tenant.id,
    rfxId: rfx.id,
    vendorResponseLineId: vendorResponseLines[4].id,
    type: "unknown_unit",
    description:
      "Vendor A quoted Line 5 \"$620.00 per pallet\" but no pallet size was stated and the tenant has no " +
      "registered \"pallet\" unit for this product. Cannot convert to the required per-piece comparison unit.",
    status: "clarification_requested",
    evidenceIds: ["evidence-5"],
    createdAt: now,
  },
  {
    id: "exception-2",
    tenantId: tenant.id,
    rfxId: rfx.id,
    vendorResponseLineId: vendorResponseLines[4].id,
    type: "technical_compliance",
    description:
      "Line 5 requires an edge crush test certificate for technical eligibility, but Vendor A's response did " +
      "not include one.",
    status: "clarification_requested",
    evidenceIds: ["evidence-5"],
    createdAt: now,
  },
];

const clarifications: Clarification[] = [
  {
    id: "clarification-1",
    rfxId: rfx.id,
    vendorId: vendor.id,
    exceptionIds: ["exception-1", "exception-2"],
    question:
      "For Line 5 (Divider Insert, 3-Ply): (1) how many pieces are included per pallet at $620.00/pallet? We " +
      "need this to compare your price on a per-piece basis with other vendors. (2) Please also provide the " +
      "edge crush test certificate for this line, which was not included in your response.",
    draftedBy: "ai",
    status: "draft",
  },
];

// --- Quality responses (independent of price) --------------------------------

const qualityResponses: QualityResponse[] = [
  {
    id: "quality-1",
    vendorResponseId: vendorResponse.id,
    rfxLineId: rfxLines[0].id,
    criteria: { edge_crush_test_certificate: true, moisture_resistant: true },
    passed: true,
    evidenceIds: ["evidence-1"],
    evaluatedAt: now,
  },
  {
    id: "quality-5",
    vendorResponseId: vendorResponse.id,
    rfxLineId: rfxLines[4].id,
    criteria: { edge_crush_test_certificate: false },
    passed: false,
    notes: "No edge crush test certificate provided for this line.",
    evidenceIds: ["evidence-5"],
    evaluatedAt: now,
  },
];

export const corrugatedSeed = {
  tenant,
  dimensions,
  units,
  products,
  packagingConversions,
  rfx,
  rfxLines,
  vendors: [vendor] as Vendor[],
  vendorResponses: [vendorResponse] as VendorResponse[],
  responseDocuments,
  vendorResponseLines,
  evidence,
  prices,
  unitResolutions,
  normalizationResults,
  exceptions,
  clarifications,
  qualityResponses,
};

export type CorrugatedSeed = typeof corrugatedSeed;
