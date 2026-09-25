import type { QuestionIntent } from "./types";

export interface ParsedIntent {
  intent: QuestionIntent;
  lineNumber?: number;
}

const LINE_NUMBER_PATTERN = /line\s*(?:no\.?|number)?\s*#?\s*(\d+)/i;

function extractLineNumber(question: string): number | undefined {
  const match = question.match(LINE_NUMBER_PATTERN);
  return match ? Number(match[1]) : undefined;
}

/**
 * Ordered, deterministic pattern match for the 5 MVP-supported question
 * types (order matters: more specific patterns, like "can't compare", are
 * checked before more general ones like "why is ... price"). No LLM call
 * involved -- this is what lets these 5 question types work even when
 * Gemini is unavailable.
 */
const INTENT_PATTERNS: { intent: QuestionIntent; test: (q: string) => boolean }[] = [
  {
    intent: "why_cant_compare",
    test: (q) =>
      /\bcan'?t\b[^.?!]*\bcompare\b|\bcannot\b[^.?!]*\bcompare\b|\bcan\s+not\b[^.?!]*\bcompare\b|why.*not.*compar/i.test(
        q,
      ),
  },
  {
    intent: "safely_comparable",
    test: (q) => /safely\s+compar|which\s+prices\s+can\s+i\s+compare|what\s+(prices\s+)?can\s+i\s+compare/i.test(q),
  },
  {
    intent: "what_to_request",
    test: (q) =>
      /what\s+(should|do)\s+i\s+(ask|request)|information\s+should\s+i\s+request|what\s+information/i.test(q),
  },
  {
    intent: "unresolved_issues",
    test: (q) => /unresolved|remain(ing)?\s+(issues|exceptions)|issues\s+remain|open\s+exceptions/i.test(q),
  },
  {
    intent: "why_price",
    test: (q) => /why\s+is\b.*(price|₹|\$|rs\.?\s?\d|inr|usd|\/\s?p(iece|c)\b)/i.test(q),
  },
];

/** Deterministic question classifier. Returns undefined for anything outside the 5 MVP question types. */
export function classifyQuestion(question: string): ParsedIntent | undefined {
  const trimmed = question.trim();
  if (!trimmed) return undefined;

  for (const { intent, test } of INTENT_PATTERNS) {
    if (test(trimmed)) {
      return { intent, lineNumber: extractLineNumber(trimmed) };
    }
  }
  return undefined;
}
