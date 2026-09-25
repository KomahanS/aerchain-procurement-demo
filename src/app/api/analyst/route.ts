import { NextResponse } from "next/server";
import { getResponseIntelligence } from "@/app/analyze-response/intelligence/view-model";
import { buildDeterministicAnswer } from "@/app/analyze-response/intelligence/analyst/answer-builder";
import { classifyQuestion } from "@/app/analyze-response/intelligence/analyst/intent";
import { explainWithGemini } from "@/app/analyze-response/intelligence/analyst/gemini-explain";
import { NOT_ENOUGH_INFO, type AnalystAnswer } from "@/app/analyze-response/intelligence/analyst/types";

export const runtime = "nodejs";

function unanswered(): AnalystAnswer {
  return { intent: null, answer: NOT_ENOUGH_INFO, usedAi: false, aiUnavailable: false, keyFacts: [], evidence: [] };
}

export async function POST(request: Request): Promise<NextResponse<{ ok: true; result: AnalystAnswer } | { ok: false; error: string }>> {
  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question : "";

  if (!question.trim()) {
    return NextResponse.json({ ok: false, error: "A question is required." }, { status: 400 });
  }

  const intelligence = getResponseIntelligence();
  if (!intelligence) {
    return NextResponse.json({ ok: true, result: unanswered() });
  }

  // Step 1: interpret intent -- deterministic, no LLM. Covers all 5 MVP
  // question types, so they keep working even when Gemini is unavailable.
  const parsed = classifyQuestion(question);
  if (!parsed) {
    return NextResponse.json({ ok: true, result: unanswered() });
  }

  // Step 2: retrieve/calculate facts -- purely from existing deterministic data.
  const deterministic = buildDeterministicAnswer(parsed, intelligence);

  // Step 3: explain answer -- Gemini may rephrase the prose, but the facts
  // above are never sent for it to recompute, and it cannot add to them.
  const explanation = await explainWithGemini(deterministic.answer, deterministic.keyFacts);

  const result: AnalystAnswer = {
    ...deterministic,
    answer: explanation.ok && explanation.text ? explanation.text : deterministic.answer,
    usedAi: explanation.ok,
    aiUnavailable: !explanation.ok,
  };

  return NextResponse.json({ ok: true, result });
}
