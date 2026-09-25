import { GoogleGenAI } from "@google/genai";
import type { AnalystFact } from "./types";

const MODEL = "gemini-3.8-flash";

export interface ExplainResult {
  ok: boolean;
  text?: string;
  errorMessage?: string;
}

const PROMPT_HEADER = `You are a procurement assistant. Rewrite the verified answer below for a buyer, in clear, natural, concise prose (2-4 sentences).

Rules:
- Use ONLY the facts given below. Do not add, invent, or change any number, price, vendor name, unit, or fact.
- Do not perform any calculation -- every number below is already final.
- If the verified answer says something cannot be determined, say so plainly; never guess a value to fill the gap.
- Return ONLY the rewritten prose. No markdown, no headings, no code fences, no extra commentary.`;

/**
 * Rephrases an already-computed, verified answer into natural prose. Never
 * asked to compute or retrieve facts itself -- those come from
 * buildDeterministicAnswer(). Plain text generation (not JSON mode), which
 * also sidesteps the JSON-mode-specific unavailability seen from the
 * ingestion pipeline's provider.
 */
export async function explainWithGemini(deterministicAnswer: string, keyFacts: AnalystFact[]): Promise<ExplainResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, errorMessage: "GEMINI_API_KEY is not set." };

  const factsText = keyFacts.map((fact) => `- ${fact.label}: ${fact.value}`).join("\n") || "(no key facts)";
  const prompt = `${PROMPT_HEADER}\n\nVerified facts:\n${factsText}\n\nVerified answer to rephrase:\n${deterministicAnswer}`;

  try {
    const client = new GoogleGenAI({ apiKey });
    const response = await client.models.generateContent({ model: MODEL, contents: prompt });
    const text = response.text?.trim();
    if (!text) return { ok: false, errorMessage: "Gemini returned no response text." };
    return { ok: true, text };
  } catch (cause) {
    return { ok: false, errorMessage: cause instanceof Error ? cause.message : String(cause) };
  }
}
