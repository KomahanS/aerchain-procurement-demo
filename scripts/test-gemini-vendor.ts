/**
 * Smoke test for GeminiVendorExtractionProvider: ingests one real vendor
 * file and sends the resulting ExtractionInput to Gemini, then prints the
 * structured result. Read-only against seed/data files -- writes nothing.
 *
 * Usage: npm run test:gemini
 */
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { GeminiVendorExtractionProvider, ingestFile } from "../src/ingestion";

loadEnvConfig(process.cwd());

async function main() {
  const filePath = path.join(process.cwd(), "data", "vendor-responses", "Vendor_E_Email_Response.txt");

  const result = await ingestFile(filePath);
  if (!result.ok) {
    console.error("Ingestion failed:", result.error);
    process.exitCode = 1;
    return;
  }

  console.log(`Ingested ${result.input.metadata.fileName} (${result.input.rawContent.kind}).`);

  const provider = new GeminiVendorExtractionProvider();
  const extraction = await provider.extract(result.input);

  console.log(`\nProvider: ${extraction.providerName}`);
  console.log(JSON.stringify(extraction.raw, null, 2));

  const outcome = extraction.raw as { status: string };
  if (outcome.status !== "ok") {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Gemini test script crashed:", err);
  process.exitCode = 1;
});
