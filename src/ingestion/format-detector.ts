import path from "node:path";
import type { SourceFormat } from "@/domain";

interface FormatSpec {
  format: SourceFormat;
  mimeType: string;
  /** Returns true if the buffer's leading bytes plausibly match this format. */
  matchesMagicBytes: (buf: Buffer) => boolean;
}

const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const PDF_SIGNATURE = Buffer.from("%PDF-");
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);

const startsWith = (buf: Buffer, sig: Buffer) =>
  buf.length >= sig.length && buf.subarray(0, sig.length).equals(sig);

/** Zip-based Office formats (xlsx/docx) share the same leading signature. */
const matchesZipContainer = (buf: Buffer) => startsWith(buf, ZIP_SIGNATURE);

const FORMATS_BY_EXTENSION: Record<string, FormatSpec> = {
  ".xlsx": {
    format: "excel",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    matchesMagicBytes: matchesZipContainer,
  },
  ".pdf": {
    format: "pdf",
    mimeType: "application/pdf",
    matchesMagicBytes: (buf) => startsWith(buf, PDF_SIGNATURE),
  },
  ".docx": {
    format: "docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    matchesMagicBytes: matchesZipContainer,
  },
  ".png": {
    format: "image",
    mimeType: "image/png",
    matchesMagicBytes: (buf) => startsWith(buf, PNG_SIGNATURE),
  },
  ".jpg": {
    format: "image",
    mimeType: "image/jpeg",
    matchesMagicBytes: (buf) => startsWith(buf, JPEG_SIGNATURE),
  },
  ".jpeg": {
    format: "image",
    mimeType: "image/jpeg",
    matchesMagicBytes: (buf) => startsWith(buf, JPEG_SIGNATURE),
  },
  ".txt": {
    format: "email",
    mimeType: "text/plain",
    // No binary signature for plain text -- accept unless it looks binary.
    matchesMagicBytes: (buf) => !looksBinary(buf),
  },
  ".eml": {
    format: "email",
    mimeType: "message/rfc822",
    matchesMagicBytes: (buf) => !looksBinary(buf),
  },
};

/** Heuristic: a NUL byte in the first KB is a strong binary signal. */
function looksBinary(buf: Buffer): boolean {
  const sample = buf.subarray(0, 1024);
  return sample.includes(0x00);
}

export interface DetectedFormat {
  extension: string;
  mimeType: string;
  format: SourceFormat;
}

export class FormatDetectionError extends Error {
  constructor(
    message: string,
    public readonly code: "unsupported_format" | "format_mismatch",
  ) {
    super(message);
    this.name = "FormatDetectionError";
  }
}

/**
 * Identifies the source format from the file extension, then cross-checks
 * it against the file's own magic bytes so a mislabeled/corrupt file is
 * reported as an error rather than silently mis-parsed.
 */
export function detectFormat(filePath: string, buffer: Buffer): DetectedFormat {
  const extension = path.extname(filePath).toLowerCase();
  const spec = FORMATS_BY_EXTENSION[extension];

  if (!spec) {
    throw new FormatDetectionError(
      `Unsupported file extension "${extension}". Supported: ${Object.keys(FORMATS_BY_EXTENSION).join(", ")}.`,
      "unsupported_format",
    );
  }

  if (!spec.matchesMagicBytes(buffer)) {
    throw new FormatDetectionError(
      `File "${path.basename(filePath)}" has extension "${extension}" but its content does not match the expected ${spec.format} signature.`,
      "format_mismatch",
    );
  }

  return { extension, mimeType: spec.mimeType, format: spec.format };
}
