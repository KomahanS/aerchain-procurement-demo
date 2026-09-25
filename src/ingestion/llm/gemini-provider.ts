import { GoogleGenAI } from "@google/genai";
import type { ResolutionStatus } from "@/domain";
import type { ExtractionInput } from "../types";
import type { VendorExtractionProvider, VendorExtractionProviderResult } from "./provider";

const MODEL = "gemini-3.8-flash";

/** Extraction never assigns "resolved" -- that only happens once a human/buyer acts on it. */
type LineResolutionStatus = Exclude<ResolutionStatus, "resolved">;

const LINE_RESOLUTION_STATUSES: readonly LineResolutionStatus[] = [
  "clear",
  "ambiguous",
  "missing",
  "contradictory",
];

/** One priced item/line as Gemini read it off the vendor source -- interpretation only, no math. */
export interface GeminiVendorLine {
  /** The verbatim excerpt (cell text, sentence, row) this line was read from. */
  sourceExcerpt: string;
  productDescription?: string;
  priceValue?: number;
  currency?: string;
  /** Vendor's literal price basis, e.g. "per kg", "per pallet", "per unit". */
  priceBasis?: string;
  quantityOrPackSize?: string;
  discount?: string;
  freight?: string;
  tax?: string;
  delivery?: string;
  terms?: string;
  resolutionStatus: LineResolutionStatus;
  /** Required whenever resolutionStatus isn't "clear" -- explains the ambiguity/gap/conflict. */
  uncertaintyNotes?: string;
}

/** The full structured extraction Gemini returns for one vendor document. */
export interface GeminiVendorExtraction {
  documentSummary: string;
  lines: GeminiVendorLine[];
  /** Anything notable that doesn't fit a single line (e.g. a footnote applying to all prices). */
  overallNotes?: string;
}

type GeminiExtractionErrorCode =
  | "missing_api_key"
  | "empty_response"
  | "invalid_json"
  | "schema_validation_failed"
  | "api_error";

/**
 * What ends up in VendorExtractionProviderResult.raw for this provider.
 * A discriminated union so a failed/invalid model response comes back as a
 * typed error instead of this provider inventing or "fixing up" data.
 */
export type GeminiExtractionOutcome =
  | { status: "ok"; extraction: GeminiVendorExtraction }
  | { status: "error"; code: GeminiExtractionErrorCode; message: string; rawResponseText?: string };

const PROMPT = `You are extracting information from a vendor's response to a corrugated-packaging RFx. This is a raw-extraction step only -- you are not calculating, normalizing, or converting anything.

Rules:
- Extract only information that is explicitly present in the vendor source below. Never invent, guess, or fill in a missing value.
- For every line, quote the exact source excerpt (sentence, cell, row) it came from in "sourceExcerpt".
- Preserve the vendor's original wording for price basis, discount terms, freight terms, and delivery terms where it is useful evidence -- do not paraphrase away specifics.
- Separate these fields whenever the source distinguishes them: price value, currency, price basis (e.g. per kg / per pallet / per unit), quantity or pack size, discount, freight, tax, delivery, and terms. Leave a field unset if the source does not state it -- do not default it.
- Set "resolutionStatus" per line:
  - "clear" only if the line is unambiguous and complete enough to compare.
  - "ambiguous" if the wording could be read more than one way.
  - "missing" if a key fact (e.g. price, unit, currency) is absent for that item.
  - "contradictory" if the source states conflicting values for the same thing.
  - Whenever the status is not "clear", explain why in "uncertaintyNotes".
- Do not compute a normalized price, apply a discount, or convert a unit/currency. That happens in a separate deterministic step, not here.
- Do not fabricate confidence scores.

Output format -- follow this exactly:
- Respond with ONE JSON object and nothing else: no markdown, no \`\`\` code fences, no explanation text before or after it.
- The JSON object must have exactly this shape:
  {
    "documentSummary": string,
    "lines": [
      {
        "sourceExcerpt": string,
        "productDescription": string (omit if not stated),
        "priceValue": number (omit if not stated),
        "currency": string (omit if not stated),
        "priceBasis": string (omit if not stated),
        "quantityOrPackSize": string (omit if not stated),
        "discount": string (omit if not stated),
        "freight": string (omit if not stated),
        "tax": string (omit if not stated),
        "delivery": string (omit if not stated),
        "terms": string (omit if not stated),
        "resolutionStatus": "clear" | "ambiguous" | "missing" | "contradictory",
        "uncertaintyNotes": string (omit if resolutionStatus is "clear")
      }
    ],
    "overallNotes": string (omit if there is nothing to add)
  }
- Omit a key entirely when the source does not state it -- never use null, "N/A", or an empty string as a stand-in.`;

/**
 * Removes a single ```/```json code fence wrapped around the entire
 * response, if present. Only strips the fence markers themselves -- the
 * match is anchored to the whole (trimmed) string, so it never touches
 * backticks that are part of the actual JSON content.
 */
function stripJsonCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateLine(value: unknown): value is GeminiVendorLine {
  if (!isPlainObject(value)) return false;
  if (typeof value.sourceExcerpt !== "string") return false;
  if (!LINE_RESOLUTION_STATUSES.includes(value.resolutionStatus as LineResolutionStatus)) return false;

  const optionalStringFields = [
    "productDescription",
    "currency",
    "priceBasis",
    "quantityOrPackSize",
    "discount",
    "freight",
    "tax",
    "delivery",
    "terms",
    "uncertaintyNotes",
  ] as const;
  for (const field of optionalStringFields) {
    if (value[field] !== undefined && typeof value[field] !== "string") return false;
  }
  if (value.priceValue !== undefined && typeof value.priceValue !== "number") return false;

  return true;
}

/** Structurally validates a parsed model response before it's trusted. */
export function validateGeminiVendorExtraction(value: unknown): value is GeminiVendorExtraction {
  if (!isPlainObject(value)) return false;
  if (typeof value.documentSummary !== "string") return false;
  if (!Array.isArray(value.lines)) return false;
  if (!value.lines.every(validateLine)) return false;
  if (value.overallNotes !== undefined && typeof value.overallNotes !== "string") return false;
  return true;
}

/**
 * Gemini-backed VendorExtractionProvider. Interprets a single vendor
 * document's raw content (text or a photographed rate card image) into
 * GeminiVendorExtraction -- nothing more. Financial calculation, unit
 * conversion, and cross-vendor comparison stay out of this provider.
 */
export class GeminiVendorExtractionProvider implements VendorExtractionProvider {
  readonly name = "gemini";
  private readonly client: GoogleGenAI;

  constructor(apiKey: string | undefined = process.env.GEMINI_API_KEY) {
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set. Set it in the environment (e.g. .env.local) before using GeminiVendorExtractionProvider.",
      );
    }
    this.client = new GoogleGenAI({ apiKey });
  }

  async extract(input: ExtractionInput): Promise<VendorExtractionProviderResult> {
    const outcome = await this.runExtraction(input);
    return { providerName: this.name, raw: outcome };
  }

  private async runExtraction(input: ExtractionInput): Promise<GeminiExtractionOutcome> {
    const { rawContent } = input;

    const contents =
      rawContent.kind === "image"
        ? [
            {
              text: `${PROMPT}\n\nThe vendor source is a photographed rate card image. Read it as a person would, including handwriting or skewed/partial text if legible. If part of the image is illegible, mark the affected lines as "ambiguous" or "missing" and say so in "uncertaintyNotes" rather than guessing.`,
            },
            { inlineData: { data: rawContent.base64, mimeType: rawContent.mimeType } },
          ]
        : [{ text: `${PROMPT}\n\nVendor source (${input.metadata.detectedFormat}, "${input.metadata.fileName}"):\n\n${rawContent.text}` }];

    let responseText: string | undefined;
    try {
      const response = await this.client.models.generateContent({
        model: MODEL,
        contents,
      });
      responseText = response.text;
    } catch (cause) {
      return {
        status: "error",
        code: "api_error",
        message: cause instanceof Error ? cause.message : String(cause),
      };
    }

    if (!responseText || responseText.trim().length === 0) {
      return { status: "error", code: "empty_response", message: "Gemini returned no response text." };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(stripJsonCodeFence(responseText));
    } catch (cause) {
      return {
        status: "error",
        code: "invalid_json",
        message: `Gemini response was not valid JSON: ${cause instanceof Error ? cause.message : String(cause)}`,
        rawResponseText: responseText,
      };
    }

    if (!validateGeminiVendorExtraction(parsed)) {
      return {
        status: "error",
        code: "schema_validation_failed",
        message: "Gemini response did not match the expected extraction schema.",
        rawResponseText: responseText,
      };
    }

    return { status: "ok", extraction: parsed };
  }
}
