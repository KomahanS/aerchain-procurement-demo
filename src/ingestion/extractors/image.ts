import { readImageDimensions } from "../image-dimensions";
import type { ExtractorOutput } from "./text";

/**
 * Images carry no extractable text at this stage -- there is no OCR here.
 * The raw content is the image itself (base64), ready to hand to a
 * vision-capable LLM provider. Dimensions are read for metadata only.
 */
export async function extractImage(buffer: Buffer, mimeType: string): Promise<ExtractorOutput> {
  const dimensions = readImageDimensions(buffer, mimeType);
  const warnings = dimensions ? [] : ["Could not determine image dimensions from header bytes."];

  return {
    rawContent: {
      kind: "image",
      base64: buffer.toString("base64"),
      mimeType,
      width: dimensions?.width,
      height: dimensions?.height,
    },
    warnings,
  };
}
