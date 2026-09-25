import mammoth from "mammoth";
import type { ExtractorOutput } from "./text";

/** Extracts raw paragraph text from a Word document, verbatim -- no formatting/interpretation. */
export async function extractDocx(buffer: Buffer): Promise<ExtractorOutput> {
  const result = await mammoth.extractRawText({ buffer });
  const warnings = result.messages
    .filter((m) => m.type === "warning" || m.type === "error")
    .map((m) => m.message);

  return {
    rawContent: { kind: "text", text: result.value },
    warnings,
  };
}
