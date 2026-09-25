import type { ExtractionInput } from "../types";

/**
 * Boundary between the deterministic ingestion pipeline and an LLM. The
 * pipeline only ever produces an ExtractionInput; everything past this
 * interface -- semantic interpretation of vendor language, line matching,
 * ambiguity detection -- is the provider's job, not the ingestion service's.
 *
 * The result shape is intentionally left open (`unknown`): it will be
 * defined against a real provider (e.g. an Anthropic Messages API call)
 * when the AI Analyst / extraction layer is built, not guessed at here.
 */
export interface VendorExtractionProvider {
  readonly name: string;
  extract(input: ExtractionInput): Promise<VendorExtractionProviderResult>;
}

export interface VendorExtractionProviderResult {
  providerName: string;
  /** Provider-defined payload. Not modeled yet -- see interface doc comment. */
  raw: unknown;
}
