import type { ISODateString, SourceFormat } from "@/domain";

/**
 * File metadata preserved verbatim from the source, regardless of whether
 * extraction later succeeds. Never derived/guessed -- read straight off the
 * filesystem and the file's own bytes.
 */
export interface FileMetadata {
  fileName: string;
  filePath: string;
  fileSizeBytes: number;
  /** Extension-derived, e.g. "xlsx". Kept separate from detectedFormat. */
  extension: string;
  mimeType: string;
  detectedFormat: SourceFormat;
  /** sha256 of the raw file bytes, for dedupe/audit. */
  sha256: string;
  ingestedAt: ISODateString;
}

export interface SheetSummary {
  name: string;
  rowCount: number;
  columnCount: number;
}

/**
 * The raw content pulled out of a document, before any LLM interpretation.
 * "text" formats (pdf/docx/email) yield a single string. "structured-text"
 * (spreadsheets) also carries a per-sheet summary. "image" formats carry no
 * text at all -- they are handed to a vision-capable LLM provider as bytes.
 */
export type RawContent =
  | { kind: "text"; text: string }
  | { kind: "structured-text"; text: string; sheets: SheetSummary[] }
  | { kind: "image"; base64: string; mimeType: string; width?: number; height?: number };

/**
 * Normalized, provider-agnostic payload ready to be handed to an LLM
 * extraction provider. Carries only what was actually read from the file --
 * no interpretation, no vendor answers, no confidence scores.
 */
export interface ExtractionInput {
  documentId: string;
  metadata: FileMetadata;
  rawContent: RawContent;
  /** Non-fatal issues hit while extracting (e.g. a password-protected PDF page). */
  warnings: string[];
}

export type ExtractionResult =
  | { ok: true; input: ExtractionInput }
  | { ok: false; error: IngestionError };

export interface IngestionError {
  code: "unsupported_format" | "unreadable_file" | "format_mismatch" | "extraction_failed";
  message: string;
  filePath: string;
  cause?: unknown;
}
