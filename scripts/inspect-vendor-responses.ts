/**
 * Inspection command for the vendor-response ingestion service.
 *
 * Processes every file in a directory (default: data/vendor-responses)
 * through ingestFile() and reports what was actually extracted -- content
 * type, size, and any warnings/errors. It never prints the extracted text
 * itself as a "result": this is a pipeline health check, not an analyst.
 *
 * Usage: npm run inspect:vendor-responses [-- <directory>]
 */
import { readdir } from "node:fs/promises";
import path from "node:path";
import { ingestFiles } from "../src/ingestion";
import type { ExtractionResult } from "../src/ingestion";

function describeSize(result: Extract<ExtractionResult, { ok: true }>): string {
  const { rawContent } = result.input;
  switch (rawContent.kind) {
    case "text":
      return `${rawContent.text.length} chars`;
    case "structured-text":
      return `${rawContent.text.length} chars across ${rawContent.sheets.length} sheet(s)`;
    case "image":
      return `${rawContent.base64.length} base64 chars` +
        (rawContent.width && rawContent.height ? ` (${rawContent.width}x${rawContent.height}px)` : "");
  }
}

async function main() {
  const dir = process.argv[2] ?? path.join(process.cwd(), "data", "vendor-responses");
  const fileNames = await readdir(dir);
  const filePaths = fileNames.map((name) => path.join(dir, name));

  console.log(`Inspecting ${filePaths.length} file(s) in ${dir}\n`);

  const results = await ingestFiles(filePaths);
  let succeeded = 0;
  let failed = 0;

  for (const result of results) {
    if (result.ok) {
      succeeded += 1;
      const { metadata, rawContent, warnings } = result.input;
      console.log(`✔ ${metadata.fileName}`);
      console.log(`    format:      ${metadata.detectedFormat} (${metadata.mimeType})`);
      console.log(`    file size:   ${metadata.fileSizeBytes} bytes`);
      console.log(`    content:     ${rawContent.kind} — ${describeSize(result)}`);
      console.log(`    sha256:      ${metadata.sha256}`);
      if (warnings.length > 0) {
        console.log(`    warnings:    ${warnings.join("; ")}`);
      }
    } else {
      failed += 1;
      console.log(`✘ ${path.basename(result.error.filePath)}`);
      console.log(`    error code:  ${result.error.code}`);
      console.log(`    message:     ${result.error.message}`);
    }
    console.log("");
  }

  console.log(`Done: ${succeeded} succeeded, ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Inspection command crashed:", err);
  process.exitCode = 1;
});
