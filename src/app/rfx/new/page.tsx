"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { CreateRfxDraftResult, RfxDraftLine } from "@/app/api/create-rfx-draft/route";

type Step = "choice" | "ai-input" | "manual-input" | "review" | "done";

interface DraftLine {
  id: string;
  description: string;
  quantity?: number;
  unit?: string;
  specNotes?: string;
  source: "ai" | "manual";
  confirmed: boolean;
}

const PRESET_REQUIREMENTS = ["Unit pricing", "Delivery lead time", "Quality / technical compliance", "Payment terms"];

let idCounter = 0;
const nextId = () => `line-${++idCounter}`;

function linesFromDraft(lines: RfxDraftLine[]): DraftLine[] {
  return lines.map((line) => ({ id: nextId(), description: line.description, quantity: line.quantity, unit: line.unit, specNotes: line.specNotes, source: "ai", confirmed: false }));
}

export default function CreateRfxPage() {
  const [step, setStep] = useState<Step>("choice");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [requirements, setRequirements] = useState<{ label: string; required: boolean }[]>([]);

  const [description, setDescription] = useState("");
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "error">("idle");
  const [aiError, setAiError] = useState<string | null>(null);

  const startAiDraft = async () => {
    setAiStatus("loading");
    setAiError(null);
    try {
      const response = await fetch("/api/create-rfx-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const body: CreateRfxDraftResult = await response.json();
      if (!body.ok) {
        setAiStatus("error");
        setAiError(body.error.message);
        return;
      }
      setTitle(body.draft.title);
      setCategory(body.draft.category);
      setLines(linesFromDraft(body.draft.lines));
      setRequirements(body.draft.vendorRequirements.map((label) => ({ label, required: true })));
      setAiStatus("idle");
      setStep("review");
    } catch (cause) {
      setAiStatus("error");
      setAiError(cause instanceof Error ? cause.message : "The request failed.");
    }
  };

  const startManual = () => {
    setTitle("");
    setCategory("");
    setLines([{ id: nextId(), description: "", source: "manual", confirmed: true }]);
    setRequirements(PRESET_REQUIREMENTS.map((label) => ({ label, required: true })));
    setStep("manual-input");
  };

  const addLine = () => setLines((prev) => [...prev, { id: nextId(), description: "", source: "manual", confirmed: true }]);
  const removeLine = (id: string) => setLines((prev) => prev.filter((l) => l.id !== id));
  const updateLine = (id: string, patch: Partial<DraftLine>) =>
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch, confirmed: true } : l)));

  const canCreate = title.trim().length > 0 && lines.some((l) => l.description.trim().length > 0);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-900 sm:px-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">Dashboard</Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <Link href="/rfx" className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">RFx</Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-slate-900 dark:text-slate-100">Create RFx</span>
          </nav>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Create RFx</h1>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
        {step === "choice" && (
          <>
            <p className="text-sm text-slate-600 dark:text-slate-400">How would you like to create your RFx?</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setStep("ai-input")}
                className="flex flex-col items-start gap-2 rounded-lg border-2 border-indigo-300 bg-indigo-50 p-6 text-left shadow-sm transition-colors hover:border-indigo-400 dark:border-indigo-800 dark:bg-indigo-950 dark:hover:border-indigo-700"
              >
                <Badge tone="indigo">Recommended</Badge>
                <h2 className="text-lg font-semibold text-indigo-950 dark:text-indigo-100">Create with AI</h2>
                <p className="text-sm text-indigo-800 dark:text-indigo-300">
                  Describe your sourcing requirement in plain language. Aerchain structures the RFx for you -- you review and confirm every field before it&apos;s created.
                </p>
                <span className="mt-2 text-sm font-medium text-indigo-700 dark:text-indigo-300">Create with AI →</span>
              </button>

              <button
                type="button"
                onClick={startManual}
                className="flex flex-col items-start gap-2 rounded-lg border border-slate-200 bg-white p-6 text-left shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Create manually</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Define line items, specifications, quantities and commercial requirements yourself.
                </p>
                <span className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">Create manually →</span>
              </button>
            </div>
          </>
        )}

        {step === "ai-input" && (
          <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Describe your sourcing requirement</h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                E.g. &ldquo;I need 30 corrugated packaging items across small, medium, large and heavy-duty cartons. Collect pricing, delivery, quality, ECT, printing and payment terms from vendors.&rdquo;
              </p>
            </div>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={6}
              placeholder="Describe what you need to source…"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            {aiStatus === "error" && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                <p className="font-medium">AI drafting is temporarily unavailable.</p>
                <p className="mt-1 text-xs">{aiError}</p>
                <button type="button" onClick={startManual} className="mt-2 text-xs font-medium underline">
                  Switch to manual creation instead
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStep("choice")}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Back
              </button>
              <button
                type="button"
                onClick={startAiDraft}
                disabled={!description.trim() || aiStatus === "loading"}
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {aiStatus === "loading" ? "Generating…" : "Generate RFx draft"}
              </button>
            </div>
          </section>
        )}

        {(step === "review" || step === "manual-input") && (
          <>
            <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="RFx title">
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Corrugated Packaging Q3" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                </Field>
                <Field label="Category">
                  <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Packaging" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
                </Field>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Line items</h2>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Review every field before creating. Editing a line marks it confirmed.</p>
                </div>
                <button type="button" onClick={addLine} className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                  + Add line
                </button>
              </div>
              <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                {lines.map((line, i) => (
                  <div key={line.id} className="flex flex-col gap-2 px-5 py-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Line {i + 1}</p>
                      <div className="flex items-center gap-2">
                        <Badge tone={line.confirmed ? "emerald" : "amber"}>{line.confirmed ? "User confirmed" : "AI suggested"}</Badge>
                        <button type="button" onClick={() => removeLine(line.id)} className="text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400">
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                      <input
                        value={line.description}
                        onChange={(e) => updateLine(line.id, { description: e.target.value })}
                        placeholder="Item description"
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:col-span-2"
                      />
                      <input
                        value={line.quantity ?? ""}
                        onChange={(e) => updateLine(line.id, { quantity: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="Quantity"
                        type="number"
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                      <input
                        value={line.unit ?? ""}
                        onChange={(e) => updateLine(line.id, { unit: e.target.value })}
                        placeholder="Unit (e.g. piece)"
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      />
                    </div>
                    <input
                      value={line.specNotes ?? ""}
                      onChange={(e) => updateLine(line.id, { specNotes: e.target.value })}
                      placeholder="Specification notes (optional)"
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                  </div>
                ))}
                {lines.length === 0 && <p className="px-5 py-6 text-sm text-slate-500 dark:text-slate-400">No line items yet -- add one above.</p>}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">What to collect from vendors</h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Toggle whether each item is required or optional in vendor responses.</p>
              <ul className="mt-3 flex flex-col gap-2">
                {requirements.map((req, i) => (
                  <li key={req.label} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800">
                    <span className="text-slate-800 dark:text-slate-200">{req.label}</span>
                    <button
                      type="button"
                      onClick={() => setRequirements((prev) => prev.map((r, idx) => (idx === i ? { ...r, required: !r.required } : r)))}
                      className="shrink-0"
                    >
                      <Badge tone={req.required ? "indigo" : "neutral"}>{req.required ? "Required" : "Optional"}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStep("choice")}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Start over
              </button>
              <button
                type="button"
                disabled={!canCreate}
                onClick={() => setStep("done")}
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Create RFx
              </button>
            </div>
          </>
        )}

        {step === "done" && (
          <section className="flex flex-col gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-6 shadow-sm dark:border-emerald-900 dark:bg-emerald-950">
            <div>
              <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">✓ RFx structure created</p>
              <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">
                <span className="font-medium">{title}</span> -- {lines.filter((l) => l.description.trim()).length} line item(s), {requirements.filter((r) => r.required).length} required vendor requirement(s).
              </p>
            </div>
            <p className="rounded-md bg-white/60 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              Demo action -- this prototype does not persist newly created RFx into the catalog. In the full product, this would now appear in your RFx list as a Draft, ready to invite vendors.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/rfx" className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                View RFx list
              </Link>
              <Link href="/rfx/rfx-1" className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                Explore a live RFx (Corrugated Packaging Q3)
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      {children}
    </label>
  );
}
