import type { RawContent } from "../types";

export interface ExtractorOutput {
  rawContent: RawContent;
  warnings: string[];
}

/** Plain text / email bodies: the raw content is the file's own text, verbatim. */
export async function extractText(buffer: Buffer): Promise<ExtractorOutput> {
  return {
    rawContent: { kind: "text", text: buffer.toString("utf-8") },
    warnings: [],
  };
}
