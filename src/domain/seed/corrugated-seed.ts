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
  title: "Corrugated Packaging Q3",
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
    vendorResponseId: vendorResponse.id,
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
    vendorResponseId: vendorResponse.id,
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

// ===========================================================================
// Vendors B-E: four more responses to the SAME rfx-1 lines, each carrying a
// distinct messiness scenario (ply non-compliance, contradictory discount,
// illegible photographed price, ambiguous prose freight, vendor-estimated-
// but-unconfigured pallet size, and an omitted line). Together with Vendor A
// this gives a genuine 5-vendor comparison across all 5 lines without
// inventing new products/units -- the packaging conversion (bundle of 50)
// and the missing-pallet-unit gap already defined above apply to any vendor
// quoting against these same lines.
// ===========================================================================

const vendorB: Vendor = { id: "vendor-2", tenantId: tenant.id, name: "Vendor B Container Supplies", contactEmail: "quotes@vendorb.example" };
const vendorC: Vendor = { id: "vendor-3", tenantId: tenant.id, name: "Vendor C Packaging Solutions", contactEmail: "sales@vendorc.example" };
const vendorD: Vendor = { id: "vendor-4", tenantId: tenant.id, name: "Vendor D Box Manufacturing", contactEmail: "orders@vendord.example" };
const vendorE: Vendor = { id: "vendor-5", tenantId: tenant.id, name: "Vendor E Corrugated Supplies", contactEmail: "info@vendore.example" };

const vendorResponseB: VendorResponse = { id: "vendor-response-b", rfxId: rfx.id, vendorId: vendorB.id, receivedAt: now };
const vendorResponseC: VendorResponse = { id: "vendor-response-c", rfxId: rfx.id, vendorId: vendorC.id, receivedAt: now };
const vendorResponseD: VendorResponse = { id: "vendor-response-d", rfxId: rfx.id, vendorId: vendorD.id, receivedAt: now };
const vendorResponseE: VendorResponse = { id: "vendor-response-e", rfxId: rfx.id, vendorId: vendorE.id, receivedAt: now };

const docB: ResponseDocument = {
  id: "doc-b1",
  vendorResponseId: vendorResponseB.id,
  format: "pdf",
  fileRef: "inbound/vendor-b/rfx-2026-corr-001-quote.pdf",
  receivedAt: now,
  rawContentExcerpt: "Single PDF price sheet covering Lines 1-4; Line 5 is not present in the document.",
};
const docC: ResponseDocument = {
  id: "doc-c1",
  vendorResponseId: vendorResponseC.id,
  format: "docx",
  fileRef: "inbound/vendor-c/rfx-2026-corr-001-quote.docx",
  receivedAt: now,
  rawContentExcerpt: "Word document with a pricing table and a separate payment-terms paragraph.",
};
const docD: ResponseDocument = {
  id: "doc-d1",
  vendorResponseId: vendorResponseD.id,
  format: "image",
  fileRef: "inbound/vendor-d/rate-card-photo.png",
  receivedAt: now,
  rawContentExcerpt: "Photographed handwritten rate card; partially smudged, bottom row not visible.",
};
const docE: ResponseDocument = {
  id: "doc-e1",
  vendorResponseId: vendorResponseE.id,
  format: "email",
  fileRef: "inbound/vendor-e/quote-email.txt",
  receivedAt: now,
  rawContentExcerpt: "Plain-text email with prose pricing, freight and pallet notes.",
};

// --- Vendor B: 5-ply quoted against a 7-ply requirement (Line 3), Line 5 omitted entirely ---

const vrlB1: VendorResponseLine = { id: "vrl-b1", vendorResponseId: vendorResponseB.id, documentId: docB.id, rfxLineId: rfxLines[0].id, rawProductDescription: "RSC Box 24x18x12, 3 ply", rawQuantity: "5000", rawUnit: "piece", evidenceIds: ["evidence-b1"] };
const vrlB2: VendorResponseLine = { id: "vrl-b2", vendorResponseId: vendorResponseB.id, documentId: docB.id, rfxLineId: rfxLines[1].id, rawProductDescription: "RSC Box 24x18x12, 5 ply", rawQuantity: "3000", rawUnit: "piece", evidenceIds: ["evidence-b2"] };
const vrlB3: VendorResponseLine = { id: "vrl-b3", vendorResponseId: vendorResponseB.id, documentId: docB.id, rfxLineId: rfxLines[2].id, rawProductDescription: "Heavy Duty Box 36x24x24, 5 ply", rawQuantity: "1200", rawUnit: "piece", evidenceIds: ["evidence-b3"] };
const vrlB4: VendorResponseLine = { id: "vrl-b4", vendorResponseId: vendorResponseB.id, documentId: docB.id, rfxLineId: rfxLines[3].id, rawProductDescription: "Mailer Box 12x9x6, 5 ply", rawQuantity: "200 bundles", rawUnit: "bundle of 50", evidenceIds: ["evidence-b4"] };

const evidenceB: Evidence[] = [
  { id: "evidence-b1", documentId: docB.id, sourceRef: docB.fileRef, excerpt: "Line 1 | RSC Box 24x18x12, 3 ply | 5000 | $1.22 / piece", location: "PDF quote, table row 1", extractedBy: "ai", extractedAt: now },
  { id: "evidence-b2", documentId: docB.id, sourceRef: docB.fileRef, excerpt: "Line 2 | RSC Box 24x18x12, 5 ply | 3000 | $1.58 / piece", location: "PDF quote, table row 2", extractedBy: "ai", extractedAt: now },
  { id: "evidence-b3", documentId: docB.id, sourceRef: docB.fileRef, excerpt: "Line 3 | Heavy Duty Box 36x24x24, 5 ply | 1200 | $2.95 / piece", location: "PDF quote, table row 3", extractedBy: "ai", extractedAt: now },
  { id: "evidence-b4", documentId: docB.id, sourceRef: docB.fileRef, excerpt: "Line 4 | Mailer Box 12x9x6, 5 ply | 200 bundles (50/bundle) | $44.50 / bundle", location: "PDF quote, table row 4", extractedBy: "ai", extractedAt: now },
  { id: "evidence-b5", documentId: docB.id, sourceRef: docB.fileRef, excerpt: "Pricing table ends at row 4; no Line 5 / Divider Insert entry present.", location: "PDF quote, end of table", extractedBy: "ai", extractedAt: now },
];

const pricesB: Price[] = [
  { id: "price-b1", vendorResponseLineId: vrlB1.id, quotedPrice: 1.22, currency: "USD", priceBasisRaw: "per piece", priceBasisUnitId: unitPiece.id, netProductPrice: 1.22, landedCost: 1.22, evidenceIds: ["evidence-b1"] },
  { id: "price-b2", vendorResponseLineId: vrlB2.id, quotedPrice: 1.58, currency: "USD", priceBasisRaw: "per piece", priceBasisUnitId: unitPiece.id, netProductPrice: 1.58, landedCost: 1.58, evidenceIds: ["evidence-b2"] },
  { id: "price-b3", vendorResponseLineId: vrlB3.id, quotedPrice: 2.95, currency: "USD", priceBasisRaw: "per piece", priceBasisUnitId: unitPiece.id, netProductPrice: 2.95, landedCost: 2.95, evidenceIds: ["evidence-b3"] },
  { id: "price-b4", vendorResponseLineId: vrlB4.id, quotedPrice: 44.5, currency: "USD", priceBasisRaw: "per bundle of 50", priceBasisUnitId: unitBundle50.id, packSize: 50, netProductPrice: 44.5, landedCost: 44.5, evidenceIds: ["evidence-b4"] },
];

const unitResolutionsB: UnitResolution[] = [
  { id: "unit-res-b1", priceId: "price-b1", rawUnitText: "per piece", matchedUnitId: unitPiece.id, status: "clear", confidence: 1, evidenceIds: ["evidence-b1"] },
  { id: "unit-res-b2", priceId: "price-b2", rawUnitText: "per piece", matchedUnitId: unitPiece.id, status: "clear", confidence: 1, evidenceIds: ["evidence-b2"] },
  { id: "unit-res-b3", priceId: "price-b3", rawUnitText: "per piece", matchedUnitId: unitPiece.id, status: "clear", confidence: 1, evidenceIds: ["evidence-b3"] },
  { id: "unit-res-b4", priceId: "price-b4", rawUnitText: "per bundle of 50", matchedUnitId: unitBundle50.id, matchedPackagingConversionId: "pack-conv-1", status: "clear", confidence: 0.95, evidenceIds: ["evidence-b4"] },
];

const normalizationResultsB: NormalizationResult[] = [
  { id: "norm-b1", priceId: "price-b1", unitResolutionId: "unit-res-b1", conversionFactorApplied: 1, fromUnitId: unitPiece.id, toUnitId: unitPiece.id, normalizedPrice: 1.22, comparisonUnitId: unitPiece.id, calculation: ["quoted $1.22/piece", "no discount/freight/tax stated", "normalized = $1.22/piece"], confidence: 0.97, status: "clear", evidenceIds: ["evidence-b1"] },
  { id: "norm-b2", priceId: "price-b2", unitResolutionId: "unit-res-b2", conversionFactorApplied: 1, fromUnitId: unitPiece.id, toUnitId: unitPiece.id, normalizedPrice: 1.58, comparisonUnitId: unitPiece.id, calculation: ["quoted $1.58/piece", "no discount/freight/tax stated", "normalized = $1.58/piece"], confidence: 0.97, status: "clear", evidenceIds: ["evidence-b2"] },
  { id: "norm-b3", priceId: "price-b3", unitResolutionId: "unit-res-b3", conversionFactorApplied: 1, fromUnitId: unitPiece.id, toUnitId: unitPiece.id, normalizedPrice: 2.95, comparisonUnitId: unitPiece.id, calculation: ["quoted $2.95/piece", "price basis is clear; see Line 3 technical-compliance exception for spec mismatch", "normalized = $2.95/piece"], confidence: 0.95, status: "clear", evidenceIds: ["evidence-b3"] },
  { id: "norm-b4", priceId: "price-b4", unitResolutionId: "unit-res-b4", conversionFactorApplied: 50, fromUnitId: unitBundle50.id, toUnitId: unitPiece.id, normalizedPrice: 0.89, comparisonUnitId: unitPiece.id, calculation: ["quoted $44.50 per bundle of 50", "bundle -> piece conversion factor 50 (PackagingConversion pack-conv-1)", "normalized = 44.50 / 50 = $0.89/piece"], confidence: 0.95, status: "clear", evidenceIds: ["evidence-b4"] },
];

const qualityB: QualityResponse[] = [
  { id: "quality-b3", vendorResponseId: vendorResponseB.id, rfxLineId: rfxLines[2].id, criteria: { ply: 5 }, passed: false, notes: "Vendor quoted 5-ply; Line 3 requires 7-ply and a 32 ECT rating.", evidenceIds: ["evidence-b3"], evaluatedAt: now },
];

const exceptionB3: Exception = { id: "exception-b3", tenantId: tenant.id, rfxId: rfx.id, vendorResponseLineId: vrlB3.id, vendorResponseId: vendorResponseB.id, type: "technical_compliance", description: "Vendor B quoted Line 3 as 5-ply construction; the RFx requires 7-ply with a 32 ECT rating. This does not meet the stated technical requirement.", status: "clarification_requested", evidenceIds: ["evidence-b3"], createdAt: now };
const exceptionB5: Exception = { id: "exception-b5", tenantId: tenant.id, rfxId: rfx.id, vendorResponseId: vendorResponseB.id, type: "missing", description: "Vendor B's quote did not include Line 5 (Divider Insert, 3-Ply). No price was provided for this item.", status: "clarification_requested", evidenceIds: ["evidence-b5"], createdAt: now };

const clarificationB: Clarification = {
  id: "clarification-b",
  rfxId: rfx.id,
  vendorId: vendorB.id,
  exceptionIds: [exceptionB3.id, exceptionB5.id],
  question:
    "(1) For Line 3 (Heavy Duty Box, 7-Ply / 32 ECT): your quote describes this item as 5-ply. Can you confirm whether you can supply the 7-ply, 32-ECT specification, and if so, requote? " +
    "(2) Your quote did not include Line 5 (Divider Insert, 3-Ply) -- could you provide pricing for this item?",
  draftedBy: "ai",
  status: "draft",
};

// --- Vendor C: contradictory discount on Line 2, vendor-estimated (unconfigured) pallet size on Line 5 ---

const vrlC1: VendorResponseLine = { id: "vrl-c1", vendorResponseId: vendorResponseC.id, documentId: docC.id, rfxLineId: rfxLines[0].id, rawProductDescription: "RSC Box 24x18x12, 3 ply", rawQuantity: "5000", rawUnit: "piece", evidenceIds: ["evidence-c1"] };
const vrlC2: VendorResponseLine = { id: "vrl-c2", vendorResponseId: vendorResponseC.id, documentId: docC.id, rfxLineId: rfxLines[1].id, rawProductDescription: "RSC Box 24x18x12, 5 ply", rawQuantity: "3000", rawUnit: "piece", evidenceIds: ["evidence-c2", "evidence-c2b"] };
const vrlC3: VendorResponseLine = { id: "vrl-c3", vendorResponseId: vendorResponseC.id, documentId: docC.id, rfxLineId: rfxLines[2].id, rawProductDescription: "Heavy Duty Box 36x24x24, 7 ply", rawQuantity: "1200", rawUnit: "piece", evidenceIds: ["evidence-c3"] };
const vrlC4: VendorResponseLine = { id: "vrl-c4", vendorResponseId: vendorResponseC.id, documentId: docC.id, rfxLineId: rfxLines[3].id, rawProductDescription: "Mailer Box 12x9x6, 5 ply", rawQuantity: "200 bundles", rawUnit: "bundle of 50", evidenceIds: ["evidence-c4"] };
const vrlC5: VendorResponseLine = { id: "vrl-c5", vendorResponseId: vendorResponseC.id, documentId: docC.id, rfxLineId: rfxLines[4].id, rawProductDescription: "Divider Insert, 3 ply", rawQuantity: "unspecified", rawUnit: "pallet (~500 pcs/pallet per email note)", evidenceIds: ["evidence-c5"] };

const evidenceC: Evidence[] = [
  { id: "evidence-c1", documentId: docC.id, sourceRef: docC.fileRef, excerpt: "Line 1 | RSC Box 24x18x12, 3 ply | 5000 | $1.30 / piece", location: "Pricing table, row 1", extractedBy: "ai", extractedAt: now },
  { id: "evidence-c2", documentId: docC.id, sourceRef: docC.fileRef, excerpt: "Line 2 | RSC Box 24x18x12, 5 ply | 3000 | $1.65 / piece, 10% volume discount", location: "Pricing table, row 2", extractedBy: "ai", extractedAt: now },
  { id: "evidence-c2b", documentId: docC.id, sourceRef: docC.fileRef, excerpt: "Payment terms: \"a 5% discount applies to all orders over 2000 units.\"", location: "Payment terms paragraph", extractedBy: "ai", extractedAt: now },
  { id: "evidence-c3", documentId: docC.id, sourceRef: docC.fileRef, excerpt: "Line 3 | Heavy Duty Box 36x24x24, 7 ply | 1200 | $3.25 / piece, freight included", location: "Pricing table, row 3", extractedBy: "ai", extractedAt: now },
  { id: "evidence-c4", documentId: docC.id, sourceRef: docC.fileRef, excerpt: "Line 4 | Mailer Box 12x9x6, 5 ply | 200 bundles (50/bundle) | $46.00 / bundle", location: "Pricing table, row 4", extractedBy: "ai", extractedAt: now },
  { id: "evidence-c5", documentId: docC.id, sourceRef: docC.fileRef, excerpt: "Line 5 | Divider Insert, 3 ply | $610.00 / pallet. Covering email: \"approx. 500 pcs per pallet, standard palletization.\"", location: "Pricing table, row 5 + covering email", extractedBy: "ai", extractedAt: now },
];

const pricesC: Price[] = [
  { id: "price-c1", vendorResponseLineId: vrlC1.id, quotedPrice: 1.3, currency: "USD", priceBasisRaw: "per piece", priceBasisUnitId: unitPiece.id, netProductPrice: 1.3, landedCost: 1.3, evidenceIds: ["evidence-c1"] },
  { id: "price-c2", vendorResponseLineId: vrlC2.id, quotedPrice: 1.65, currency: "USD", priceBasisRaw: "per piece", priceBasisUnitId: unitPiece.id, discountRaw: "Pricing table states 10% volume discount; payment-terms paragraph states 5% for the same order -- contradictory.", evidenceIds: ["evidence-c2", "evidence-c2b"] },
  { id: "price-c3", vendorResponseLineId: vrlC3.id, quotedPrice: 3.25, currency: "USD", priceBasisRaw: "per piece", priceBasisUnitId: unitPiece.id, freightRaw: "included", freightAmount: 0, netProductPrice: 3.25, landedCost: 3.25, evidenceIds: ["evidence-c3"] },
  { id: "price-c4", vendorResponseLineId: vrlC4.id, quotedPrice: 46.0, currency: "USD", priceBasisRaw: "per bundle of 50", priceBasisUnitId: unitBundle50.id, packSize: 50, netProductPrice: 46.0, landedCost: 46.0, evidenceIds: ["evidence-c4"] },
  { id: "price-c5", vendorResponseLineId: vrlC5.id, quotedPrice: 610.0, currency: "USD", priceBasisRaw: "per pallet (vendor states ~500 pieces/pallet)", evidenceIds: ["evidence-c5"] },
];

const unitResolutionsC: UnitResolution[] = [
  { id: "unit-res-c1", priceId: "price-c1", rawUnitText: "per piece", matchedUnitId: unitPiece.id, status: "clear", confidence: 1, evidenceIds: ["evidence-c1"] },
  { id: "unit-res-c2", priceId: "price-c2", rawUnitText: "per piece", matchedUnitId: unitPiece.id, status: "clear", confidence: 1, evidenceIds: ["evidence-c2"] },
  { id: "unit-res-c3", priceId: "price-c3", rawUnitText: "per piece", matchedUnitId: unitPiece.id, status: "clear", confidence: 1, evidenceIds: ["evidence-c3"] },
  { id: "unit-res-c4", priceId: "price-c4", rawUnitText: "per bundle of 50", matchedUnitId: unitBundle50.id, matchedPackagingConversionId: "pack-conv-1", status: "clear", confidence: 0.95, evidenceIds: ["evidence-c4"] },
  { id: "unit-res-c5", priceId: "price-c5", rawUnitText: "per pallet", status: "ambiguous", confidence: 0.5, evidenceIds: ["evidence-c5"], notes: "Vendor's covering email states approximately 500 pieces per pallet, but no \"pallet\" unit is configured in the tenant's catalog yet -- treat as a tentative, vendor-stated conversion only." },
];

const normalizationResultsC: NormalizationResult[] = [
  { id: "norm-c1", priceId: "price-c1", unitResolutionId: "unit-res-c1", conversionFactorApplied: 1, fromUnitId: unitPiece.id, toUnitId: unitPiece.id, normalizedPrice: 1.3, comparisonUnitId: unitPiece.id, calculation: ["quoted $1.30/piece", "no discount/freight/tax stated", "normalized = $1.30/piece"], confidence: 0.97, status: "clear", evidenceIds: ["evidence-c1"] },
  { id: "norm-c2", priceId: "price-c2", unitResolutionId: "unit-res-c2", comparisonUnitId: unitPiece.id, calculation: ["quoted $1.65/piece", "discount stated as both 10% (pricing table) and 5% (payment terms) for the same order", "cannot determine the net price without resolving which discount applies", "comparison blocked pending clarification"], confidence: 0.2, status: "contradictory", evidenceIds: ["evidence-c2", "evidence-c2b"] },
  { id: "norm-c3", priceId: "price-c3", unitResolutionId: "unit-res-c3", conversionFactorApplied: 1, fromUnitId: unitPiece.id, toUnitId: unitPiece.id, normalizedPrice: 3.25, comparisonUnitId: unitPiece.id, calculation: ["quoted $3.25/piece, freight included", "no discount/tax stated", "normalized = $3.25/piece"], confidence: 0.95, status: "clear", evidenceIds: ["evidence-c3"] },
  { id: "norm-c4", priceId: "price-c4", unitResolutionId: "unit-res-c4", conversionFactorApplied: 50, fromUnitId: unitBundle50.id, toUnitId: unitPiece.id, normalizedPrice: 0.92, comparisonUnitId: unitPiece.id, calculation: ["quoted $46.00 per bundle of 50", "bundle -> piece conversion factor 50 (PackagingConversion pack-conv-1)", "normalized = 46.00 / 50 = $0.92/piece"], confidence: 0.95, status: "clear", evidenceIds: ["evidence-c4"] },
  { id: "norm-c5", priceId: "price-c5", unitResolutionId: "unit-res-c5", toUnitId: unitPiece.id, comparisonUnitId: unitPiece.id, normalizedPrice: 1.22, calculation: ["quoted $610.00 per pallet", "vendor's covering email states approximately 500 pieces per pallet (not a configured tenant unit)", "tentative normalized = 610.00 / 500 = $1.22/piece -- pending buyer confirmation / unit configuration"], confidence: 0.5, status: "ambiguous", evidenceIds: ["evidence-c5"] },
];

const exceptionC2: Exception = { id: "exception-c2", tenantId: tenant.id, rfxId: rfx.id, vendorResponseLineId: vrlC2.id, vendorResponseId: vendorResponseC.id, type: "contradictory", description: "Vendor C's quote states two different discounts for Line 2: 10% in the pricing table and 5% in the payment-terms paragraph. Which applies is unclear.", status: "clarification_requested", evidenceIds: ["evidence-c2", "evidence-c2b"], createdAt: now };
const exceptionC5: Exception = { id: "exception-c5", tenantId: tenant.id, rfxId: rfx.id, vendorResponseLineId: vrlC5.id, vendorResponseId: vendorResponseC.id, type: "unknown_unit", description: "Vendor C quoted Line 5 at $610.00/pallet and mentioned ~500 pieces per pallet in a covering email, but no \"pallet\" unit is configured for this tenant/product. Confirm the pallet size and configure the unit before treating this as comparable.", status: "clarification_requested", evidenceIds: ["evidence-c5"], createdAt: now };

const clarificationC: Clarification = {
  id: "clarification-c",
  rfxId: rfx.id,
  vendorId: vendorC.id,
  exceptionIds: [exceptionC2.id, exceptionC5.id],
  question:
    "(1) For Line 2 (RSC Box, 5-Ply): your pricing table shows a 10% discount while your payment terms mention 5% for the same order. Please confirm which discount applies. " +
    "(2) For Line 5 (Divider Insert): please confirm the exact number of pieces per pallet for the $610.00/pallet quote so we can compare it on a per-piece basis.",
  draftedBy: "ai",
  status: "draft",
};

// --- Vendor D: photographed rate card, illegible price on Line 4, Line 5 not visible on the card ---

const vrlD1: VendorResponseLine = { id: "vrl-d1", vendorResponseId: vendorResponseD.id, documentId: docD.id, rfxLineId: rfxLines[0].id, rawProductDescription: "RSC Box 24x18x12, 3 ply", rawQuantity: "5000", rawUnit: "piece", evidenceIds: ["evidence-d1"] };
const vrlD2: VendorResponseLine = { id: "vrl-d2", vendorResponseId: vendorResponseD.id, documentId: docD.id, rfxLineId: rfxLines[1].id, rawProductDescription: "RSC Box 24x18x12, 5 ply", rawQuantity: "3000", rawUnit: "piece", evidenceIds: ["evidence-d2"] };
const vrlD3: VendorResponseLine = { id: "vrl-d3", vendorResponseId: vendorResponseD.id, documentId: docD.id, rfxLineId: rfxLines[2].id, rawProductDescription: "Heavy Duty Box 36x24x24, 7 ply", rawQuantity: "1200", rawUnit: "piece", evidenceIds: ["evidence-d3"] };
const vrlD4: VendorResponseLine = { id: "vrl-d4", vendorResponseId: vendorResponseD.id, documentId: docD.id, rfxLineId: rfxLines[3].id, rawProductDescription: "Mailer Box 12x9x6, 5 ply", rawQuantity: "~200 bundles", rawUnit: "bundle of 50 (handwritten, partially smudged)", evidenceIds: ["evidence-d4"] };

const evidenceD: Evidence[] = [
  { id: "evidence-d1", documentId: docD.id, sourceRef: docD.fileRef, excerpt: "\"RSC 24x18x12 3ply ... $1.28/pc\"", location: "Photographed rate card, row 1", extractedBy: "ai", extractedAt: now },
  { id: "evidence-d2", documentId: docD.id, sourceRef: docD.fileRef, excerpt: "\"RSC 24x18x12 5ply ... $1.62/pc\"", location: "Photographed rate card, row 2", extractedBy: "ai", extractedAt: now },
  { id: "evidence-d3", documentId: docD.id, sourceRef: docD.fileRef, excerpt: "\"HD 36x24x24 7ply ... $3.05/pc, frt incl\"", location: "Photographed rate card, row 3", extractedBy: "ai", extractedAt: now },
  { id: "evidence-d4", documentId: docD.id, sourceRef: docD.fileRef, excerpt: "\"Mailer 12x9x6 5ply ... $4[smudged].00/bndl(50)\" -- AI read as $48.00, 58% confidence", location: "Photographed rate card, row 4", extractedBy: "ai", extractedAt: now },
  { id: "evidence-d5", documentId: docD.id, sourceRef: docD.fileRef, excerpt: "Card frame ends after row 4; no Divider Insert / Line 5 row is visible in the photograph.", location: "Photographed rate card, bottom edge", extractedBy: "ai", extractedAt: now },
];

const pricesD: Price[] = [
  { id: "price-d1", vendorResponseLineId: vrlD1.id, quotedPrice: 1.28, currency: "USD", priceBasisRaw: "per piece", priceBasisUnitId: unitPiece.id, netProductPrice: 1.28, landedCost: 1.28, evidenceIds: ["evidence-d1"] },
  { id: "price-d2", vendorResponseLineId: vrlD2.id, quotedPrice: 1.62, currency: "USD", priceBasisRaw: "per piece", priceBasisUnitId: unitPiece.id, netProductPrice: 1.62, landedCost: 1.62, evidenceIds: ["evidence-d2"] },
  { id: "price-d3", vendorResponseLineId: vrlD3.id, quotedPrice: 3.05, currency: "USD", priceBasisRaw: "per piece", priceBasisUnitId: unitPiece.id, freightRaw: "included", freightAmount: 0, netProductPrice: 3.05, landedCost: 3.05, evidenceIds: ["evidence-d3"] },
  { id: "price-d4", vendorResponseLineId: vrlD4.id, quotedPrice: 48.0, currency: "USD", priceBasisRaw: "per bundle of 50 (handwritten, partially smudged)", priceBasisUnitId: unitBundle50.id, packSize: 50, evidenceIds: ["evidence-d4"] },
];

const unitResolutionsD: UnitResolution[] = [
  { id: "unit-res-d1", priceId: "price-d1", rawUnitText: "per piece", matchedUnitId: unitPiece.id, status: "clear", confidence: 0.9, evidenceIds: ["evidence-d1"] },
  { id: "unit-res-d2", priceId: "price-d2", rawUnitText: "per piece", matchedUnitId: unitPiece.id, status: "clear", confidence: 0.9, evidenceIds: ["evidence-d2"] },
  { id: "unit-res-d3", priceId: "price-d3", rawUnitText: "per piece", matchedUnitId: unitPiece.id, status: "clear", confidence: 0.9, evidenceIds: ["evidence-d3"] },
  { id: "unit-res-d4", priceId: "price-d4", rawUnitText: "per bundle of 50", matchedUnitId: unitBundle50.id, matchedPackagingConversionId: "pack-conv-1", status: "clear", confidence: 0.85, evidenceIds: ["evidence-d4"] },
];

const normalizationResultsD: NormalizationResult[] = [
  { id: "norm-d1", priceId: "price-d1", unitResolutionId: "unit-res-d1", conversionFactorApplied: 1, fromUnitId: unitPiece.id, toUnitId: unitPiece.id, normalizedPrice: 1.28, comparisonUnitId: unitPiece.id, calculation: ["photographed rate card read as $1.28/piece", "no discount/freight/tax stated", "normalized = $1.28/piece"], confidence: 0.85, status: "clear", evidenceIds: ["evidence-d1"] },
  { id: "norm-d2", priceId: "price-d2", unitResolutionId: "unit-res-d2", conversionFactorApplied: 1, fromUnitId: unitPiece.id, toUnitId: unitPiece.id, normalizedPrice: 1.62, comparisonUnitId: unitPiece.id, calculation: ["photographed rate card read as $1.62/piece", "no discount/freight/tax stated", "normalized = $1.62/piece"], confidence: 0.85, status: "clear", evidenceIds: ["evidence-d2"] },
  { id: "norm-d3", priceId: "price-d3", unitResolutionId: "unit-res-d3", conversionFactorApplied: 1, fromUnitId: unitPiece.id, toUnitId: unitPiece.id, normalizedPrice: 3.05, comparisonUnitId: unitPiece.id, calculation: ["photographed rate card read as $3.05/piece, freight included", "no discount/tax stated", "normalized = $3.05/piece"], confidence: 0.85, status: "clear", evidenceIds: ["evidence-d3"] },
  { id: "norm-d4", priceId: "price-d4", unitResolutionId: "unit-res-d4", conversionFactorApplied: 50, fromUnitId: unitBundle50.id, toUnitId: unitPiece.id, normalizedPrice: 0.96, comparisonUnitId: unitPiece.id, calculation: ["photographed rate card price read as $48.00 per bundle of 50 (AI confidence 58% -- digit partially smudged)", "bundle -> piece conversion factor 50 (PackagingConversion pack-conv-1)", "tentative normalized = 48.00 / 50 = $0.96/piece -- verify against the original image or the vendor"], confidence: 0.45, status: "ambiguous", evidenceIds: ["evidence-d4"] },
];

const exceptionD4: Exception = { id: "exception-d4", tenantId: tenant.id, rfxId: rfx.id, vendorResponseLineId: vrlD4.id, vendorResponseId: vendorResponseD.id, type: "ambiguous", description: "The photographed rate card's price for Line 4 is partially smudged. AI read it as $48.00 per bundle of 50 with low confidence (58%). Verify against the original image or ask the vendor to resend.", status: "clarification_requested", evidenceIds: ["evidence-d4"], createdAt: now };
const exceptionD5: Exception = { id: "exception-d5", tenantId: tenant.id, rfxId: rfx.id, vendorResponseId: vendorResponseD.id, type: "missing", description: "Line 5 (Divider Insert) does not appear on Vendor D's photographed rate card -- the bottom of the card may be cropped or the item was not quoted.", status: "clarification_requested", evidenceIds: ["evidence-d5"], createdAt: now };

const clarificationD: Clarification = {
  id: "clarification-d",
  rfxId: rfx.id,
  vendorId: vendorD.id,
  exceptionIds: [exceptionD4.id, exceptionD5.id],
  question:
    "(1) For Line 4 (Mailer Box, 5-Ply): the price on your photographed rate card is partially illegible -- we read it as $48.00 per bundle of 50, please confirm. " +
    "(2) Your rate card does not appear to include Line 5 (Divider Insert) -- could you provide pricing for this item?",
  draftedBy: "ai",
  status: "draft",
};

// --- Vendor E: email response, freight described in prose (Line 2), vendor-estimated pallet size (Line 5) ---

const vrlE1: VendorResponseLine = { id: "vrl-e1", vendorResponseId: vendorResponseE.id, documentId: docE.id, rfxLineId: rfxLines[0].id, rawProductDescription: "RSC Box 24x18x12, 3 ply", rawQuantity: "5000", rawUnit: "piece", evidenceIds: ["evidence-e1"] };
const vrlE2: VendorResponseLine = { id: "vrl-e2", vendorResponseId: vendorResponseE.id, documentId: docE.id, rfxLineId: rfxLines[1].id, rawProductDescription: "RSC Box 24x18x12, 5 ply", rawQuantity: "3000", rawUnit: "piece", evidenceIds: ["evidence-e2"] };
const vrlE3: VendorResponseLine = { id: "vrl-e3", vendorResponseId: vendorResponseE.id, documentId: docE.id, rfxLineId: rfxLines[2].id, rawProductDescription: "Heavy Duty Box 36x24x24, 7 ply", rawQuantity: "1200", rawUnit: "piece", evidenceIds: ["evidence-e3"] };
const vrlE4: VendorResponseLine = { id: "vrl-e4", vendorResponseId: vendorResponseE.id, documentId: docE.id, rfxLineId: rfxLines[3].id, rawProductDescription: "Mailer Box 12x9x6, 5 ply", rawQuantity: "200 bundles", rawUnit: "bundle of 50", evidenceIds: ["evidence-e4"] };
const vrlE5: VendorResponseLine = { id: "vrl-e5", vendorResponseId: vendorResponseE.id, documentId: docE.id, rfxLineId: rfxLines[4].id, rawProductDescription: "Divider Insert, 3 ply", rawQuantity: "unspecified", rawUnit: "pallet (~480 pcs/pallet, vendor estimate)", evidenceIds: ["evidence-e5"] };

const evidenceE: Evidence[] = [
  { id: "evidence-e1", documentId: docE.id, sourceRef: docE.fileRef, excerpt: "\"Line 1, RSC 24x18x12 3-ply: $1.24 each for the full 5,000 qty.\"", location: "Email body, paragraph 1", extractedBy: "ai", extractedAt: now },
  { id: "evidence-e2", documentId: docE.id, sourceRef: docE.fileRef, excerpt: "\"Line 2, RSC 24x18x12 5-ply: $1.55 each. Freight would be approximately 3-5% of order value depending on destination, to be confirmed at PO stage.\"", location: "Email body, paragraph 2", extractedBy: "ai", extractedAt: now },
  { id: "evidence-e3", documentId: docE.id, sourceRef: docE.fileRef, excerpt: "\"Line 3, Heavy Duty 36x24x24 7-ply: $3.00 each, freight included.\"", location: "Email body, paragraph 3", extractedBy: "ai", extractedAt: now },
  { id: "evidence-e4", documentId: docE.id, sourceRef: docE.fileRef, excerpt: "\"Line 4, Mailer 12x9x6 5-ply: $43.00 per bundle of 50.\"", location: "Email body, paragraph 4", extractedBy: "ai", extractedAt: now },
  { id: "evidence-e5", documentId: docE.id, sourceRef: docE.fileRef, excerpt: "\"Line 5, Divider Insert: $600.00 per pallet -- roughly 480 units per pallet based on standard palletization, but please treat that as an estimate, not confirmed.\"", location: "Email body, paragraph 5", extractedBy: "ai", extractedAt: now },
];

const pricesE: Price[] = [
  { id: "price-e1", vendorResponseLineId: vrlE1.id, quotedPrice: 1.24, currency: "USD", priceBasisRaw: "per piece", priceBasisUnitId: unitPiece.id, netProductPrice: 1.24, landedCost: 1.24, evidenceIds: ["evidence-e1"] },
  { id: "price-e2", vendorResponseLineId: vrlE2.id, quotedPrice: 1.55, currency: "USD", priceBasisRaw: "per piece", priceBasisUnitId: unitPiece.id, freightRaw: "approximately 3-5% of order value depending on destination, to be confirmed at PO stage", netProductPrice: 1.55, evidenceIds: ["evidence-e2"] },
  { id: "price-e3", vendorResponseLineId: vrlE3.id, quotedPrice: 3.0, currency: "USD", priceBasisRaw: "per piece", priceBasisUnitId: unitPiece.id, freightRaw: "included", freightAmount: 0, netProductPrice: 3.0, landedCost: 3.0, evidenceIds: ["evidence-e3"] },
  { id: "price-e4", vendorResponseLineId: vrlE4.id, quotedPrice: 43.0, currency: "USD", priceBasisRaw: "per bundle of 50", priceBasisUnitId: unitBundle50.id, packSize: 50, netProductPrice: 43.0, landedCost: 43.0, evidenceIds: ["evidence-e4"] },
  { id: "price-e5", vendorResponseLineId: vrlE5.id, quotedPrice: 600.0, currency: "USD", priceBasisRaw: "per pallet (vendor estimates ~480 pieces/pallet, unconfirmed)", evidenceIds: ["evidence-e5"] },
];

const unitResolutionsE: UnitResolution[] = [
  { id: "unit-res-e1", priceId: "price-e1", rawUnitText: "per piece", matchedUnitId: unitPiece.id, status: "clear", confidence: 1, evidenceIds: ["evidence-e1"] },
  { id: "unit-res-e2", priceId: "price-e2", rawUnitText: "per piece", matchedUnitId: unitPiece.id, status: "clear", confidence: 1, evidenceIds: ["evidence-e2"] },
  { id: "unit-res-e3", priceId: "price-e3", rawUnitText: "per piece", matchedUnitId: unitPiece.id, status: "clear", confidence: 1, evidenceIds: ["evidence-e3"] },
  { id: "unit-res-e4", priceId: "price-e4", rawUnitText: "per bundle of 50", matchedUnitId: unitBundle50.id, matchedPackagingConversionId: "pack-conv-1", status: "clear", confidence: 0.95, evidenceIds: ["evidence-e4"] },
  { id: "unit-res-e5", priceId: "price-e5", rawUnitText: "per pallet", status: "ambiguous", confidence: 0.4, evidenceIds: ["evidence-e5"], notes: "Vendor estimated approximately 480 pieces per pallet but explicitly flagged this as unconfirmed, and no \"pallet\" unit is configured in the tenant's catalog." },
];

const normalizationResultsE: NormalizationResult[] = [
  { id: "norm-e1", priceId: "price-e1", unitResolutionId: "unit-res-e1", conversionFactorApplied: 1, fromUnitId: unitPiece.id, toUnitId: unitPiece.id, normalizedPrice: 1.24, comparisonUnitId: unitPiece.id, calculation: ["quoted $1.24/piece", "no discount/freight/tax stated", "normalized = $1.24/piece"], confidence: 0.97, status: "clear", evidenceIds: ["evidence-e1"] },
  { id: "norm-e2", priceId: "price-e2", unitResolutionId: "unit-res-e2", conversionFactorApplied: 1, fromUnitId: unitPiece.id, toUnitId: unitPiece.id, normalizedPrice: 1.55, comparisonUnitId: unitPiece.id, calculation: ["quoted $1.55/piece", "freight described only as \"approximately 3-5% of order value\", not a fixed amount", "net price = $1.55/piece; landed cost cannot be finalized until freight is fixed"], confidence: 0.6, status: "ambiguous", evidenceIds: ["evidence-e2"] },
  { id: "norm-e3", priceId: "price-e3", unitResolutionId: "unit-res-e3", conversionFactorApplied: 1, fromUnitId: unitPiece.id, toUnitId: unitPiece.id, normalizedPrice: 3.0, comparisonUnitId: unitPiece.id, calculation: ["quoted $3.00/piece, freight included", "no discount/tax stated", "normalized = $3.00/piece"], confidence: 0.97, status: "clear", evidenceIds: ["evidence-e3"] },
  { id: "norm-e4", priceId: "price-e4", unitResolutionId: "unit-res-e4", conversionFactorApplied: 50, fromUnitId: unitBundle50.id, toUnitId: unitPiece.id, normalizedPrice: 0.86, comparisonUnitId: unitPiece.id, calculation: ["quoted $43.00 per bundle of 50", "bundle -> piece conversion factor 50 (PackagingConversion pack-conv-1)", "normalized = 43.00 / 50 = $0.86/piece"], confidence: 0.95, status: "clear", evidenceIds: ["evidence-e4"] },
  { id: "norm-e5", priceId: "price-e5", unitResolutionId: "unit-res-e5", toUnitId: unitPiece.id, comparisonUnitId: unitPiece.id, normalizedPrice: 1.25, calculation: ["quoted $600.00 per pallet", "vendor estimates approximately 480 pieces per pallet, explicitly described as unconfirmed", "tentative normalized = 600.00 / 480 = $1.25/piece -- pending vendor confirmation"], confidence: 0.4, status: "ambiguous", evidenceIds: ["evidence-e5"] },
];

const exceptionE2: Exception = { id: "exception-e2", tenantId: tenant.id, rfxId: rfx.id, vendorResponseLineId: vrlE2.id, vendorResponseId: vendorResponseE.id, type: "ambiguous", description: "Vendor E's email describes Line 2 freight as \"approximately 3-5% of order value depending on destination, to be confirmed at PO stage\" instead of a fixed amount. Landed cost cannot be finalized until freight is fixed.", status: "clarification_requested", evidenceIds: ["evidence-e2"], createdAt: now };
const exceptionE5: Exception = { id: "exception-e5", tenantId: tenant.id, rfxId: rfx.id, vendorResponseLineId: vrlE5.id, vendorResponseId: vendorResponseE.id, type: "unknown_unit", description: "Vendor E estimated approximately 480 pieces per pallet for the $600.00/pallet quote on Line 5, but described this as unconfirmed. Confirm the exact pallet size before treating this as comparable.", status: "clarification_requested", evidenceIds: ["evidence-e5"], createdAt: now };

const clarificationE: Clarification = {
  id: "clarification-e",
  rfxId: rfx.id,
  vendorId: vendorE.id,
  exceptionIds: [exceptionE2.id, exceptionE5.id],
  question:
    "(1) For Line 2 (RSC Box, 5-Ply): could you confirm a fixed freight amount or percentage rather than a range, so we can finalize the landed cost? " +
    "(2) For Line 5 (Divider Insert): please confirm the exact number of pieces per pallet for the $600.00/pallet quote -- your email noted ~480 as an estimate only.",
  draftedBy: "ai",
  status: "draft",
};

// ===========================================================================
// Two additional, deliberately lightweight RFx records so the RFx list and
// Dashboard reflect a real multi-RFx tenant rather than a single demo page.
// Both reuse the same tenant/dimension/unit catalog; neither introduces new
// scenario types -- the corrugated-packaging RFx above is where all of the
// required messiness scenarios live.
// ===========================================================================

const productFastener1: Product = { id: "product-f1", tenantId: tenant.id, name: "Hex Bolt M8x40, Grade 8.8", category: "Industrial Fasteners", specification: { material: "Steel", grade: "8.8", size: "M8x40" }, dimensionId: dimensionCount.id, baseSellingUnitId: unitPiece.id };
const productFastener2: Product = { id: "product-f2", tenantId: tenant.id, name: "Flat Washer M8", category: "Industrial Fasteners", specification: { material: "Steel", size: "M8" }, dimensionId: dimensionCount.id, baseSellingUnitId: unitPiece.id };
const productFastener3: Product = { id: "product-f3", tenantId: tenant.id, name: "Hex Nut M8, Grade 8", category: "Industrial Fasteners", specification: { material: "Steel", grade: "8", size: "M8" }, dimensionId: dimensionCount.id, baseSellingUnitId: unitPiece.id };

const rfxFasteners: RFx = { id: "rfx-2", tenantId: tenant.id, title: "Industrial Fasteners Q3", category: "Industrial Fasteners", createdVia: "manual", status: "responses_in_progress", createdAt: now };
const rfxFastenerLines: RFxLine[] = [
  { id: "rfx2-line-1", rfxId: rfxFasteners.id, lineNumber: 1, productId: productFastener1.id, specification: { material: "Steel", grade: "8.8", size: "M8x40" }, requestedQuantity: 20000, requiredUnitId: unitPiece.id, deliveryRequirements: "FOB destination, 3-week lead time" },
  { id: "rfx2-line-2", rfxId: rfxFasteners.id, lineNumber: 2, productId: productFastener2.id, specification: { material: "Steel", size: "M8" }, requestedQuantity: 50000, requiredUnitId: unitPiece.id, deliveryRequirements: "FOB destination, 3-week lead time" },
  { id: "rfx2-line-3", rfxId: rfxFasteners.id, lineNumber: 3, productId: productFastener3.id, specification: { material: "Steel", grade: "8", size: "M8" }, requestedQuantity: 50000, requiredUnitId: unitPiece.id, deliveryRequirements: "FOB destination, 3-week lead time" },
];

const vendorFastener: Vendor = { id: "vendor-6", tenantId: tenant.id, name: "Fastener Direct Ltd", contactEmail: "sales@fastenerdirect.example" };
const vendorResponseFastener: VendorResponse = { id: "vendor-response-f", rfxId: rfxFasteners.id, vendorId: vendorFastener.id, receivedAt: now };
const docFastener: ResponseDocument = { id: "doc-f1", vendorResponseId: vendorResponseFastener.id, format: "excel", fileRef: "inbound/fastener-direct/quote.xlsx", receivedAt: now, rawContentExcerpt: "Excel price sheet, all 3 lines quoted per piece with no exceptions." };

const vrlF1: VendorResponseLine = { id: "vrl-f1", vendorResponseId: vendorResponseFastener.id, documentId: docFastener.id, rfxLineId: rfxFastenerLines[0].id, rawProductDescription: "Hex Bolt M8x40, Grade 8.8", rawQuantity: "20000", rawUnit: "piece", evidenceIds: ["evidence-f1"] };
const vrlF2: VendorResponseLine = { id: "vrl-f2", vendorResponseId: vendorResponseFastener.id, documentId: docFastener.id, rfxLineId: rfxFastenerLines[1].id, rawProductDescription: "Flat Washer M8", rawQuantity: "50000", rawUnit: "piece", evidenceIds: ["evidence-f2"] };
const vrlF3: VendorResponseLine = { id: "vrl-f3", vendorResponseId: vendorResponseFastener.id, documentId: docFastener.id, rfxLineId: rfxFastenerLines[2].id, rawProductDescription: "Hex Nut M8, Grade 8", rawQuantity: "50000", rawUnit: "piece", evidenceIds: ["evidence-f3"] };

const evidenceF: Evidence[] = [
  { id: "evidence-f1", documentId: docFastener.id, sourceRef: docFastener.fileRef, excerpt: "Line 1 | Hex Bolt M8x40, Gr 8.8 | 20000 | $0.08 / piece", location: "Sheet1!A2:D2", extractedBy: "ai", extractedAt: now },
  { id: "evidence-f2", documentId: docFastener.id, sourceRef: docFastener.fileRef, excerpt: "Line 2 | Flat Washer M8 | 50000 | $0.02 / piece", location: "Sheet1!A3:D3", extractedBy: "ai", extractedAt: now },
  { id: "evidence-f3", documentId: docFastener.id, sourceRef: docFastener.fileRef, excerpt: "Line 3 | Hex Nut M8, Gr 8 | 50000 | $0.03 / piece", location: "Sheet1!A4:D4", extractedBy: "ai", extractedAt: now },
];

const pricesF: Price[] = [
  { id: "price-f1", vendorResponseLineId: vrlF1.id, quotedPrice: 0.08, currency: "USD", priceBasisRaw: "per piece", priceBasisUnitId: unitPiece.id, netProductPrice: 0.08, landedCost: 0.08, evidenceIds: ["evidence-f1"] },
  { id: "price-f2", vendorResponseLineId: vrlF2.id, quotedPrice: 0.02, currency: "USD", priceBasisRaw: "per piece", priceBasisUnitId: unitPiece.id, netProductPrice: 0.02, landedCost: 0.02, evidenceIds: ["evidence-f2"] },
  { id: "price-f3", vendorResponseLineId: vrlF3.id, quotedPrice: 0.03, currency: "USD", priceBasisRaw: "per piece", priceBasisUnitId: unitPiece.id, netProductPrice: 0.03, landedCost: 0.03, evidenceIds: ["evidence-f3"] },
];

const unitResolutionsF: UnitResolution[] = ["price-f1", "price-f2", "price-f3"].map((priceId, i) => ({
  id: `unit-res-f${i + 1}`,
  priceId,
  rawUnitText: "per piece",
  matchedUnitId: unitPiece.id,
  status: "clear" as const,
  confidence: 1,
  evidenceIds: [`evidence-f${i + 1}`],
}));

const normalizationResultsF: NormalizationResult[] = [
  { id: "norm-f1", priceId: "price-f1", unitResolutionId: "unit-res-f1", conversionFactorApplied: 1, fromUnitId: unitPiece.id, toUnitId: unitPiece.id, normalizedPrice: 0.08, comparisonUnitId: unitPiece.id, calculation: ["quoted $0.08/piece", "no discount/freight/tax stated", "normalized = $0.08/piece"], confidence: 0.98, status: "clear", evidenceIds: ["evidence-f1"] },
  { id: "norm-f2", priceId: "price-f2", unitResolutionId: "unit-res-f2", conversionFactorApplied: 1, fromUnitId: unitPiece.id, toUnitId: unitPiece.id, normalizedPrice: 0.02, comparisonUnitId: unitPiece.id, calculation: ["quoted $0.02/piece", "no discount/freight/tax stated", "normalized = $0.02/piece"], confidence: 0.98, status: "clear", evidenceIds: ["evidence-f2"] },
  { id: "norm-f3", priceId: "price-f3", unitResolutionId: "unit-res-f3", conversionFactorApplied: 1, fromUnitId: unitPiece.id, toUnitId: unitPiece.id, normalizedPrice: 0.03, comparisonUnitId: unitPiece.id, calculation: ["quoted $0.03/piece", "no discount/freight/tax stated", "normalized = $0.03/piece"], confidence: 0.98, status: "clear", evidenceIds: ["evidence-f3"] },
];

const productOffice1: Product = { id: "product-o1", tenantId: tenant.id, name: "A4 Paper Ream, 80gsm", category: "Office Supplies", specification: { gsm: 80, size: "A4" }, dimensionId: dimensionCount.id, baseSellingUnitId: unitPiece.id };
const productOffice2: Product = { id: "product-o2", tenantId: tenant.id, name: "Ballpoint Pen, Box of 50", category: "Office Supplies", specification: { color: "Blue" }, dimensionId: dimensionCount.id, baseSellingUnitId: unitPiece.id };
const productOffice3: Product = { id: "product-o3", tenantId: tenant.id, name: "Lever Arch Folder, A4", category: "Office Supplies", specification: { size: "A4" }, dimensionId: dimensionCount.id, baseSellingUnitId: unitPiece.id };

const rfxOffice: RFx = { id: "rfx-3", tenantId: tenant.id, title: "Office Supplies Q3", category: "Office Supplies", createdVia: "ai_suggested", status: "awarded", createdAt: now, approvedAt: now };
const rfxOfficeLines: RFxLine[] = [
  { id: "rfx3-line-1", rfxId: rfxOffice.id, lineNumber: 1, productId: productOffice1.id, specification: { gsm: 80, size: "A4" }, requestedQuantity: 500, requiredUnitId: unitPiece.id },
  { id: "rfx3-line-2", rfxId: rfxOffice.id, lineNumber: 2, productId: productOffice2.id, specification: { color: "Blue" }, requestedQuantity: 300, requiredUnitId: unitPiece.id },
  { id: "rfx3-line-3", rfxId: rfxOffice.id, lineNumber: 3, productId: productOffice3.id, specification: { size: "A4" }, requestedQuantity: 1000, requiredUnitId: unitPiece.id },
];

const vendorOffice1: Vendor = { id: "vendor-7", tenantId: tenant.id, name: "Office Mart Supplies", contactEmail: "sales@officemart.example" };
const vendorOffice2: Vendor = { id: "vendor-8", tenantId: tenant.id, name: "Paperline Traders", contactEmail: "orders@paperline.example" };
const vendorResponseOffice1: VendorResponse = { id: "vendor-response-o1", rfxId: rfxOffice.id, vendorId: vendorOffice1.id, receivedAt: now };
const vendorResponseOffice2: VendorResponse = { id: "vendor-response-o2", rfxId: rfxOffice.id, vendorId: vendorOffice2.id, receivedAt: now };
const docOffice1: ResponseDocument = { id: "doc-o1", vendorResponseId: vendorResponseOffice1.id, format: "excel", fileRef: "inbound/office-mart/quote.xlsx", receivedAt: now };
const docOffice2: ResponseDocument = { id: "doc-o2", vendorResponseId: vendorResponseOffice2.id, format: "email", fileRef: "inbound/paperline/quote-email.txt", receivedAt: now };

const officeVendorData: { vendor: Vendor; response: VendorResponse; doc: ResponseDocument; prices: [number, number, number] }[] = [
  { vendor: vendorOffice1, response: vendorResponseOffice1, doc: docOffice1, prices: [3.2, 8.4, 2.1] },
  { vendor: vendorOffice2, response: vendorResponseOffice2, doc: docOffice2, prices: [3.05, 8.75, 1.95] },
];

const officeVendorLines: VendorResponseLine[] = [];
const officeEvidence: Evidence[] = [];
const officePrices: Price[] = [];
const officeUnitResolutions: UnitResolution[] = [];
const officeNormalizations: NormalizationResult[] = [];

officeVendorData.forEach(({ response, doc, prices: vendorPrices }, vi) => {
  rfxOfficeLines.forEach((line, li) => {
    const suffix = `o${vi + 1}-${li + 1}`;
    const vrlId = `vrl-${suffix}`;
    const evId = `evidence-${suffix}`;
    const priceId = `price-${suffix}`;
    const unitResId = `unit-res-${suffix}`;
    const normId = `norm-${suffix}`;
    const amount = vendorPrices[li];

    officeVendorLines.push({
      id: vrlId,
      vendorResponseId: response.id,
      documentId: doc.id,
      rfxLineId: line.id,
      rawProductDescription: [productOffice1, productOffice2, productOffice3][li].name,
      rawQuantity: String(line.requestedQuantity),
      rawUnit: "piece",
      evidenceIds: [evId],
    });
    officeEvidence.push({
      id: evId,
      documentId: doc.id,
      sourceRef: doc.fileRef,
      excerpt: `Line ${li + 1} | ${[productOffice1, productOffice2, productOffice3][li].name} | ${line.requestedQuantity} | $${amount.toFixed(2)} / piece`,
      location: doc.format === "excel" ? `Sheet1!A${li + 2}:D${li + 2}` : `Email body, paragraph ${li + 1}`,
      extractedBy: "ai",
      extractedAt: now,
    });
    officePrices.push({ id: priceId, vendorResponseLineId: vrlId, quotedPrice: amount, currency: "USD", priceBasisRaw: "per piece", priceBasisUnitId: unitPiece.id, netProductPrice: amount, landedCost: amount, evidenceIds: [evId] });
    officeUnitResolutions.push({ id: unitResId, priceId, rawUnitText: "per piece", matchedUnitId: unitPiece.id, status: "clear", confidence: 1, evidenceIds: [evId] });
    officeNormalizations.push({ id: normId, priceId, unitResolutionId: unitResId, conversionFactorApplied: 1, fromUnitId: unitPiece.id, toUnitId: unitPiece.id, normalizedPrice: amount, comparisonUnitId: unitPiece.id, calculation: [`quoted $${amount.toFixed(2)}/piece`, "no discount/freight/tax stated", `normalized = $${amount.toFixed(2)}/piece`], confidence: 0.98, status: "clear", evidenceIds: [evId] });
  });
});

export const corrugatedSeed = {
  tenant,
  dimensions,
  units,
  products: [...products, productFastener1, productFastener2, productFastener3, productOffice1, productOffice2, productOffice3],
  packagingConversions,
  rfx,
  rfxList: [rfx, rfxFasteners, rfxOffice] as RFx[],
  rfxLines: [...rfxLines, ...rfxFastenerLines, ...rfxOfficeLines],
  vendors: [vendor, vendorB, vendorC, vendorD, vendorE, vendorFastener, vendorOffice1, vendorOffice2] as Vendor[],
  vendorResponses: [
    vendorResponse,
    vendorResponseB,
    vendorResponseC,
    vendorResponseD,
    vendorResponseE,
    vendorResponseFastener,
    vendorResponseOffice1,
    vendorResponseOffice2,
  ] as VendorResponse[],
  responseDocuments: [...responseDocuments, docB, docC, docD, docE, docFastener, docOffice1, docOffice2],
  vendorResponseLines: [
    ...vendorResponseLines,
    vrlB1, vrlB2, vrlB3, vrlB4,
    vrlC1, vrlC2, vrlC3, vrlC4, vrlC5,
    vrlD1, vrlD2, vrlD3, vrlD4,
    vrlE1, vrlE2, vrlE3, vrlE4, vrlE5,
    vrlF1, vrlF2, vrlF3,
    ...officeVendorLines,
  ],
  evidence: [...evidence, ...evidenceB, ...evidenceC, ...evidenceD, ...evidenceE, ...evidenceF, ...officeEvidence],
  prices: [...prices, ...pricesB, ...pricesC, ...pricesD, ...pricesE, ...pricesF, ...officePrices],
  unitResolutions: [...unitResolutions, ...unitResolutionsB, ...unitResolutionsC, ...unitResolutionsD, ...unitResolutionsE, ...unitResolutionsF, ...officeUnitResolutions],
  normalizationResults: [...normalizationResults, ...normalizationResultsB, ...normalizationResultsC, ...normalizationResultsD, ...normalizationResultsE, ...normalizationResultsF, ...officeNormalizations],
  exceptions: [...exceptions, exceptionB3, exceptionB5, exceptionC2, exceptionC5, exceptionD4, exceptionD5, exceptionE2, exceptionE5],
  clarifications: [...clarifications, clarificationB, clarificationC, clarificationD, clarificationE],
  qualityResponses: [...qualityResponses, ...qualityB],
};

export type CorrugatedSeed = typeof corrugatedSeed;
