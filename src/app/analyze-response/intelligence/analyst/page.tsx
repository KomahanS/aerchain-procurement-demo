"use client";

import { useState } from "react";
import Link from "next/link";
import type { AnalystAnswer } from "./types";

const SUGGESTED_QUESTIONS = [
  "Why can't I compare Vendor A's Line 5?",
  "Why is Line 4 ₹0.90/piece?",
  "What should I ask the vendor?",
  "Which prices can I safely compare?",
  "What issues remain unresolved?",
];

type Status = "idle" | "asking" | "answered" | "error";

export default function AnalystPage() {
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [answer, setAnswer] = useState<AnalystAnswer | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const ask = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuestion(trimmed);
    setStatus("asking");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) {
        setErrorMessage(body.error ?? "The analyst could not answer that.");
        setStatus("error");
        return;
      }
      setAnswer(body.result as AnalystAnswer);
      setStatus("answered");
    } catch (cause) {
      setErrorMessage(cause instanceof Error ? cause.message : "The request failed.");
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        {/* Header */}
        <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/analyze-response" className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">
              Analyze Vendor Response
            </Link>
            <span>/</span>
            <Link
              href="/analyze-response/intelligence"
              className="hover:text-slate-900 hover:underline dark:hover:text-slate-100"
            >
              Response Intelligence
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-slate-100">AI Procurement Analyst</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">AI Procurement Analyst</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Ask questions about vendor responses, comparisons, exceptions and clarifications.
            </p>
          </div>
        </header>

        {/* Question input */}
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              ask(question);
            }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="e.g. Why can't I compare Vendor A's Line 5?"
              className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={status === "asking" || !question.trim()}
              className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "asking" ? "Asking…" : "Ask"}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((suggested) => (
              <button
                key={suggested}
                type="button"
                onClick={() => ask(suggested)}
                disabled={status === "asking"}
                className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {suggested}
              </button>
            ))}
          </div>
        </section>

        {/* Error */}
        {status === "error" && (
          <section className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 shadow-sm dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
            {errorMessage}
          </section>
        )}

        {/* Answer */}
        {status === "answered" && answer && (
          <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Answer</h2>
                {answer.usedAi && (
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:ring-indigo-800">
                    AI-phrased
                  </span>
                )}
              </div>
              {answer.aiUnavailable && (
                <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                  AI interpretation is temporarily unavailable. Showing the verified answer directly.
                </p>
              )}
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{answer.answer}</p>
            </div>

            {answer.keyFacts.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Key facts
                </h3>
                <dl className="mt-2 space-y-1.5 text-sm">
                  {answer.keyFacts.map((fact, i) => (
                    <div key={i} className="flex gap-2">
                      <dt className="w-40 shrink-0 text-slate-500 dark:text-slate-400">{fact.label}</dt>
                      <dd className="text-slate-800 dark:text-slate-200">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {answer.relatedException && (
              <div className="rounded-md bg-slate-50 px-3 py-2 text-xs dark:bg-slate-950">
                <p className="font-medium uppercase tracking-wide text-[10px] text-slate-500 dark:text-slate-400">
                  Related exception · {answer.relatedException.type.replace(/_/g, " ")}
                </p>
                <p className="mt-1 text-slate-700 dark:text-slate-300">{answer.relatedException.description}</p>
              </div>
            )}

            {answer.relatedClarification && (
              <div className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
                <p className="font-medium uppercase tracking-wide text-[10px] text-indigo-700 dark:text-indigo-400">
                  Related clarification
                </p>
                <p className="mt-1 whitespace-pre-line">{answer.relatedClarification.question}</p>
              </div>
            )}

            {answer.evidence.length > 0 && (
              <details>
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Evidence ({answer.evidence.length})
                </summary>
                <ul className="mt-2 space-y-2 text-xs">
                  {answer.evidence.map((item, i) => (
                    <li key={i} className="rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-950">
                      <p className="text-slate-700 dark:text-slate-300">&ldquo;{item.excerpt}&rdquo;</p>
                      <p className="mt-1 text-slate-500 dark:text-slate-400">{item.source}</p>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        )}

        <div>
          <Link
            href="/analyze-response/intelligence"
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ← Back to Response Intelligence
          </Link>
        </div>
      </div>
    </main>
  );
}
