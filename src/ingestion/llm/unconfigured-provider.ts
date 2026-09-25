import type { ExtractionInput } from "../types";
import type { VendorExtractionProvider, VendorExtractionProviderResult } from "./provider";

/**
 * Default provider wired in until a real LLM API is connected. Deliberately
 * refuses to run rather than fabricate a vendor-extraction result -- there
 * must be no path in this codebase that returns invented AI output.
 */
export class UnconfiguredVendorExtractionProvider implements VendorExtractionProvider {
  readonly name = "unconfigured";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature required by VendorExtractionProvider
  async extract(input: ExtractionInput): Promise<VendorExtractionProviderResult> {
    throw new Error(
      "No LLM extraction provider is configured. Implement VendorExtractionProvider " +
        "against a real LLM API and wire it in before calling extract().",
    );
  }
}
