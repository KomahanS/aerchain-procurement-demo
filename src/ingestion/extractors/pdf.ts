import { PDFParse } from "pdf-parse";
import type { ExtractorOutput } from "./text";

/** Extracts concatenated page text from a PDF, verbatim -- no summarizing. */
export async function extractPdf(buffer: Buffer): Promise<ExtractorOutput> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const warnings =
      result.total > 0 && result.text.trim().length === 0
        ? [`PDF has ${result.total} page(s) but no extractable text (likely scanned/image-only).`]
        : [];

    return {
      rawContent: { kind: "text", text: result.text },
      warnings,
    };
  } finally {
    await parser.destroy();
  }
}
