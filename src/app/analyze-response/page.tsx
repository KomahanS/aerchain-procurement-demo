"use client";

import { useCallback, useRef, useState } from "react";
import type { DragEvent } from "react";
import Link from "next/link";
import type { ResolutionStatus } from "@/domain";
import {
  RESOLUTION_STATUS_LABEL,
  RESOLUTION_STATUS_STYLE,
  SOURCE_FORMAT_LABEL,
} from "@/app/rfx/[rfxId]/responses/presentation";
import type { AnalyzeVendorResponseApiResult, RawContentSummary } from "./types";

const ACCEPTED_FILE_TYPES = ".xlsx,.pdf,.docx,.png,.jpg,.jpeg,.txt";

const EXTENSION_LABEL: Record<string, string> = {
  ".xlsx": "Excel",
  ".pdf": "PDF",
  ".docx": "Word (DOCX)",
  ".png": "Image (PNG)",
  ".jpg": "Image (JPEG)",
  ".jpeg": "Image (JPEG)",
  ".txt": "Text / email",
};

type Phase = "idle" | "selected" | "processing" | "done";
type StageStatus = "pending" | "active" | "done" | "unavailable" | "warning";

interface StageState {
  upload: StageStatus;
  formatDetected: StageStatus;
  contentExtracted: StageStatus;
  aiAnalysis: StageStatus;
  readyForReview: StageStatus;
}

const INITIAL_STAGES: StageState = {
  upload: "pending",
  formatDetected: "pending",
  contentExtracted: "pending",
  aiAnalysis: "pending",
  readyForReview: "pending",
};

const PROCESSING_STAGES: StageState = {
  upload: "done",
  formatDetected: "active",
  contentExtracted: "active",
  aiAnalysis: "active",
  readyForReview: "active",
};

const STAGE_LABELS: [keyof StageState, string][] = [
  ["upload", "Upload"],
  ["formatDetected", "Format detected"],
  ["contentExtracted", "Content extracted"],
  ["aiAnalysis", "AI analysis"],
  ["readyForReview", "Ready for review"],
];

const STAGE_STATUS_STYLE: Record<StageStatus, string> = {
  pending: "bg-slate-100 text-slate-500 ring-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-600",
  active: "bg-amber-50 text-amber-800 ring-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
  done: "bg-emerald-50 text-emerald-700 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
  unavailable: "bg-rose-50 text-rose-700 ring-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-800",
  warning: "bg-amber-50 text-amber-800 ring-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
};

const STAGE_STATUS_LABEL: Record<StageStatus, string> = {
  pending: "Pending",
  active: "In progress…",
  done: "Done",
  unavailable: "Unavailable",
  warning: "Unavailable",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Extension-only guess shown the instant a file is picked; the server's detectFormat() is authoritative. */
function guessFormatLabel(fileName: string): string {
  const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
  return EXTENSION_LABEL[ext] ?? "Unrecognized extension";
}

function fileStatusText(phase: Phase, result: AnalyzeVendorResponseApiResult | null): string {
  if (phase === "processing") return "Processing…";
  if (phase !== "done") return "Ready to analyze";
  if (result && result.ok && result.ai.status !== "ok") return "Source extracted";
  return "Processed";
}

function contentAvailabilityLabel(rawContent: RawContentSummary): string {
  switch (rawContent.kind) {
    case "text":
      return `Text extracted (${rawContent.characterCount.toLocaleString()} characters)`;
    case "structured-text":
      return `${rawContent.sheetCount} sheet(s) extracted (${rawContent.characterCount.toLocaleString()} characters)`;
    case "image":
      return rawContent.width && rawContent.height
        ? `Image captured (${rawContent.width}×${rawContent.height}px, sent to AI as an image)`
        : "Image captured (sent to AI as an image)";
  }
}

function deriveStages(apiResult: AnalyzeVendorResponseApiResult): StageState {
  if (!apiResult.ok) {
    const unreadable = apiResult.error.code === "unreadable_file";
    const formatFailed = apiResult.error.code === "unsupported_format" || apiResult.error.code === "format_mismatch";
    return {
      upload: unreadable ? "unavailable" : "done",
      formatDetected: unreadable || formatFailed ? "unavailable" : "done",
      contentExtracted: "unavailable",
      aiAnalysis: "unavailable",
      readyForReview: "unavailable",
    };
  }
  const aiOk = apiResult.ai.status === "ok";
  return {
    upload: "done",
    formatDetected: "done",
    contentExtracted: "done",
    // Amber, not red: AI being unavailable is not a pipeline failure -- source extraction already succeeded.
    aiAnalysis: aiOk ? "done" : "warning",
    // Review isn't ready until AI analysis has actually completed.
    readyForReview: aiOk ? "done" : "pending",
  };
}

export default function AnalyzeResponsePage() {
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [stages, setStages] = useState<StageState>(INITIAL_STAGES);
  const [result, setResult] = useState<AnalyzeVendorResponseApiResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((selected: File | null) => {
    setFile(selected);
    setResult(null);
    setStages(INITIAL_STAGES);
    setPhase(selected ? "selected" : "idle");
  }, []);

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const dropped = event.dataTransfer.files?.[0] ?? null;
    if (dropped) handleFile(dropped);
  };

  const analyze = async () => {
    if (!file) return;
    setPhase("processing");
    setStages(PROCESSING_STAGES);

    const formData = new FormData();
    formData.append("file", file);

    let apiResult: AnalyzeVendorResponseApiResult;
    try {
      const response = await fetch("/api/analyze-vendor-response", { method: "POST", body: formData });
      apiResult = (await response.json()) as AnalyzeVendorResponseApiResult;
    } catch (cause) {
      apiResult = {
        ok: false,
        fileName: file.name,
        error: {
          code: "network_error",
          message: cause instanceof Error ? cause.message : "The request to analyze this file failed.",
        },
      };
    }

    setResult(apiResult);
    setStages(deriveStages(apiResult));
    setPhase("done");
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
            <span className="text-slate-900 dark:text-slate-100">Analyze Vendor Response</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Analyze Vendor Response</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Upload one vendor response document. Aerchain extracts its raw content and asks an AI provider to
              interpret it -- every value shown below traces back to what the file or the model actually returned.
            </p>
          </div>
        </header>

        {/* Trust message */}
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
          Aerchain does not guess missing commercial information.
        </div>

        {/* Upload */}
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Vendor response file</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Supports Excel (.xlsx), PDF, Word (.docx), PNG/JPG, and TXT/email.
          </p>

          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={`mt-4 cursor-pointer rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
              dragActive
                ? "border-indigo-400 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-950"
                : "border-slate-300 dark:border-slate-700"
            }`}
          >
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Drag and drop a file here, or click to browse
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">One file at a time.</p>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
            />
          </div>

          {file && (
            <div className="mt-4 flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">{file.name}</p>
                <p className="text-slate-500 dark:text-slate-400">
                  {guessFormatLabel(file.name)} · {formatBytes(file.size)} · {fileStatusText(phase, result)}
                </p>
              </div>
              <button
                type="button"
                onClick={analyze}
                disabled={phase === "processing"}
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {phase === "processing" ? "Analyzing…" : "Analyze file"}
              </button>
            </div>
          )}
        </section>

        {/* Pipeline */}
        {phase !== "idle" && (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Processing pipeline</h2>
            <ol className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
              {STAGE_LABELS.map(([key, label], index) => (
                <li key={key} className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${STAGE_STATUS_STYLE[stages[key]]}`}
                  >
                    {label} · {STAGE_STATUS_LABEL[stages[key]]}
                  </span>
                  {index < STAGE_LABELS.length - 1 && (
                    <span className="hidden text-slate-300 dark:text-slate-700 sm:inline">→</span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Ingestion failure */}
        {result && !result.ok && (
          <section className="rounded-lg border border-rose-200 bg-rose-50 p-6 shadow-sm dark:border-rose-900 dark:bg-rose-950">
            <h2 className="text-base font-semibold text-rose-900 dark:text-rose-200">Could not process this file</h2>
            <p className="mt-1 text-sm text-rose-800 dark:text-rose-300">
              {result.error.message}{" "}
              <span className="font-mono text-xs text-rose-700 dark:text-rose-400">({result.error.code})</span>
            </p>
          </section>
        )}

        {/* Extraction preview */}
        {result && result.ok && (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Extraction preview</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Detected format" value={SOURCE_FORMAT_LABEL[result.detectedFormat] ?? result.detectedFormat} />
              <Stat label="File size" value={formatBytes(result.fileSizeBytes)} />
              <Stat label="Extracted content" value={contentAvailabilityLabel(result.rawContent)} />
              <Stat label="AI status" value={result.ai.status === "ok" ? "Interpreted" : "Unavailable"} />
            </dl>
            {result.warnings.length > 0 && (
              <ul className="mt-4 space-y-1 text-xs text-amber-800 dark:text-amber-300">
                {result.warnings.map((warning, i) => (
                  <li key={i}>⚠ {warning}</li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* AI interpretation */}
        {result && result.ok && result.ai.status === "error" && (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm dark:border-amber-900 dark:bg-amber-950">
            <h2 className="text-base font-semibold text-amber-900 dark:text-amber-200">
              AI analysis temporarily unavailable
            </h2>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
              Source content was extracted successfully. No AI-derived values are shown until analysis is available.
            </p>
            <p className="mt-2 font-mono text-xs text-amber-700 dark:text-amber-400">
              {result.ai.code}: {result.ai.message}
            </p>
          </section>
        )}

        {result && result.ok && result.ai.status === "ok" && (
          <section className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                AI interpretation · source document
              </p>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{result.fileName}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{result.ai.extraction.documentSummary}</p>
            </div>

            <div className="flex flex-col gap-4">
              {result.ai.extraction.lines.map((line, i) => (
                <article key={i} className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {line.productDescription ?? "Unlabeled line"}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${RESOLUTION_STATUS_STYLE[line.resolutionStatus as ResolutionStatus]}`}
                    >
                      {RESOLUTION_STATUS_LABEL[line.resolutionStatus as ResolutionStatus]}
                    </span>
                  </div>
                  <dl className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-2">
                    <Row term="Price / basis" value={formatPriceBasis(line)} />
                    <Row term="Quantity / pack size" value={line.quantityOrPackSize} />
                    <Row term="Discount" value={line.discount} />
                    <Row term="Freight / tax" value={joinDefined([line.freight, line.tax])} />
                    <Row term="Delivery / terms" value={joinDefined([line.delivery, line.terms])} />
                    <Row term="Source excerpt" value={line.sourceExcerpt} />
                  </dl>
                  {line.uncertaintyNotes && (
                    <p className="border-t border-slate-100 px-4 py-2 text-xs text-amber-800 dark:border-slate-800 dark:text-amber-300">
                      ⚠ {line.uncertaintyNotes}
                    </p>
                  )}
                </article>
              ))}
            </div>

            {result.ai.extraction.overallNotes && (
              <p className="rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-300">
                {result.ai.extraction.overallNotes}
              </p>
            )}
          </section>
        )}

        {/* Next step */}
        {result && result.ok && (
          <div>
            <Link
              href="/analyze-response/intelligence"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              View Response Intelligence
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-950">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}

function Row({ term, value }: { term: string; value: string | undefined }) {
  return (
    <div className="flex gap-2">
      <dt className="w-36 shrink-0 text-slate-500 dark:text-slate-400">{term}</dt>
      <dd className="text-slate-800 dark:text-slate-200">{value ?? "Not stated"}</dd>
    </div>
  );
}

function formatPriceBasis(line: { priceValue?: number; currency?: string; priceBasis?: string }): string | undefined {
  const parts: string[] = [];
  if (line.priceValue !== undefined) {
    parts.push(line.currency ? `${line.currency} ${line.priceValue}` : String(line.priceValue));
  } else if (line.currency) {
    parts.push(line.currency);
  }
  if (line.priceBasis) parts.push(line.priceBasis);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

function joinDefined(values: (string | undefined)[]): string | undefined {
  const defined = values.filter((v): v is string => Boolean(v));
  return defined.length > 0 ? defined.join(" · ") : undefined;
}
