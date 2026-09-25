import { randomUUID } from "node:crypto";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextResponse } from "next/server";
import { GeminiVendorExtractionProvider, ingestFile } from "@/ingestion";
import type { ExtractionInput, GeminiExtractionOutcome } from "@/ingestion";
import type { AnalyzeVendorResponseApiResult, RawContentSummary } from "@/app/analyze-response/types";

export const runtime = "nodejs";

async function runAiExtraction(input: ExtractionInput): Promise<GeminiExtractionOutcome> {
  try {
    const provider = new GeminiVendorExtractionProvider();
    const result = await provider.extract(input);
    // Safe: GeminiVendorExtractionProvider is the only provider constructed
    // here, and it always populates `raw` with its own GeminiExtractionOutcome.
    return result.raw as GeminiExtractionOutcome;
  } catch (cause) {
    // Covers a missing/misconfigured API key as well as any error thrown
    // before the provider's own try/catch takes over (construction only) --
    // still surfaced as the provider's own typed error shape, not fabricated.
    return {
      status: "error",
      code: "api_error",
      message: cause instanceof Error ? cause.message : String(cause),
    };
  }
}

export async function POST(request: Request): Promise<NextResponse<AnalyzeVendorResponseApiResult>> {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, fileName: "", error: { code: "no_file", message: "No file was uploaded." } },
      { status: 400 },
    );
  }

  const extension = path.extname(file.name);
  const tempPath = path.join(tmpdir(), `aerchain-upload-${randomUUID()}${extension}`);
  await writeFile(tempPath, Buffer.from(await file.arrayBuffer()));

  try {
    const result = await ingestFile(tempPath);

    if (!result.ok) {
      return NextResponse.json({
        ok: false,
        fileName: file.name,
        error: { code: result.error.code, message: result.error.message },
      });
    }

    const { metadata, rawContent, warnings } = result.input;
    const summarizedRawContent: RawContentSummary =
      rawContent.kind === "text"
        ? { kind: "text", characterCount: rawContent.text.length }
        : rawContent.kind === "structured-text"
          ? { kind: "structured-text", characterCount: rawContent.text.length, sheetCount: rawContent.sheets.length }
          : { kind: "image", width: rawContent.width, height: rawContent.height };

    const ai = await runAiExtraction(result.input);

    return NextResponse.json({
      ok: true,
      // The original upload's name, not metadata.fileName (which reflects
      // the randomized temp path this route writes the upload to on disk).
      fileName: file.name,
      fileSizeBytes: metadata.fileSizeBytes,
      detectedFormat: metadata.detectedFormat,
      mimeType: metadata.mimeType,
      rawContent: summarizedRawContent,
      warnings,
      ai,
    });
  } finally {
    await unlink(tempPath).catch(() => {
      // Best-effort cleanup; a leftover temp file is not worth failing the request over.
    });
  }
}
