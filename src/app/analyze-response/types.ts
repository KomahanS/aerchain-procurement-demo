import type { SourceFormat } from "@/domain";
import type { GeminiExtractionOutcome } from "@/ingestion";

/** Summary of the extracted content -- never the full text/base64 payload. */
export type RawContentSummary =
  | { kind: "text"; characterCount: number }
  | { kind: "structured-text"; characterCount: number; sheetCount: number }
  | { kind: "image"; width?: number; height?: number };

/**
 * Contract for POST /api/analyze-vendor-response. Deliberately does not
 * carry the full raw text/base64 back to the client -- the buyer-facing
 * preview only needs a summary (kind, size, dimensions), not the payload
 * itself.
 */
export type AnalyzeVendorResponseApiResult =
  | {
      ok: true;
      fileName: string;
      fileSizeBytes: number;
      detectedFormat: SourceFormat;
      mimeType: string;
      rawContent: RawContentSummary;
      warnings: string[];
      ai: GeminiExtractionOutcome;
    }
  | {
      ok: false;
      fileName: string;
      error: { code: string; message: string };
    };
