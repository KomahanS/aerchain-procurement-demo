export type QuestionIntent =
  | "why_cant_compare"
  | "why_price"
  | "what_to_request"
  | "safely_comparable"
  | "unresolved_issues";

export interface AnalystFact {
  label: string;
  value: string;
}

export interface AnalystEvidenceRef {
  excerpt: string;
  source: string;
}

/**
 * Result of one analyst question. `answer` is plain prose (Gemini-polished
 * when available, otherwise a deterministic fallback); `keyFacts` and
 * `evidence` are always sourced directly from the existing deterministic
 * intelligence data, never from the LLM, so they stay correct even when
 * `answer` is AI-phrased.
 */
export interface AnalystAnswer {
  intent: QuestionIntent | null;
  answer: string;
  usedAi: boolean;
  aiUnavailable: boolean;
  keyFacts: AnalystFact[];
  evidence: AnalystEvidenceRef[];
  relatedException?: { type: string; description: string };
  relatedClarification?: { question: string };
}

export const NOT_ENOUGH_INFO = "I don't have enough verified information to answer that.";
