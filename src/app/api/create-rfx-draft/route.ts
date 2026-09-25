import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MODEL = "gemini-3.8-flash";

export interface RfxDraftLine {
  description: string;
  /** Omitted when the buyer's description didn't state a quantity -- never guessed. */
  quantity?: number;
  unit?: string;
  specNotes?: string;
}

export interface RfxDraft {
  title: string;
  category: string;
  lines: RfxDraftLine[];
  /** What to collect from vendors (pricing, delivery, quality, etc.), stated by the buyer or reasonably implied by the category. */
  vendorRequirements: string[];
}

type DraftErrorCode = "missing_api_key" | "empty_response" | "invalid_json" | "schema_validation_failed" | "api_error";

export type CreateRfxDraftResult =
  | { ok: true; draft: RfxDraft }
  | { ok: false; error: { code: DraftErrorCode; message: string } };

const PROMPT = `You are helping a procurement buyer structure a sourcing request (RFx) from a plain-language description. This is a drafting step only -- the buyer will review and edit every field before anything is sent to vendors.

Rules:
- Only include line items, quantities, and requirements that are stated or clearly implied by the buyer's description. Do not invent items, quantities, or specifications the buyer did not mention.
- Omit "quantity" and "unit" for a line if the buyer did not state them -- never default to a guessed number.
- Keep "description" short and specific (e.g. "Small corrugated carton" not a full paragraph).
- "vendorRequirements" is a short list of what to collect from vendors (e.g. "Unit pricing", "Delivery lead time", "Payment terms") -- base it on what the buyer asked for, plus obviously-relevant commercial basics (pricing, delivery) if not contradicted.
- Pick a short, specific "title" (e.g. "Corrugated Packaging Q3") and a one-to-three-word "category".

Output format -- follow this exactly:
- Respond with ONE JSON object and nothing else: no markdown, no \`\`\` code fences, no explanation text before or after it.
- Shape:
  {
    "title": string,
    "category": string,
    "lines": [ { "description": string, "quantity": number (omit if not stated), "unit": string (omit if not stated), "specNotes": string (omit if nothing further stated) } ],
    "vendorRequirements": [string]
  }`;

function stripJsonCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateLine(value: unknown): value is RfxDraftLine {
  if (!isPlainObject(value)) return false;
  if (typeof value.description !== "string") return false;
  if (value.quantity !== undefined && typeof value.quantity !== "number") return false;
  if (value.unit !== undefined && typeof value.unit !== "string") return false;
  if (value.specNotes !== undefined && typeof value.specNotes !== "string") return false;
  return true;
}

function validateDraft(value: unknown): value is RfxDraft {
  if (!isPlainObject(value)) return false;
  if (typeof value.title !== "string" || typeof value.category !== "string") return false;
  if (!Array.isArray(value.lines) || !value.lines.every(validateLine)) return false;
  if (!Array.isArray(value.vendorRequirements) || !value.vendorRequirements.every((v) => typeof v === "string")) return false;
  return true;
}

export async function POST(request: Request): Promise<NextResponse<CreateRfxDraftResult>> {
  const body = await request.json().catch(() => null);
  const description = typeof body?.description === "string" ? body.description.trim() : "";

  if (!description) {
    return NextResponse.json({ ok: false, error: { code: "empty_response", message: "A description is required." } }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: { code: "missing_api_key", message: "GEMINI_API_KEY is not set." } });
  }

  let responseText: string | undefined;
  try {
    const client = new GoogleGenAI({ apiKey });
    const response = await client.models.generateContent({ model: MODEL, contents: `${PROMPT}\n\nBuyer's description:\n${description}` });
    responseText = response.text;
  } catch (cause) {
    return NextResponse.json({ ok: false, error: { code: "api_error", message: cause instanceof Error ? cause.message : String(cause) } });
  }

  if (!responseText || responseText.trim().length === 0) {
    return NextResponse.json({ ok: false, error: { code: "empty_response", message: "Gemini returned no response text." } });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonCodeFence(responseText));
  } catch (cause) {
    return NextResponse.json({ ok: false, error: { code: "invalid_json", message: `Gemini response was not valid JSON: ${cause instanceof Error ? cause.message : String(cause)}` } });
  }

  if (!validateDraft(parsed)) {
    return NextResponse.json({ ok: false, error: { code: "schema_validation_failed", message: "Gemini response did not match the expected draft schema." } });
  }

  return NextResponse.json({ ok: true, draft: parsed });
}
