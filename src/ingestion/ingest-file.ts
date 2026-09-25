import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { EXTRACTORS_BY_FORMAT } from "./extractors";
import { detectFormat, FormatDetectionError } from "./format-detector";
import type { ExtractionInput, ExtractionResult, IngestionError } from "./types";

function toIngestionError(
  code: IngestionError["code"],
  filePath: string,
  message: string,
  cause?: unknown,
): IngestionError {
  return { code, filePath, message, cause };
}

/**
 * Reads a single vendor-response file from disk, identifies its format,
 * and extracts its raw content into a provider-agnostic ExtractionInput.
 * Never throws -- unreadable/unsupported files come back as a typed error
 * result so a batch run can report per-file failures instead of aborting.
 */
export async function ingestFile(filePath: string): Promise<ExtractionResult> {
  let buffer: Buffer;
  let fileSizeBytes: number;

  try {
    const stats = await stat(filePath);
    fileSizeBytes = stats.size;
    buffer = await readFile(filePath);
  } catch (cause) {
    return {
      ok: false,
      error: toIngestionError(
        "unreadable_file",
        filePath,
        `Could not read file: ${cause instanceof Error ? cause.message : String(cause)}`,
        cause,
      ),
    };
  }

  let detected;
  try {
    detected = detectFormat(filePath, buffer);
  } catch (cause) {
    if (cause instanceof FormatDetectionError) {
      return { ok: false, error: toIngestionError(cause.code, filePath, cause.message, cause) };
    }
    throw cause;
  }

  const extractor = EXTRACTORS_BY_FORMAT[detected.format];
  if (!extractor) {
    return {
      ok: false,
      error: toIngestionError(
        "unsupported_format",
        filePath,
        `No extractor registered for format "${detected.format}".`,
      ),
    };
  }

  try {
    const { rawContent, warnings } = await extractor(buffer, detected.mimeType);
    const sha256 = createHash("sha256").update(buffer).digest("hex");

    const input: ExtractionInput = {
      documentId: sha256,
      metadata: {
        fileName: path.basename(filePath),
        filePath,
        fileSizeBytes,
        extension: detected.extension,
        mimeType: detected.mimeType,
        detectedFormat: detected.format,
        sha256,
        ingestedAt: new Date().toISOString(),
      },
      rawContent,
      warnings,
    };

    return { ok: true, input };
  } catch (cause) {
    return {
      ok: false,
      error: toIngestionError(
        "extraction_failed",
        filePath,
        `Extraction failed: ${cause instanceof Error ? cause.message : String(cause)}`,
        cause,
      ),
    };
  }
}

export async function ingestFiles(filePaths: string[]): Promise<ExtractionResult[]> {
  return Promise.all(filePaths.map(ingestFile));
}
